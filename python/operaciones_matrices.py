"""Operaciones matriciales exactas implementadas con Python estándar."""

from fractions import Fraction

from entrada_datos import convertir_numero
from formas_matriciales import analizar_forma
from operaciones_fila import (
    buscar_pivote_menor,
    copiar_matriz,
    eliminar_denominadores,
    intercambiar_filas,
    multiplicar_fila,
    sumar_multiplo,
)


def leer_matriz(texto, nombre="matriz"):
    """Convierte texto en una matriz rectangular de valores exactos."""
    contenido = str(texto).strip()
    if not contenido:
        raise ValueError(f"La {nombre} no puede estar vacía.")

    lineas = [
        linea.strip()
        for linea in contenido.replace(";", "\n").splitlines()
        if linea.strip()
    ]

    if not 1 <= len(lineas) <= 6:
        raise ValueError(f"La {nombre} debe tener entre 1 y 6 filas.")

    matriz = []
    columnas = None

    for i, linea in enumerate(lineas):
        componentes = linea.replace(",", ".").split()

        if columnas is None:
            columnas = len(componentes)
            if not 1 <= columnas <= 6:
                raise ValueError(
                    f"La {nombre} debe tener entre 1 y 6 columnas."
                )

        if len(componentes) != columnas:
            raise ValueError(
                f"La fila {i + 1} de la {nombre} tiene {len(componentes)} "
                f"elemento(s), pero se esperaban {columnas}."
            )

        fila = []
        for j, componente in enumerate(componentes):
            try:
                fila.append(convertir_numero(componente))
            except ValueError as error:
                raise ValueError(
                    f"Error en {nombre}, fila {i + 1}, columna {j + 1}: {error}"
                ) from error
        matriz.append(fila)

    return matriz


def dimensiones(A):
    """Devuelve (filas, columnas)."""
    return len(A), len(A[0])


def mismas_dimensiones(A, B):
    """Indica si A y B tienen el mismo número de filas y columnas."""
    return dimensiones(A) == dimensiones(B)


def matriz_cero(filas, columnas):
    """Construye una matriz nula del tamaño indicado."""
    return [[Fraction(0) for _ in range(columnas)] for _ in range(filas)]


def matriz_identidad(orden):
    """Construye la matriz identidad de orden n."""
    return [
        [Fraction(1 if i == j else 0) for j in range(orden)]
        for i in range(orden)
    ]


def sumar_matrices(A, B):
    """Suma matrices de iguales dimensiones entrada a entrada."""
    if not mismas_dimensiones(A, B):
        raise ValueError(
            "Para sumar matrices, A y B deben tener las mismas dimensiones."
        )
    return [
        [A[i][j] + B[i][j] for j in range(len(A[0]))]
        for i in range(len(A))
    ]


def restar_matrices(A, B):
    """Resta matrices de iguales dimensiones entrada a entrada."""
    if not mismas_dimensiones(A, B):
        raise ValueError(
            "Para restar matrices, A y B deben tener las mismas dimensiones."
        )
    return [
        [A[i][j] - B[i][j] for j in range(len(A[0]))]
        for i in range(len(A))
    ]


def multiplicar_por_escalar(escalar, A):
    """Multiplica cada entrada de A por un número real."""
    return [[escalar * valor for valor in fila] for fila in A]


def multiplicacion_definida(A, B):
    """AB existe si columnas(A) = filas(B)."""
    return len(A[0]) == len(B)


def multiplicar_matrices(A, B):
    """Calcula AB mediante la regla fila-columna y registra cada entrada."""
    if not multiplicacion_definida(A, B):
        raise ValueError(
            "AB no está definida: columnas(A) debe ser igual a filas(B)."
        )

    producto = []
    pasos = []

    # Primer bucle: recorre las filas de A.
    for i in range(len(A)):
        fila_resultado = []

        # Segundo bucle: recorre las columnas de B.
        for j in range(len(B[0])):
            total = Fraction(0)
            terminos = []

            # Tercer bucle: multiplica fila i de A por columna j de B.
            for k in range(len(B)):
                parcial = A[i][k] * B[k][j]
                total += parcial
                terminos.append(
                    {
                        "a": A[i][k],
                        "b": B[k][j],
                        "producto": parcial,
                    }
                )

            fila_resultado.append(total)
            pasos.append(
                {
                    "fila": i,
                    "columna": j,
                    "terminos": terminos,
                    "resultado": total,
                }
            )

        producto.append(fila_resultado)

    return producto, pasos


def transponer(A):
    """Intercambia filas por columnas para obtener A^T."""
    return [
        [A[i][j] for i in range(len(A))]
        for j in range(len(A[0]))
    ]


def son_iguales(A, B):
    """Comprueba igualdad por tamaño y entradas correspondientes."""
    return mismas_dimensiones(A, B) and A == B


def clasificar_matriz(A):
    """Reconoce los tipos de matrices trabajados en clase."""
    filas, columnas = dimensiones(A)
    cuadrada = filas == columnas

    cero = all(valor == 0 for fila in A for valor in fila)

    identidad = cuadrada and all(
        A[i][j] == (1 if i == j else 0)
        for i in range(filas)
        for j in range(columnas)
    )

    diagonal = cuadrada and all(
        i == j or A[i][j] == 0
        for i in range(filas)
        for j in range(columnas)
    )

    triangular_superior = cuadrada and all(
        i <= j or A[i][j] == 0
        for i in range(filas)
        for j in range(columnas)
    )

    triangular_inferior = cuadrada and all(
        i >= j or A[i][j] == 0
        for i in range(filas)
        for j in range(columnas)
    )

    return {
        "filas": filas,
        "columnas": columnas,
        "cuadrada": cuadrada,
        "cero": cero,
        "identidad": identidad,
        "diagonal": diagonal,
        "triangular_superior": triangular_superior,
        "triangular_inferior": triangular_inferior,
    }


def reducir_a_escalonada(A):
    """Lleva una matriz libre a forma escalonada mediante operaciones por filas."""
    matriz = copiar_matriz(A)
    pasos = []
    fila_pivote = 0

    for columna in range(len(matriz[0])):
        if fila_pivote >= len(matriz):
            break

        elegida = buscar_pivote_menor(matriz, fila_pivote, columna)
        if elegida is None:
            continue

        pasos.append(
            {
                "tipo": "pivote",
                "fila": elegida,
                "columna": columna,
                "valor": matriz[elegida][columna],
                "matriz": copiar_matriz(matriz),
            }
        )

        if elegida != fila_pivote:
            intercambiar_filas(matriz, fila_pivote, elegida)
            pasos.append(
                {
                    "tipo": "intercambio",
                    "fila_a": fila_pivote,
                    "fila_b": elegida,
                    "matriz": copiar_matriz(matriz),
                }
            )

        pivote = matriz[fila_pivote][columna]

        for fila in range(fila_pivote + 1, len(matriz)):
            valor = matriz[fila][columna]
            if valor == 0:
                continue

            k = -valor / pivote
            sumar_multiplo(matriz, fila, fila_pivote, k)
            pasos.append(
                {
                    "tipo": "combinacion",
                    "destino": fila,
                    "origen": fila_pivote,
                    "k": k,
                    "matriz": copiar_matriz(matriz),
                }
            )

            multiplo = eliminar_denominadores(matriz, fila)
            if multiplo > 1:
                pasos.append(
                    {
                        "tipo": "mcm",
                        "fila": fila,
                        "multiplo": multiplo,
                        "matriz": copiar_matriz(matriz),
                    }
                )

        fila_pivote += 1

    return matriz, pasos


def reducir_a_rref(A):
    """Continúa la reducción hasta obtener forma escalonada reducida."""
    escalonada, pasos = reducir_a_escalonada(A)
    matriz = copiar_matriz(escalonada)
    pasos_rref = []

    for fila in range(len(matriz) - 1, -1, -1):
        columna = None
        for j, valor in enumerate(matriz[fila]):
            if valor != 0:
                columna = j
                break

        if columna is None:
            continue

        pivote = matriz[fila][columna]
        if pivote != 1:
            constante = Fraction(1, 1) / pivote
            multiplicar_fila(matriz, fila, constante)
            pasos_rref.append(
                {
                    "tipo": "normalizacion",
                    "fila": fila,
                    "constante": constante,
                    "matriz": copiar_matriz(matriz),
                }
            )

        for superior in range(fila):
            valor = matriz[superior][columna]
            if valor == 0:
                continue

            k = -valor
            sumar_multiplo(matriz, superior, fila, k)
            pasos_rref.append(
                {
                    "tipo": "combinacion",
                    "destino": superior,
                    "origen": fila,
                    "k": k,
                    "matriz": copiar_matriz(matriz),
                }
            )

    return escalonada, matriz, pasos + pasos_rref


def _propiedad(nombre, izquierda, derecha):
    return {
        "nombre": nombre,
        "izquierda": izquierda,
        "derecha": derecha,
        "cumple": izquierda == derecha,
    }


def comprobar_propiedades(A, B=None, C=None, c=Fraction(1), d=Fraction(1)):
    """Comprueba las propiedades de matrices estudiadas que estén definidas."""
    propiedades = []

    if B is not None and mismas_dimensiones(A, B):
        propiedades.append(
            _propiedad("A + B = B + A", sumar_matrices(A, B), sumar_matrices(B, A))
        )
        propiedades.append(
            _propiedad(
                "c(A + B) = cA + cB",
                multiplicar_por_escalar(c, sumar_matrices(A, B)),
                sumar_matrices(
                    multiplicar_por_escalar(c, A),
                    multiplicar_por_escalar(c, B),
                ),
            )
        )
        propiedades.append(
            _propiedad(
                "(A + B)^T = A^T + B^T",
                transponer(sumar_matrices(A, B)),
                sumar_matrices(transponer(A), transponer(B)),
            )
        )

    cero = matriz_cero(len(A), len(A[0]))
    propiedades.append(_propiedad("A + 0 = A", sumar_matrices(A, cero), A))
    propiedades.append(
        _propiedad(
            "(c + d)A = cA + dA",
            multiplicar_por_escalar(c + d, A),
            sumar_matrices(
                multiplicar_por_escalar(c, A),
                multiplicar_por_escalar(d, A),
            ),
        )
    )
    propiedades.append(
        _propiedad(
            "c(dA) = (cd)A",
            multiplicar_por_escalar(c, multiplicar_por_escalar(d, A)),
            multiplicar_por_escalar(c * d, A),
        )
    )
    propiedades.append(_propiedad("(A^T)^T = A", transponer(transponer(A)), A))
    propiedades.append(
        _propiedad(
            "(cA)^T = cA^T",
            transponer(multiplicar_por_escalar(c, A)),
            multiplicar_por_escalar(c, transponer(A)),
        )
    )

    if B is not None and multiplicacion_definida(A, B):
        AB, _ = multiplicar_matrices(A, B)
        BT = transponer(B)
        AT = transponer(A)
        BTAT, _ = multiplicar_matrices(BT, AT)
        propiedades.append(_propiedad("(AB)^T = B^T A^T", transponer(AB), BTAT))

        propiedades.append(
            _propiedad(
                "c(AB) = (cA)B",
                multiplicar_por_escalar(c, AB),
                multiplicar_matrices(multiplicar_por_escalar(c, A), B)[0],
            )
        )
        propiedades.append(
            _propiedad(
                "c(AB) = A(cB)",
                multiplicar_por_escalar(c, AB),
                multiplicar_matrices(A, multiplicar_por_escalar(c, B))[0],
            )
        )

    if C is not None and B is not None:
        if mismas_dimensiones(A, B) and mismas_dimensiones(B, C):
            propiedades.append(
                _propiedad(
                    "(A + B) + C = A + (B + C)",
                    sumar_matrices(sumar_matrices(A, B), C),
                    sumar_matrices(A, sumar_matrices(B, C)),
                )
            )

        if mismas_dimensiones(B, C) and multiplicacion_definida(A, B):
            if multiplicacion_definida(A, C):
                propiedades.append(
                    _propiedad(
                        "A(B + C) = AB + AC",
                        multiplicar_matrices(A, sumar_matrices(B, C))[0],
                        sumar_matrices(
                            multiplicar_matrices(A, B)[0],
                            multiplicar_matrices(A, C)[0],
                        ),
                    )
                )

        if mismas_dimensiones(B, C) and multiplicacion_definida(B, A):
            if multiplicacion_definida(C, A):
                propiedades.append(
                    _propiedad(
                        "(B + C)A = BA + CA",
                        multiplicar_matrices(sumar_matrices(B, C), A)[0],
                        sumar_matrices(
                            multiplicar_matrices(B, A)[0],
                            multiplicar_matrices(C, A)[0],
                        ),
                    )
                )

        if multiplicacion_definida(A, B):
            AB, _ = multiplicar_matrices(A, B)
            if multiplicacion_definida(B, C):
                BC, _ = multiplicar_matrices(B, C)
                if multiplicacion_definida(A, BC) and multiplicacion_definida(AB, C):
                    propiedades.append(
                        _propiedad(
                            "A(BC) = (AB)C",
                            multiplicar_matrices(A, BC)[0],
                            multiplicar_matrices(AB, C)[0],
                        )
                    )

    filas, columnas = dimensiones(A)
    I_filas = matriz_identidad(filas)
    I_columnas = matriz_identidad(columnas)
    propiedades.append(
        _propiedad("I_m A = A", multiplicar_matrices(I_filas, A)[0], A)
    )
    propiedades.append(
        _propiedad("A I_n = A", multiplicar_matrices(A, I_columnas)[0], A)
    )

    return propiedades


def _serializar(valor):
    """Convierte Fraction y estructuras anidadas a datos compatibles con JSON."""
    if isinstance(valor, Fraction):
        return str(valor)
    if isinstance(valor, list):
        return [_serializar(elemento) for elemento in valor]
    if isinstance(valor, tuple):
        return [_serializar(elemento) for elemento in valor]
    if isinstance(valor, dict):
        return {clave: _serializar(elemento) for clave, elemento in valor.items()}
    return valor


def ejecutar_matrices(datos):
    """Coordina las herramientas de matrices que utiliza la interfaz."""
    A = leer_matriz(datos.get("A", ""), "matriz A")
    texto_B = str(datos.get("B", "")).strip()
    texto_C = str(datos.get("C", "")).strip()
    c = convertir_numero(datos.get("c", "1") or "1")
    d = convertir_numero(datos.get("d", "1") or "1")

    B = leer_matriz(texto_B, "matriz B") if texto_B else None
    C = leer_matriz(texto_C, "matriz C") if texto_C else None

    escalonada, rref, pasos_reduccion = reducir_a_rref(A)

    resultado = {
        "A": A,
        "dimension_A": dimensiones(A),
        "clasificacion_A": clasificar_matriz(A),
        "transpuesta_A": transponer(A),
        "escalar_c": c,
        "escalar_d": d,
        "escalar_A": multiplicar_por_escalar(c, A),
        "matriz_escalonada_A": escalonada,
        "matriz_rref_A": rref,
        "forma_A": analizar_forma(A),
        "forma_escalonada_A": analizar_forma(escalonada),
        "forma_rref_A": analizar_forma(rref),
        "pasos_reduccion_A": pasos_reduccion,
        "B_ingresada": B is not None,
        "C_ingresada": C is not None,
    }

    if B is not None:
        resultado.update(
            {
                "B": B,
                "dimension_B": dimensiones(B),
                "clasificacion_B": clasificar_matriz(B),
                "transpuesta_B": transponer(B),
                "iguales": son_iguales(A, B),
                "suma_definida": mismas_dimensiones(A, B),
                "resta_definida": mismas_dimensiones(A, B),
                "producto_AB_definido": multiplicacion_definida(A, B),
                "producto_BA_definido": multiplicacion_definida(B, A),
            }
        )

        if mismas_dimensiones(A, B):
            resultado["suma"] = sumar_matrices(A, B)
            resultado["resta"] = restar_matrices(A, B)
        else:
            resultado["mensaje_suma_resta"] = (
                f"A es {len(A)}x{len(A[0])} y B es {len(B)}x{len(B[0])}. "
                "Para sumar o restar deben tener las mismas dimensiones."
            )

        if multiplicacion_definida(A, B):
            resultado["producto_AB"], resultado["pasos_AB"] = multiplicar_matrices(A, B)
        else:
            resultado["mensaje_AB"] = (
                f"AB no está definida: A tiene {len(A[0])} columna(s) y "
                f"B tiene {len(B)} fila(s)."
            )

        if multiplicacion_definida(B, A):
            resultado["producto_BA"], resultado["pasos_BA"] = multiplicar_matrices(B, A)

        if resultado["producto_AB_definido"] and resultado["producto_BA_definido"]:
            resultado["AB_igual_BA"] = resultado["producto_AB"] == resultado["producto_BA"]
        else:
            resultado["AB_igual_BA"] = None

    if C is not None:
        resultado["C"] = C
        resultado["dimension_C"] = dimensiones(C)
        resultado["clasificacion_C"] = clasificar_matriz(C)

    resultado["propiedades"] = comprobar_propiedades(A, B, C, c, d)
    return _serializar(resultado)
