"""Calcula operaciones, determinantes, inversas y sus propiedades exactas.
Implementa el Módulo III y las sesiones 9, 10 y 11 de Álgebra Lineal.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""
from fractions import Fraction
from nexolineal.parsing.numbers import parse_matrix
from nexolineal.algorithms.matrices import suma, resta, escalar, producto, transpuesta, identidad
from python.entrada_datos import convertir_numero
from python.operaciones_matrices import ejecutar_matrices, multiplicar_matrices, _serializar


def matriz_exacta(datos, cuadrada=False):
    """Adapta la firma histórica al parser compartido."""
    return parse_matrix(datos, square=cuadrada)

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
                         'cofactor': cofactor, 'termino': A[i][j] * cofactor,
                         'procedimiento_menor': procedimiento_determinante(submatriz)})
    return terminos



def procedimiento_determinante(matriz):
    """Recibe una matriz o menor vacío; devuelve su desarrollo exacto hasta orden 2."""
    if not matriz:
        return {'matriz': [], 'valor': Fraction(1), 'caso': 'vacio'}
    matriz = matriz_exacta(matriz, True)
    if len(matriz) == 1:
        return {'matriz': matriz, 'valor': matriz[0][0], 'caso': 'uno'}
    if len(matriz) == 2:
        principal = matriz[0][0]*matriz[1][1]
        secundaria = matriz[0][1]*matriz[1][0]
        return {'matriz': matriz, 'valor': principal-secundaria, 'caso': 'dos',
                'principal': principal, 'secundaria': secundaria}
    elegida = elegir_desarrollo(matriz)
    terminos = expansion_cofactores(matriz, elegida['eje'], elegida['indice'])
    return {'matriz': matriz, 'valor': sum(t['termino'] for t in terminos),
            'caso': 'expansion', 'terminos': terminos, **elegida}

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
    arreglo = A + [A[0][:], A[1][:]]
    diagonales = []
    recorridos = [('positiva', [(i,0),(i+1,1),(i+2,2)]) for i in range(3)]
    recorridos += [('negativa', [(i+2,0),(i+1,1),(i,2)]) for i in range(3)]
    for sentido, recorrido in recorridos:
        factores = [arreglo[i][j] for i,j in recorrido]
        valor = factores[0]*factores[1]*factores[2]
        diagonales.append({'sentido': sentido, 'coordenadas': [[i+1,j+1] for i,j in recorrido],
                           'factores': factores, 'producto': valor})
    return {'positivas': positivas, 'negativas': negativas,
            'determinante': sum(positivas) - sum(negativas),
            'arreglo': A + [A[0][:], A[1][:]],
            'suma_positivas': sum(positivas), 'suma_negativas': sum(negativas),
            'diagonales': diagonales}


def _registrar(pasos, descripcion, matriz):
    """Recibe una operación y su matriz; agrega al registro una copia independiente."""
    pasos.append({'descripcion': descripcion, 'matriz': [f[:] for f in matriz]})


def reduccion_triangular(A, normalizar=False):
    """Recibe A cuadrada; devuelve U, intercambios, factores y det(A) corregido."""
    U = matriz_exacta(A, True)
    inicial = [fila[:] for fila in U]
    intercambios, pasos, factor_filas = 0, [], Fraction(1)
    for columna in range(len(U)):
        pivote = next((i for i in range(columna, len(U)) if U[i][columna]), None)
        if pivote is None:
            continue
        if pivote != columna:
            U[pivote], U[columna] = U[columna], U[pivote]
            intercambios += 1
            _registrar(pasos, f'F{columna+1} ↔ F{pivote+1}; cambia el signo.', U)
            pasos[-1].update({'operacion': 'intercambio', 'fila': columna+1,
                             'otra_fila': pivote+1, 'multiplicador_determinante': Fraction(-1),
                             'factor_recuperacion': (-1)**intercambios * factor_filas})
        if normalizar and U[columna][columna] != 1:
            divisor = U[columna][columna]
            anterior = U[columna][:]
            U[columna] = [v / divisor for v in U[columna]]
            # Dividir una fila divide el determinante: guardamos el factor que recupera det(A).
            factor_filas *= divisor
            _registrar(pasos, f'Extraer factor {divisor}: F{columna+1} ← F{columna+1} / ({divisor})', U)
            pasos[-1].update({'operacion': 'division', 'fila': columna+1,
                             'pivote': divisor, 'anterior': anterior,
                             'multiplicador_determinante': Fraction(1) / divisor,
                             'factor_recuperacion': (-1)**intercambios * factor_filas})
        for fila in range(columna + 1, len(U)):
            factor = U[fila][columna] / U[columna][columna]
            if factor:
                anterior, origen = U[fila][:], U[columna][:]
                U[fila] = [a - factor*b for a, b in zip(U[fila], U[columna])]
                _registrar(pasos, f'F{fila+1} ← F{fila+1} − ({factor})F{columna+1}', U)
                pasos[-1].update({'operacion': 'reemplazo', 'fila': fila+1,
                                 'origen': columna+1, 'factor': factor,
                                 'anterior': anterior, 'fila_origen': origen,
                                 'multiplicador_determinante': Fraction(1),
                                 'factor_recuperacion': (-1)**intercambios * factor_filas})
    diagonal = Fraction(1)
    for i in range(len(U)):
        diagonal *= U[i][i]
    # El determinante original recupera los factores extraídos y el signo de cada intercambio.
    valor = (-1)**intercambios * factor_filas * diagonal
    anterior = valor
    for paso in pasos:
        paso['det_antes'] = anterior
        paso['det_despues'] = valor / paso['factor_recuperacion']
        anterior = paso['det_despues']
    return {'inicial': inicial, 'triangular': U, 'intercambios': intercambios, 'factor_filas': factor_filas,
            'producto_diagonal': diagonal, 'determinante': valor,
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
        anterior = matriz[fila_pivote][:]
        matriz[fila_pivote] = [v / pivote for v in matriz[fila_pivote]]
        _registrar(pasos, f'F{fila_pivote+1} ← F{fila_pivote+1} / ({pivote})', matriz)
        pasos[-1].update({'operacion': 'division', 'fila': fila_pivote+1,
                         'columna_pivote': columna+1, 'pivote': pivote, 'anterior': anterior})
    for fila in range(len(matriz)):
        if fila != fila_pivote and matriz[fila][columna]:
            factor = matriz[fila][columna]
            anterior, origen = matriz[fila][:], matriz[fila_pivote][:]
            matriz[fila] = [a - factor*b for a, b in zip(anterior, origen)]
            _registrar(pasos, f'F{fila+1} ← F{fila+1} − ({factor})F{fila_pivote+1}', matriz)
            pasos[-1].update({'operacion': 'reemplazo', 'fila': fila+1, 'origen': fila_pivote+1,
                             'columna_pivote': columna+1, 'factor': factor,
                             'anterior': anterior, 'fila_origen': origen})


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
            pasos[-1].update({'operacion': 'intercambio', 'fila': fila_pivote+1,
                             'otra_fila': elegida+1, 'columna_pivote': columna+1})
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
    """Recibe A y B del mismo tamaño; verifica las identidades sin exigir inversas globalmente."""
    A, B = matriz_exacta(A), matriz_exacta(B)
    if (len(A), len(A[0])) != (len(B), len(B[0])):
        raise ValueError('A y B deben tener las mismas dimensiones en este verificador general.')
    resultados = verificar_propiedades_completas(A, B, k=k, fila_i=fila_i, fila_j=fila_j)
    resultados = [p for p in resultados if not (
        p.get('estado') == 'no_aplica' and
        (p['nombre'] == 'det(A triangular) = producto diagonal' or
         (len(A) == 1 and p['nombre'].startswith(('Intercambiar', 'Reemplazar')))))]
    if len(A) == 1:
        for propiedad in resultados:
            if propiedad['nombre'] == 'Multiplicar una fila por c escala el determinante':
                propiedad['nombre'] = '5. F1 ← k F1: det = k det(A)'
    return resultados


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
    """Devuelve el método elegido y los dos productos desarrollados con fracciones."""
    A = matriz_exacta(A, True)
    if metodo not in ('gauss', 'adjunta'):
        raise ValueError('El método debe ser gauss o adjunta.')
    datos = gauss_jordan_inversa(A)
    resultado = {'A': A, 'determinante': determinante(A), 'diagnostico': diagnostico(A),
                 'gauss': datos, 'metodo': metodo, 'inversa': datos['inversa']}
    if metodo == 'adjunta':
        resultado['procedimiento_determinante'] = procedimiento_determinante(A)
    if datos['inversa'] is not None:
        if metodo == 'adjunta':
            otra = inversa_adjunta(A)
            resultado.update({'cofactores': matriz_cofactores(A), 'detalle_cofactores': detalles_cofactores(A),
                              'adjunta': adjunta(A), 'reciproco_determinante': 1/resultado['determinante'],
                              'inversa': otra, 'inversa_adjunta': otra,
                              'coinciden': otra == datos['inversa']})
        inversa = resultado['inversa']
        derecho, pasos_derecho = multiplicar_matrices(A, inversa)
        izquierdo, pasos_izquierdo = multiplicar_matrices(inversa, A)
        resultado.update({'producto': derecho, 'pasos_producto': pasos_derecho,
                          'producto_izquierdo': izquierdo, 'pasos_producto_izquierdo': pasos_izquierdo,
                          'identidad': identidad(len(A)),
                          'verificada': derecho == identidad(len(A)) == izquierdo})
    return resultado


def verificar_propiedad(nombre, A, B=None, C=None, k=3, d=1, fila_i=1, fila_j=2, cache=None):
    """Recibe una identidad y sus datos; devuelve ambos miembros o su condición pendiente."""
    A = matriz_exacta(A)
    B = matriz_exacta(B) if B is not None else None
    C = matriz_exacta(C) if C is not None else None
    k, d = convertir_numero(k), convertir_numero(d)
    cache = {} if cache is None else cache

    def guardar(clave, calculo):
        """Recibe una clave y cálculo; conserva la lista intermedia para reutilizarla."""
        if clave not in cache:
            cache[clave] = calculo()
        return cache[clave]

    def requerida(matriz, letra):
        """Recibe una matriz opcional y nombre; exige los datos usados por la identidad."""
        if matriz is None:
            raise ValueError(f'Completa la matriz {letra} para esta propiedad.')
        return matriz

    def matriz_B():
        """Devuelve B sin solicitar que el usuario reingrese una operación intermedia."""
        return requerida(B, 'B')

    def matriz_C():
        """Devuelve C cuando una propiedad usa tres matrices."""
        return requerida(C, 'C')

    def AB():
        """Devuelve el producto AB calculado una sola vez."""
        return guardar('AB', lambda: producto(A, matriz_B()))

    def AmasB():
        """Devuelve la suma A+B calculada una sola vez."""
        return guardar('A+B', lambda: suma(A, matriz_B()))

    def IA():
        """Devuelve la inversa de A o comunica que no existe."""
        return guardar('IA', lambda: inversa_gauss_jordan(A))

    def IB():
        """Devuelve la inversa de B o comunica que no existe."""
        return guardar('IB', lambda: inversa_gauss_jordan(matriz_B()))

    def detA():
        """Devuelve el determinante exacto de A y lo conserva para otras propiedades."""
        return guardar('detA', lambda: determinante(A))

    def fila_propiedad(tipo):
        """Recibe intercambio, reemplazo o escala; reutiliza el verificador por filas."""
        j = 1 if len(A) == 1 else fila_j
        casos = guardar('filas', lambda: _propiedades_operaciones(A, fila_i, j, k, 'fila'))
        for caso in casos:
            if caso['nombre'].startswith(tipo):
                return caso
        raise ValueError('Esta propiedad requiere dos filas distintas.')

    def triangular():
        """Devuelve A si es cuadrada triangular; rechaza una condición no satisfecha."""
        matriz_exacta(A, True)
        superior = all(not A[i][j] for i in range(len(A)) for j in range(i))
        inferior = all(not A[i][j] for i in range(len(A)) for j in range(i+1, len(A)))
        if not (superior or inferior):
            raise ValueError('Esta identidad requiere una matriz triangular.')
        return A

    def diagonal():
        """Retorna el producto de la diagonal de la matriz triangular validada."""
        matriz = triangular()
        valor = Fraction(1)
        for i in range(len(matriz)):
            valor *= matriz[i][i]
        return valor

    cero = [[Fraction(0) for _ in fila] for fila in A]
    operaciones = {
        'A + B = B + A': (lambda: AmasB(), lambda: suma(matriz_B(), A)),
        '(A + B) + C = A + (B + C)': (lambda: suma(AmasB(), matriz_C()), lambda: suma(A, suma(matriz_B(), matriz_C()))),
        'A + 0 = A': (lambda: suma(A, cero), lambda: A),
        'c(A + B) = cA + cB': (lambda: escalar(AmasB(), k), lambda: suma(escalar(A, k), escalar(matriz_B(), k))),
        '(c + d)A = cA + dA': (lambda: escalar(A, k+d), lambda: suma(escalar(A, k), escalar(A, d))),
        'c(dA) = (cd)A': (lambda: escalar(escalar(A, d), k), lambda: escalar(A, k*d)),
        'A(BC) = (AB)C': (lambda: producto(A, producto(matriz_B(), matriz_C())), lambda: producto(AB(), matriz_C())),
        'A(B + C) = AB + AC': (lambda: producto(A, suma(matriz_B(), matriz_C())), lambda: suma(AB(), producto(A, matriz_C()))),
        '(B + C)A = BA + CA': (lambda: producto(suma(matriz_B(), matriz_C()), A), lambda: suma(producto(matriz_B(), A), producto(matriz_C(), A))),
        'c(AB) = (cA)B': (lambda: escalar(AB(), k), lambda: producto(escalar(A, k), matriz_B())),
        'c(AB) = A(cB)': (lambda: escalar(AB(), k), lambda: producto(A, escalar(matriz_B(), k))),
        'I_m A = A': (lambda: producto(identidad(len(A)), A), lambda: A),
        'A I_n = A': (lambda: producto(A, identidad(len(A[0]))), lambda: A),
        '(A^T)^T = A': (lambda: transpuesta(transpuesta(A)), lambda: A),
        '(A + B)^T = A^T + B^T': (lambda: transpuesta(AmasB()), lambda: suma(transpuesta(A), transpuesta(matriz_B()))),
        '(cA)^T = cA^T': (lambda: transpuesta(escalar(A, k)), lambda: escalar(transpuesta(A), k)),
        '(AB)^T = B^T A^T': (lambda: transpuesta(AB()), lambda: producto(transpuesta(matriz_B()), transpuesta(A))),
        'c(A^T + B^T) = (c(A + B))^T': (lambda: escalar(suma(transpuesta(A), transpuesta(matriz_B())), k), lambda: transpuesta(escalar(AmasB(), k))),
        '(A^-1)^-1 = A': (lambda: inversa_gauss_jordan(IA()), lambda: A),
        '(AB)^-1 = B^-1 A^-1': (lambda: inversa_gauss_jordan(AB()), lambda: producto(IB(), IA())),
        '(A^T)^-1 = (A^-1)^T': (lambda: inversa_gauss_jordan(transpuesta(A)), lambda: transpuesta(IA())),
        'A A^-1 = I': (lambda: producto(A, IA()), lambda: identidad(len(A))),
        'A^-1 A = I': (lambda: producto(IA(), A), lambda: identidad(len(A))),
        'det(A^T) = det(A)': (lambda: determinante(transpuesta(A)), lambda: detA()),
        'det(AB) = det(A)det(B)': (lambda: determinante(AB()), lambda: detA()*determinante(matriz_B())),
        'det(A^-1) = 1/det(A)': (lambda: determinante(IA()), lambda: Fraction(1)/detA()),
        'det(cA) = c^n det(A)': (lambda: determinante(escalar(A, k)), lambda: k**len(A)*detA()),
        'det(A triangular) = producto diagonal': (lambda: determinante(triangular()), diagonal),
    }
    try:
        tipos = {'Intercambiar filas cambia el signo del determinante': 'Intercambio',
                 'Reemplazar una fila conserva el determinante': 'Reemplazo',
                 'Multiplicar una fila por c escala el determinante': 'Escalamiento'}
        if nombre in tipos:
            resultado = fila_propiedad(tipos[nombre]).copy()
            resultado['nombre'] = nombre
            return resultado
        if nombre not in operaciones:
            raise ValueError('Propiedad desconocida.')
        izquierda, derecha = operaciones[nombre]
        return _propiedad(nombre, izquierda(), derecha())
    except (ValueError, ZeroDivisionError) as error:
        return {'nombre': nombre, 'izquierda': None, 'derecha': None, 'cumple': None,
                'estado': 'no_aplica', 'mensaje': str(error)}


def verificar_propiedades_completas(A, B=None, C=None, k=3, d=1, fila_i=1, fila_j=2):
    """Recibe entradas originales; comprueba cada identidad con condiciones independientes."""
    nombres = [
        '(A^-1)^-1 = A', '(AB)^-1 = B^-1 A^-1', '(A^T)^-1 = (A^-1)^T',
        'det(A^-1) = 1/det(A)', 'A A^-1 = I', 'A^-1 A = I',
        '(A^T)^T = A', '(A + B)^T = A^T + B^T', '(cA)^T = cA^T',
        '(AB)^T = B^T A^T', 'c(A^T + B^T) = (c(A + B))^T',
        'A + B = B + A', 'c(A + B) = cA + cB', 'c(dA) = (cd)A',
        '(c + d)A = cA + dA', 'det(A^T) = det(A)',
        'det(AB) = det(A)det(B)', 'det(cA) = c^n det(A)',
        'Intercambiar filas cambia el signo del determinante',
        'Reemplazar una fila conserva el determinante',
        'Multiplicar una fila por c escala el determinante',
        'det(A triangular) = producto diagonal',
    ]
    if C is not None:
        nombres += ['(A + B) + C = A + (B + C)', 'A(BC) = (AB)C',
                    'A(B + C) = AB + AC', '(B + C)A = BA + CA']
    cache = {}
    return [verificar_propiedad(nombre, A, B, C, k, d, fila_i, fila_j, cache) for nombre in nombres]

def ejecutar_programa5(datos):
    """Recibe la solicitud de interfaz; devuelve el resultado serializable de una opción."""
    opcion = str(datos.get('opcion', '6'))
    if opcion == '0':
        from teoremas.resumen_teoremas import obtener_teoremas
        return {'teoremas': obtener_teoremas('matrices') + obtener_teoremas('determinantes') + obtener_teoremas('lu')}
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
        B = matriz_exacta(datos['B']) if datos.get('B') else None
        C = matriz_exacta(datos['C']) if datos.get('C') else None
        propiedades = verificar_propiedades_completas(
            A, B, C, datos.get('k', 3), datos.get('d', 1),
            int(datos.get('fila_i', 1)), int(datos.get('fila_j', 2)))
        return {'A': A, 'B': B, 'C': C, 'propiedades': propiedades}
    if opcion == '13':
        B = matriz_exacta(datos.get('B', ''), True)
        return {'A': A, 'B': B, 'producto_AB': producto(A, B),
                'determinante_A': determinante(A), 'determinante_B': determinante(B),
                'suma_determinantes': comparar_suma_determinantes(A, B),
                'propiedades': verificar_determinantes(
            A, B, int(datos.get('fila_i', 1)), int(datos.get('fila_j', 2)),
            datos.get('k', 3), datos.get('eje', 'fila'))}
    if opcion == '11':
        from modulos.modulo_lu import ejecutar_lu
        return ejecutar_lu(A, datos.get('b', ''))
    if opcion in ('10', '12', '14'):
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
