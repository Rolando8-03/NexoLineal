"""Evalúa combinación lineal, independencia y las propiedades de Ax.
Implementa ecuaciones vectoriales y sistemas homogéneos.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""

from fractions import Fraction

from analisis_sistema import resolver_sistema
from entrada_datos import convertir_numero


def leer_vector(texto, nombre="vector"):
    """Convierte componentes separadas por espacios en un vector exacto. Recibe texto, nombre."""
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
    """Lee un vector por línea; también permite separar vectores con punto y coma. Recibe texto."""
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
    """Construye A=[v1 v2 ... vk], colocando cada vector como una columna. Recibe vectores."""
    dimension = len(vectores[0])
    return [
        [vectores[j][i] for j in range(len(vectores))]
        for i in range(dimension)
    ]


def _serializar_vectores(vectores):
    """Recibe vectores exactos y devuelve listas de textos compatibles con JSON."""
    return [[str(valor) for valor in vector] for vector in vectores]


def analizar_combinacion(datos):
    """Determina si b pertenece al generado de los vectores ingresados. Recibe datos."""
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
    """Determina si un conjunto de vectores es L.I. o L.D. Recibe datos."""

    
    vectores = leer_conjunto_vectores(datos.get("vectores", ""))

    cantidad = len(vectores)
    dimension = len(vectores[0])

    
    
    try:
        k = int(str(datos.get("k", cantidad)))
        n = int(str(datos.get("n", dimension)))
    except (ValueError, TypeError):
        raise ValueError("k y n deben ser números enteros.") from None

    
    if not 1 <= k <= 6 or not 1 <= n <= 6:
        raise ValueError("k y n deben estar entre 1 y 6.")

    if cantidad != k:
        raise ValueError(
            f"Indicaste {k} vectores, pero ingresaste {cantidad}."
        )

    if dimension != n:
        raise ValueError(
            f"Cada vector debe tener {n} componentes."
        )

    
    A = construir_matriz_columnas(vectores)

    
    
    cero = [Fraction(0) for _ in range(n)]

    
    sistema = resolver_sistema(A, cero)

    numero_pivotes = len(sistema["columnas_pivote"])
    numero_libres = len(sistema["variables_libres"])

    
    
    independiente = numero_pivotes == k

    if independiente:
        veredicto = "L.I. — Linealmente independientes"

        explicacion = (
            f"Hay {numero_pivotes} pivotes para {k} vectores. "
            "No existen variables libres. "
            "Ax = 0 solo tiene la solución trivial: "
            "todos los coeficientes son cero."
        )

        relacion = []

    else:
        veredicto = "L.D. — Linealmente dependientes"

        explicacion = (
            f"Hay {numero_pivotes} pivotes para {k} vectores "
            f"y {numero_libres} variable(s) libre(s). "
            "Ax = 0 tiene soluciones no triviales: "
            "existen coeficientes no todos cero cuya "
            "combinación de los vectores produce el vector cero."
        )

        
        relacion = sistema.get("relacion_columnas", [])

    
    
    return {
        "vectores": _serializar_vectores(vectores),
        "dimension": n,
        "cantidad_vectores": k,
        "A": [[str(valor) for valor in fila] for fila in A],
        "independiente": independiente,
        "numero_pivotes": numero_pivotes,
        "numero_libres": numero_libres,
        "veredicto": veredicto,
        "explicacion": explicacion,
        "relacion": relacion,
        "sistema": sistema,
    }


def multiplicar_matriz_vector(A, v):
    """Multiplica una matriz A por un vector columna v. Recibe A, v."""
    if not A or not A[0]:
        raise ValueError("La matriz A no puede estar vacía.")
    if len(A[0]) != len(v):
        raise ValueError(
            f"A tiene {len(A[0])} columnas, pero el vector tiene {len(v)} componentes."
        )
    
    return [
        sum(A[i][j] * v[j] for j in range(len(v)))
        for i in range(len(A))
    ]


def _serializar_matriz(matriz):
    """Recibe una matriz exacta y devuelve sus entradas como texto."""
    return [[str(valor) for valor in fila] for fila in matriz]


def _serializar_vector(vector):
    """Recibe un vector exacto y devuelve sus componentes como texto."""
    return [str(valor) for valor in vector]


def analizar_propiedades_matriz_vector(datos):
    """Comprueba A(u+v)=Au+Av y A(cu)=c(Au). Recibe datos."""
    
    filas = int(datos.get("filas", 0))
    columnas = int(datos.get("columnas", 0))
    if not 1 <= filas <= 6 or not 1 <= columnas <= 6:
        raise ValueError("Las dimensiones de A deben estar entre 1 y 6.")

    textos_A = datos.get("A", [])
    if len(textos_A) != filas:
        raise ValueError("La matriz A no coincide con la cantidad de filas indicada.")

    
    A = []
    for i, fila_texto in enumerate(textos_A):
        if len(fila_texto) != columnas:
            raise ValueError(f"La fila {i + 1} de A debe tener {columnas} elementos.")
        fila = []
        for j, valor in enumerate(fila_texto):
            try:
                fila.append(convertir_numero(valor))
            except ValueError as error:
                raise ValueError(f"Error en A, fila {i + 1}, columna {j + 1}: {error}") from error
        A.append(fila)

    
    def leer_vector_componentes(nombre):
        """Recibe nombre y datos de un vector; devuelve componentes exactas validadas."""
        datos_vector = datos.get(nombre, [])
        if len(datos_vector) != columnas:
            raise ValueError(
                f"{nombre} debe tener exactamente {columnas} componentes porque pertenece a R^{columnas}."
            )
        vector = []
        for i, valor in enumerate(datos_vector):
            try:
                vector.append(convertir_numero(valor))
            except ValueError as error:
                raise ValueError(f"Error en {nombre}, componente {i + 1}: {error}") from error
        return vector

    
    u = leer_vector_componentes("u")
    v = leer_vector_componentes("v")
    try:
        c = convertir_numero(datos.get("c", "1"))
    except ValueError as error:
        raise ValueError(f"Error en el escalar c: {error}") from error

    
    u_mas_v = [u[i] + v[i] for i in range(columnas)]
    Au_mas_v = multiplicar_matriz_vector(A, u_mas_v)
    Au = multiplicar_matriz_vector(A, u)
    Av = multiplicar_matriz_vector(A, v)
    Au_mas_Av = [Au[i] + Av[i] for i in range(filas)]

    
    cu = [c * x for x in u]
    Acu = multiplicar_matriz_vector(A, cu)
    cAu = [c * x for x in Au]

    
    propiedades = [
        {
            "nombre": "A(u + v) = Au + Av",
            "izquierda": Au_mas_v,
            "derecha": Au_mas_Av,
            "cumple": Au_mas_v == Au_mas_Av,
        },
        {
            "nombre": "A(cu) = c(Au)",
            "izquierda": Acu,
            "derecha": cAu,
            "cumple": Acu == cAu,
        },
    ]

    return {
        "A": _serializar_matriz(A),
        "u": _serializar_vector(u),
        "v": _serializar_vector(v),
        "c": str(c),
        "u_mas_v": _serializar_vector(u_mas_v),
        "Au": _serializar_vector(Au),
        "Av": _serializar_vector(Av),
        "Au_mas_v": _serializar_vector(Au_mas_v),
        "Au_mas_Av": _serializar_vector(Au_mas_Av),
        "cu": _serializar_vector(cu),
        "Acu": _serializar_vector(Acu),
        "cAu": _serializar_vector(cAu),
        "propiedades": propiedades,
    }

def ejecutar_relaciones(datos):
    """Selecciona el análisis solicitado desde la interfaz. Recibe datos."""
    accion = datos.get("accion")
    if accion == "combinacion_lineal":
        return analizar_combinacion(datos)
    if accion == "independencia_lineal":
        return analizar_independencia(datos)
    
    if accion == "propiedades_matriz_vector":
        return analizar_propiedades_matriz_vector(datos)
    raise ValueError("Operación vectorial no reconocida.")
