"""Evalúa expresiones y calcula derivadas e integrales elementales.
Extensión opcional de cálculo; no interviene en los algoritmos de álgebra lineal.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""
import ast
import math
from fractions import Fraction

FUNCIONES = {'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'ln', 'log', 'exp', 'abs', 'factorial'}


def analizar(texto, variable=False):
    """Recibe una expresión y permiso de variable; devuelve el árbol sintáctico validado."""
    texto = str(texto).strip().replace('^', '**').replace('π', 'pi').replace('×', '*').replace('÷', '/')
    if not texto or len(texto) > 350:
        raise ValueError('Escribe una expresión de hasta 350 caracteres.')
    try:
        nodo = ast.parse(texto, mode='eval').body
    except SyntaxError as error:
        raise ValueError('Revisa la sintaxis. Escribe * para multiplicar.') from error
    def validar(n, profundidad=0):
        """Recibe un nodo y profundidad; rechaza operaciones ajenas a la calculadora."""
        if profundidad > 45:
            raise ValueError('Expresión demasiado extensa.')
        if isinstance(n, ast.Constant) and type(n.value) in (int, float):
            if abs(n.value) > 1e12:
                raise ValueError('Número demasiado grande.')
        elif isinstance(n, ast.Name) and n.id in ({'pi', 'e', 'Ans', 'x'} if variable else {'pi', 'e', 'Ans'}):
            pass
        elif isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.UAdd, ast.USub)):
            validar(n.operand, profundidad + 1)
        elif isinstance(n, ast.BinOp) and isinstance(n.op, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow)):
            validar(n.left, profundidad + 1)
            validar(n.right, profundidad + 1)
        elif isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in FUNCIONES and len(n.args) == 1 and not n.keywords:
            validar(n.args[0], profundidad + 1)
        else:
            raise ValueError('Expresión no permitida. Usa números, x, operadores y funciones disponibles.')
    validar(nodo)
    return nodo


def evaluar(n, x=0, ans=0, grados=False):
    """Recibe el árbol, x, Ans y modo angular; devuelve su valor real finito."""
    if isinstance(n, ast.Constant):
        y = float(n.value)
    elif isinstance(n, ast.Name):
        y = {'x': x, 'Ans': ans, 'pi': math.pi, 'e': math.e}[n.id]
    elif isinstance(n, ast.UnaryOp):
        y = evaluar(n.operand, x, ans, grados) * (-1 if isinstance(n.op, ast.USub) else 1)
    elif isinstance(n, ast.BinOp):
        a, b = evaluar(n.left, x, ans, grados), evaluar(n.right, x, ans, grados)
        if isinstance(n.op, ast.Add): y = a + b
        elif isinstance(n.op, ast.Sub): y = a - b
        elif isinstance(n.op, ast.Mult): y = a * b
        elif isinstance(n.op, ast.Div): y = a / b
        else:
            if abs(b) > 100 or abs(a) > 1e7:
                raise ValueError('Potencia demasiado grande.')
            y = a ** b
    else:
        a = evaluar(n.args[0], x, ans, grados)
        nombre = n.func.id
        if nombre == 'factorial':
            if a < 0 or a > 170 or a != int(a):
                raise ValueError('El factorial requiere un entero entre 0 y 170.')
            y = math.factorial(int(a))
        elif nombre in ('sin', 'cos', 'tan'):
            y = getattr(math, nombre)(math.radians(a) if grados else a)
        elif nombre in ('asin', 'acos', 'atan'):
            y = getattr(math, nombre)(a)
            if grados: y = math.degrees(y)
        elif nombre == 'log': y = math.log10(a)
        elif nombre == 'ln': y = math.log(a)
        elif nombre == 'abs': y = abs(a)
        else: y = getattr(math, nombre)(a)
    if isinstance(y, complex) or not math.isfinite(y):
        raise ValueError('El resultado no es un número real finito.')
    return y


def numero(v):
    """Recibe un valor numérico y devuelve su representación legible en texto."""
    if abs(v) < 1e-13: return '0'
    if abs(v - round(v)) < 1e-12 and abs(v) < 1e12: return str(round(v))
    return format(v, '.12g')


def imprimir(n):
    """Recibe un nodo de expresión y devuelve su notación matemática en texto."""
    if isinstance(n, ast.Constant): return str(n.value)
    if isinstance(n, ast.Name): return n.id
    if isinstance(n, ast.UnaryOp): return f'(-{imprimir(n.operand)})' if isinstance(n.op, ast.USub) else imprimir(n.operand)
    if isinstance(n, ast.Call): return f'{n.func.id}({imprimir(n.args[0])})'
    op = {ast.Add: '+', ast.Sub: '-', ast.Mult: '*', ast.Div: '/', ast.Pow: '^'}[type(n.op)]
    return f'({imprimir(n.left)}{op}{imprimir(n.right)})'


def derivar(n):
    """Recibe un árbol de expresión y devuelve la derivada simbólica como texto."""
    if isinstance(n, ast.Constant) or (isinstance(n, ast.Name) and n.id != 'x'): return '0'
    if isinstance(n, ast.Name): return '1'
    if isinstance(n, ast.UnaryOp): return f'(-{derivar(n.operand)})' if isinstance(n.op, ast.USub) else derivar(n.operand)
    if isinstance(n, ast.BinOp):
        u, v = imprimir(n.left), imprimir(n.right)
        du, dv = derivar(n.left), derivar(n.right)
        if isinstance(n.op, ast.Add): return f'({du}+{dv})'
        if isinstance(n.op, ast.Sub): return f'({du}-{dv})'
        if isinstance(n.op, ast.Mult): return f'({du}*{v}+{u}*{dv})'
        if isinstance(n.op, ast.Div): return f'(({du}*{v}-{u}*{dv})/({v}^2))'
        if isinstance(n.right, ast.Constant): return f'({v}*({u})^({v}-1)*{du})'
        return f'(({u})^({v})*({dv}*ln({u})+({v})*{du}/({u})))'
    u, du = imprimir(n.args[0]), derivar(n.args[0])
    fun = n.func.id
    regla = {'sin': f'cos({u})', 'cos': f'(-sin({u}))', 'tan': f'(1/cos({u})^2)',
             'exp': f'exp({u})', 'ln': f'(1/({u}))', 'log': f'(1/(({u})*ln(10)))',
             'sqrt': f'(1/(2*sqrt({u})))', 'asin': f'(1/sqrt(1-({u})^2))',
             'acos': f'(-1/sqrt(1-({u})^2))', 'atan': f'(1/(1+({u})^2))'}
    if fun not in regla: raise ValueError(f'No se admite la derivada simbólica de {fun}.')
    return f'({regla[fun]}*{du})'


def simplificar_polinomio(n):
    """Coeficientes racionales de polinomios de grado hasta 30. Recibe n."""
    if isinstance(n, ast.Constant): return {0: Fraction(str(n.value))}
    if isinstance(n, ast.Name):
        if n.id == 'x': return {1: Fraction(1)}
        raise ValueError('Esta integral simbólica admite polinomios de coeficientes numéricos.')
    if isinstance(n, ast.UnaryOp):
        p = simplificar_polinomio(n.operand)
        return {k: -v for k, v in p.items()} if isinstance(n.op, ast.USub) else p
    if isinstance(n, ast.BinOp):
        a = simplificar_polinomio(n.left)
        if isinstance(n.op, ast.Pow):
            b = simplificar_polinomio(n.right)
            if len(b) != 1 or 0 not in b or b[0].denominator != 1 or not 0 <= b[0] <= 30:
                raise ValueError('Esta integral simbólica admite exponentes enteros entre 0 y 30.')
            resultado = {0: Fraction(1)}
            for _ in range(int(b[0])): resultado = multiplicar_poly(resultado, a)
            return resultado
        b = simplificar_polinomio(n.right)
        if isinstance(n.op, ast.Mult): return multiplicar_poly(a, b)
        if isinstance(n.op, ast.Div):
            if set(b) != {0} or b[0] == 0: raise ValueError('No es un polinomio.')
            return {k: v / b[0] for k, v in a.items()}
        resultado = dict(a)
        for k, v in b.items(): resultado[k] = resultado.get(k, 0) + (v if isinstance(n.op, ast.Add) else -v)
        return resultado
    raise ValueError('La integral simbólica disponible admite polinomios, sin, cos, exp y 1/x.')


def multiplicar_poly(a, b):
    """Recibe dos diccionarios de coeficientes y devuelve el polinomio producto."""
    r = {}
    for i, u in a.items():
        for j, v in b.items():
            if i + j > 30: raise ValueError('Polinomio de grado demasiado alto.')
            r[i+j] = r.get(i+j, 0) + u*v
    return r


def coeficiente(c):
    """Recibe una fracción y devuelve un coeficiente escrito como entero o cociente."""
    return str(c.numerator) if c.denominator == 1 else f'({c.numerator}/{c.denominator})'


def integrar(n):
    """Recibe una expresión y devuelve su primitiva cuando la regla está implementada."""
    try:
        p = simplificar_polinomio(n)
        partes = [f'{coeficiente(v/Fraction(k+1))}*x^{k+1}' for k, v in sorted(p.items(), reverse=True) if v]
        return '+'.join(partes) if partes else '0'
    except ValueError:
        pass
    if isinstance(n, ast.UnaryOp):
        return f'-({integrar(n.operand)})' if isinstance(n.op, ast.USub) else integrar(n.operand)
    if isinstance(n, ast.BinOp):
        if isinstance(n.op, (ast.Add, ast.Sub)):
            return f'({integrar(n.left)}){("+" if isinstance(n.op, ast.Add) else "-")}({integrar(n.right)})'
        if isinstance(n.op, ast.Mult):
            for a, b in ((n.left, n.right), (n.right, n.left)):
                if 'x' in imprimir(a): continue
                try: return f'({numero(evaluar(a))})*({integrar(b)})'
                except (ValueError, ZeroDivisionError): pass
        if isinstance(n.op, ast.Div):
            try:
                if 'x' not in imprimir(n.right): return f'({integrar(n.left)})/({numero(evaluar(n.right))})'
            except (ValueError, ZeroDivisionError): pass
            if isinstance(n.left, ast.Constant) and n.left.value == 1 and imprimir(n.right) == 'x': return 'ln(abs(x))'
    if isinstance(n, ast.Call) and n.func.id in ('sin', 'cos', 'exp'):
        try:
            p = simplificar_polinomio(n.args[0])
            if any(k > 1 and v for k, v in p.items()) or not p.get(1): raise ValueError('Argumento no lineal.')
            a = coeficiente(p[1]); argumento = imprimir(n.args[0])
            signo, fun = ('-', 'cos') if n.func.id == 'sin' else ('', 'sin') if n.func.id == 'cos' else ('', 'exp')
            return f'{signo}{fun}({argumento})/({a})'
        except ValueError: pass
    raise ValueError('No hay primitiva simbólica para esta expresión. Prueba con una integral definida para obtener una aproximación numérica.')


def integral_numerica(n, a, b):
    """Recibe expresión e intervalo; devuelve la aproximación mediante Simpson adaptativo."""
    if a == b: return 0.0
    def f(x):
        """Recibe un punto y devuelve el valor de la función integranda."""
        return evaluar(n, x=x)
    def simpson(l, r, fl, fm, fr):
        """Recibe extremos y valores de una función; devuelve la aproximación de Simpson."""
        return (r-l)*(fl+4*fm+fr)/6
    def subdividir(l, r, fl, fm, fr, base, tol, nivel):
        """Recibe un subintervalo y estimación; devuelve la integral refinada hasta la tolerancia."""
        m = (l+r)/2; lm = (l+m)/2; rm = (m+r)/2
        flm, frm = f(lm), f(rm)
        iz = simpson(l, m, fl, flm, fm); de = simpson(m, r, fm, frm, fr)
        if nivel == 0:
            raise ValueError('No se logró la precisión numérica cerca de una discontinuidad.')
        if abs(iz+de-base) <= 15*tol: return iz+de+(iz+de-base)/15
        return subdividir(l,m,fl,flm,fm,iz,tol/2,nivel-1)+subdividir(m,r,fm,frm,fr,de,tol/2,nivel-1)
    signo = 1 if b >= a else -1
    l, r = min(a,b), max(a,b)
    
    muestras = [f(l+(r-l)*i/256) for i in range(257)]
    for i in range(256):
        if abs(muestras[i]) > 1e10 or abs(muestras[i+1]) > 1e10:
            raise ValueError('Posible singularidad: revisa los límites.')
    return signo*subdividir(l,r,muestras[0],f((l+r)/2),muestras[-1],simpson(l,r,muestras[0],f((l+r)/2),muestras[-1]),1e-8,22)


def ejecutar_calculo(datos):
    """Recibe opción y expresión de la interfaz; devuelve el resultado del cálculo."""
    accion = datos.get('accion')
    if accion == 'basica':
        n = analizar(datos.get('expresion', ''))
        return {'valor': numero(evaluar(n, ans=float(datos.get('ans', 0)), grados=bool(datos.get('grados'))))}
    if accion != 'calculo': raise ValueError('Operación desconocida.')
    n = analizar(datos.get('expresion', ''), variable=True)
    operacion = datos.get('operacion')
    if operacion == 'derivar':
        try:
            p = simplificar_polinomio(n)
            terminos = [f'{coeficiente(v*k)}*x^{k-1}' for k, v in sorted(p.items(), reverse=True) if k and v]
            expresion = '+'.join(terminos) if terminos else '0'
        except ValueError:
            expresion = derivar(n)
        
        resultado = {'expresion': expresion, 'tipo': 'derivada'}
        if str(datos.get('punto', '')).strip():
            x = evaluar(analizar(datos['punto']))
            resultado['valor'] = numero(evaluar(analizar(expresion, variable=True), x=x))
            resultado['punto'] = numero(x)
        return resultado
    if operacion == 'integrar':
        return {'expresion': integrar(n) + ' + C', 'tipo': 'primitiva'}
    if operacion == 'definida':
        a = evaluar(analizar(datos.get('inferior', '')))
        b = evaluar(analizar(datos.get('superior', '')))
        if abs(b-a) > 1e5: raise ValueError('Intervalo demasiado grande.')
        if (isinstance(n, ast.BinOp) and isinstance(n.op, ast.Div)
                and imprimir(n.right) == 'x' and min(a, b) <= 0 <= max(a, b)):
            raise ValueError('La función tiene una singularidad en x=0 dentro del intervalo.')
        try:
            primitiva = integrar(n)
            fn = analizar(primitiva, variable=True)
            valor = evaluar(fn, x=b)-evaluar(fn, x=a)
            return {'valor': numero(valor), 'expresion': primitiva, 'tipo': 'exacta'}
        except ValueError:
            valor = integral_numerica(n, a, b)
            return {'valor': numero(valor), 'tipo': 'aproximada'}
    raise ValueError('Elige derivar o integrar.')
