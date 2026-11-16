# Comprobación de la fase 02

La ejecución aplica los criterios B05–B10 del plan maestro de reestructuración guardado. Ese plan establece un recorrido completo migrado al paquete y mantiene la migración ampliada para las fases posteriores.

| Bloque | Evidencia de implementación | Evidencia automática |
| --- | --- | --- |
| B05 | domain/models.py y esquemas 1.0 | Solicitudes válidas, inválidas, opciones y errores |
| B06 | pyproject.toml, imports normales y adaptadores | Paquete aislado fuera del proyecto e imports sin mutaciones |
| B07 | parsing/numbers.py y serialización | Decimal largo, racionales, valores pequeños y Ans |
| B08 | BigInt y Exportar producto JSON | Numerador 9007199254740993 preservado en pantalla y archivo |
| B09 | algorithms/calculo.py y domains.py | Singularidades compuestas, polos, resultados exactos y aproximados |
| B10 | Producto con Step, verificación y contrato | 288 sistemas de referencia, casos del producto e interfaz real |

Se retiraron Abrir_consola.bat, Abrir_ventana.bat y el menú de terminal. La documentación actual explica el uso gráfico y el desarrollo del paquete.

La comprobación del origen sigue permitiendo recuperar el código de fase-01-base y registra las diferencias intencionales de esta fase. Las evidencias del resultado integrado se enlazan en cierre.md.
