"""Reconoce las formas escalonada y escalonada reducida.
Aplica las cinco condiciones de REF y RREF estudiadas en clase.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""


def analizar_forma(matriz):
    """Inspecciona la matriz recibida sin modificarla. Recibe matriz."""

    pivotes = []
    nula_vista = False
    nulas_abajo = True

    
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

    
    derecha = all(
        pivotes[k][1] < pivotes[k + 1][1]
        for k in range(len(pivotes) - 1)
    )

    
    ceros_abajo = all(
        matriz[k][j] == 0
        for i, j in pivotes
        for k in range(i + 1, len(matriz))
    )

    
    unos = all(
        matriz[i][j] == 1
        for i, j in pivotes
    )

    
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