"""Comprueba las propiedades de las formas escalonadas y reducidas."""


def analizar_forma(matriz):
    """Inspecciona la matriz recibida sin modificarla."""

    pivotes = []
    nula_vista = False
    nulas_abajo = True

    # Localizar la entrada principal de cada fila.
    for i, fila in enumerate(matriz):
        principal = None

        for j, valor in enumerate(fila):
            if valor != 0:
                principal = j
                break

        if principal is None:
            nula_vista = True
        else:
            if nula_vista:
                nulas_abajo = False

            pivotes.append((i, principal))

    # Propiedad 2: las entradas principales avanzan hacia la derecha.
    derecha = all(
        pivotes[k][1] < pivotes[k + 1][1]
        for k in range(len(pivotes) - 1)
    )

    # Propiedad 3: debajo de cada entrada principal hay ceros.
    ceros_abajo = all(
        matriz[k][j] == 0
        for i, j in pivotes
        for k in range(i + 1, len(matriz))
    )

    # Propiedad 4: todas las entradas principales son 1.
    unos = all(
        matriz[i][j] == 1
        for i, j in pivotes
    )

    # Propiedad 5: el pivote es el único valor no nulo de su columna.
    unicos = all(
        matriz[k][j] == 0
        for i, j in pivotes
        for k in range(len(matriz))
        if k != i
    )

    propiedades = [
        nulas_abajo,
        derecha,
        ceros_abajo,
        unos,
        unicos,
    ]

    escalonada = all(propiedades[:3])
    reducida = all(propiedades)

    if reducida:
        clasificacion = "Forma escalonada reducida"
    elif escalonada:
        clasificacion = "Solo forma escalonada"
    else:
        clasificacion = "No está en forma escalonada"

    return {
        "propiedades": propiedades,
        "escalonada": escalonada,
        "reducida": reducida,
        "clasificacion": clasificacion,
    }