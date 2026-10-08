"""Presenta los menús de consola, valida entradas y formatea resultados.
Conecta los programas 1 a 5 sin mezclar entrada/salida con los cálculos.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""
from entrada_datos import convertir_numero
from teoremas.resumen_teoremas import mostrar_teoremas

OPCIONES = {'1': 'Suma', '2': 'Resta', '3': 'Multiplicación por escalar',
            '4': 'Producto matricial', '5': 'Transposición', '6': 'Determinante',
            '7': 'Inversa por Gauss-Jordan', '8': 'Inversa por matriz adjunta',
            '9': 'Verificador de propiedades', '10': 'Regla de Cramer',
            '11': 'Factorización LU y resolución de Ax=b', '12': 'Resolver x=A⁻¹b',
            '13': 'Propiedades de determinantes (incluye matrices singulares)',
            '14': 'Resolver Ly=b y Ux=y con factores dados'}
LOGOS = {
    'sistemas': '[ [1 2 | 3] ] MÓDULO: SISTEMAS DE ECUACIONES (SEL)\n[ [0 1 | 5] ] Métodos: Gauss, Gauss-Jordan',
    'vectores': '   / v     MÓDULO: VECTORES E INDEPENDENCIA LINEAL\n  /__ u    Combinaciones lineales, L.I. y L.D.\n           A x = 0',
    'matrices': '[ A ][ B ] MÓDULO: ÁLGEBRA DE MATRICES\n[ C ][ D ] Operaciones, Traspuesta y Matriz Inversa',
    'determinantes': '| a b | MÓDULO: DETERMINANTES Y PROPIEDADES\n| c d | Cofactores, Sarrus y reducción triangular'}


def cabecera(modulo):
    """Recibe un módulo y muestra su logotipo ASCII; no devuelve un resultado."""
    print('\n' + '='*65 + '\n' + LOGOS[modulo] + '\n' + '='*65)


def leer_entero(mensaje, minimo=1, maximo=None):
    """Recibe un mensaje y límites; repite la pregunta hasta devolver un entero válido."""
    while True:
        try:
            valor = int(input(mensaje))
            if valor < minimo or (maximo is not None and valor > maximo):
                raise ValueError
            return valor
        except ValueError:
            print(f'Escribe un entero desde {minimo}' + (f' hasta {maximo}.' if maximo else '.'))


def leer_numero(mensaje):
    """Recibe un mensaje y devuelve un número exacto, repitiendo entradas inválidas."""
    while True:
        try:
            return convertir_numero(input(mensaje))
        except ValueError as error:
            print(error)


def leer_fila(mensaje, cantidad):
    """Recibe mensaje y longitud; devuelve la fila de valores exactos tras validarla."""
    while True:
        try:
            fila = [convertir_numero(v) for v in input(mensaje).split()]
            if len(fila) != cantidad:
                raise ValueError(f'Se requieren exactamente {cantidad} números separados por espacios.')
            return fila
        except ValueError as error:
            print(error)


def leer_matriz(nombre='A', cuadrada=False):
    """Recibe nombre y condición cuadrada; devuelve la matriz leída fila por fila."""
    filas = leer_entero(f'Filas de {nombre}: ')
    columnas = filas if cuadrada else leer_entero(f'Columnas de {nombre}: ')
    return [leer_fila(f'{nombre}, fila {i+1}: ', columnas) for i in range(filas)]


def mostrar_matriz(matriz):
    """Recibe una matriz y la imprime alineada con sus dimensiones; devuelve None."""
    if not matriz:
        print('[]')
        return
    textos = [[str(v) for v in fila] for fila in matriz]
    anchos = [max(len(f[j]) for f in textos) for j in range(len(textos[0]))]
    print(f'({len(matriz)} × {len(matriz[0])})')
    for fila in textos:
        print('[ ' + '  '.join(v.rjust(anchos[j]) for j, v in enumerate(fila)) + ' ]')


def mostrar_resultado(datos, titulo='Resultado'):
    """Recibe resultados anidados; imprime matrices, pasos y comparaciones exactas."""
    print('\n' + titulo.replace('_', ' ').capitalize())
    if isinstance(datos, dict):
        for clave, valor in datos.items():
            if valor is not None and valor != '':
                mostrar_resultado(valor, clave)
    elif isinstance(datos, list):
        if datos and isinstance(datos[0], list) and all(not isinstance(v, (dict, list)) for v in datos[0]):
            mostrar_matriz(datos)
        elif datos and isinstance(datos[0], (dict, list)):
            for numero, valor in enumerate(datos, 1):
                mostrar_resultado(valor, f'{titulo} {numero}')
        else:
            print('  '.join(str(v) for v in datos))
    elif isinstance(datos, bool):
        print('Se cumple' if datos else 'No se cumple')
    else:
        print(datos)



def leer_desarrollo(orden):
    """Recibe el orden; solicita desarrollo por fila, columna o selección con más ceros."""
    while True:
        eje = input('Desarrollo por fila, columna o automático (f/c/a): ').strip().lower()
        if eje in ('f', 'c', 'a'):
            break
        print('Selecciona f, c o a.')
    indice = leer_entero('Número de fila/columna: ', 1, orden) if eje != 'a' else 1
    normalizar = input('¿Extraer factores para obtener pivotes 1? (s/n): ').strip().lower() == 's'
    return {'eje': {'f': 'fila', 'c': 'columna', 'a': 'auto'}[eje],
            'indice': indice, 'normalizar': normalizar}

def datos_matrices(opcion):
    """Recibe una opción de menú; devuelve las matrices y parámetros solicitados."""
    if opcion == '14':
        print('Ingresa L como matriz A (cuadrada) y U como matriz B (escalonada).')
    datos = {'opcion': opcion, 'A': leer_matriz('A', opcion in ('6', '7', '8', '9', '10', '12', '13', '14'))}
    if opcion in ('1', '2', '4', '9', '13', '14'):
        datos['B'] = leer_matriz('B', opcion in ('9', '13'))
    if opcion in ('3', '9', '13'):
        datos['k'] = leer_numero('Escalar k: ')
        while opcion == '9' and len(datos['A']) > 1 and datos['k'] == 0:
            print('Para escalar una fila como operación elemental, k debe ser distinto de cero.')
            datos['k'] = leer_numero('Escalar k: ')
    if opcion in ('9', '13') and len(datos['A']) > 1:
        datos['fila_i'] = leer_entero('Fila destino i: ', 1, len(datos['A']))
        datos['fila_j'] = leer_entero('Otra fila j: ', 1, len(datos['A']))
        while datos['fila_j'] == datos['fila_i']:
            print('Selecciona dos filas diferentes para el intercambio y el reemplazo.')
            datos['fila_j'] = leer_entero('Otra fila j: ', 1, len(datos['A']))
    if opcion == '6':
        datos.update(leer_desarrollo(len(datos['A'])))
    if opcion == '13':
        datos['eje'] = 'columna' if input('Operar filas o columnas (f/c): ').strip().lower() == 'c' else 'fila'
    if opcion == '14':
        print('En esta opción, la matriz A ingresada representa L y B representa U.')
    if opcion in ('10', '12', '14') or (opcion == '11' and input('¿Resolver Ax=b? (s/n): ').lower() == 's'):
        datos['b'] = leer_fila('Vector b: ', len(datos['A']))
    return datos


def menu_matrices_cli(modulo='matrices'):
    """Recibe el módulo de portada; ejecuta opciones hasta volver al menú principal."""
    from modulos.modulo_matrices import ejecutar_programa5
    while True:
        cabecera(modulo)
        print('0. Ver Teoremas Clave del Módulo')
        for numero, nombre in OPCIONES.items():
            print(f'{numero}. {nombre}')
        opcion = input('V. Volver\nOpción: ').strip().lower()
        if opcion == 'v':
            return
        if opcion == '0':
            mostrar_teoremas('matrices')
            mostrar_teoremas('determinantes')
        elif opcion in OPCIONES:
            try:
                mostrar_resultado(ejecutar_programa5(datos_matrices(opcion)))
            except (ValueError, ZeroDivisionError) as error:
                print(f'No se pudo operar: {error}\nPuedes corregir los datos en la misma opción.')
        else:
            print('Opción no válida.')


def menu_sistemas():
    """Sin argumentos; permite resolver sistemas y consultar sus teoremas en consola."""
    from analisis_sistema import resolver_sistema
    while True:
        cabecera('sistemas')
        opcion = input('0. Ver Teoremas Clave del Módulo\n1. Resolver Ax=b\nV. Volver\nOpción: ').lower()
        if opcion == 'v':
            return
        if opcion == '0':
            mostrar_teoremas('sistemas')
        elif opcion == '1':
            A = leer_matriz()
            b = leer_fila('Vector b: ', len(A))
            mostrar_resultado(resolver_sistema(A, b))
        else:
            print('Opción no válida.')


def _operar_vectores(opcion):
    """Recibe opción de vectores, solicita entradas y presenta sus resultados."""
    from vectores import operaciones
    from relaciones_vectoriales import analizar_combinacion, analizar_independencia
    if opcion == '1':
        n = leer_entero('Dimensión de los vectores (1 a 6): ', 1, 6)
        datos = {v: ' '.join(map(str, leer_fila(f'Vector {v}: ', n))) for v in ('u', 'v', 'w')}
        datos.update({'c': str(leer_numero('Escalar c: ')), 'd': str(leer_numero('Escalar d: '))})
        mostrar_resultado(operaciones(datos))
        return
    k = leer_entero('Cantidad de vectores k (1 a 6): ', 1, 6)
    n = leer_entero('Dimensión n (1 a 6): ', 1, 6)
    vectores = [leer_fila(f'Vector {j+1}: ', n) for j in range(k)]
    datos = {'k': k, 'n': n, 'vectores': '\n'.join(' '.join(map(str, v)) for v in vectores)}
    if opcion == '2':
        datos['b'] = ' '.join(map(str, leer_fila('Vector b: ', n)))
        mostrar_resultado(analizar_combinacion(datos))
    else:
        mostrar_resultado(analizar_independencia(datos))


def menu_vectores_cli():
    """Sin argumentos; muestra operaciones y propiedades de vectores hasta volver."""
    while True:
        cabecera('vectores')
        opcion = input('0. Ver Teoremas Clave del Módulo\n1. Operaciones y propiedades\n'
                       '2. Combinación lineal\n3. Independencia lineal\nV. Volver\nOpción: ').lower()
        if opcion == 'v':
            return
        if opcion == '0':
            mostrar_teoremas('vectores')
        elif opcion in ('1', '2', '3'):
            try:
                _operar_vectores(opcion)
            except ValueError as error:
                print(error)
        else:
            print('Opción no válida.')


def menu_principal():
    """Sin argumentos; conecta los cuatro módulos y termina al elegir salir."""
    while True:
        opcion = input('\nNEXOLINEAL\n1. Sistemas\n2. Vectores\n3. Matrices e inversa\n'
                       '4. Determinantes\n0. Salir\nOpción: ').strip()
        if opcion == '0':
            return
        if opcion == '1':
            menu_sistemas()
        elif opcion == '2':
            menu_vectores_cli()
        elif opcion in ('3', '4'):
            menu_matrices_cli('matrices' if opcion == '3' else 'determinantes')
        else:
            print('Opción no válida.')
