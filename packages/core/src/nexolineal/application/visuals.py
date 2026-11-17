"""Escenas verificables: geometría y muestras en Python, dibujo en el cliente.

Las coordenadas exactas o decimales viajan como texto. El recorte es una ventana,
no una modificación del sistema; las curvas solo unen intervalos cuyo dominio
pudo justificar el mismo analizador usado por los métodos numéricos.
"""

from decimal import Decimal, localcontext
from fractions import Fraction as F
from itertools import product
from math import atan2, isfinite
from ..algorithms.linear.context import Context, vector, matrix, matvec
from ..algorithms.numerical.functions import Function, PRECISION, decimal
from ..domain.models import (
    DomainError,
    InputError,
    ResourceLimitError,
    CancelledError,
    serializar,
)

LIMIT = F(10**6)


def numeric(value):
    n = F(str(value))
    if abs(n) > LIMIT:
        raise ValueError(
            "La escena admite coordenadas de magnitud hasta 10^6; el resultado completo sigue disponible."
        )
    return n


def point(values):
    return [numeric(x) for x in values]


def series(label, points, kind="line", source="entrada original"):
    return {"label": label, "kind": kind, "points": points, "source": source}


def scene(kind, title, dim, items, frames=None, notes=None):
    return {
        "version": 1,
        "kind": kind,
        "title": title,
        "dimension": dim,
        "axes": ["x", "y", "z"][:dim],
        "units": "unidades de coordenadas",
        "series": items,
        "frames": frames or [],
        "notes": notes or [],
        "alternative": "Coordenadas emitidas por Python; el resultado y la tabla exactos prevalecen sobre el dibujo aproximado.",
        "approximate_display": True,
    }


def clipped_equation(a, b, extent):
    """Interseca recta/plano con las aristas de [-e,e]^n, con racionales."""
    dim = len(a)
    hits = set()
    for axis in range(dim):
        if not a[axis]:
            continue
        others = [i for i in range(dim) if i != axis]
        for signs in product((-extent, extent), repeat=dim - 1):
            p = [F(0)] * dim
            for i, x in zip(others, signs):
                p[i] = x
            p[axis] = (b - sum(a[i] * p[i] for i in others)) / a[axis]
            if abs(p[axis]) <= extent:
                hits.add(tuple(p))
    points = list(sorted(hits))
    if dim == 3 and len(points) >= 3:
        # Solo orden de dibujo alrededor del centro; los vértices siguen siendo exactos.
        drop = max(range(3), key=lambda i: abs(a[i]))
        u, v = [i for i in range(3) if i != drop]
        center = [sum(p[i] for p in points) / len(points) for i in range(3)]
        points.sort(
            key=lambda p: atan2(float(p[v] - center[v]), float(p[u] - center[u]))
        )
    return [list(p) for p in points]


def affine_line(p, v, extent):
    lower, upper = None, None
    for x, d in zip(p, v):
        if not d:
            if abs(x) > extent:
                return []
            continue
        a, b = sorted(((-extent - x) / d, (extent - x) / d))
        lower = a if lower is None else max(lower, a)
        upper = b if upper is None else min(upper, b)
    if lower is None or upper is None or lower > upper:
        return []
    return [[x + t * d for x, d in zip(p, v)] for t in (lower, upper)]


def system_plot(response, ctx):
    data, result = response["input"], response["result"]
    A, b = matrix(data["A"]), vector(data["b"])
    dim = len(A[0])
    if dim not in (2, 3):
        raise ValueError(
            "La vista geométrica de sistemas requiere dos o tres incógnitas; no se proyectan dimensiones superiores."
        )
    p = point(result["particular"]) if result.get("particular") is not None else None
    extent = max(F(4), max(map(abs, p), default=F(0)) * F(3, 2) + 1) if p else F(4)
    if extent > LIMIT:
        raise ValueError("La solución excede la ventana geométrica admitida.")
    items, notes = [], [
        "Ventana recortada: las rectas y los planos se prolongan fuera del marco."
    ]
    for i, (row, rhs) in enumerate(zip(A, b)):
        ctx.tick()
        if not any(row):
            notes.append(
                f"Ecuación {i+1}: 0={rhs}; "
                + ("no restringe el espacio." if rhs == 0 else "impide toda solución.")
            )
            continue
        points = clipped_equation(row, rhs, extent)
        items.append(
            series(
                f"Ecuación {i+1}",
                points,
                "polygon" if dim == 3 else "line",
                f"A[{i}], b[{i}] originales",
            )
        )
        if not points:
            notes.append(
                f"La ecuación {i+1} no corta esta ventana; no significa que no tenga puntos."
            )
    if p is not None:
        items.append(
            series("Solución particular", [p], "points", "resultado.particular")
        )
        directions = [point(d) for d in result.get("direcciones", [])]
        if len(directions) == 1:
            items.append(
                series(
                    "Familia de soluciones",
                    affine_line(p, directions[0], extent),
                    "line",
                    "particular + t·dirección",
                )
            )
        elif dim == 3 and len(directions) == 2:
            u, v = directions
            normal = [
                u[1] * v[2] - u[2] * v[1],
                u[2] * v[0] - u[0] * v[2],
                u[0] * v[1] - u[1] * v[0],
            ]
            rhs = sum(a * x for a, x in zip(normal, p))
            items.append(
                series(
                    "Plano de soluciones",
                    clipped_equation(normal, rhs, extent),
                    "polygon",
                    "resultado.particular y direcciones",
                )
            )
        elif len(directions) == dim:
            notes.append("Todas las coordenadas del espacio ambiente son soluciones.")
    else:
        notes.append(
            "Sistema incompatible: no existe intersección común, aunque algunas ecuaciones se corten entre sí."
        )
    s = scene(
        "system",
        "Rectas del sistema" if dim == 2 else "Planos del sistema",
        dim,
        items,
        notes=notes,
    )
    s["range"] = [[-extent, extent] for _ in range(dim)]
    s["classification"] = result.get("clasificacion")
    return s


def vector_plot(response, ctx):
    data, result = response["input"], response["result"]
    values = []
    for name in ("u", "v"):
        if name in data:
            values.append((name, point(vector(data[name]))))
    for name in ("vector", "proyeccion", "componente_ortogonal"):
        if isinstance(result.get(name), list):
            values.append((name.replace("_", " "), point(result[name])))
    rows = []
    if "vectores" in data:
        raw = data["vectores"]
        rows = (
            (
                []
                if raw.strip() == "[]"
                else [
                    r.split() for r in raw.replace(";", "\n").splitlines() if r.strip()
                ]
            )
            if isinstance(raw, str)
            else raw
        )
        values.extend((f"v{i+1}", point(v)) for i, v in enumerate(rows))
    if (
        not values
        or len(values[0][1]) not in (2, 3)
        or any(len(v) != len(values[0][1]) for _, v in values)
    ):
        raise ValueError(
            "Esta geometría vectorial requiere vectores de R² o R³ no vacíos."
        )
    dim = len(values[0][1])
    zero = [F(0)] * dim
    items = [
        series(name, [zero, v], "vector", "entrada o resultado exacto: " + name)
        for name, v in values
    ]
    if response["operation_id"] == "vectores.suma":
        u, v = values[0][1], values[1][1]
        items.append(
            series(
                "v trasladado al extremo de u",
                [u, [a + b for a, b in zip(u, v)]],
                "line",
                "regla del paralelogramo, u+v",
            )
        )
    if result.get("coeficientes") is not None and rows:
        cursor = zero[:]
        for i, (raw, coefficient) in enumerate(zip(rows, result["coeficientes"])):
            ctx.tick(dim)
            delta = [F(coefficient) * x for x in point(raw)]
            following = point([x + d for x, d in zip(cursor, delta)])
            items.append(
                series(
                    f"{coefficient}·v{i+1}",
                    [cursor, following],
                    "vector",
                    "coeficiente calculado por Python y vector generador",
                )
            )
            cursor = following
        if cursor != point(result["reconstruccion"]):
            raise ValueError(
                "La reconstrucción geométrica no coincide con el resultado; se conserva la alternativa textual."
            )
        items.append(
            series(
                "Reconstrucción del objetivo",
                [zero, point(result["reconstruccion"])],
                "vector",
                "resultado.reconstruccion",
            )
        )
    if "proyeccion" in result:
        items.append(
            series(
                "Diferencia ortogonal",
                [point(result["proyeccion"]), point(vector(data["u"]))],
                "line",
                "u − proyección",
            )
        )
    return scene("vectors", "Vectores en el mismo espacio", dim, items)


def transformation_plot(response, ctx):
    A = matrix(response["result"]["matrix"])
    if len(A) != 2 or len(A[0]) != 2:
        raise ValueError(
            "La cuadrícula muestra transformaciones R²→R² en coordenadas canónicas; otras dimensiones conservan su resultado textual."
        )
    items = []
    for c in range(-3, 4):
        for endpoints in (([F(c), F(-3)], [F(c), F(3)]), ([F(-3), F(c)], [F(3), F(c)])):
            ctx.tick()
            items.append(
                series(
                    "Cuadrícula original",
                    list(endpoints),
                    "line",
                    "coordenadas canónicas",
                )
            )
            transformed = [matvec(A, p, ctx) for p in endpoints]
            [point(p) for p in transformed]
            items.append(
                series(
                    "Cuadrícula transformada",
                    transformed,
                    "line",
                    "resultado.matrix · coordenadas originales",
                )
            )
    if response["result"].get("imagen_vector") is not None:
        items.append(
            series(
                "T(v)",
                [[F(0), F(0)], point(response["result"]["imagen_vector"])],
                "vector",
                "resultado.imagen_vector",
            )
        )
    return scene(
        "transformation",
        "Cuadrícula original y su imagen lineal",
        2,
        items,
        notes=[
            "Se dibujan segmentos rectos mediante T(x)=Ax. Las rectas pueden colapsar; nunca se curvan."
        ],
    )


def function_segments(f, lower, upper, ctx):
    segments = []
    current = []
    skipped = 0
    previous = None
    for i in range(201):
        ctx.tick()
        x = lower + (upper - lower) * F(i, 200)
        try:
            y = f.value(decimal(x))
            numeric(y)
            connected = previous is None
            if previous is not None:
                try:
                    f.continuous(previous, x)
                    connected = True
                except (DomainError, InputError, ValueError, ResourceLimitError):
                    connected = False
            if not connected:
                if current:
                    segments.append(current)
                current = []
                skipped += 1
            current.append([x, y])
            previous = x
        except (
            DomainError,
            InputError,
            ValueError,
            ArithmeticError,
            ResourceLimitError,
        ):
            if current:
                segments.append(current)
            current = []
            previous = None
            skipped += 1
    if current:
        segments.append(current)
    return segments, skipped


def roots_plot(response, ctx):
    data, result = response["input"], response["result"]
    rows = result.get("tabla", [])
    f = Function(data["expresion"], ctx)
    xs = []
    for key in ("inferior", "superior", "inicial", "anterior"):
        if key in data:
            xs.append(numeric(data[key]))
    for row in rows:
        for key in ("x", "x_anterior", "anterior"):
            if key in row:
                xs.append(numeric(row[key]))
    if not xs:
        raise ValueError("No hay puntos de iteración para representar.")
    lo, hi = min(xs), max(xs)
    margin = max(F(1, 2), (hi - lo) / 5)
    lo, hi = lo - margin, hi + margin
    segments, gaps = function_segments(f, lo, hi, ctx)
    items = [
        series(
            "f(x) = " + data["expresion"], seg, "line", "muestreo protegido en Python"
        )
        for seg in segments
        if len(seg) > 1
    ]
    # Muestras aisladas no se unen cuando el dominio no pudo justificarse.
    items.extend(
        series("Muestra aislada", seg, "points", "dominio puntual")
        for seg in segments
        if len(seg) == 1
    )
    frames = []
    for i, row in enumerate(rows):
        ctx.tick()
        x, fx = numeric(row["x"]), numeric(row["fx"])
        geometry = [
            series("Aproximación", [[x, 0], [x, fx]], "line", "fila actual: x, fx"),
            series("Punto actual", [[x, fx]], "points", "tabla.x, tabla.fx"),
        ]
        if "a" in row:
            a, b, fa, fb = [numeric(row[k]) for k in ("a", "b", "fa", "fb")]
            geometry.append(
                series(
                    "Intervalo antes de actualizar",
                    [[a, 0], [b, 0]],
                    "line",
                    "tabla.a, tabla.b",
                )
            )
            geometry.append(
                series(
                    "Extremos evaluados",
                    [[a, fa], [b, fb]],
                    "points",
                    "tabla.fa, tabla.fb",
                )
            )
            if response["operation_id"].endswith("falsa_posicion"):
                geometry.append(
                    series(
                        "Secante del intervalo",
                        [[a, fa], [b, fb]],
                        "line",
                        "extremos de la fila actual",
                    )
                )
        elif "x_anterior" in row:
            old, yold = numeric(row["x_anterior"]), numeric(row["f_anterior_actual"])
            geometry.append(
                series("Punto anterior", [[old, yold]], "points", "tabla.x_anterior")
            )
            if "derivada_x" in row and x != old:
                geometry.append(
                    series(
                        "Recta usada por Newton",
                        [[old, yold], [x, 0]],
                        "line",
                        "tabla.derivada_x; si fue suministrada, no se certifica que sea f prima",
                    )
                )
            elif "anterior" in row and x != old:
                geometry.append(
                    series(
                        "Secante de las semillas",
                        [
                            [numeric(row["anterior"]), numeric(row["f_anterior"])],
                            [old, yold],
                            [x, 0],
                        ],
                        "line",
                        "datos de la misma iteración",
                    )
                )
        frames.append(
            {
                "step": i if response["steps"] else None,
                "row": i,
                "values": row,
                "series": geometry,
            }
        )
    notes = [
        "f(x) y geometría se aproximan solo para dibujar; tabla y pasos conservan sus valores.",
        "El muestreo no certifica todas las raíces ni la convergencia.",
    ]
    if any("x_anterior" in row and F(row["x"]) == F(row["x_anterior"]) for row in rows):
        notes.append(
            "La abscisa no cambió a la precisión de trabajo; se omite la recta del método para no dibujar una tangente vertical ficticia."
        )
    if gaps:
        notes.append(
            f"{gaps} separaciones o muestras omitidas por dominio o límite; no se conectan a través de ellas."
        )
    s = scene("roots", "Geometría de " + result["metodo"], 2, items, frames, notes)
    s["expression"] = data["expresion"]
    s["axes"] = ["x", "f(x)"]
    s["sampling_gaps"] = gaps
    return s


def residual_plot(response, ctx):
    rows = response["result"].get("tabla", [])
    items = []
    frames = []
    points = []
    for i, row in enumerate(rows):
        ctx.tick()
        residual = numeric(row["norma_residual"])
        p = [F(row["iteracion"]), residual]
        points.append(p)
        frames.append(
            {
                "step": i if response["steps"] else None,
                "row": i,
                "values": row,
                "series": [
                    series(
                        "Residual seleccionado", [p], "points", "tabla.norma_residual"
                    )
                ],
            }
        )
    items.append(
        series("Norma residual", points, "line", "tabla.norma_residual sin recalcular")
    )
    s = scene(
        "residual",
        "Residual de la iteración",
        2,
        items,
        frames,
        [
            "Escala lineal: cero se representa sin sustituirlo por epsilon. Un residual no es el error verdadero."
        ],
    )
    s["axes"] = ["iteración", "norma residual"]
    s["units"] = "iteraciones / unidades de b"
    return s


def build_visualization(response, checkpoint=None):
    """Un fallo de visualización no cambia una solución matemática ya calculada."""
    op = response["operation_id"]
    if not response.get("result"):
        return {
            "version": 1,
            "kind": "unavailable",
            "reason": "No hay resultado matemático para representar.",
        }
    ctx = Context(checkpoint=checkpoint)
    try:
        with localcontext() as arithmetic:
            arithmetic.prec = PRECISION
            if op == "sistemas.resolver":
                result = system_plot(response, ctx)
            elif op.startswith("vectores."):
                result = vector_plot(response, ctx)
            elif op in (
                "transformaciones.analizar",
                "transformaciones.desde_imagenes",
                "transformaciones.componer",
            ):
                result = transformation_plot(response, ctx)
            elif op.startswith("raices."):
                result = roots_plot(response, ctx)
            elif op.startswith("iterativos."):
                result = residual_plot(response, ctx)
            else:
                return {
                    "version": 1,
                    "kind": "unavailable",
                    "reason": "Esta operación conserva su procedimiento y resultado; no tiene una geometría asignada en esta fase.",
                }
            return serializar(result)
    except CancelledError:
        raise
    except (ValueError, ArithmeticError, ResourceLimitError, DomainError) as error:
        return {"version": 1, "kind": "unavailable", "reason": str(error)}
