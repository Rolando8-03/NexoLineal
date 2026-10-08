"""Calcula operaciones, determinantes, inversas y sus propiedades exactas.
Implementa el Módulo III y las sesiones 9, 10 y 11 de Álgebra Lineal.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""
from fractions import Fraction
from entrada_datos import convertir_numero
from operaciones_matrices import ejecutar_matrices, _serializar


def matriz_exacta(datos, cuadrada=False):
    """Recibe texto o filas numéricas; devuelve una matriz rectangular de Fraction."""
    if isinstance(datos, str):
        datos = [f.split() for f in datos.replace(';', '\n').splitlines() if f.strip()]
    if (not isinstance(datos, (list, tuple)) or not datos
            or not isinstance(datos[0], (list, tuple)) or not datos[0]):
        raise ValueError('La matriz no puede estar vacía.')
    if any(not isinstance(f, (list, tuple)) or len(f) != len(datos[0]) for f in datos):
        raise ValueError('Todas las filas deben tener la misma cantidad de elementos.')
    if cuadrada and len(datos) != len(datos[0]):
        raise ValueError('La operación requiere una matriz cuadrada.')
    return [[convertir_numero(v) for v in fila] for fila in datos]


def identidad(orden):
    """Recibe un orden positivo y devuelve la matriz identidad exacta."""
    if not isinstance(orden, int) or orden < 1:
        raise ValueError('El orden debe ser un entero positivo.')
    return [[Fraction(i == j) for j in range(orden)] for i in range(orden)]


def suma(A, B):
    """Recibe matrices de igual tamaño y devuelve su suma exacta."""
    A, B = matriz_exacta(A), matriz_exacta(B)
    if (len(A), len(A[0])) != (len(B), len(B[0])):
        raise ValueError('Suma y resta requieren matrices de las mismas dimensiones.')
    return [[a + b for a, b in zip(fa, fb)] for fa, fb in zip(A, B)]


def escalar(A, numero):
    """Recibe una matriz y un escalar; devuelve el producto por ese escalar."""
    numero = convertir_numero(numero)
    return [[numero * v for v in fila] for fila in matriz_exacta(A)]


def resta(A, B):
    """Recibe matrices de igual tamaño y devuelve A menos B."""
    return suma(A, escalar(B, -1))


def producto(A, B):
    """Recibe A de m×n y B de n×p; devuelve AB mediante la regla fila-columna."""
    A, B = matriz_exacta(A), matriz_exacta(B)
    if len(A[0]) != len(B):
        raise ValueError(f'No se puede multiplicar: Columnas de A [{len(A[0])}] ≠ Filas de B [{len(B)}]')
    resultado = []
    for fila in A:
        nueva = []
        for columna in range(len(B[0])):
            nueva.append(sum(fila[k] * B[k][columna] for k in range(len(B))))
        resultado.append(nueva)
    return resultado


def transpuesta(A):
    """Recibe A de m×n y devuelve su transpuesta de n×m."""
    A = matriz_exacta(A)
    return [[A[i][j] for i in range(len(A))] for j in range(len(A[0]))]


def menor(A, fila, columna):
    """Recibe A e índices desde cero; devuelve la submatriz sin esa fila y columna."""
    return [[v for j, v in enumerate(renglon) if j != columna]
            for i, renglon in enumerate(A) if i != fila]


def _cofactores_recursivo(A):
    """Recibe una matriz cuadrada exacta y devuelve su determinante recursivo."""
    # det de orden cero = 1 permite obtener el cofactor de una matriz 1×1.
    if not A:
        return Fraction(1)
    if len(A) == 1:
        return A[0][0]
    fila = max(range(len(A)), key=lambda i: A[i].count(0))
    total = Fraction(0)
    for columna, valor in enumerate(A[fila]):
        if valor:
            # El signo depende de fila y columna, aun si elegimos otra fila con más ceros.
            total += valor * (-1)**(fila + columna) * _cofactores_recursivo(menor(A, fila, columna))
    return total


def determinante_cofactores(A):
    """Recibe una matriz cuadrada de cualquier orden y devuelve det(A) por cofactores."""
    return _cofactores_recursivo(matriz_exacta(A, True))


def expansion_cofactores(A, eje='fila', indice=1):
    """Recibe A cuadrada, eje y posición desde 1; devuelve menores y términos elegidos."""
    A = matriz_exacta(A, True)
    if eje not in ('fila', 'columna'):
        raise ValueError('El desarrollo debe ser por fila o columna.')
    if type(indice) is not int or not 1 <= indice <= len(A):
        raise ValueError('La fila o columna elegida debe existir y ser un entero.')
    terminos = []
    for posicion in range(len(A)):
        i, j = (indice-1, posicion) if eje == 'fila' else (posicion, indice-1)
        submatriz = menor(A, i, j)
        valor_menor = _cofactores_recursivo(submatriz)
        signo = (-1)**(i+j)
        cofactor = signo * valor_menor
        terminos.append({'fila': i+1, 'columna': j+1, 'elemento': A[i][j],
                         'menor': submatriz, 'det_menor': valor_menor, 'signo': signo,
                         'cofactor': cofactor, 'termino': A[i][j] * cofactor})
    return terminos


def elegir_desarrollo(A):
    """Recibe A cuadrada; elige la fila o columna con más ceros para reducir el trabajo."""
    A = matriz_exacta(A, True)
    opciones = [('fila', i+1, fila.count(0)) for i, fila in enumerate(A)]
    opciones += [('columna', j+1, sum(fila[j] == 0 for fila in A)) for j in range(len(A))]
    eje, indice, ceros = max(opciones, key=lambda opcion: opcion[2])
    return {'eje': eje, 'indice': indice, 'ceros': ceros}


def detalles_cofactores(A):
    """Recibe A cuadrada; devuelve el menor, signo y valor de cada cofactor Cij."""
    A = matriz_exacta(A, True)
    return [termino for i in range(1, len(A)+1) for termino in expansion_cofactores(A, 'fila', i)]


def sarrus(A):
    """Recibe A de 3×3; devuelve productos de diagonales y su diferencia."""
    A = matriz_exacta(A, True)
    if len(A) != 3:
        raise ValueError('La regla de Sarrus se aplica únicamente a matrices de 3×3.')
    positivas = [A[0][j] * A[1][(j+1)%3] * A[2][(j+2)%3] for j in range(3)]
    negativas = [A[0][j] * A[1][(j-1)%3] * A[2][(j-2)%3] for j in range(3)]
    return {'positivas': positivas, 'negativas': negativas,
            'determinante': sum(positivas) - sum(negativas),
            'arreglo': A + [A[0][:], A[1][:]],
            'suma_positivas': sum(positivas), 'suma_negativas': sum(negativas)}


def _registrar(pasos, descripcion, matriz):
    """Recibe una operación y su matriz; agrega al registro una copia independiente."""
    pasos.append({'descripcion': descripcion, 'matriz': [f[:] for f in matriz]})


def reduccion_triangular(A, normalizar=False):
    """Recibe A cuadrada; devuelve U, intercambios, factores y det(A) corregido."""
    U = matriz_exacta(A, True)
    intercambios, pasos, factor_filas = 0, [], Fraction(1)
    for columna in range(len(U)):
        pivote = next((i for i in range(columna, len(U)) if U[i][columna]), None)
        if pivote is None:
            continue
        if pivote != columna:
            U[pivote], U[columna] = U[columna], U[pivote]
            intercambios += 1
            _registrar(pasos, f'F{columna+1} ↔ F{pivote+1}; cambia el signo.', U)
        if normalizar and U[columna][columna] != 1:
            divisor = U[columna][columna]
            U[columna] = [v / divisor for v in U[columna]]
            # Dividir una fila divide el determinante: guardamos el factor que recupera det(A).
            factor_filas *= divisor
            _registrar(pasos, f'Extraer factor {divisor}: F{columna+1} ← F{columna+1} / ({divisor})', U)
        for fila in range(columna + 1, len(U)):
            factor = U[fila][columna] / U[columna][columna]
            if factor:
                U[fila] = [a - factor*b for a, b in zip(U[fila], U[columna])]
                _registrar(pasos, f'F{fila+1} ← F{fila+1} − ({factor})F{columna+1}', U)
    diagonal = Fraction(1)
    for i in range(len(U)):
        diagonal *= U[i][i]
    # El determinante original recupera los factores extraídos y el signo de cada intercambio.
    return {'triangular': U, 'intercambios': intercambios, 'factor_filas': factor_filas,
            'producto_diagonal': diagonal, 'determinante': (-1)**intercambios * factor_filas * diagonal,
            'pasos': pasos}


def determinante(A):
    """Recibe A cuadrada y devuelve su determinante por reducción triangular."""
    return reduccion_triangular(A)['determinante']


def matriz_cofactores(A):
    """Recibe A cuadrada y devuelve C con Cij = (−1)^(i+j) det(Mij)."""
    A = matriz_exacta(A, True)
    return [[(-1)**(i+j) * _cofactores_recursivo(menor(A, i, j))
             for j in range(len(A))] for i in range(len(A))]


def adjunta(A):
    """Recibe A cuadrada y devuelve la transpuesta de su matriz de cofactores."""
    return transpuesta(matriz_cofactores(A))


def inversa_adjunta(A):
    """Recibe A cuadrada no singular y devuelve adj(A)/det(A); rechaza det=0."""
    valor = determinante(A)
    if valor == 0:
        raise ValueError('La matriz es singular (no tiene inversa): det(A) = 0.')
    return escalar(adjunta(A), 1 / valor)


def _eliminar_columna(matriz, fila_pivote, columna, pasos):
    """Recibe una aumentada y su pivote; normaliza y elimina su columna in situ."""
    pivote = matriz[fila_pivote][columna]
    if pivote != 1:
        matriz[fila_pivote] = [v / pivote for v in matriz[fila_pivote]]
        _registrar(pasos, f'F{fila_pivote+1} ← F{fila_pivote+1} / ({pivote})', matriz)
    for fila in range(len(matriz)):
        if fila != fila_pivote and matriz[fila][columna]:
            factor = matriz[fila][columna]
            matriz[fila] = [a - factor*b for a, b in zip(matriz[fila], matriz[fila_pivote])]
            _registrar(pasos, f'F{fila+1} ← F{fila+1} − ({factor})F{fila_pivote+1}', matriz)


def gauss_jordan_inversa(A):
    """Recibe A cuadrada; devuelve [A|I], reducción, pivotes e inversa si existe."""
    A = matriz_exacta(A, True)
    orden, I = len(A), identidad(len(A))
    inicial = [a + b for a, b in zip(A, I)]
    matriz, pasos, fila_pivote = [f[:] for f in inicial], [], 0
    # Se buscan pivotes únicamente en A: un pivote de I no prueba invertibilidad.
    for columna in range(orden):
        elegida = next((i for i in range(fila_pivote, orden) if matriz[i][columna]), None)
        if elegida is None:
            continue
        if elegida != fila_pivote:
            matriz[elegida], matriz[fila_pivote] = matriz[fila_pivote], matriz[elegida]
            _registrar(pasos, f'F{fila_pivote+1} ↔ F{elegida+1}', matriz)
        _eliminar_columna(matriz, fila_pivote, columna, pasos)
        fila_pivote += 1
    inversa = [f[orden:] for f in matriz] if fila_pivote == orden else None
    return {'inicial': inicial, 'reducida': matriz, 'pivotes': fila_pivote,
            'inversa': inversa, 'pasos': pasos}


def inversa_gauss_jordan(A):
    """Recibe A cuadrada no singular y devuelve su inversa exacta por Gauss-Jordan."""
    resultado = gauss_jordan_inversa(A)
    if resultado['inversa'] is None:
        raise ValueError('La matriz es singular (no tiene inversa): det(A) = 0.')
    return resultado['inversa']


def diagnostico(A):
    """Recibe A cuadrada y devuelve el diagnóstico de invertibilidad y rango."""
    datos = gauss_jordan_inversa(A)
    orden = len(A)
    if datos['pivotes'] == orden:
        return (f'La matriz es invertible: det(A) ≠ 0, tiene {orden} posiciones pivote, '
                f'sus columnas son L.I. y generan ℝ^{orden}.')
    return f'La matriz es singular (no tiene inversa): det(A) = 0; {datos["pivotes"]} pivotes.'


def _propiedad(nombre, izquierda, derecha, matriz=None):
    """Recibe ambos miembros; devuelve los valores y la comparación exacta."""
    return {'nombre': nombre, 'izquierda': izquierda, 'derecha': derecha,
            'cumple': izquierda == derecha, 'matriz': matriz}


def propiedades_filas(A, fila_i=1, fila_j=2, k=3):
    """Recibe A y filas numeradas desde 1; verifica intercambio, reemplazo y escala."""
    A, k = matriz_exacta(A, True), convertir_numero(k)
    if not isinstance(fila_i, int) or not isinstance(fila_j, int):
        raise ValueError('Los números de fila deben ser enteros.')
    if not 1 <= fila_i <= len(A) or not 1 <= fila_j <= len(A):
        raise ValueError('Las filas seleccionadas no existen.')
    if fila_i == fila_j:
        raise ValueError('Intercambio y reemplazo requieren dos filas diferentes.')
    if k == 0:
        raise ValueError('El escalamiento elemental requiere k distinto de cero.')
    i, j, valor = fila_i-1, fila_j-1, determinante(A)
    cambio, reemplazo, escala = [f[:] for f in A], [f[:] for f in A], [f[:] for f in A]
    cambio[i], cambio[j] = cambio[j], cambio[i]
    reemplazo[i] = [a+k*b for a, b in zip(A[i], A[j])]
    escala[i] = [k*a for a in A[i]]
    return [_propiedad(f'F{fila_i} ↔ F{fila_j}: det = −det(A)', determinante(cambio), -valor, cambio),
            _propiedad(f'F{fila_i} ← F{fila_i} + ({k})F{fila_j}: det = det(A)', determinante(reemplazo), valor, reemplazo),
            _propiedad(f'F{fila_i} ← ({k})F{fila_i}: det = k det(A)', determinante(escala), k*valor, escala)]


def verificar_propiedades(A, B, fila_i=1, fila_j=2, k=3):
    """Recibe A y B invertibles del mismo orden; devuelve las seis propiedades de Tarea 5."""
    A, B = matriz_exacta(A, True), matriz_exacta(B, True)
    if len(A) != len(B):
        raise ValueError('A y B deben ser cuadradas del mismo orden.')
    IA, IB = inversa_gauss_jordan(A), inversa_gauss_jordan(B)
    datos = reduccion_triangular(A)
    propiedades = [
        _propiedad('1. (A⁻¹)⁻¹ = A', inversa_gauss_jordan(IA), A),
        _propiedad('2. (AB)⁻¹ = B⁻¹A⁻¹', inversa_gauss_jordan(producto(A, B)), producto(IB, IA)),
        _propiedad('3. (Aᵀ)⁻¹ = (A⁻¹)ᵀ', inversa_gauss_jordan(transpuesta(A)), transpuesta(IA)),
        _propiedad('4. det(A⁻¹) = 1/det(A)', determinante(IA), 1/determinante(A))]
    if len(A) > 1:
        propiedades += propiedades_filas(A, fila_i, fila_j, k)
    else:
        escalada = escalar(A, k)
        propiedades.append(_propiedad('5. F1 ← k F1: det = k det(A)',
                                     determinante(escalada), convertir_numero(k)*determinante(A), escalada))
    propiedades.append(_propiedad('6. Producto diagonal corregido = cofactores',
                                 datos['determinante'], determinante_cofactores(A), datos['triangular']))
    propiedades += [_propiedad('det(Aᵀ) = det(A)', determinante(transpuesta(A)), determinante(A)),
                   _propiedad('det(AB) = det(A)det(B)', determinante(producto(A, B)), determinante(A)*determinante(B)),
                   _propiedad('det(kA) = kⁿdet(A)', determinante(escalar(A, k)), convertir_numero(k)**len(A)*determinante(A))]
    return propiedades



def _propiedades_operaciones(A, i, j, k, eje):
    """Recibe A, posiciones y k; verifica operaciones de fila o columna aun con det=0."""
    if eje not in ('fila', 'columna'):
        raise ValueError('Elige operaciones de fila o columna.')
    base = transpuesta(A) if eje == 'columna' else matriz_exacta(A, True)
    if type(i) is not int or type(j) is not int or not 1 <= i <= len(base) or not 1 <= j <= len(base):
        raise ValueError('Las posiciones deben ser enteros entre 1 y el orden de A.')
    if len(base) > 1 and i == j:
        raise ValueError('Intercambio y reemplazo requieren posiciones diferentes.')
    valor, k = determinante(A), convertir_numero(k)
    escala = [f[:] for f in base]
    escala[i-1] = [k*v for v in escala[i-1]]
    casos = [('Escalamiento', escala, k*valor)]
    if len(base) > 1:
        cambio, reemplazo = [f[:] for f in base], [f[:] for f in base]
        cambio[i-1], cambio[j-1] = cambio[j-1], cambio[i-1]
        reemplazo[i-1] = [a+k*b for a, b in zip(base[i-1], base[j-1])]
        casos = [('Intercambio', cambio, -valor), ('Reemplazo', reemplazo, valor)] + casos
    return [_propiedad(f'{nombre} de {eje}: posiciones {i}, {j}; k={k}',
                       determinante(M), esperado, transpuesta(M) if eje == 'columna' else M)
            for nombre, M, esperado in casos]


def verificar_determinantes(A, B, fila_i=1, fila_j=2, k=3, eje='fila'):
    """Recibe cuadradas del mismo orden; verifica Sesión 11 sin exigir invertibilidad."""
    A, B = matriz_exacta(A, True), matriz_exacta(B, True)
    if len(A) != len(B):
        raise ValueError('A y B deben tener el mismo orden.')
    valor = determinante(A)
    datos = reduccion_triangular(A)
    if len(A) == 1:
        fila_j = 1
    propiedades = _propiedades_operaciones(A, fila_i, fila_j, k, eje)
    propiedades += [_propiedad('det(Aᵀ) = det(A)', determinante(transpuesta(A)), valor),
                   _propiedad('det(AB) = det(A)det(B)', determinante(producto(A, B)), valor*determinante(B)),
                   _propiedad('det(kA) = kⁿdet(A)', determinante(escalar(A, k)), convertir_numero(k)**len(A)*valor),
                   _propiedad('Producto diagonal corregido = cofactores', datos['determinante'],
                              determinante_cofactores(A), datos['triangular'])]
    if valor:
        propiedades.append(_propiedad('det(A⁻¹) = 1/det(A)', determinante(inversa_gauss_jordan(A)), 1/valor))
    return propiedades


def comparar_suma_determinantes(A, B):
    """Recibe cuadradas del mismo orden; compara la suma sin presentarla como una ley."""
    izquierda = determinante(suma(A, B))
    derecha = determinante(A) + determinante(B)
    return {'matriz_suma': suma(A, B), 'izquierda': izquierda, 'derecha': derecha,
            'coinciden': izquierda == derecha,
            'nota': 'En general, det(A+B) no es igual a det(A)+det(B). '
                    'Una coincidencia en un ejemplo no demuestra que sea una propiedad.'}

def resumen_determinante(A, eje='fila', indice=1, normalizar=False):
    """Recibe A cuadrada; devuelve los métodos de determinante y su coincidencia."""
    A = matriz_exacta(A, True)
    reduccion = reduccion_triangular(A, normalizar)
    if eje == 'auto':
        elegida = elegir_desarrollo(A)
        eje, indice = elegida['eje'], elegida['indice']
    valor = determinante_cofactores(A)
    return {'A': A, 'determinante': valor, 'expansion': expansion_cofactores(A, eje, indice),
            'desarrollo': {'eje': eje, 'indice': indice},
            'reduccion': reduccion, 'sarrus': sarrus(A) if len(A) == 3 else None,
            'coinciden': valor == reduccion['determinante'], 'diagnostico': diagnostico(A)}


def resumen_inversa(A, metodo='gauss'):
    """Recibe A cuadrada y método; devuelve ambas inversas, proceso y comprobaciones."""
    A = matriz_exacta(A, True)
    datos = gauss_jordan_inversa(A)
    resultado = {'A': A, 'determinante': determinante(A), 'diagnostico': diagnostico(A),
                 'gauss': datos, 'metodo': metodo}
    if datos['inversa'] is not None:
        otra = inversa_adjunta(A)
        resultado.update({'cofactores': matriz_cofactores(A), 'detalle_cofactores': detalles_cofactores(A),
                          'adjunta': adjunta(A), 'reciproco_determinante': 1/determinante(A),
                          'inversa': otra if metodo == 'adjunta' else datos['inversa'],
                          'inversa_adjunta': otra, 'coinciden': otra == datos['inversa'],
                          'producto': producto(A, otra), 'producto_izquierdo': producto(otra, A),
                          'verificada': producto(A, otra) == identidad(len(A)) == producto(otra, A)})
    return resultado


def ejecutar_programa5(datos):
    """Recibe la solicitud de interfaz; devuelve el resultado serializable de una opción."""
    opcion = str(datos.get('opcion', '6'))
    if opcion == '0':
        from teoremas.resumen_teoremas import obtener_teoremas
        return {'teoremas': obtener_teoremas('matrices') + obtener_teoremas('determinantes')}
    A = matriz_exacta(datos.get('A', ''))
    basicas = {'1': suma, '2': resta, '4': producto}
    if opcion in basicas:
        B = matriz_exacta(datos.get('B', ''))
        resultado = {'A': A, 'B': B, 'resultado': basicas[opcion](A, B)}
    elif opcion == '3':
        resultado = {'A': A, 'escalar': convertir_numero(datos.get('k', 1)), 'resultado': escalar(A, datos.get('k', 1))}
    elif opcion == '5':
        resultado = {'A': A, 'resultado': transpuesta(A)}
    else:
        resultado = _ejecutar_avanzada(opcion, A, datos)
    return _serializar(resultado)


def _ejecutar_avanzada(opcion, A, datos):
    """Recibe opción, A y datos auxiliares; devuelve determinante, inversa o propiedades."""
    if opcion == '6':
        return resumen_determinante(A, datos.get('eje', 'fila'),
                                    int(datos.get('indice', 1)), datos.get('normalizar', False))
    if opcion in ('7', '8'):
        return resumen_inversa(A, 'gauss' if opcion == '7' else 'adjunta')
    if opcion == '9':
        B = matriz_exacta(datos.get('B', ''), True)
        propiedades = verificar_propiedades(A, B, int(datos.get('fila_i', 1)),
                                            int(datos.get('fila_j', 2)), datos.get('k', 3))
        return {'A': A, 'B': B, 'propiedades': propiedades,
                'nota': 'En orden 1 no existen dos filas distintas para intercambio o reemplazo.' if len(A) == 1 else ''}
    if opcion == '13':
        B = matriz_exacta(datos.get('B', ''), True)
        return {'A': A, 'B': B, 'producto_AB': producto(A, B),
                'determinante_A': determinante(A), 'determinante_B': determinante(B),
                'suma_determinantes': comparar_suma_determinantes(A, B),
                'propiedades': verificar_determinantes(
            A, B, int(datos.get('fila_i', 1)), int(datos.get('fila_j', 2)),
            datos.get('k', 3), datos.get('eje', 'fila'))}
    if opcion in ('10', '11', '12', '14'):
        from modulos.factorizacion import ejecutar_metodo
        return ejecutar_metodo(opcion, A, datos.get('b', ''), datos.get('B'))
    raise ValueError('Opción desconocida.')


def ejecutar_matrices_interfaz(datos):
    """Recibe los datos de la ventana original y devuelve sus resultados compatibles."""
    return ejecutar_matrices(datos)


def menu_matrices():
    """Sin argumentos; muestra el menú de consola del Módulo III y retorna al salir."""
    from modulos.consola import menu_matrices_cli
    menu_matrices_cli()
