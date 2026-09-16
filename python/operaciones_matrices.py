"""Operaciones y propiedades de matrices en NexoLineal."""

from fractions import Fraction

from entrada_datos import (
    convertir_numero,
    leer_matriz_celdas,
)

from metodos_eliminacion import (
    reducir_matriz,
)

from formas_matriciales import (
    analizar_forma,
)


# ============================================================
# DIMENSIONES Y VALIDACIONES
# ============================================================

def dimensiones(matriz):
    """
    Devuelve:

        filas, columnas

    de una matriz rectangular.
    """

    return (
        len(matriz),
        len(matriz[0]),
    )


def mismas_dimensiones(
    A,
    B
):
    """
    Comprueba si A y B tienen
    exactamente el mismo tamaño.
    """

    return dimensiones(A) == dimensiones(B)


def validar_mismas_dimensiones(
    A,
    B,
    operacion="realizar esta operación"
):
    """
    Verifica que A y B tengan las mismas dimensiones.

    Se utiliza para suma, resta y otras propiedades
    donde las matrices deben tener igual tamaño.
    """

    if mismas_dimensiones(
        A,
        B
    ):
        return

    filas_A, columnas_A = dimensiones(A)
    filas_B, columnas_B = dimensiones(B)

    raise ValueError(
        f"No se puede {operacion}. "
        f"A es {filas_A}x{columnas_A} y "
        f"B es {filas_B}x{columnas_B}. "
        "Las matrices deben tener las mismas dimensiones."
    )


def producto_definido(
    A,
    B
):
    """
    Comprueba la condición:

        columnas(A) = filas(B)
    """

    _, columnas_A = dimensiones(A)

    filas_B, _ = dimensiones(B)

    return columnas_A == filas_B


def validar_producto(
    A,
    B
):
    """
    Verifica que el producto AB esté definido.

    Si:

        A es m x n
        B es r x p

    debe cumplirse:

        n = r
    """

    filas_A, columnas_A = dimensiones(A)
    filas_B, columnas_B = dimensiones(B)

    if columnas_A != filas_B:

        raise ValueError(
            "No se puede calcular AB. "
            f"A es {filas_A}x{columnas_A} y "
            f"B es {filas_B}x{columnas_B}. "
            f"A tiene {columnas_A} columna(s), "
            f"pero B tiene {filas_B} fila(s). "
            "Para multiplicar matrices debe cumplirse: "
            "columnas(A) = filas(B)."
        )


# ============================================================
# MATRIZ CERO E IDENTIDAD
# ============================================================

def matriz_cero(
    filas,
    columnas
):
    """Construye una matriz cero de tamaño filas x columnas."""

    return [
        [
            Fraction(0)
            for _ in range(columnas)
        ]
        for _ in range(filas)
    ]


def matriz_identidad(
    orden
):
    """
    Construye la matriz identidad I_n.

    Tiene 1 en la diagonal principal
    y 0 en las demás posiciones.
    """

    matriz = []

    for i in range(orden):

        fila = []

        for j in range(orden):

            if i == j:

                fila.append(
                    Fraction(1)
                )

            else:

                fila.append(
                    Fraction(0)
                )

        matriz.append(
            fila
        )

    return matriz


# ============================================================
# IGUALDAD DE MATRICES
# ============================================================

def matrices_iguales(
    A,
    B
):
    """
    Dos matrices son iguales si:

    1. Tienen las mismas dimensiones.
    2. Sus entradas correspondientes son iguales.
    """

    if not mismas_dimensiones(
        A,
        B
    ):
        return False

    filas, columnas = dimensiones(A)

    for i in range(filas):

        for j in range(columnas):

            if A[i][j] != B[i][j]:

                return False

    return True


# ============================================================
# SUMA
# ============================================================

def sumar_matrices(
    A,
    B
):
    """
    Calcula A + B.

    La suma se realiza entrada por entrada:

        c_ij = a_ij + b_ij

    A y B deben tener las mismas dimensiones.
    """

    validar_mismas_dimensiones(
        A,
        B,
        "sumar A + B"
    )

    filas, columnas = dimensiones(A)

    resultado = []

    for i in range(filas):

        fila = []

        for j in range(columnas):

            fila.append(
                A[i][j]
                + B[i][j]
            )

        resultado.append(
            fila
        )

    return resultado


# ============================================================
# RESTA
# ============================================================

def restar_matrices(
    A,
    B
):
    """
    Calcula A - B.

    La resta se realiza entrada por entrada:

        c_ij = a_ij - b_ij
    """

    validar_mismas_dimensiones(
        A,
        B,
        "restar A - B"
    )

    filas, columnas = dimensiones(A)

    resultado = []

    for i in range(filas):

        fila = []

        for j in range(columnas):

            fila.append(
                A[i][j]
                - B[i][j]
            )

        resultado.append(
            fila
        )

    return resultado


# ============================================================
# MULTIPLICACIÓN POR ESCALAR
# ============================================================

def multiplicar_escalar(
    escalar,
    A
):
    """
    Calcula:

        cA

    multiplicando cada entrada de A
    por el escalar c.
    """

    escalar = Fraction(
        escalar
    )

    filas, columnas = dimensiones(A)

    resultado = []

    for i in range(filas):

        fila = []

        for j in range(columnas):

            fila.append(
                escalar
                * A[i][j]
            )

        resultado.append(
            fila
        )

    return resultado


# ============================================================
# MULTIPLICACIÓN DE MATRICES
# ============================================================

def multiplicar_matrices(
    A,
    B
):
    """
    Calcula el producto:

        AB

    utilizando la regla fila-columna.

    Si:

        A es m x n
        B es n x p

    el resultado es una matriz:

        AB de tamaño m x p.

    Se utilizan tres bucles anidados:

    1. Recorre las filas de A.
    2. Recorre las columnas de B.
    3. Multiplica y suma las entradas correspondientes
       de la fila de A y la columna de B.
    """

    validar_producto(
        A,
        B
    )

    filas_A, columnas_A = dimensiones(A)

    _, columnas_B = dimensiones(B)

    resultado = []

    pasos = []

    # --------------------------------------------------------
    # Primer bucle:
    # recorrer cada fila de A.
    # --------------------------------------------------------

    for i in range(
        filas_A
    ):

        fila_resultado = []

        # ----------------------------------------------------
        # Segundo bucle:
        # recorrer cada columna de B.
        # ----------------------------------------------------

        for j in range(
            columnas_B
        ):

            suma = Fraction(0)

            productos = []

            # ------------------------------------------------
            # Tercer bucle:
            #
            # multiplicar las entradas de la fila i de A
            # por las entradas de la columna j de B.
            # ------------------------------------------------

            for k in range(
                columnas_A
            ):

                producto = (
                    A[i][k]
                    * B[k][j]
                )

                suma += producto

                productos.append(
                    {
                        "indice": k,

                        "a":
                            A[i][k],

                        "b":
                            B[k][j],

                        "producto":
                            producto,
                    }
                )

            fila_resultado.append(
                suma
            )

            # Guardamos cómo se calculó cada entrada.
            pasos.append(
                {
                    "fila": i,
                    "columna": j,

                    "productos":
                        productos,

                    "resultado":
                        suma,
                }
            )

        resultado.append(
            fila_resultado
        )

    return (
        resultado,
        pasos,
    )


# ============================================================
# TRANSPUESTA
# ============================================================

def transponer(
    A
):
    """
    Calcula A^T.

    Las filas de A se convierten
    en las columnas de A^T.
    """

    filas, columnas = dimensiones(A)

    transpuesta = []

    for j in range(
        columnas
    ):

        fila = []

        for i in range(
            filas
        ):

            fila.append(
                A[i][j]
            )

        transpuesta.append(
            fila
        )

    return transpuesta


# ============================================================
# CLASIFICACIÓN DE MATRICES
# ============================================================

def clasificar_matriz(
    A
):
    """
    Analiza los tipos de matriz estudiados.

    Reconoce:

    - Matriz fila
    - Matriz columna
    - Matriz rectangular
    - Matriz cuadrada
    - Matriz cero
    - Matriz identidad
    - Matriz diagonal
    - Triangular superior
    - Triangular inferior

    También devuelve la diagonal principal.
    """

    filas, columnas = dimensiones(A)

    cuadrada = (
        filas == columnas
    )

    rectangular = (
        filas != columnas
    )

    matriz_fila = (
        filas == 1
    )

    matriz_columna = (
        columnas == 1
    )

    # --------------------------------------------------------
    # Diagonal principal
    # --------------------------------------------------------

    diagonal_principal = []

    for i in range(
        min(
            filas,
            columnas
        )
    ):

        diagonal_principal.append(
            A[i][i]
        )

    # --------------------------------------------------------
    # Matriz cero
    # --------------------------------------------------------

    cero = True

    for fila in A:

        for valor in fila:

            if valor != 0:

                cero = False
                break

        if not cero:
            break

    # --------------------------------------------------------
    # Matrices que requieren ser cuadradas
    # --------------------------------------------------------

    identidad = False
    diagonal = False
    triangular_superior = False
    triangular_inferior = False

    if cuadrada:

        identidad = True
        diagonal = True
        triangular_superior = True
        triangular_inferior = True

        for i in range(filas):

            for j in range(columnas):

                valor = A[i][j]

                # Matriz identidad
                if i == j:

                    if valor != 1:

                        identidad = False

                else:

                    if valor != 0:

                        identidad = False
                        diagonal = False

                # Debajo de la diagonal debe haber ceros.
                if i > j and valor != 0:

                    triangular_superior = False

                # Encima de la diagonal debe haber ceros.
                if i < j and valor != 0:

                    triangular_inferior = False

    return {
        "filas":
            filas,

        "columnas":
            columnas,

        "dimension":
            f"{filas}x{columnas}",

        "matriz_fila":
            matriz_fila,

        "matriz_columna":
            matriz_columna,

        "rectangular":
            rectangular,

        "cuadrada":
            cuadrada,

        "cero":
            cero,

        "identidad":
            identidad,

        "diagonal":
            diagonal,

        "triangular_superior":
            triangular_superior,

        "triangular_inferior":
            triangular_inferior,

        "diagonal_principal":
            serializar_vector(
                diagonal_principal
            ),
    }


# ============================================================
# PROPIEDADES
# ============================================================

def construir_resultado_propiedad(
    codigo,
    nombre,
    formula,
    lados
):
    """
    Construye el resultado de una propiedad.

    lados contiene las matrices que deben ser iguales.

    Ejemplo:

        [
            ("A+B", matriz_1),
            ("B+A", matriz_2)
        ]
    """

    matrices = [
        matriz
        for _, matriz in lados
    ]

    primera = matrices[0]

    cumple = all(
        matrices_iguales(
            primera,
            matriz
        )
        for matriz in matrices[1:]
    )

    return {
        "codigo":
            codigo,

        "nombre":
            nombre,

        "formula":
            formula,

        "cumple":
            cumple,

        "lados": [
            {
                "etiqueta":
                    etiqueta,

                "matriz":
                    serializar_matriz(
                        matriz
                    ),
            }

            for (
                etiqueta,
                matriz,
            ) in lados
        ],
    }


def comprobar_propiedad(
    codigo,
    datos
):
    """
    Comprueba una propiedad matricial seleccionada
    por el usuario.

    La interfaz solamente pedirá las matrices y
    escalares necesarios para esa propiedad.
    """

    # ========================================================
    # SUMA CONMUTATIVA
    #
    # A + B = B + A
    # ========================================================

    if codigo == "suma_conmutativa":

        A = obtener_matriz(
            datos,
            "A"
        )

        B = obtener_matriz(
            datos,
            "B"
        )

        izquierda = sumar_matrices(
            A,
            B
        )

        derecha = sumar_matrices(
            B,
            A
        )

        return construir_resultado_propiedad(
            codigo,
            "Conmutatividad de la suma",
            "A + B = B + A",
            [
                ("A+B", izquierda),
                ("B+A", derecha),
            ],
        )

    # ========================================================
    # SUMA ASOCIATIVA
    #
    # A + (B + C) = (A + B) + C
    # ========================================================

    if codigo == "suma_asociativa":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")
        C = obtener_matriz(datos, "C")

        izquierda = sumar_matrices(
            A,
            sumar_matrices(
                B,
                C
            )
        )

        derecha = sumar_matrices(
            sumar_matrices(
                A,
                B
            ),
            C
        )

        return construir_resultado_propiedad(
            codigo,
            "Asociatividad de la suma",
            "A + (B + C) = (A + B) + C",
            [
                ("A+(B+C)", izquierda),
                ("(A+B)+C", derecha),
            ],
        )

    # ========================================================
    # IDENTIDAD ADITIVA
    #
    # A + 0 = A
    # ========================================================

    if codigo == "identidad_aditiva":

        A = obtener_matriz(
            datos,
            "A"
        )

        filas, columnas = dimensiones(A)

        cero = matriz_cero(
            filas,
            columnas
        )

        izquierda = sumar_matrices(
            A,
            cero
        )

        return construir_resultado_propiedad(
            codigo,
            "Identidad aditiva",
            "A + 0 = A",
            [
                ("A+0", izquierda),
                ("A", A),
            ],
        )

    # ========================================================
    # DISTRIBUTIVIDAD DEL ESCALAR
    #
    # r(A+B) = rA + rB
    # ========================================================

    if codigo == "escalar_distributivo":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        r = obtener_escalar(
            datos,
            "r"
        )

        izquierda = multiplicar_escalar(
            r,
            sumar_matrices(
                A,
                B
            )
        )

        derecha = sumar_matrices(
            multiplicar_escalar(
                r,
                A
            ),
            multiplicar_escalar(
                r,
                B
            ),
        )

        return construir_resultado_propiedad(
            codigo,
            "Distributividad del escalar",
            "r(A + B) = rA + rB",
            [
                ("r(A+B)", izquierda),
                ("rA+rB", derecha),
            ],
        )

    # ========================================================
    # SUMA DE ESCALARES
    #
    # (r+s)A = rA + sA
    # ========================================================

    if codigo == "suma_escalares":

        A = obtener_matriz(
            datos,
            "A"
        )

        r = obtener_escalar(
            datos,
            "r"
        )

        s = obtener_escalar(
            datos,
            "s"
        )

        izquierda = multiplicar_escalar(
            r + s,
            A
        )

        derecha = sumar_matrices(
            multiplicar_escalar(
                r,
                A
            ),
            multiplicar_escalar(
                s,
                A
            ),
        )

        return construir_resultado_propiedad(
            codigo,
            "Distributividad respecto a escalares",
            "(r + s)A = rA + sA",
            [
                ("(r+s)A", izquierda),
                ("rA+sA", derecha),
            ],
        )

    # ========================================================
    # ASOCIATIVIDAD DE ESCALARES
    #
    # r(sA) = (rs)A
    # ========================================================

    if codigo == "asociativa_escalares":

        A = obtener_matriz(
            datos,
            "A"
        )

        r = obtener_escalar(
            datos,
            "r"
        )

        s = obtener_escalar(
            datos,
            "s"
        )

        izquierda = multiplicar_escalar(
            r,
            multiplicar_escalar(
                s,
                A
            )
        )

        derecha = multiplicar_escalar(
            r * s,
            A
        )

        return construir_resultado_propiedad(
            codigo,
            "Asociatividad de escalares",
            "r(sA) = (rs)A",
            [
                ("r(sA)", izquierda),
                ("(rs)A", derecha),
            ],
        )

    # ========================================================
    # PRODUCTO ASOCIATIVO
    #
    # A(BC) = (AB)C
    # ========================================================

    if codigo == "producto_asociativo":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")
        C = obtener_matriz(datos, "C")

        BC, _ = multiplicar_matrices(
            B,
            C
        )

        izquierda, _ = multiplicar_matrices(
            A,
            BC
        )

        AB, _ = multiplicar_matrices(
            A,
            B
        )

        derecha, _ = multiplicar_matrices(
            AB,
            C
        )

        return construir_resultado_propiedad(
            codigo,
            "Asociatividad del producto",
            "A(BC) = (AB)C",
            [
                ("A(BC)", izquierda),
                ("(AB)C", derecha),
            ],
        )

    # ========================================================
    # DISTRIBUTIVA IZQUIERDA
    #
    # A(B+C) = AB + AC
    # ========================================================

    if codigo == "producto_distributivo_izquierda":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")
        C = obtener_matriz(datos, "C")

        B_mas_C = sumar_matrices(
            B,
            C
        )

        izquierda, _ = multiplicar_matrices(
            A,
            B_mas_C
        )

        AB, _ = multiplicar_matrices(
            A,
            B
        )

        AC, _ = multiplicar_matrices(
            A,
            C
        )

        derecha = sumar_matrices(
            AB,
            AC
        )

        return construir_resultado_propiedad(
            codigo,
            "Distributividad izquierda",
            "A(B + C) = AB + AC",
            [
                ("A(B+C)", izquierda),
                ("AB+AC", derecha),
            ],
        )

    # ========================================================
    # DISTRIBUTIVA DERECHA
    #
    # (B+C)A = BA + CA
    # ========================================================

    if codigo == "producto_distributivo_derecha":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")
        C = obtener_matriz(datos, "C")

        B_mas_C = sumar_matrices(
            B,
            C
        )

        izquierda, _ = multiplicar_matrices(
            B_mas_C,
            A
        )

        BA, _ = multiplicar_matrices(
            B,
            A
        )

        CA, _ = multiplicar_matrices(
            C,
            A
        )

        derecha = sumar_matrices(
            BA,
            CA
        )

        return construir_resultado_propiedad(
            codigo,
            "Distributividad derecha",
            "(B + C)A = BA + CA",
            [
                ("(B+C)A", izquierda),
                ("BA+CA", derecha),
            ],
        )

    # ========================================================
    # ESCALAR Y PRODUCTO
    #
    # r(AB) = (rA)B = A(rB)
    # ========================================================

    if codigo == "escalar_producto":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        r = obtener_escalar(
            datos,
            "r"
        )

        AB, _ = multiplicar_matrices(
            A,
            B
        )

        lado_1 = multiplicar_escalar(
            r,
            AB
        )

        rA = multiplicar_escalar(
            r,
            A
        )

        lado_2, _ = multiplicar_matrices(
            rA,
            B
        )

        rB = multiplicar_escalar(
            r,
            B
        )

        lado_3, _ = multiplicar_matrices(
            A,
            rB
        )

        return construir_resultado_propiedad(
            codigo,
            "Escalar y producto matricial",
            "r(AB) = (rA)B = A(rB)",
            [
                ("r(AB)", lado_1),
                ("(rA)B", lado_2),
                ("A(rB)", lado_3),
            ],
        )

    # ========================================================
    # IDENTIDAD MULTIPLICATIVA
    #
    # I_m A = A = A I_n
    # ========================================================

    if codigo == "identidad_multiplicativa":

        A = obtener_matriz(
            datos,
            "A"
        )

        filas, columnas = dimensiones(A)

        I_filas = matriz_identidad(
            filas
        )

        I_columnas = matriz_identidad(
            columnas
        )

        izquierda, _ = multiplicar_matrices(
            I_filas,
            A
        )

        derecha, _ = multiplicar_matrices(
            A,
            I_columnas
        )

        return construir_resultado_propiedad(
            codigo,
            "Identidad multiplicativa",
            "I_m A = A = A I_n",
            [
                ("I_m A", izquierda),
                ("A", A),
                ("A I_n", derecha),
            ],
        )

    # ========================================================
    # TRANSPUESTA DE LA TRANSPUESTA
    #
    # (A^T)^T = A
    # ========================================================

    if codigo == "transpuesta_doble":

        A = obtener_matriz(
            datos,
            "A"
        )

        izquierda = transponer(
            transponer(
                A
            )
        )

        return construir_resultado_propiedad(
            codigo,
            "Transpuesta de la transpuesta",
            "(A^T)^T = A",
            [
                ("(A^T)^T", izquierda),
                ("A", A),
            ],
        )

    # ========================================================
    # TRANSPUESTA DE UNA SUMA
    #
    # (A+B)^T = A^T + B^T
    # ========================================================

    if codigo == "transpuesta_suma":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        izquierda = transponer(
            sumar_matrices(
                A,
                B
            )
        )

        derecha = sumar_matrices(
            transponer(A),
            transponer(B),
        )

        return construir_resultado_propiedad(
            codigo,
            "Transpuesta de una suma",
            "(A + B)^T = A^T + B^T",
            [
                ("(A+B)^T", izquierda),
                ("A^T+B^T", derecha),
            ],
        )

    # ========================================================
    # TRANSPUESTA DE UN MÚLTIPLO ESCALAR
    #
    # (rA)^T = rA^T
    # ========================================================

    if codigo == "transpuesta_escalar":

        A = obtener_matriz(
            datos,
            "A"
        )

        r = obtener_escalar(
            datos,
            "r"
        )

        izquierda = transponer(
            multiplicar_escalar(
                r,
                A
            )
        )

        derecha = multiplicar_escalar(
            r,
            transponer(
                A
            )
        )

        return construir_resultado_propiedad(
            codigo,
            "Transpuesta de un múltiplo escalar",
            "(rA)^T = rA^T",
            [
                ("(rA)^T", izquierda),
                ("rA^T", derecha),
            ],
        )

    # ========================================================
    # TRANSPUESTA DE UN PRODUCTO
    #
    # (AB)^T = B^T A^T
    # ========================================================

    if codigo == "transpuesta_producto":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        AB, _ = multiplicar_matrices(
            A,
            B
        )

        izquierda = transponer(
            AB
        )

        derecha, _ = multiplicar_matrices(
            transponer(B),
            transponer(A),
        )

        return construir_resultado_propiedad(
            codigo,
            "Transpuesta de un producto",
            "(AB)^T = B^T A^T",
            [
                ("(AB)^T", izquierda),
                ("B^T A^T", derecha),
            ],
        )

    raise ValueError(
        "Selecciona una propiedad matricial válida"
    )


# ============================================================
# REDUCCIÓN POR FILAS
# ============================================================

def analizar_reduccion(
    A
):
    """
    Lleva una matriz libre a:

    - Forma escalonada.
    - Forma escalonada reducida.

    Además devuelve pivotes, rango y todos
    los pasos de las operaciones elementales.
    """

    reduccion = reducir_matriz(
        A
    )

    escalonada = reduccion[
        "matriz_escalonada"
    ]

    rref = reduccion[
        "matriz_rref"
    ]

    forma_escalonada = analizar_forma(
        escalonada
    )

    forma_rref = analizar_forma(
        rref
    )

    rango = forma_escalonada[
        "rango"
    ]

    return {
        "matriz_original":
            serializar_matriz(
                reduccion[
                    "matriz_original"
                ]
            ),

        "matriz_escalonada":
            serializar_matriz(
                escalonada
            ),

        "matriz_rref":
            serializar_matriz(
                rref
            ),

        "posiciones_pivote":
            reduccion[
                "posiciones_pivote"
            ],

        "columnas_pivote":
            reduccion[
                "columnas_pivote"
            ],

        "rango":
            rango,

        "forma_escalonada":
            forma_escalonada,

        "forma_rref":
            forma_rref,

        "pasos_gauss":
            serializar_pasos(
                reduccion[
                    "pasos_gauss"
                ]
            ),

        "pasos_jordan":
            serializar_pasos(
                reduccion[
                    "pasos_jordan"
                ]
            ),
    }


# ============================================================
# UTILIDADES PARA LA INTERFAZ
# ============================================================

def obtener_matriz(
    datos,
    clave
):
    """
    Lee una matriz enviada desde una cuadrícula.

    Ejemplo:

        clave = "A"

    busca:

        datos["A"]
    """

    return leer_matriz_celdas(
        datos.get(
            clave,
            []
        ),
        f"matriz {clave}"
    )


def obtener_escalar(
    datos,
    clave
):
    """Lee un escalar enviado desde la interfaz."""

    return convertir_numero(
        datos.get(
            clave,
            ""
        )
    )


# ============================================================
# SERIALIZACIÓN
# ============================================================

def serializar_vector(
    vector
):
    return [
        str(valor)
        for valor in vector
    ]


def serializar_matriz(
    matriz
):
    return [
        [
            str(valor)
            for valor in fila
        ]
        for fila in matriz
    ]


def serializar_operacion(
    operacion
):
    """Convierte Fraction dentro de una operación a texto."""

    resultado = {}

    for clave, valor in operacion.items():

        if isinstance(
            valor,
            Fraction
        ):

            resultado[
                clave
            ] = str(valor)

        else:

            resultado[
                clave
            ] = valor

    return resultado


def serializar_pasos(
    pasos
):
    """Serializa los pasos de Gauss/Gauss-Jordan."""

    resultado = []

    for paso in pasos:

        resultado.append(
            {
                "titulo":
                    paso[
                        "titulo"
                    ],

                "mostrar_matriz":
                    paso[
                        "mostrar_matriz"
                    ],

                "operacion":
                    serializar_operacion(
                        paso[
                            "operacion"
                        ]
                    ),

                "matriz":
                    serializar_matriz(
                        paso[
                            "matriz"
                        ]
                    ),
            }
        )

    return resultado


def serializar_pasos_producto(
    pasos
):
    """
    Serializa el procedimiento de la
    regla fila-columna.
    """

    resultado = []

    for paso in pasos:

        resultado.append(
            {
                "fila":
                    paso[
                        "fila"
                    ],

                "columna":
                    paso[
                        "columna"
                    ],

                "productos": [
                    {
                        "indice":
                            producto[
                                "indice"
                            ],

                        "a":
                            str(
                                producto[
                                    "a"
                                ]
                            ),

                        "b":
                            str(
                                producto[
                                    "b"
                                ]
                            ),

                        "producto":
                            str(
                                producto[
                                    "producto"
                                ]
                            ),
                    }

                    for producto
                    in paso[
                        "productos"
                    ]
                ],

                "resultado":
                    str(
                        paso[
                            "resultado"
                        ]
                    ),
            }
        )

    return resultado


# ============================================================
# PUNTO DE ENTRADA PARA LA INTERFAZ
# ============================================================

def ejecutar_matrices(
    datos
):
    """
    Ejecuta solamente la operación matricial
    seleccionada por el usuario.

    Operaciones:

        suma
        resta
        escalar
        igualdad
        clasificacion
        producto
        transpuesta
        reduccion
        propiedad
    """

    operacion = datos.get(
        "operacion",
        ""
    )

    # ========================================================
    # SUMA
    # ========================================================

    if operacion == "suma":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        resultado = sumar_matrices(
            A,
            B
        )

        return {
            "operacion":
                "suma",

            "A":
                serializar_matriz(A),

            "B":
                serializar_matriz(B),

            "resultado":
                serializar_matriz(
                    resultado
                ),
        }

    # ========================================================
    # RESTA
    # ========================================================

    if operacion == "resta":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        resultado = restar_matrices(
            A,
            B
        )

        return {
            "operacion":
                "resta",

            "A":
                serializar_matriz(A),

            "B":
                serializar_matriz(B),

            "resultado":
                serializar_matriz(
                    resultado
                ),
        }

    # ========================================================
    # ESCALAR
    # ========================================================

    if operacion == "escalar":

        A = obtener_matriz(
            datos,
            "A"
        )

        c = obtener_escalar(
            datos,
            "c"
        )

        resultado = multiplicar_escalar(
            c,
            A
        )

        return {
            "operacion":
                "escalar",

            "A":
                serializar_matriz(A),

            "c":
                str(c),

            "resultado":
                serializar_matriz(
                    resultado
                ),
        }

    # ========================================================
    # IGUALDAD
    # ========================================================

    if operacion == "igualdad":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        return {
            "operacion":
                "igualdad",

            "A":
                serializar_matriz(A),

            "B":
                serializar_matriz(B),

            "misma_dimension":
                mismas_dimensiones(
                    A,
                    B
                ),

            "iguales":
                matrices_iguales(
                    A,
                    B
                ),
        }

    # ========================================================
    # CLASIFICACIÓN
    # ========================================================

    if operacion == "clasificacion":

        A = obtener_matriz(
            datos,
            "A"
        )

        return {
            "operacion":
                "clasificacion",

            "A":
                serializar_matriz(A),

            "clasificacion":
                clasificar_matriz(
                    A
                ),
        }

    # ========================================================
    # PRODUCTO AB
    # ========================================================

    if operacion == "producto":

        A = obtener_matriz(datos, "A")
        B = obtener_matriz(datos, "B")

        producto_AB, pasos = (
            multiplicar_matrices(
                A,
                B
            )
        )

        resultado = {
            "operacion":
                "producto",

            "A":
                serializar_matriz(A),

            "B":
                serializar_matriz(B),

            "dimension_A":
                list(
                    dimensiones(A)
                ),

            "dimension_B":
                list(
                    dimensiones(B)
                ),

            "resultado":
                serializar_matriz(
                    producto_AB
                ),

            "pasos":
                serializar_pasos_producto(
                    pasos
                ),

            # Advertencias trabajadas en clase.
            "advertencias": [
                (
                    "En general, la multiplicación "
                    "de matrices no es conmutativa."
                ),
                (
                    "Las leyes de cancelación no se "
                    "aplican en general a la "
                    "multiplicación de matrices."
                ),
                (
                    "Si AB es la matriz cero, no se "
                    "puede concluir en general que "
                    "A o B sea la matriz cero."
                ),
            ],
        }

        # ----------------------------------------------------
        # Comparar AB con BA solamente cuando BA exista.
        # ----------------------------------------------------

        if producto_definido(
            B,
            A
        ):

            producto_BA, _ = (
                multiplicar_matrices(
                    B,
                    A
                )
            )

            resultado[
                "BA_definido"
            ] = True

            resultado[
                "BA"
            ] = serializar_matriz(
                producto_BA
            )

            resultado[
                "AB_igual_BA"
            ] = matrices_iguales(
                producto_AB,
                producto_BA
            )

        else:

            resultado[
                "BA_definido"
            ] = False

            resultado[
                "BA"
            ] = []

            resultado[
                "AB_igual_BA"
            ] = None

        return resultado

    # ========================================================
    # TRANSPUESTA
    # ========================================================

    if operacion == "transpuesta":

        A = obtener_matriz(
            datos,
            "A"
        )

        resultado = transponer(
            A
        )

        return {
            "operacion":
                "transpuesta",

            "A":
                serializar_matriz(A),

            "resultado":
                serializar_matriz(
                    resultado
                ),

            "dimension_A":
                list(
                    dimensiones(A)
                ),

            "dimension_transpuesta":
                list(
                    dimensiones(
                        resultado
                    )
                ),
        }

    # ========================================================
    # REDUCCIÓN
    # ========================================================

    if operacion == "reduccion":

        A = obtener_matriz(
            datos,
            "A"
        )

        return {
            "operacion":
                "reduccion",

            **analizar_reduccion(
                A
            ),
        }

    # ========================================================
    # PROPIEDADES
    # ========================================================

    if operacion == "propiedad":

        codigo = datos.get(
            "propiedad",
            ""
        )

        return {
            "operacion":
                "propiedad",

            "propiedad":
                comprobar_propiedad(
                    codigo,
                    datos
                ),
        }

    raise ValueError(
        "Selecciona una operación válida "
        "del módulo de matrices"
    )