"""Combinación lineal e independencia lineal de conjuntos de vectores."""

from fractions import Fraction

from analisis_sistema import resolver_sistema
from entrada_datos import convertir_numero


def leer_vector(texto, nombre="vector"):
    """Convierte componentes separadas por espacios en un vector exacto."""
    partes = str(texto).replace(";", " ").split()
    if not 1 <= len(partes) <= 6:
        raise ValueError(f"El {nombre} debe tener entre 1 y 6 componentes.")

    vector = []
    for i, parte in enumerate(partes):
        try:
            vector.append(convertir_numero(parte))
        except ValueError as error:
            raise ValueError(
                f"Error en {nombre}, componente {i + 1}: {error}"
            ) from error
    return vector


def leer_conjunto_vectores(texto):
    """Lee un vector por línea; también permite separar vectores con punto y coma."""
    contenido = str(texto).strip()
    if not contenido:
        raise ValueError("Debes ingresar al menos un vector.")

    lineas = [
        linea.strip()
        for linea in contenido.replace(";", "\n").splitlines()
        if linea.strip()
    ]

    if not 1 <= len(lineas) <= 6:
        raise ValueError("Debes ingresar entre 1 y 6 vectores.")

    vectores = [
        leer_vector(linea, f"vector v{i + 1}")
        for i, linea in enumerate(lineas)
    ]

    dimension = len(vectores[0])
    for i, vector in enumerate(vectores):
        if len(vector) != dimension:
            raise ValueError(
                f"v{i + 1} tiene dimensión {len(vector)}, pero v1 tiene "
                f"dimensión {dimension}."
            )

    return vectores


def construir_matriz_columnas(vectores):
    """Construye A=[v1 v2 ... vk], colocando cada vector como una columna."""
    dimension = len(vectores[0])
    return [
        [vectores[j][i] for j in range(len(vectores))]
        for i in range(dimension)
    ]


def _serializar_vectores(vectores):
    return [[str(valor) for valor in vector] for vector in vectores]


def analizar_combinacion(datos):
    """Determina si b pertenece al generado de los vectores ingresados."""
    vectores = leer_conjunto_vectores(datos.get("vectores", ""))
    b = leer_vector(datos.get("b", ""), "vector b")
    dimension = len(vectores[0])

    if len(b) != dimension:
        raise ValueError(
            f"b pertenece a R^{len(b)}, pero los vectores generadores "
            f"pertenecen a R^{dimension}."
        )

    A = construir_matriz_columnas(vectores)
    sistema = resolver_sistema(A, b)
    es_combinacion = sistema["tipo"] != "inconsistente"

    return {
        "vectores": _serializar_vectores(vectores),
        "b": [str(valor) for valor in b],
        "dimension": dimension,
        "cantidad_vectores": len(vectores),
        "A": [[str(valor) for valor in fila] for fila in A],
        "es_combinacion": es_combinacion,
        "coeficientes": sistema.get("solucion_particular", []) if es_combinacion else [],
        "coeficientes_unicos": sistema["tipo"] == "unica",
        "sistema": sistema,
    }


def analizar_independencia(datos):
    """Resuelve c1v1+...+ckvk=0 para decidir independencia lineal."""
    vectores = leer_conjunto_vectores(datos.get("vectores", ""))
    dimension = len(vectores[0])
    A = construir_matriz_columnas(vectores)
    cero = [Fraction(0) for _ in range(dimension)]
    sistema = resolver_sistema(A, cero)

    independiente = sistema["tipo"] == "unica"
    relacion = []

    if not independiente:
        direcciones = sistema.get("direcciones", [])
        if direcciones:
            relacion = direcciones[0]

    return {
        "vectores": _serializar_vectores(vectores),
        "dimension": dimension,
        "cantidad_vectores": len(vectores),
        "A": [[str(valor) for valor in fila] for fila in A],
        "independiente": independiente,
        "relacion": relacion,
        "sistema": sistema,
    }


def ejecutar_relaciones(datos):
    """Selecciona el análisis solicitado desde la interfaz."""
    accion = datos.get("accion")
    if accion == "combinacion_lineal":
        return analizar_combinacion(datos)
    if accion == "independencia_lineal":
        return analizar_independencia(datos)
    raise ValueError("Operación vectorial no reconocida.")
