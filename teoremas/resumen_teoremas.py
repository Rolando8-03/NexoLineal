"""Centraliza las propiedades y los teoremas para pantalla y consola.
Resume sistemas, vectores, matrices, determinantes y factorización LU.
Autores: Rolando Enrique Mayorga Mena, Alex Josué Fonseca Velásquez,
Alondra Sofía Mayen Rodríguez y Mery Nohemy López Aguirre (Grupo 4).
"""


TEOREMAS = {
    "sistemas": [
        (
            "Las operaciones elementales por filas conservan "
            "las soluciones del sistema."
        ),
        (
            "El rango de una matriz es su número de pivotes."
        ),
        (
            "Si rango(A) < rango([A|b]), el sistema no tiene solución."
        ),
        (
            "Si ambos rangos son iguales al número de incógnitas, "
            "el sistema tiene solución única."
        ),
        (
            "Si ambos rangos son iguales y menores que el número "
            "de incógnitas, hay infinitas soluciones."
        ),
        (
            "Ax = 0 siempre tiene la solución trivial."
        ),
    ],

    "vectores": [
        (
            "Los vectores se colocan como columnas de A "
            "para construir el sistema homogéneo Ax = 0."
        ),
        (
            "Son L.I. si Ax = 0 solo tiene la solución trivial."
        ),
        (
            "Son L.D. si Ax = 0 tiene una solución no trivial."
        ),
        (
            "Variables libres = cantidad de vectores - número de pivotes."
        ),
        (
            "Si hay más vectores que dimensiones, son L.D."
        ),
        (
            "Un conjunto que contiene el vector cero es L.D."
        ),
    ],

    "matrices": [
        (
            "Para sumar o restar matrices deben tener "
            "las mismas dimensiones."
        ),
        (
            "AB está definido si las columnas de A "
            "coinciden con las filas de B."
        ),
        (
            "En general, AB no es igual a BA."
        ),
        (
            "Ley asociativa: A(BC) = (AB)C, cuando las dimensiones "
            "son compatibles."
        ),
        (
            "Ley distributiva izquierda: A(B + C) = AB + AC, "
            "cuando las operaciones están definidas."
        ),
        
        (
            "Ley distributiva derecha: (B + C)A = BA + CA."
        ),
        (
            "Para cualquier escalar r: r(AB) = (rA)B = A(rB)."
        ),
        (
            "Identidad para la multiplicación: I_n A = A = A I_n."
        ),
        (
            "La transpuesta intercambia filas y columnas."
        ),
        (
            "Transpuesta de la transpuesta: (A^T)^T = A."
        ),
        (
            "Transpuesta de una suma: (A + B)^T = A^T + B^T."
        ),
        (
            "Para cualquier escalar r: (rA)^T = rA^T."
        ),
        (
            "Transpuesta de un producto: (AB)^T = B^T A^T."
        ),
        (
            "Una matriz cuadrada de orden n tiene inversa "
            "si y solo si su rango es n."
        ),
        (
            "Si A es invertible, Gauss-Jordan transforma "
            "[A|I] en [I|A^-1]."
        ),
    ],

    "determinantes": [
        (
            "El determinante solo se define para matrices cuadradas."
        ),
        (
            "det(I) = 1."
        ),
        (
            "Intercambiar dos filas cambia el signo del determinante."
        ),
        (
            "Multiplicar una fila por c multiplica "
            "el determinante por c."
        ),
        (
            "Sumar a una fila un múltiplo de otra "
            "conserva el determinante."
        ),
        (
            "El determinante de una matriz triangular "
            "es el producto de su diagonal principal."
        ),
        (
            "det(A^T) = det(A)."
        ),
        (
            "Para matrices cuadradas del mismo orden, "
            "det(AB) = det(A)det(B)."
        ),
        (
            "A tiene inversa si y solo si det(A) es distinto de cero."
        ),
    ],
}


TEOREMAS["sistemas"] += [
    "Toda matriz tiene una única forma escalonada reducida; la forma escalonada puede variar.",
    "Ax=b equivale a x1 a1 + ... + xn an=b. Si A es m×n, entonces x está en R^n y b en R^m.",
    "Ax=0 tiene solución no trivial si y solo si hay al menos una variable libre.",
    "Si Ax=b es consistente, toda solución tiene la forma x=p+v, donde Ap=b y Av=0.",
    "Ax=b es consistente para todo b en R^m si y solo si A tiene un pivote en cada fila.",
    "En aplicaciones se definen las variables y ecuaciones antes de reducir: conservación de átomos, ingresos=gastos o flujo entrante=saliente.",
    "Una solución algebraica puede requerir restricciones físicas adicionales, como cantidades o flujos no negativos."]
TEOREMAS["vectores"] += [
    "u+v=v+u; (u+v)+w=u+(v+w); u+0=u; u+(-u)=0.",
    "c(u+v)=cu+cv; (c+d)u=cu+du; c(du)=(cd)u; 1u=u.",
    "A(u+v)=Au+Av y A(cu)=c(Au), para u,v en R^n y A de m×n.",
    "b pertenece al generado de las columnas de A si y solo si Ax=b es consistente.",
    "Un solo vector es L.I. si es no nulo. Dos vectores son L.D. si uno es múltiplo del otro.",
    "Un conjunto de al menos dos vectores es L.D. si uno es combinación lineal de los demás."]
TEOREMAS["matrices"][7] = "Identidad rectangular: I_m A = A = A I_n, para A de m×n."
TEOREMAS["matrices"] += [
    "A+B=B+A; (A+B)+C=A+(B+C); A+0=A, cuando los tamaños coinciden.",
    "c(A+B)=cA+cB; (c+d)A=cA+dA; c(dA)=(cd)A.",
    "Sesión 10 (a): (A⁻¹)⁻¹=A, para A invertible.",
    "Sesión 10 (b): (AB)⁻¹=B⁻¹A⁻¹, para A y B invertibles del mismo orden.",
    "Sesión 10 (c): (Aᵀ)⁻¹=(A⁻¹)ᵀ, para A invertible.",
    "Matriz invertible (*c, *e, *h): A invertible ⇔ n posiciones pivote ⇔ columnas L.I. ⇔ columnas generan R^n, si A es n×n.",
    "A invertible ⇔ det(A)≠0. En ese caso A⁻¹=adj(A)/det(A) y Ax=b tiene solución única x=A⁻¹b.",
    "Para A=[[a,b],[c,d]], det(A)=ad−bc y A⁻¹=[[d,−b],[−c,a]]/(ad−bc), si ad−bc≠0.",
    "Si A se escalona sin intercambios, A=LU: L triangular inferior unitaria y U escalonada.",
    "Para resolver Ax=b con A=LU: primero Ly=b y luego Ux=y. Se comprueba L·U=A y A·x=b."]
TEOREMAS["determinantes"] += [
    "Cij=(−1)^(i+j)det(Mij). Se puede expandir por cualquier fila o columna.",
    "Sarrus se aplica solo a matrices de 3×3; cofactores se aplica a cualquier orden.",
    "Las propiedades de operaciones de fila también se aplican a columnas porque det(Aᵀ)=det(A).",
    "Una fila nula o dos filas iguales o proporcionales implican determinante cero.",
    "det(cA)=c^n det(A), para A de n×n. En general det(A+B)≠det(A)+det(B).",
    "det(A⁻¹)=1/det(A), cuando A es invertible.",
    "adj(A) es la transpuesta de la matriz de cofactores y A⁻¹=adj(A)/det(A), si det(A)≠0.",
    "Cramer: xi=det(Ai)/det(A); Ai sustituye la columna i por b. Requiere A cuadrada con det(A)≠0.",
    "En 2D, |det(A)| multiplica áreas; en 3D multiplica volúmenes. El signo indica orientación y det=0 implica colapso."]

TEOREMAS['matrices'] += [
    'Sesión 12: para A de m×n, L es m×m triangular inferior unitaria y U es m×n escalonada.',
    'Se reduce A a U solo mediante reemplazos. Los cocientes entrada/pivote se guardan en la columna de L asociada a la fila pivote.',
    'Las mismas operaciones que llevan A a U llevan L a I. Se verifica L·U=A.',
    'Para Ax=b con A=LU, se reduce [L|b] a [I|y] y después [U|y] por Gauss-Jordan.',
    'En U rectangular, una columna sin pivote da una variable libre. Se expresa x=p+t1·v1+... y se verifica Ap=b y Avj=0.',
    'Si hace falta un intercambio, el método A=LU de esta sesión se detiene. PA=LU usa permutaciones y es un método distinto.']
TEOREMAS['determinantes'] += [
    'Sesión 11: desarrollar por cualquier fila o columna. Elegir la de más ceros disminuye el trabajo.',
    'Extraer un factor d de una fila equivale a dividirla entre d: det(A)=d·det(matriz modificada).',
    'Si hay s intercambios y se extraen factores d1,...,dr, det(A)=(-1)^s·d1···dr·producto diagonal de U.',
    'Para operaciones de columna se aplican las mismas leyes que para filas, porque det(Aᵀ)=det(A).',
    'Inversa por adjunta en cuatro pasos: determinante, cofactores, transposición y multiplicación por 1/det(A).']

def obtener_teoremas(modulo):
    """Devuelve las propiedades del módulo solicitado. Recibe modulo."""

    if modulo not in TEOREMAS:
        raise ValueError(f"Módulo no reconocido: {modulo}")

    
    return TEOREMAS[modulo][:]


def mostrar_teoremas(modulo):
    """Imprime el resumen del módulo en la consola. Recibe modulo."""

    propiedades = obtener_teoremas(modulo)

    print("\n" + "=" * 60)
    print(f"TEOREMAS CLAVE: {modulo.upper()}")
    print("=" * 60)

    
    for numero, propiedad in enumerate(propiedades, start=1):
        print(f"\n{numero}. {propiedad}")

    print("\n" + "=" * 60)

    

