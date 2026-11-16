"""Factorización A=LU y resolución en dos sustituciones: Programa 6, MTM0120.
Reutiliza la eliminación, los productos y las sustituciones de la calculadora.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""
from modulos.factorizacion import (
    factorizar_lu as _factorizar_lu, resolver_con_factores,
    sustitucion_triangular, leer_b,
)
from modulos.modulo_matrices import producto


def factorizar_lu(matriz_A):
    """Recibe A de m×n; retorna L de m×m, U escalonada, pasos y verificación."""
    try:
        resultado = _factorizar_lu(matriz_A)
    except ValueError as error:
        if 'intercambio' in str(error):
            raise ValueError('La matriz no admite Factorización LU sin permutación '
                             '(requiere pivoteo parcial PA = LU).') from None
        raise
    resultado['mensaje_factorizacion'] = (
        'La factorización es correcta (L · U == A).'
        if resultado['verificada'] else 'La factorización no coincide con A.')
    return resultado


def resolver_lu(matriz_A, vector_b):
    """Recibe A y b; retorna L, U, y, x, reducciones aumentadas y Ax=b."""
    resultado = factorizar_lu(matriz_A)
    vector_b = leer_b(vector_b, len(resultado['A']))
    etapas = resolver_con_factores(resultado['L'], resultado['U'], vector_b)
    resultado.update(etapas)
    vector_y = sustitucion_triangular(resultado['L'], vector_b, inferior=True)
    resultado['y'] = vector_y
    resultado['Ly_verificada'] = producto(resultado['L'], [[v] for v in vector_y]) == [[v] for v in vector_b]
    if len(resultado['A']) == len(resultado['A'][0]) and resultado['sistema']['tipo'] == 'unica':
        vector_x = sustitucion_triangular(resultado['U'], vector_y)
        resultado['solucion'] = vector_x
        resultado['Ux_verificada'] = producto(resultado['U'], [[v] for v in vector_x]) == [[v] for v in vector_y]
        resultado['comprobacion'] = producto(resultado['A'], [[v] for v in vector_x])
        resultado['solucion_verificada'] = resultado['comprobacion'] == [[v] for v in vector_b]
    resultado['mensaje_solucion'] = (
        'Comprobación exitosa: A · x == b.' if resultado.get('solucion_verificada')
        else resultado['sistema']['clasificacion'])
    return resultado


def ejecutar_lu(matriz_A, vector_b=None):
    """Recibe A y b opcional; retorna factorización sola o resolución completa."""
    if vector_b is None or vector_b == '' or vector_b == []:
        return factorizar_lu(matriz_A)
    return resolver_lu(matriz_A, vector_b)
