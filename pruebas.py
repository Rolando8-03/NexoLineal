"""Verifica resultados de las guías y casos límite de los módulos matemáticos.
Comprueba tareas 1–5, Cramer y factorización LU mediante Python estándar.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""
import unittest
from fractions import Fraction as F
from modulos.modulo_matrices import (producto, suma, resta, escalar, transpuesta,
    determinante, determinante_cofactores, sarrus, adjunta, inversa_adjunta,
    inversa_gauss_jordan, gauss_jordan_inversa, verificar_propiedades,
    propiedades_filas, ejecutar_programa5, identidad, matriz_exacta)
from modulos.factorizacion import factorizar_lu, resolver_lu, cramer, resolver_por_inversa
from modulos.modulo_sistemas import resolver_desde_interfaz
from modulos.modulo_vectores import ejecutar_relaciones_interfaz, ejecutar_vectores_interfaz
from modulos.modulo_determinantes import ejecutar_determinante_interfaz
from operaciones_matrices import ejecutar_matrices
from analisis_sistema import resolver_sistema


class PruebasAlgebra(unittest.TestCase):
    """Agrupa casos de las guías y comprobaciones algebraicas independientes."""

    def test_producto_guia(self):
        """Sin entradas; comprueba el producto rectangular esperado en la Tarea 5."""
        A, B = [[1,2,3],[4,5,6]], [[1,0],[2,1],[0,3]]
        self.assertEqual(producto(A,B), [[5,11],[14,23]])
        self.assertEqual(len(producto(B,A)), 3)
        with self.assertRaisesRegex(ValueError, r'Columnas de A \[3\] ≠ Filas de B \[2\]'):
            producto(A,A)

    def test_basicas(self):
        """Sin entradas; comprueba suma, resta, escalar y transpuesta exactos."""
        self.assertEqual(suma([[1,'1/2']], [[2,'1/2']]), [[3,1]])
        self.assertEqual(resta([[1,2]], [[2,1]]), [[-1,1]])
        self.assertEqual(escalar([[1,2]], '1/2'), [[F(1,2),1]])
        self.assertEqual(transpuesta([[1,2,3]]), [[1],[2],[3]])

    def test_inversa_guia_3(self):
        """Sin entradas; verifica la inversa 3×3 conocida y los tres determinantes."""
        A = [[1,2,3],[0,1,4],[5,6,0]]
        esperada = [[-24,18,5],[20,-15,-4],[-5,4,1]]
        self.assertEqual(inversa_gauss_jordan(A), esperada)
        self.assertEqual(inversa_adjunta(A), esperada)
        self.assertEqual(producto(A,esperada), identidad(3))
        self.assertEqual(determinante(A), 1)
        self.assertEqual(determinante_cofactores(A), 1)
        self.assertEqual(sarrus(A)['determinante'], 1)

    def test_adjunta_guia(self):
        """Sin entradas; comprueba cofactores transpuestos y fracciones en la inversa."""
        A = [[1,2],[3,4]]
        self.assertEqual(adjunta(A), [[4,-2],[-3,1]])
        self.assertEqual(inversa_adjunta(A), [[-2,1],[F(3,2),F(-1,2)]])
        self.assertEqual(determinante(inversa_adjunta(A)), F(-1,2))

    def test_singular_guia(self):
        """Sin entradas; confirma det=0 y dos pivotes sin buscar pivotes en la identidad."""
        A = [[1,2,3],[4,5,6],[7,8,9]]
        self.assertEqual(determinante(A), 0)
        self.assertEqual(gauss_jordan_inversa(A)['pivotes'], 2)
        self.assertIsNone(gauss_jordan_inversa(A)['inversa'])
        for metodo in (inversa_adjunta, inversa_gauss_jordan):
            with self.assertRaisesRegex(ValueError, 'singular'):
                metodo(A)

    def test_propiedades_guia(self):
        """Sin entradas; compara los miembros y resultados conocidos de las propiedades."""
        A, B = [[1,2],[3,4]], [[0,1],[1,1]]
        resultados = verificar_propiedades(A,B)
        self.assertTrue(all(p['cumple'] for p in resultados))
        self.assertEqual(resultados[1]['izquierda'], [[F(7,2),F(-3,2)],[-2,1]])
        self.assertEqual(resultados[2]['izquierda'], [[-2,F(3,2)],[1,F(-1,2)]])
        self.assertEqual([p['izquierda'] for p in propiedades_filas(A,1,2,3)], [2,-2,-6])
        self.assertEqual(propiedades_filas(A,2,1,-3)[1]['izquierda'], -2)

    def test_intercambio_y_orden_uno(self):
        """Sin entradas; cubre pivote cero, fracciones pequeñas y cofactor de orden cero."""
        self.assertEqual(determinante([[0,1],[2,3]]), -2)
        self.assertEqual(inversa_gauss_jordan([[0,1],[2,3]]), [[F(-3,2),F(1,2)],[1,0]])
        self.assertEqual(adjunta([[7]]), [[1]])
        self.assertEqual(inversa_adjunta([['0.000000000001']]), [[10**12]])
        self.assertEqual(gauss_jordan_inversa([[0]])['pivotes'], 0)

    def test_validaciones(self):
        """Sin entradas; exige errores claros ante matrices o parámetros inválidos."""
        for A in ([], [[1],[2,3]], [[1,2],[3,'nan']], [[1,'1/0']]):
            with self.assertRaises(ValueError): matriz_exacta(A)
        with self.assertRaises(ValueError): determinante([[1,2,3]])
        with self.assertRaises(ValueError): sarrus([[1,2],[3,4]])
        with self.assertRaises(ValueError): suma([[1]],[[1,2]])
        with self.assertRaises(ValueError): propiedades_filas([[1,2],[3,4]],1,1)
        with self.assertRaises(ValueError): propiedades_filas([[1,2],[3,4]],1,2,0)
        with self.assertRaises(ValueError): verificar_propiedades([[1]],[[1,0],[0,1]])

    def test_cramer_lu_inversa(self):
        """Sin entradas; comprueba tres métodos con una solución conocida de la sesión 12."""
        A, b = [[3,-7,-2],[-3,5,1],[6,-4,0]], [-7,5,2]
        for metodo in (cramer, resolver_lu, resolver_por_inversa):
            r = metodo(A,b)
            self.assertEqual(r['solucion'], [3,4,-6])
            self.assertEqual(r['comprobacion'], [[-7],[5],[2]])
        r = resolver_lu(A,b)
        self.assertEqual(r['y'], [-7,-2,6])
        self.assertEqual(r['producto_LU'], A)

    def test_lu_rectangular(self):
        """Sin entradas; cubre LU rectangular, columnas sin pivote y el rechazo de permutaciones."""
        for A in ([[0,2,1],[0,4,5],[0,6,9]], [[1,2],[3,7],[2,4]], [[0,0],[0,0]], [[1,2,3]]):
            r = factorizar_lu(A)
            self.assertEqual(producto(r['L'],r['U']), A)
        with self.assertRaisesRegex(ValueError, 'intercambio'): factorizar_lu([[0,1],[1,0]])
        with self.assertRaises(ValueError): cramer([[1,2],[2,4]],[1,2])

    def test_sistemas_anteriores(self):
        """Sin entradas; conserva clasificación y solución de los programas 1 y 2."""
        self.assertEqual(resolver_sistema([[1,1],[1,-1]],[3,1])['solucion'], ['2','1'])
        self.assertEqual(resolver_sistema([[1,1],[2,2]],[3,6])['tipo'], 'infinitas')
        self.assertEqual(resolver_sistema([[1,1],[2,2]],[3,7])['tipo'], 'inconsistente')
        r = resolver_desde_interfaz({'textos_A':[['1','1']], 'textos_b':['2']})
        self.assertEqual(len(r['variables_libres']),1)

    def test_vectores_anteriores(self):
        """Sin entradas; comprueba L.I., L.D., combinación y ocho propiedades vectoriales."""
        for texto, independiente in [('1 0\n0 1',True),('1 2\n2 4',False)]:
            r = ejecutar_relaciones_interfaz({'accion':'independencia_lineal','vectores':texto})
            self.assertEqual(r['independiente'],independiente)
        r = ejecutar_vectores_interfaz({'accion':'vectores','u':'1 2','v':'3 4','w':'5 6','c':'2','d':'3'})
        self.assertEqual(len(r['propiedades']),8)
        self.assertTrue(all(p['cumple'] for p in r['propiedades']))

    def test_puentes_interfaz(self):
        """Sin entradas; ejecuta las trece opciones y conserva los datos de la ventana anterior."""
        for op in range(13):
            r = ejecutar_programa5({'opcion':str(op),'A':'1 2\n3 4','B':'0 1\n1 1','b':'3 7','k':'3'})
            self.assertIsInstance(r,dict)
        r = ejecutar_matrices({'A':'1 2\n3 4','B':'0 1\n1 1'})
        self.assertEqual(r['determinante_A'],'-2')
        self.assertTrue(r['inversa_verificada'])
        self.assertEqual(ejecutar_determinante_interfaz({'A':'1 2\n3 4'})['determinante_A'],'-2')

    def test_determinantes_varios_ordenes(self):
        """Sin entradas; compara cofactores y eliminación en matrices de orden 1 a 7."""
        for n in range(1,8):
            A = [[F((i*7+j*3)%5-2) for j in range(n)] for i in range(n)]
            for i in range(n): A[i][i] += 10
            valor = determinante(A)
            self.assertEqual(valor,determinante_cofactores(A))
            self.assertEqual(producto(A,inversa_gauss_jordan(A)),identidad(n))

    def test_entradas_malformadas(self):
        """Sin entradas; exige ValueError en estructuras vacías, escalares e irregulares."""
        for datos in (None, 7, [7], [[1], 2], [[1], [2, 3]], [[], []]):
            with self.subTest(datos=datos), self.assertRaises(ValueError):
                matriz_exacta(datos)

    def test_propiedad_fila_orden_uno(self):
        """Sin entradas; comprueba escalamiento de la única fila, incluso con k=0."""
        for k in (0, -3, F(1, 2)):
            propiedades = verificar_propiedades([[2]], [[3]], k=k)
            escala = [p for p in propiedades if p['nombre'].startswith('5.')]
            self.assertEqual(len(escala), 1)
            self.assertEqual(escala[0]['izquierda'], 2*k)
            self.assertTrue(all(p['cumple'] for p in propiedades))

    def test_consola_recupera_errores(self):
        """Sin entradas; simula números, filas y k inválidos antes de una propiedad válida."""
        from unittest.mock import patch
        from modulos.consola import datos_matrices
        entradas = iter(['0', 'abc', '2', '1', '1 2', '3 4',
                         '2', '0 1', '1 1', '0', '3', '1', '1', '2'])
        with patch('builtins.input', side_effect=lambda _: next(entradas)), patch('builtins.print'):
            datos = datos_matrices('9')
        self.assertEqual((datos['fila_i'], datos['fila_j'], datos['k']), (1, 2, 3))
        self.assertTrue(all(p['cumple'] for p in verificar_propiedades(
            datos['A'], datos['B'], datos['fila_i'], datos['fila_j'], datos['k'])))

    def test_consola_teoremas_completos(self):
        """Sin entradas; exige inversa y determinantes desde la opción cero del Módulo III."""
        import io
        from contextlib import redirect_stdout
        from unittest.mock import patch
        from modulos.consola import menu_matrices_cli
        salida = io.StringIO()
        with patch('builtins.input', side_effect=['0', 'v']), redirect_stdout(salida):
            menu_matrices_cli()
        self.assertIn('Sesión 10 (a)', salida.getvalue())
        self.assertIn('det(A⁻¹)=1/det(A)', salida.getvalue())

    def test_matrices_aleatorias_contra_cofactores(self):
        """Sin entradas; contrasta eliminación, inversas y propiedades en casos aleatorios."""
        import random
        rng = random.Random(5)
        for orden in range(1, 5):
            for _ in range(25):
                A = [[rng.randint(-3, 3) for _ in range(orden)] for _ in range(orden)]
                self.assertEqual(determinante(A), determinante_cofactores(A))
                if determinante(A):
                    inversa = inversa_gauss_jordan(A)
                    self.assertEqual(inversa, inversa_adjunta(A))
                    self.assertEqual(producto(A, inversa), identidad(orden))
                    self.assertTrue(all(p['cumple'] for p in verificar_propiedades(A, identidad(orden))))


    def test_cofactores_sesion11(self):
        """Sin entradas; desarrolla por F1, C2 y selección automática como en clase."""
        from modulos.modulo_matrices import expansion_cofactores, resumen_determinante
        A = [[1,3,-3],[2,0,1],[-1,4,-2]]
        for eje, indice in [('fila',1), ('columna',2), ('auto',1)]:
            r = resumen_determinante(A, eje, indice)
            self.assertEqual(sum(t['termino'] for t in r['expansion']), -19)
            self.assertTrue(r['coinciden'])
        A4 = [[2,3,4,5],[1,0,-1,2],[0,-2,1,0],[3,0,2,1]]
        self.assertEqual(determinante(A4),85)
        for eje in ('fila', 'columna'):
            for i in range(1,5):
                self.assertEqual(sum(t['termino'] for t in expansion_cofactores(A4,eje,i)), determinante(A4))
        with self.assertRaises(ValueError): expansion_cofactores(A,'diagonal',1)
        with self.assertRaises(ValueError): expansion_cofactores(A,'fila',0)

    def test_determinantes_sesion11(self):
        """Sin entradas; verifica los valores de ejemplos 2×2, Sarrus y reducción de clase."""
        from modulos.modulo_matrices import reduccion_triangular
        casos = [([[1,2],[2,3]],-1), ([[4,1],[-2,5]],22),
                 ([[2,-1,0],[-2,3,4],[-5,1,6]],36),
                 ([[1,2,1],[1,3,4],[1,0,2]],7),
                 ([[1,-4,2],[-2,8,-9],[-1,7,0]],15)]
        for A, esperado in casos:
            self.assertEqual(determinante_cofactores(A), esperado)
            for normalizar in (False,True):
                r=reduccion_triangular(A,normalizar)
                self.assertEqual(r['determinante'],esperado)
                self.assertEqual((-1)**r['intercambios']*r['factor_filas']*r['producto_diagonal'],esperado)
            if len(A)==3:self.assertEqual(sarrus(A)['determinante'],esperado)

    def test_adjunta_sesion11(self):
        """Sin entradas; verifica los nueve cofactores y la inversa de diapositivas 40–42."""
        from modulos.modulo_matrices import resumen_inversa
        A=[[1,3,-3],[2,0,1],[-1,4,-2]]
        r=resumen_inversa(A,'adjunta')
        self.assertEqual(r['determinante'],-19)
        self.assertEqual(r['cofactores'],[[-4,3,8],[-6,-5,-7],[3,-7,-6]])
        self.assertEqual(r['adjunta'],[[-4,-6,3],[3,-5,-7],[8,-7,-6]])
        self.assertEqual(len(r['detalle_cofactores']),9)
        self.assertTrue(r['verificada'])

    def test_propiedades_determinantes_singulares(self):
        """Sin entradas; verifica filas y columnas, incluyendo escalamiento k=0 y det=0."""
        from modulos.modulo_matrices import verificar_determinantes
        for A in ([[6,1],[3,2]],[[1,2],[2,4]],[[0]]):
            for eje in ('fila','columna'):
                for k in (0,3,F(1,2)):
                    r=verificar_determinantes(A,identidad(len(A)),1,2 if len(A)>1 else 1,k,eje)
                    self.assertTrue(all(p['cumple'] for p in r))
        r=verificar_determinantes([[6,1],[3,2]],[[4,3],[1,2]])
        multiplicativa=next(p for p in r if p['nombre']=='det(AB) = det(A)det(B)')
        self.assertEqual(multiplicativa['izquierda'],45)

    def test_lu_sesion12_3x3(self):
        """Sin entradas; reproduce L, U, y y x del primer ejemplo y verifica L a I."""
        r=resolver_lu([[3,-7,-2],[-3,5,1],[6,-4,0]],[-7,5,2])
        self.assertEqual(r['L'],[[1,0,0],[-1,1,0],[2,-5,1]])
        self.assertEqual(r['U'],[[3,-7,-2],[0,-2,-1],[0,0,-1]])
        self.assertEqual(r['y'],[-7,-2,6])
        self.assertEqual(r['solucion'],[3,4,-6])
        self.assertEqual(r['etapa_Ly']['reducida'],[[1,0,0,-7],[0,1,0,-2],[0,0,1,6]])
        self.assertEqual(r['etapa_Ux']['reducida'],[[1,0,0,3],[0,1,0,4],[0,0,1,-6]])
        self.assertTrue(r['L_reducida_a_I'])
        self.assertEqual(r['construccion_L'][1]['cocientes'],[1,-5])

    def test_lu_sesion12_4x4(self):
        """Sin entradas; reproduce el segundo ejemplo con solución [3,4,-6,-1]."""
        r=resolver_lu([[3,-7,-2,2],[-3,5,1,0],[6,-4,0,-5],[-9,5,-5,12]],[-9,5,7,11])
        self.assertEqual(r['L'],[[1,0,0,0],[-1,1,0,0],[2,-5,1,0],[-3,8,3,1]])
        self.assertEqual(r['y'],[-9,-4,5,1])
        self.assertEqual(r['solucion'],[3,4,-6,-1])
        self.assertTrue(r['solucion_verificada'])

    def test_lu_sesion12_rectangular(self):
        """Sin entradas; reproduce la matriz 4×5 y sus pivotes en columnas 1,2,4,5."""
        A=[[2,4,-1,5,-2],[-4,-5,3,-8,1],[2,-5,-4,1,8],[-6,0,7,-3,1]]
        r=factorizar_lu(A)
        self.assertEqual(r['L'],[[1,0,0,0],[-2,1,0,0],[1,-3,1,0],[-3,4,2,1]])
        self.assertEqual(r['U'],[[2,4,-1,5,-2],[0,3,1,2,-3],[0,0,0,2,1],[0,0,0,0,5]])
        self.assertEqual(r['columnas_pivote'],[1,2,4,5])
        self.assertEqual([c['columna_pivote_U'] for c in r['construccion_L']],[1,2,4,5])
        self.assertTrue(r['L_reducida_a_I'])
        r=resolver_lu(A,[1,2,3,4])
        self.assertEqual(r['sistema']['tipo'],'infinitas')
        self.assertEqual(r['sistema']['variables_libres'],[3])
        self.assertTrue(r['solucion_verificada'] and r['direcciones_verificadas'])

    def test_lu_factores_dados_y_singular(self):
        """Sin entradas; valida los cuatro ejercicios de factores dados y rechaza factores inválidos."""
        from modulos.factorizacion import resolver_con_factores
        casos=[([[3,-7,-2],[-3,5,1],[6,-4,0]],[-7,5,2]),
               ([[2,-6,4],[-4,8,0],[0,-4,6]],[2,-4,6]),
               ([[2,-4,2],[-4,5,2],[6,-9,1]],[6,0,6]),
               ([[1,-1,2],[1,-3,1],[3,7,5]],[0,-5,7])]
        for A,b in casos:
            factores=factorizar_lu(A)
            r=resolver_con_factores(factores['L'],factores['U'],b)
            self.assertEqual(r['A'],A)
            self.assertEqual(r['solucion'],cramer(A,b)['solucion'])
            self.assertTrue(r['solucion_verificada'])
        self.assertEqual(resolver_lu([[1,2],[2,4]],[1,3])['sistema']['tipo'],'incompatible')
        self.assertEqual(resolver_lu([[1,2],[2,4]],[1,2])['sistema']['tipo'],'infinitas')
        with self.assertRaises(ValueError):resolver_con_factores([[2,0],[0,1]],identidad(2),[1,2])
        with self.assertRaises(ValueError):resolver_con_factores(identidad(2),[[0,1],[1,0]],[1,2])

    def test_opciones_nuevas(self):
        """Sin entradas; prueba el puente JSON de determinantes y de factores dados."""
        r=ejecutar_programa5({'opcion':'13','A':[[0]],'B':[[1]]})
        self.assertTrue(all(p['cumple'] for p in r['propiedades']))
        r=ejecutar_programa5({'opcion':'13','A':[[1,2],[2,4]],'B':identidad(2),'k':0})
        self.assertTrue(all(p['cumple'] for p in r['propiedades']))
        r=ejecutar_programa5({'opcion':'14','A':[[1,0],[-1,1]],'B':[[2,1],[0,3]],'b':[1,2]})
        self.assertTrue(r['solucion_verificada'])

    def test_propiedades_fotos_octubre6(self):
        """Sin entradas; contrasta fotos: filas, producto, transpuesta y adjunta exacta."""
        A, B = [[6,1],[3,2]], [[4,3],[1,2]]
        r=ejecutar_programa5({'opcion':'13','A':A,'B':B,'k':3,'fila_i':1,'fila_j':2})
        self.assertEqual(r['producto_AB'],[['25','20'],['14','13']])
        self.assertEqual((r['determinante_A'],r['determinante_B']),('9','5'))
        self.assertTrue(all(p['cumple'] for p in r['propiedades']))
        c=r['suma_determinantes']
        self.assertEqual((c['izquierda'],c['derecha']),('24','14'))
        self.assertFalse(c['coinciden'])
        # La matriz cero puede coincidir: se mantiene la advertencia de que no es una ley.
        c=ejecutar_programa5({'opcion':'13','A':[[0]],'B':[[1]]})['suma_determinantes']
        self.assertTrue(c['coinciden'])
        self.assertIn('no demuestra',c['nota'])
        r=ejecutar_programa5({'opcion':'8','A':[[1,3,-3],[2,0,1],[-1,4,-2]]})
        self.assertEqual(r['inversa'],[['4/19','6/19','-3/19'],['-3/19','5/19','7/19'],['-8/19','7/19','6/19']])
        self.assertTrue(r['verificada'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
