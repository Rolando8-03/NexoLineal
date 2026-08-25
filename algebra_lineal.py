"""Motor matemático del Programa 1.

Todas las operaciones matriciales se realizan manualmente con listas anidadas,
bucles, condicionales y funciones de Python estándar. No se utiliza NumPy,
SciPy ni ninguna función externa de álgebra lineal.
"""

TOLERANCIA = 1e-10


def copiar_matriz(matriz):
    """Crea una copia independiente de una matriz representada con listas."""
    copia = []
    for fila in matriz:
        copia.append(fila[:])
    return copia


def limpiar_casi_ceros(matriz):
    """Sustituye residuos numéricos muy pequeños por cero."""
    for i in range(len(matriz)):
        for j in range(len(matriz[i])):
            if abs(matriz[i][j]) < TOLERANCIA:
                matriz[i][j] = 0.0


def validar_datos(A, b):
    """Comprueba que A y b formen un sistema rectangular válido."""
    if not A or not A[0]:
        raise ValueError("La matriz de coeficientes no puede estar vacía.")

    numero_columnas = len(A[0])
    if len(A) != len(b):
        raise ValueError("Debe existir un término independiente por ecuación.")

    for fila in A:
        if len(fila) != numero_columnas:
            raise ValueError("Todas las filas deben tener igual cantidad de coeficientes.")


def construir_matriz_aumentada(A, b):
    """Forma [A|b] agregando b como última columna."""
    aumentada = []
    for i in range(len(A)):
        fila = A[i][:]
        fila.append(b[i])
        aumentada.append(fila)
    return aumentada


def registrar_paso(pasos, fase, titulo, operacion, matriz):
    """Guarda una fotografía de la matriz después de una operación elemental."""
    pasos.append(
        {
            "fase": fase,
            "titulo": titulo,
            "operacion": operacion,
            "matriz": copiar_matriz(matriz),
        }
    )


def posiciones_pivote(matriz, numero_variables):
    """Localiza el primer coeficiente no nulo de cada fila."""
    pivotes = []
    for i in range(len(matriz)):
        for j in range(numero_variables):
            if abs(matriz[i][j]) > TOLERANCIA:
                pivotes.append((i, j))
                break
    return pivotes


def calcular_rangos(matriz, numero_variables):
    """Calcula manualmente rango(A) y rango([A|b]) contando filas no nulas."""
    rango_A = 0
    rango_aumentada = 0

    for fila in matriz:
        hay_coeficiente = False
        for j in range(numero_variables):
            if abs(fila[j]) > TOLERANCIA:
                hay_coeficiente = True
                break

        if hay_coeficiente:
            rango_A += 1

        if hay_coeficiente or abs(fila[-1]) > TOLERANCIA:
            rango_aumentada += 1

    return rango_A, rango_aumentada


def buscar_fila_contradiccion(matriz, numero_variables):
    """Busca una fila [0 0 ... 0 | k] con k distinto de cero."""
    for i in range(len(matriz)):
        todos_cero = True
        for j in range(numero_variables):
            if abs(matriz[i][j]) > TOLERANCIA:
                todos_cero = False
                break

        if todos_cero and abs(matriz[i][-1]) > TOLERANCIA:
            return i
    return None


def escalonar_con_pivoteo(A, b):
    """Aplica eliminación de Gauss con pivoteo parcial y registra cada paso."""
    matriz = construir_matriz_aumentada(A, b)
    pasos = []
    numero_filas = len(matriz)
    numero_variables = len(A[0])
    fila_pivote = 0

    registrar_paso(
        pasos,
        "Matriz inicial",
        "Sistema escrito como matriz aumentada",
        "[A|b]",
        matriz,
    )

    # En cada columna se selecciona el mayor pivote disponible. Esto reduce
    # errores de redondeo y equivale, cuando hace falta, a intercambiar filas.
    for columna in range(numero_variables):
        if fila_pivote >= numero_filas:
            break

        fila_mayor = fila_pivote
        valor_mayor = abs(matriz[fila_pivote][columna])
        for fila in range(fila_pivote + 1, numero_filas):
            valor_actual = abs(matriz[fila][columna])
            if valor_actual > valor_mayor:
                valor_mayor = valor_actual
                fila_mayor = fila

        # Si toda la columna restante es cero, la variable no puede ser pivote.
        if valor_mayor < TOLERANCIA:
            continue

        # Operación elemental: Fi <-> Fj.
        if fila_mayor != fila_pivote:
            matriz[fila_pivote], matriz[fila_mayor] = (
                matriz[fila_mayor],
                matriz[fila_pivote],
            )
            registrar_paso(
                pasos,
                "Escalonamiento",
                "Intercambio para elegir un pivote estable",
                f"F{fila_pivote + 1} ↔ F{fila_mayor + 1}",
                matriz,
            )

        pivote = matriz[fila_pivote][columna]

        # Operación elemental: Fi <- Fi - factor*Fp. Con ella se crean ceros
        # debajo del pivote de la columna actual.
        for fila in range(fila_pivote + 1, numero_filas):
            if abs(matriz[fila][columna]) < TOLERANCIA:
                continue

            factor = matriz[fila][columna] / pivote
            for j in range(columna, numero_variables + 1):
                matriz[fila][j] = matriz[fila][j] - factor * matriz[fila_pivote][j]

            limpiar_casi_ceros(matriz)
            registrar_paso(
                pasos,
                "Escalonamiento",
                f"Cero debajo del pivote de la columna {columna + 1}",
                f"F{fila + 1} ← F{fila + 1} - ({factor:.6g})F{fila_pivote + 1}",
                matriz,
            )

        fila_pivote += 1

    limpiar_casi_ceros(matriz)
    return matriz, pasos


def resolver_sustitucion_regresiva(matriz, numero_variables):
    """Obtiene la solución única desde la última ecuación hacia la primera."""
    solucion = [0.0] * numero_variables
    pivotes = posiciones_pivote(matriz, numero_variables)

    for indice in range(len(pivotes) - 1, -1, -1):
        fila, columna = pivotes[indice]
        acumulado = 0.0

        for j in range(columna + 1, numero_variables):
            acumulado += matriz[fila][j] * solucion[j]

        solucion[columna] = (matriz[fila][-1] - acumulado) / matriz[fila][columna]

    return solucion


def reducir_a_rref(matriz_escalonada, numero_variables, pasos):
    """Continúa hasta forma escalonada reducida para expresar variables libres."""
    matriz = copiar_matriz(matriz_escalonada)
    pivotes = posiciones_pivote(matriz, numero_variables)

    for indice in range(len(pivotes) - 1, -1, -1):
        fila, columna = pivotes[indice]
        pivote = matriz[fila][columna]

        # Operación elemental: Fi <- (1/pivote)Fi.
        if abs(pivote - 1.0) > TOLERANCIA:
            for j in range(columna, numero_variables + 1):
                matriz[fila][j] = matriz[fila][j] / pivote
            limpiar_casi_ceros(matriz)
            registrar_paso(
                pasos,
                "Forma reducida",
                "Normalización del pivote",
                f"F{fila + 1} ← (1/{pivote:.6g})F{fila + 1}",
                matriz,
            )

        # Operación elemental: Fs <- Fs - factor*Fi para crear ceros arriba.
        for fila_superior in range(fila):
            factor = matriz[fila_superior][columna]
            if abs(factor) < TOLERANCIA:
                continue

            for j in range(columna, numero_variables + 1):
                matriz[fila_superior][j] -= factor * matriz[fila][j]
            limpiar_casi_ceros(matriz)
            registrar_paso(
                pasos,
                "Forma reducida",
                f"Cero arriba del pivote de la columna {columna + 1}",
                f"F{fila_superior + 1} ← F{fila_superior + 1} - ({factor:.6g})F{fila + 1}",
                matriz,
            )

    return matriz


def construir_solucion_parametrica(matriz_rref, numero_variables):
    """Construye las expresiones de las variables usando parámetros libres."""
    pivotes = posiciones_pivote(matriz_rref, numero_variables)
    columnas_pivote = []
    for _, columna in pivotes:
        columnas_pivote.append(columna)

    variables_libres = []
    for columna in range(numero_variables):
        if columna not in columnas_pivote:
            variables_libres.append(columna)

    # Cada expresión guarda: constante + suma(coeficiente * variable_libre).
    expresiones = []
    for columna in range(numero_variables):
        expresiones.append({"constante": 0.0, "terminos": {}})

    for indice, columna_libre in enumerate(variables_libres):
        expresiones[columna_libre]["terminos"][columna_libre] = 1.0

    for fila, columna_pivote in pivotes:
        expresiones[columna_pivote]["constante"] = matriz_rref[fila][-1]
        for columna_libre in variables_libres:
            coeficiente = -matriz_rref[fila][columna_libre]
            if abs(coeficiente) > TOLERANCIA:
                expresiones[columna_pivote]["terminos"][columna_libre] = coeficiente

    # Una solución particular se obtiene asignando cero a cada parámetro libre.
    solucion_particular = []
    for expresion in expresiones:
        solucion_particular.append(expresion["constante"])

    return variables_libres, expresiones, solucion_particular


def verificar_solucion(A, b, solucion):
    """Sustituye la solución en Ax=b y devuelve el detalle por ecuación."""
    comprobaciones = []

    for i in range(len(A)):
        lado_izquierdo = 0.0
        for j in range(len(A[i])):
            lado_izquierdo += A[i][j] * solucion[j]

        error = abs(lado_izquierdo - b[i])
        comprobaciones.append(
            {
                "ecuacion": i + 1,
                "izquierda": lado_izquierdo,
                "derecha": b[i],
                "cumple": error < 1e-8,
            }
        )

    return comprobaciones


def resolver_sistema(A, b):
    """Resuelve, clasifica y verifica un sistema lineal Ax=b."""
    validar_datos(A, b)
    numero_variables = len(A[0])
    escalonada, pasos = escalonar_con_pivoteo(A, b)
    rango_A, rango_aumentada = calcular_rangos(escalonada, numero_variables)

    resultado = {
        "matriz_inicial": construir_matriz_aumentada(A, b),
        "matriz_escalonada": copiar_matriz(escalonada),
        "rango_A": rango_A,
        "rango_aumentada": rango_aumentada,
        "numero_variables": numero_variables,
        "pasos": pasos,
    }

    # Teorema de Rouché-Frobenius aplicado mediante los rangos calculados.
    if rango_A < rango_aumentada:
        resultado["tipo"] = "inconsistente"
        resultado["clasificacion"] = "Sistema Inconsistente: Sin Solución"
        resultado["fila_contradiccion"] = buscar_fila_contradiccion(
            escalonada, numero_variables
        )
        return resultado

    if rango_A == numero_variables:
        solucion = resolver_sustitucion_regresiva(escalonada, numero_variables)
        resultado["tipo"] = "unica"
        resultado["clasificacion"] = (
            "Sistema Consistente Determinado: Solución Única"
        )
        resultado["solucion"] = solucion
        resultado["comprobaciones"] = verificar_solucion(A, b, solucion)
        return resultado

    matriz_rref = reducir_a_rref(escalonada, numero_variables, pasos)
    variables_libres, expresiones, particular = construir_solucion_parametrica(
        matriz_rref, numero_variables
    )
    resultado["tipo"] = "infinitas"
    resultado["clasificacion"] = (
        "Sistema Consistente Indeterminado: Infinitas Soluciones"
    )
    resultado["matriz_rref"] = matriz_rref
    resultado["variables_libres"] = variables_libres
    resultado["expresiones"] = expresiones
    resultado["solucion_particular"] = particular
    resultado["comprobaciones"] = verificar_solucion(A, b, particular)
    return resultado

