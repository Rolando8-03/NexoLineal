"""Resuelve Ax=b por Cramer, inversa y factorización LU sin intercambios.
Implementa los temas de determinantes y factorización de las semanas 7 y 8.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""
from fractions import Fraction
from entrada_datos import convertir_numero
from modulos.modulo_matrices import (matriz_exacta, identidad, producto, determinante,
                                     inversa_gauss_jordan, _registrar, _eliminar_columna)


def leer_b(datos, filas):
    """Recibe componentes y número de ecuaciones; devuelve b exacto o informa el error."""
    if isinstance(datos, str):
        datos = datos.replace(';', ' ').split()
    if not isinstance(datos, (list, tuple)) or len(datos) != filas:
        raise ValueError(f'b debe tener {filas} componentes.')
    return [convertir_numero(v) for v in datos]


def cramer(A, b):
    """Recibe A cuadrada invertible y b; devuelve determinantes sustituidos y solución."""
    A = matriz_exacta(A, True)
    b = leer_b(b, len(A))
    valor = determinante(A)
    if not valor:
        raise ValueError('Cramer requiere det(A) ≠ 0. Usa Gauss para clasificar este sistema.')
    reemplazos, valores = [], []
    for columna in range(len(A)):
        matriz = [fila[:] for fila in A]
        for fila in range(len(A)):
            matriz[fila][columna] = b[fila]
        reemplazos.append(matriz)
        valores.append(determinante(matriz))
    solucion = [v / valor for v in valores]
    return {'A': A, 'b': b, 'determinante': valor, 'matrices_cramer': reemplazos,
            'determinantes_cramer': valores, 'solucion': solucion,
            'comprobacion': producto(A, [[v] for v in solucion]),
            'verificada': producto(A, [[v] for v in solucion]) == [[v] for v in b]}


def _columna_lu(U, L, fila_pivote, columna, pasos):
    """Recibe U, L y un pivote; elimina hacia abajo y guarda multiplicadores en L."""
    for fila in range(fila_pivote+1, len(U)):
        factor = U[fila][columna] / U[fila_pivote][columna]
        L[fila][fila_pivote] = factor
        if factor:
            U[fila] = [a-factor*b for a, b in zip(U[fila], U[fila_pivote])]
            _registrar(pasos, f'F{fila+1} ← F{fila+1} − ({factor})F{fila_pivote+1}', U)
            pasos[-1].update({'destino': fila, 'origen': fila_pivote, 'factor': factor})


def factorizar_lu(A):
    """Recibe A rectangular; devuelve L unitaria y U escalonada con LU=A sin permutar."""
    U = matriz_exacta(A)
    A, L, pasos, fila_pivote = [f[:] for f in U], identidad(len(U)), [], 0
    construccion, columnas_pivote = [], []
    for columna in range(len(U[0])):
        if fila_pivote == len(U):
            break
        if not any(U[i][columna] for i in range(fila_pivote, len(U))):
            continue
        if U[fila_pivote][columna] == 0:
            # El método de clase supone ausencia de intercambios: no confundimos PA=LU con A=LU.
            raise ValueError('Esta matriz requiere intercambio de filas. El método LU de clase '
                             'no lo admite; usa Gauss para resolver el sistema.')
        construccion.append({'columna_L': fila_pivote+1, 'columna_pivote_U': columna+1,
                             'pivote': U[fila_pivote][columna],
                             'entradas': [U[i][columna] for i in range(fila_pivote, len(U))],
                             'cocientes': [U[i][columna]/U[fila_pivote][columna]
                                          for i in range(fila_pivote, len(U))]})
        columnas_pivote.append(columna+1)
        _columna_lu(U, L, fila_pivote, columna, pasos)
        fila_pivote += 1
    reduccion_L = comprobar_reduccion_L(L, pasos)
    return {'A': A, 'L': L, 'U': U, 'producto_LU': producto(L, U),
            'verificada': producto(L, U) == A, 'pasos': pasos,
            'construccion_L': construccion, 'columnas_pivote': columnas_pivote,
            'reduccion_L': reduccion_L, 'L_reducida_a_I': reduccion_L['reducida'] == identidad(len(L))}


def sustitucion_triangular(matriz, b, inferior=False):
    """Recibe triangular no singular y b; devuelve la solución por sustitución."""
    matriz = matriz_exacta(matriz, True)
    b = leer_b(b, len(matriz))
    solucion = [Fraction(0) for _ in b]
    recorrido = range(len(b)) if inferior else range(len(b)-1, -1, -1)
    for fila in recorrido:
        if matriz[fila][fila] == 0:
            raise ValueError('La triangular tiene un pivote nulo; usa Gauss para clasificar el sistema.')
        columnas = range(fila) if inferior else range(fila+1, len(b))
        suma = sum(matriz[fila][j]*solucion[j] for j in columnas)
        solucion[fila] = (b[fila]-suma)/matriz[fila][fila]
    return solucion


def comprobar_reduccion_L(L, operaciones):
    """Recibe L y reemplazos que llevaron A a U; los repite para comprobar L a I."""
    matriz, pasos = matriz_exacta(L, True), []
    for operacion in operaciones:
        i, j, factor = operacion['destino'], operacion['origen'], operacion['factor']
        matriz[i] = [a-factor*b for a, b in zip(matriz[i], matriz[j])]
        _registrar(pasos, operacion['descripcion'], matriz)
    return {'inicial': matriz_exacta(L), 'reducida': matriz, 'pasos': pasos}


def gauss_jordan_triangular(matriz, b, inferior=False):
    """Recibe L o U escalonada y b; devuelve la reducción aumentada con pasos de clase."""
    matriz = matriz_exacta(matriz)
    b = leer_b(b, len(matriz))
    inicial = [fila+[valor] for fila, valor in zip(matriz, b)]
    aumentada, pasos = [f[:] for f in inicial], []
    if inferior:
        posiciones = [(i, i) for i in range(len(matriz))]
    else:
        posiciones = [(i, next((j for j, v in enumerate(fila) if v), None))
                      for i, fila in enumerate(matriz)]
        posiciones = [(i, j) for i, j in posiciones if j is not None][::-1]
    # En U avanzamos desde el último pivote: coincide con la fase regresiva de clase.
    for fila, columna in posiciones:
        _eliminar_columna(aumentada, fila, columna, pasos)
    return {'inicial': inicial, 'reducida': aumentada, 'pasos': pasos}


def resumen_solucion_escalonada(reducida):
    """Recibe [R|c] reducida; devuelve clasificación, solución particular y direcciones."""
    n = len(reducida[0])-1
    if any(not any(f[:-1]) and f[-1] for f in reducida):
        return {'tipo': 'incompatible', 'clasificacion': 'El sistema no tiene solución.'}
    pivotes = [(i, next((j for j in range(n) if f[j]), None)) for i, f in enumerate(reducida)]
    pivotes = [(i, j) for i, j in pivotes if j is not None]
    libres = [j for j in range(n) if j not in [columna for _, columna in pivotes]]
    particular = [Fraction(0) for _ in range(n)]
    for fila, columna in pivotes:
        particular[columna] = reducida[fila][-1]
    direcciones = []
    for libre in libres:
        vector = [Fraction(j == libre) for j in range(n)]
        for fila, columna in pivotes:
            vector[columna] = -reducida[fila][libre]
        direcciones.append(vector)
    return {'tipo': 'infinitas' if libres else 'unica', 'solucion_particular': particular,
            'direcciones': direcciones, 'variables_libres': [j+1 for j in libres],
            'clasificacion': 'Infinitas soluciones: x = p + t1·v1 + ...' if libres else 'Solución única.'}


def resolver_con_factores(L, U, b):
    """Recibe L unitaria y U escalonada dadas; resuelve Ly=b y Ux=y con Gauss-Jordan."""
    L, U = validar_factores(L, U)
    b = leer_b(b, len(L))
    etapa_L = gauss_jordan_triangular(L, b, True)
    y = [fila[-1] for fila in etapa_L['reducida']]
    etapa_U = gauss_jordan_triangular(U, y)
    solucion = resumen_solucion_escalonada(etapa_U['reducida'])
    A = producto(L, U)
    datos = {'A': A, 'L': L, 'U': U, 'b': b, 'y': y, 'producto_LU': A,
             'etapa_Ly': etapa_L, 'etapa_Ux': etapa_U, 'sistema': solucion}
    if solucion['tipo'] != 'incompatible':
        x = solucion['solucion_particular']
        comprobacion = producto(A, [[v] for v in x])
        datos.update({'solucion': x, 'comprobacion': comprobacion,
                      'solucion_verificada': comprobacion == [[v] for v in b],
                      'direcciones_verificadas': all(producto(A, [[v] for v in d]) == [[0] for _ in b]
                                                    for d in solucion['direcciones'])})
    return datos


def validar_factores(L, U):
    """Recibe factores dados; exige L inferior unitaria y U escalonada compatible."""
    L, U = matriz_exacta(L, True), matriz_exacta(U)
    if len(L) != len(U):
        raise ValueError('L y U deben tener la misma cantidad de filas.')
    if any(L[i][i] != 1 or any(L[i][j] for j in range(i+1, len(L))) for i in range(len(L))):
        raise ValueError('L debe ser triangular inferior con unos en la diagonal.')
    anterior, fila_nula = -1, False
    for fila in U:
        pivote = next((j for j, v in enumerate(fila) if v), None)
        if pivote is None:
            fila_nula = True
        elif fila_nula or pivote <= anterior:
            raise ValueError('U debe estar en forma escalonada, con las filas nulas al final.')
        else:
            anterior = pivote
    return L, U


def resolver_lu(A, b):
    """Recibe A rectangular y b; factoriza y muestra Ly=b y Ux=y como en Sesión 12."""
    datos = factorizar_lu(A)
    solucion = resolver_con_factores(datos['L'], datos['U'], b)
    datos.update(solucion)
    return datos


def resolver_por_inversa(A, b):
    """Recibe A cuadrada invertible y b; devuelve x=A⁻¹b y su comprobación."""
    A = matriz_exacta(A, True)
    b = leer_b(b, len(A))
    inversa = inversa_gauss_jordan(A)
    columna = producto(inversa, [[v] for v in b])
    return {'A': A, 'b': b, 'inversa': inversa, 'solucion': [f[0] for f in columna],
            'comprobacion': producto(A, columna), 'verificada': producto(A, columna) == [[v] for v in b]}


def ejecutar_metodo(opcion, A, b, U=None):
    """Recibe la opción y entradas; devuelve el resultado de Cramer, LU o inversa."""
    if isinstance(b, str):
        b = b.strip()
    if opcion == '14':
        return resolver_con_factores(A, U, b)
    if opcion == '10':
        return cramer(A, b)
    if opcion == '11':
        return resolver_lu(A, b) if b else factorizar_lu(A)
    return resolver_por_inversa(A, b)
