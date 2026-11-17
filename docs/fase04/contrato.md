# Entradas, resultados y convenciones

## Solicitudes

```json
{"schema_version":"1.0","operation_id":"sistemas.resolver","input":{"A":"1 2 3;2 4 6","b":"1 2","metodo":"gauss_jordan"}}
```

El resultado es infinite y contiene xp=(1,0,0), direcciones (-2,1,0) y (-3,0,1), parámetros t1,t2 y la familia x=xp+t1 v1+t2 v2. La comprobación aplica A original a xp y a cada dirección. El esquema de solicitud está en packages/contracts/problem.schema.json y el de respuesta en result.schema.json. El ejemplo ejecutable de cada operación está en tests/fixtures/fase04_defaults.json.

- Una matriz se recibe como filas separadas por salto de línea o punto y coma; componentes separadas por espacios. También admite listas anidadas JSON.
- Un vector se recibe como componentes separadas por espacios o lista JSON.
- Una familia contiene **un vector por fila**. Internamente se forma una matriz de columnas para resolver combinaciones. [] representa la familia vacía. Su dimensión ambiente se infiere de otra entrada o se solicita cuando todas las familias están vacías.
- Una base se valida antes de calcular coordenadas. Las coordenadas admiten bases de subespacios propios si el vector pertenece al generado.
- Los números viajan como texto: "1/3", "0.25", "9007199254740993/2". Las dimensiones, índices y contadores son enteros administrativos. No se convierte una magnitud matemática a Number de JavaScript.
- El catálogo administrativo catalogo.operaciones devuelve títulos, categorías y campos; no cuenta como una operación matemática adicional.
- Los índices de la API y Step comienzan en cero. La interfaz muestra filas, columnas y variables desde uno. Los cortes de bloques son posiciones después de las cuales se separa: [1,3] deja grupos de tamaños 1,2 y el resto; deben ser crecientes, únicos e interiores.

## Estados

| Estado | Significado en álgebra lineal |
| --- | --- |
| ok | Método realizado y comprobado; un booleano falso puede ser un resultado válido |
| infinite | Sistema compatible con variables libres; contiene particular y direcciones |
| inconsistent | Sistema incompatible; contiene certificado y no ofrece solución particular |
| singular | No existe la inversa solicitada |
| not_applicable | Datos válidos para los que el método elegido no se aplica: Sarrus 2×2, Cramer singular, LU que requiere permutar, base inválida o vector fuera del subespacio |
| invalid_input | Datos mal formados, campos no admitidos, dimensiones incompatibles o índices inválidos |
| limit_reached | Se excedió un presupuesto del motor |
| cancelled | El usuario canceló; no se publica un resultado parcial como completo |
| internal_error | Fallo interno o comprobación fallida; no se presenta como resultado correcto |

Los resultados infinite e inconsistent se muestran con sus datos y comprobaciones. Un es_base=false o pertenece=false con status=ok significa que se respondió correctamente a esa pregunta. verification.passed verifica la respuesta, no fuerza que la respuesta sea afirmativa.

## Convenciones matemáticas

- Reducción: EA=R. Las instantáneas de operaciones elementales permiten reconstruir R. El pivote de la columna aumentada no cuenta como pivote de A.
- Incompatibilidad: yᵀA=0 y yᵀb≠0. PLU transporta su certificado hasta las entradas originales.
- PLU: **PA=LU**. L es m×m unitaria inferior, P es m×m y U es m×n escalonada. Los intercambios posteriores actualizan únicamente las columnas ya calculadas de L. LU docente usa P=I y rechaza los casos que requieren intercambio.
- Espacios fundamentales: las columnas base se extraen de A original, las filas base son las filas no nulas de RREF y la base del núcleo incluye todas las variables libres. Rango+nulidad=n.
- Cambio de base: **[v]destino=P[v]origen**; si S y T contienen las bases de origen y destino como columnas, TP=S. Ambas bases deben generar el mismo subespacio.
- Composición: AB representa T∘S: primero B, después A.
- Matriz desde imágenes: AB=Y, A=YB⁻¹; B es una base completa del dominio y Y contiene sus imágenes como columnas.
- Representación en bases: M=C⁻¹AB, de modo que [T(v)]C=M[v]B; se verifica CM=AB.
- Los datos admitidos son racionales exactos. La norma puede devolver sqrt(q) simbólico cuando no es racional. No se aceptan coeficientes complejos ni simbólicos generales en esta fase.
- Las matrices definen aplicaciones lineales y las familias finitas definen espacios generados. No se ofrece una supuesta prueba de linealidad para funciones arbitrarias ni de subespacio para ecuaciones generales mediante unos pocos ejemplos.
- AB=BA y det(A+B)=det(A)+det(B) son comparaciones del caso ingresado, identificadas expresamente como relaciones que no son leyes generales.

## Límites reales

Las operaciones lineales nuevas admiten hasta 20 filas, columnas, componentes y vectores por familia. El producto preexistente mantiene su presupuesto propio. Cofactores y adjugata se limitan a orden 6; Sarrus a 3×3; potencias a enteros entre −100 y 100. A⁰=I incluso si A es singular; exponentes negativos requieren inversa.

Context controla 250000 unidades de trabajo registradas y 1200 pasos por recorrido, además de checkpoints de cancelación. Algunos cálculos auxiliares usan un contexto separado; este contador no pretende medir cada instrucción de CPU. Los racionales se limitan a 12000 bits por numerador o denominador; el parser admite hasta 1000 caracteres por número y exponente decimal absoluto de 1000. Una entrada dentro del tamaño máximo puede alcanzar otro presupuesto y devolver limit_reached.

include_steps=false evita almacenar el procedimiento, conserva resultado y verificación. El progreso no retrocede durante subcálculos. La fase 04 no cambia los límites y la cancelación interna de los tres casos de cálculo heredados.
