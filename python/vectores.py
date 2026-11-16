"""Calcula operaciones exactas y verifica propiedades de vectores.
Implementa el álgebra de vectores en R^n.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

from fractions import Fraction

from entrada_datos import convertir_numero


def leer_vector(texto):
    """Lee componentes separadas por espacios o punto y coma. Recibe texto."""

    datos = str(texto).replace(";", " ").split()

    if not 1 <= len(datos) <= 6:
        raise ValueError(
            "Ingresa entre 1 y 6 componentes separados por espacios."
        )

    return [convertir_numero(x) for x in datos]


def sumar(u, v):
    """Suma componentes que ocupan la misma posición. Recibe u, v."""

    if len(u) != len(v):
        raise ValueError(
            "Los vectores deben tener la misma dimensión."
        )

    return [u[i] + v[i] for i in range(len(u))]


def escalar(c, u):
    """Multiplica cada componente del vector por el escalar. Recibe c, u."""

    return [c * valor for valor in u]


def operaciones(datos):
    """Calcula operaciones y comprueba las ocho propiedades. Recibe datos."""

    u = leer_vector(datos["u"])
    v = leer_vector(datos["v"])
    w = leer_vector(datos["w"])

    if len(u) != len(v) or len(u) != len(w):
        raise ValueError(
            "u, v y w deben tener la misma cantidad de componentes."
        )

    c = convertir_numero(datos["c"])
    d = convertir_numero(datos["d"])

    cero = [Fraction(0)] * len(u)

    
    pares = [
        (
            "u + v = v + u",
            sumar(u, v),
            sumar(v, u),
        ),
        (
            "(u + v) + w = u + (v + w)",
            sumar(sumar(u, v), w),
            sumar(u, sumar(v, w)),
        ),
        (
            "u + 0 = 0 + u = u",
            sumar(u, cero),
            sumar(cero, u),
        ),
        (
            "u + (−u) = (−u) + u = 0",
            sumar(u, escalar(-1, u)),
            sumar(escalar(-1, u), u),
        ),
        (
            "c(u + v) = cu + cv",
            escalar(c, sumar(u, v)),
            sumar(escalar(c, u), escalar(c, v)),
        ),
        (
            "(c + d)u = cu + du",
            escalar(c + d, u),
            sumar(escalar(c, u), escalar(d, u)),
        ),
        (
            "c(du) = (cd)u",
            escalar(c, escalar(d, u)),
            escalar(c * d, u),
        ),
        (
            "1u = u",
            escalar(1, u),
            u,
        ),
    ]

    propiedades = []

    for nombre, izquierda, derecha in pares:
        propiedades.append(
            {
                "nombre": nombre,
                "izquierda": izquierda,
                "derecha": derecha,
                "cumple": izquierda == derecha,
            }
        )

    
    
    norma2 = sum(x * x for x in u)

    return {
        "u": u,
        "v": v,
        "w": w,
        "c": c,
        "d": d,
        "dimension": len(u),
        "iguales": u == v,
        "u_es_cero": u == cero,
        "v_es_cero": v == cero,
        "suma": sumar(u, v),
        "resta": sumar(u, escalar(-1, v)),
        "menos_v": escalar(-1, v),
        "menos_2v": escalar(-2, v),
        "u_menos_2v": sumar(u, escalar(-2, v)),
        "cu": escalar(c, u),
        "dv": escalar(d, v),
        "combinacion": sumar(
            escalar(c, u),
            escalar(d, v),
        ),
        "norma2": norma2,
        "norma_v2": sum(x * x for x in v),
        "producto_punto": sum(a * b for a, b in zip(u, v)),
        "propiedades": propiedades,
    }


def ejecutar_tema(datos):
    """Ejecuta las operaciones básicas con vectores. Recibe datos."""

    if datos.get("accion") == "vectores":
        return operaciones(datos)

    raise ValueError("Operación de vectores no reconocida.")
