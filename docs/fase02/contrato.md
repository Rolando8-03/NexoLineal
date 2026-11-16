# Contrato 1.0 del núcleo

Cada solicitud contiene schema_version, operation_id, input y options opcional. Los campos desconocidos producen invalid_input. Las entradas matemáticas exactas se envían como cadenas, por ejemplo "0.1", "1/3" y "9007199254740993/2".

## Operaciones disponibles

| operation_id | Datos requeridos | Datos opcionales |
| --- | --- | --- |
| matrices.producto | A y B como matrices de textos o texto por filas | options.include_steps booleano |
| calculadora.evaluar | expresion | ans y grados booleano |
| calculo.definida | expresion, inferior y superior | include_steps conserva la forma común de opciones |
| calculo.derivar | expresion | punto |

Ejemplo ejecutable después de instalar el paquete

```python
from nexolineal.application.service import execute

resultado = execute({
    "schema_version": "1.0",
    "operation_id": "matrices.producto",
    "input": {"A": [["1/2", "2"]], "B": [["2"], ["3"]]}
})
assert resultado["result"]["matrix"] == [["7"]]
```

La respuesta contiene schema_version, operation_id, input, status, result, steps, verification, warnings, metadata y error. Un fallo conserva el sobre y devuelve error.code y error.message.

Los estados admitidos por el esquema incluyen ok, invalid_input, domain_error, limit_reached, singular, inconsistent, infinite, not_applicable, cancelled, non_convergent e internal_error. El catálogo de esta fase produce ok, invalid_input, domain_error, limit_reached y non_convergent. Los otros estados quedan definidos para incorporar los recorridos correspondientes.

## Números, pasos y comprobaciones

Los racionales se serializan como texto de Fraction. Los índices administrativos siguen siendo enteros y comienzan en cero. Los resultados aproximados declaran exactitud y precision_bits. Los flotantes finitos se representan con su texto sin sustituir silenciosamente magnitudes pequeñas por cero.

Cada Step contiene id, kind, description, data y formula. En el producto fila-columna, data registra fila, columna, factores, productos parciales y total. verification.kind identifica una comprobación de consistencia de esos pasos. La referencia matemática independiente se ejecuta por separado en las pruebas.

El parser limita el texto numérico a 1000 caracteres y el exponente decimal a valor absoluto 1000. El producto del catálogo admite hasta 250000 términos. La representación racional del contrato tiene un presupuesto de 12000 bits por numerador o denominador. Esos límites generan errores explícitos.
