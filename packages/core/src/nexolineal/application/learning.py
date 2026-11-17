"""Fichas originales, fuentes primarias y modelos reproducibles del banco educativo.

No son transcripciones de libros. Los ejercicios contextuales se construyen aquí
con datos propios y se resuelven mediante las operaciones públicas existentes.
"""

from fractions import Fraction as F
from ..algorithms.linear.context import matrix, vector
from ..domain.models import serializar

ILA = "https://textbooks.math.gatech.edu/ila/"


def theorem(id, title, statement, hypotheses, operations, url, section):
    return dict(
        id=id,
        title=title,
        statement=statement,
        hypotheses=hypotheses,
        operations=operations,
        reference={
            "title": (
                "Margalit y Rabinoff, Interactive Linear Algebra"
                if url.startswith(ILA)
                else section
            ),
            "url": url,
            "section": section,
        },
    )


THEOREMS = [
    theorem(
        "filas",
        "Equivalencia por filas",
        "Intercambiar ecuaciones, multiplicar una por un escalar no nulo o sumarle un múltiplo de otra conserva exactamente las soluciones.",
        [
            "Sistema sobre un cuerpo; aquí se usa R con coeficientes racionales.",
            "El factor de una escala de fila debe ser distinto de cero.",
        ],
        ["sistemas.", "matrices.ref", "matrices.rref"],
        ILA + "row-reduction.html",
        "§1.2, operaciones elementales",
    ),
    theorem(
        "rangos",
        "Compatibilidad por rangos",
        "Ax=b tiene solución si y solo si rango(A)=rango([A|b]). Si el rango común es n, es única; si es menor que n, hay variables libres.",
        ["A tiene m filas y n columnas; b pertenece a R^m."],
        ["sistemas."],
        ILA + "solution-sets.html",
        "§2.4, conjuntos solución",
    ),
    theorem(
        "familia",
        "Solución particular y núcleo",
        "Si Ap=b, toda solución de Ax=b es p+v con v en el núcleo de A, y cada vector de esa forma es solución.",
        ["El sistema debe ser compatible."],
        ["sistemas.", "espacios.fundamentales"],
        ILA + "solution-sets.html",
        "§2.4, conjuntos solución",
    ),
    theorem(
        "rango-nulidad",
        "Rango y nulidad",
        "Para una matriz m×n, la dimensión de su imagen más la de su núcleo es n.",
        ["Transformación lineal con dominio de dimensión finita n."],
        ["espacios.", "transformaciones.", "vectores.analizar"],
        ILA + "rank-thm.html",
        "§2.9, teorema del rango",
    ),
    theorem(
        "linealidad",
        "Transformación matricial",
        "T(x)=Ax satisface T(u+v)=T(u)+T(v) y T(cu)=cT(u). Una recta se transforma en una recta o en un punto; el origen permanece en el origen.",
        [
            "A es fija y todos los vectores pertenecen al dominio R^n.",
            "No se suma una traslación independiente.",
        ],
        ["transformaciones."],
        ILA + "matrix-transformations.html",
        "§3.1, transformaciones matriciales",
    ),
    theorem(
        "inversa",
        "Matriz invertible",
        "Para A cuadrada n×n, ser invertible equivale a tener rango n y a que Ax=b tenga solución única para cada b. Se verifican ambos productos con la identidad.",
        [
            "Matriz cuadrada; las equivalencias no se trasladan sin cambios a matrices rectangulares."
        ],
        ["matrices.inversa", "sistemas.inversa", "sistemas.cramer"],
        ILA + "invertible-matrix-thm.html",
        "§3.6, teorema de la matriz invertible",
    ),
    theorem(
        "determinante",
        "Determinante y escala geométrica",
        "En R², el valor absoluto del determinante multiplica áreas; en R³, volúmenes. El determinante cero indica colapso de dimensión.",
        [
            "Transformación lineal de R² en R² o de R³ en R³.",
            "El signo informa orientación; el área y el volumen son no negativos.",
        ],
        ["determinantes.", "transformaciones."],
        ILA + "determinants-volumes.html",
        "§4.3, determinantes y volúmenes",
    ),
    theorem(
        "proyeccion",
        "Proyección ortogonal sobre una recta",
        "Para v no nulo, p=((u·v)/(v·v))v es la proyección de u sobre span(v). La diferencia u−p es perpendicular a v.",
        ["Producto interior euclídeo real.", "v no puede ser el vector cero."],
        ["vectores.proyeccion", "vectores.producto_punto"],
        ILA + "projections.html",
        "§6.3, proyección ortogonal",
    ),
    theorem(
        "bolzano",
        "Cambio de signo y existencia de raíz",
        "Si f es continua en [a,b] y los valores de sus extremos tienen signos opuestos, existe una raíz en el interior. El signo por sí solo no basta ante una discontinuidad.",
        [
            "Continuidad en todo el intervalo cerrado.",
            "a<b y f(a)f(b)<0.",
            "Las evaluaciones aproximadas no sustituyen una certificación exacta del signo.",
        ],
        ["raices.biseccion", "raices.falsa_posicion"],
        "https://openstax.org/books/calculus-volume-1/pages/2-4-continuity",
        "OpenStax, Calculus Volume 1, §2.4",
    ),
    theorem(
        "newton",
        "Recta de Newton",
        "El siguiente iterado es la intersección con el eje x de la recta de pendiente f prima evaluada en el punto actual. Una derivada nula impide ese paso.",
        [
            "La derivada usada debe existir y ser no nula.",
            "No se garantiza convergencia desde cualquier semilla.",
            "Una derivada escrita por el usuario se trata como dato; no se certifica su equivalencia.",
        ],
        ["raices.newton"],
        "https://openstax.org/books/calculus-volume-1/pages/4-9-newtons-method",
        "OpenStax, Calculus Volume 1, §4.9",
    ),
    theorem(
        "contraccion",
        "Residual y contracción",
        "El residual mide el incumplimiento de Ax=b. Una iteración estacionaria x siguiente=B x+c converge a su punto fijo si una norma inducida de B es menor que uno; las cotas requieren esa hipótesis.",
        [
            "Norma vectorial y norma matricial inducida compatibles.",
            "La condición de contracción debe comprobarse; un residual pequeño no es por sí mismo error verdadero pequeño.",
        ],
        ["iterativos."],
        "https://netlib.org/templates/templates.html",
        "Barrett y colaboradores, Templates, métodos estacionarios y criterios de parada",
    ),
    theorem(
        "poblaciones",
        "Transición por columnas",
        "Una matriz no negativa cuyas columnas suman uno conserva la suma de las componentes de un vector de población no negativo.",
        [
            "Vector columna y convención de transición por columnas.",
            "Población cerrada durante el período y tasas fijas; no se afirma estabilidad de largo plazo.",
        ],
        ["matrices.producto", "matrices.potencia"],
        ILA + "stochastic-matrices.html",
        "§5.6, matrices estocásticas",
    ),
]


def application(
    id,
    title,
    area,
    description,
    variables,
    equations,
    restrictions,
    op,
    inputs,
    reference,
):
    return dict(
        id=id,
        title=title,
        area=area,
        description=description,
        variables=variables,
        equations=equations,
        restrictions=restrictions,
        problem={"schema_version": "1.0", "operation_id": op, "input": inputs},
        reference=reference,
        origin="Ejemplo original de NexoLineal; datos didácticos, no mediciones reales.",
    )


APPLICATIONS = [
    application(
        "red",
        "Distribución de caudal",
        "Redes",
        "En un nodo entran 30 L/min. Los dos ramales de salida difieren en 10 L/min. Hallar ambos caudales.",
        [{"name": "f1", "unit": "L/min"}, {"name": "f2", "unit": "L/min"}],
        ["f1+f2=30", "f1−f2=10"],
        [
            "Régimen estacionario y sin acumulación.",
            "f1≥0 y f2≥0 según el sentido elegido.",
        ],
        "sistemas.resolver",
        {"A": "1 1;1 -1", "b": "30 10"},
        ILA + "systems-of-eqns.html",
    ),
    application(
        "quimica",
        "Balance de una reacción",
        "Balance químico",
        "Balancear Fe + O2 → Fe2O3 fijando en 2 el coeficiente de Fe2O3. Las incógnitas son los otros dos coeficientes.",
        [
            {"name": "coeficiente de Fe", "unit": "coeficiente estequiométrico"},
            {"name": "coeficiente de O2", "unit": "coeficiente estequiométrico"},
        ],
        ["Fe: cFe=2·2", "O: 2·cO2=3·2"],
        [
            "Coeficientes enteros positivos.",
            "Solo se conserva el número de átomos; no se modelan velocidad ni energía.",
        ],
        "sistemas.resolver",
        {"A": "1 0;0 2", "b": "4 6"},
        ILA + "matrix-equations.html",
    ),
    application(
        "economia",
        "Producción y demanda",
        "Economía",
        "Dos sectores consumen insumos según C=[[1/5,1/10],[1/5,3/10]]. La demanda final es (70,30). Resolver (I−C)x=d.",
        [
            {"name": "producción del sector 1", "unit": "unidades monetarias/período"},
            {"name": "producción del sector 2", "unit": "unidades monetarias/período"},
        ],
        ["(4/5)x1−(1/10)x2=70", "−(1/5)x1+(7/10)x2=30"],
        [
            "Producciones no negativas.",
            "Coeficientes técnicos fijos, precios y período comunes.",
            "Modelo didáctico de insumo-producto; no predicción de un mercado real.",
        ],
        "sistemas.resolver",
        {"A": "4/5 -1/10;-1/5 7/10", "b": "70 30"},
        ILA + "matrix-equations.html",
    ),
    application(
        "recursos",
        "Uso completo de dos recursos",
        "Recursos",
        "Cada unidad del producto 1 usa 2 kg y 1 h; cada unidad del producto 2 usa 1 kg y 2 h. Se usan exactamente 40 kg y 50 h.",
        [
            {"name": "producto 1", "unit": "unidades"},
            {"name": "producto 2", "unit": "unidades"},
        ],
        ["2x1+x2=40 kg", "x1+2x2=50 h"],
        [
            "Cantidades no negativas e indivisibles en este ejemplo.",
            "Se impone uso completo; no se resuelve un problema de optimización ni desigualdades.",
        ],
        "sistemas.resolver",
        {"A": "2 1;1 2", "b": "40 50"},
        ILA + "systems-of-eqns.html",
    ),
    application(
        "poblaciones",
        "Población en el siguiente período",
        "Poblaciones",
        "P=[[4/5,1/10],[1/5,9/10]] transforma una población columna (200,100). Cada columna indica el destino de un grupo durante un período.",
        [
            {"name": "grupo 1 al finalizar", "unit": "individuos esperados"},
            {"name": "grupo 2 al finalizar", "unit": "individuos esperados"},
        ],
        [
            "n siguiente=P·n actual",
            "n1 siguiente=(4/5)·200+(1/10)·100",
            "n2 siguiente=(1/5)·200+(9/10)·100",
        ],
        [
            "Matriz no negativa y columnas con suma 1.",
            "Sistema cerrado, tasas constantes en ese período.",
            "Son valores esperados del modelo; no una simulación aleatoria ni una garantía demográfica.",
        ],
        "matrices.producto",
        {"A": "4/5 1/10;1/5 9/10", "B": "200;100"},
        ILA + "stochastic-matrices.html",
    ),
]


def contextualize(response):
    """Reconoce entradas equivalentes, sin resolver otra vez ni evaluar restricciones en JS."""
    if response["status"] != "ok" or not response.get("result"):
        return None
    for app in APPLICATIONS:
        problem = app["problem"]
        data = response["input"]
        if response["operation_id"] != problem["operation_id"]:
            continue
        try:
            same = matrix(data["A"]) == matrix(problem["input"]["A"])
            if problem["operation_id"] == "sistemas.resolver":
                same = same and vector(data["b"]) == vector(problem["input"]["b"])
                values = [F(x) for x in response["result"]["particular"]]
            else:
                same = same and matrix(data["B"]) == matrix(problem["input"]["B"])
                values = [F(row[0]) for row in response["result"]["matrix"]]
            if not same:
                continue
        except (ValueError, KeyError, TypeError):
            continue
        checks = {
            "ecuaciones": response["verification"].get("passed") is True,
            "no_negatividad": all(x >= 0 for x in values),
        }
        if app["id"] in ("quimica", "recursos"):
            checks["enteros"] = all(x.denominator == 1 for x in values)
        if app["id"] == "quimica":
            checks["conservacion_atomos"] = values[0] == 4 and 2 * values[1] == 6
        if app["id"] == "poblaciones":
            checks["total_conservado"] = sum(values) == 300
        return serializar(
            {
                "id": app["id"],
                "title": app["title"],
                "interpretation": [
                    {**variable, "value": value}
                    for variable, value in zip(app["variables"], values)
                ],
                "checks": checks,
                "passed": all(checks.values()),
                "restrictions": app["restrictions"],
                "model_scope": app["description"],
            }
        )
    return None
