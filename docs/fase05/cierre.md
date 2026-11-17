# Cierre de fase 05 — Métodos numéricos y herramientas

Fecha local de verificación: 16 de noviembre de 2026 (America/Managua).

**B27–B34 están terminados en el alcance del plan recibido.** La versión 0.5.0 incorpora 12 operaciones y conserva las 44 anteriores: **56 operaciones** en el catálogo compartido de web, Windows y Android. Los modos Serio y Explorador ofrecen las mismas capacidades. El usuario final utiliza la interfaz gráfica.

## Bloques cerrados

| Bloque | Resultado | Registro |
| --- | --- | --- |
| B27 | Parser seguro, evaluaciones protegidas, dominio y datos mínimos | [B27](../progreso/B27.md) |
| B28 | Bisección, raíces en extremos, tabla, criterio y cota coherente | [B28](../progreso/B28.md) |
| B29 | Falsa posición clásica, límite, punto interior y estancamiento | [B29](../progreso/B29.md) |
| B30 | Newton con derivada declarada, dominio, derivada nula y ciclo | [B30](../progreso/B30.md) |
| B31 | Secante, dos semillas, denominador y terminaciones diferenciadas | [B31](../progreso/B31.md) |
| B32 | Jacobi/Gauss-Seidel, inicial inferida, normas, residual y cotas condicionadas | [B32](../progreso/B32.md) |
| B33 | Errores con referencia apropiada; conversión posicional e inversa | [B33](../progreso/B33.md) |
| B34 | Conjuntos con universo, primitivas admitidas y Simpson refinado | [B34](../progreso/B34.md) |

Los criterios, entradas, valores predeterminados y límites se detallan en [contrato.md](contrato.md). El [catálogo](cobertura.md) identifica cada operación. El [plan original](plan.md) se conserva con sus ventanas orientativas; no se presenta como registro de 40 horas efectivamente transcurridas.

## Pruebas ejecutadas

- **122 pruebas unittest**: 29 originales y 93 del núcleo/plataformas, incluidas 22 nuevas de fase 05.
- **6473 comprobaciones nuevas** en **339 solicitudes** a las 12 operaciones, contrastadas con SymPy 1.14.0 y reconstrucciones independientes.
- Auditorías conservadas: 288 sistemas/1572 comprobaciones y 2376 solicitudes/12633 comprobaciones de álgebra lineal, aprobadas.
- Los 56 ejemplos cumplen los esquemas de solicitud y respuesta.
- Web: **113 contratos completos** en Worker real, **56 formularios en cada modo** (112 recorridos), tabla paginada, página/expresión conservadas al cambiar modo, móvil sin desbordamiento, exportación, fracciones grandes, cancelación y recuperación. Informe de 119 casos.
- Windows: **117 casos desde Python y otros 117 desde el EXE**, con producto, sistema rectangular y bisección mediante formularios, 113 contratos y cancelación/recuperación. El EXE tiene subsistema gráfico PE=2 y cierra correctamente.
- Android: **117 casos del APK instalado sin conexión** en emulador API 35/x86_64; paquete con Python también para ARM64.
- **Paridad completa** de las 113 respuestas JSON y de los hashes de los **46 archivos Python** usados en las tres compilaciones.
- Interfaz anterior: 11 recorridos gráficos aprobados.
- Compilación TypeScript/Vite y auditoría npm aprobadas; cero vulnerabilidades en el árbol fijado.

Las pruebas incluyen discontinuidades, denominadores problemáticos, error relativo indefinido, falta de dominancia sin falso diagnóstico, ciclo de Newton, precisión agotada y subdesbordamiento. El decimal mostrado incluye su redondeo en la cota cuando existe una cota garantizada. Los residuos grandes de conversiones se transportan como texto; una regresión protege su exactitud frente al límite entero de JavaScript.

El código verificado es **89f4bdf72011c80e322f426f545efbd5c38e01d3**. Los cambios de cierre posteriores son documentación. Los informes permanentes, versiones, hashes y artefactos se conservan en [evidencias.json](evidencias.json); los comandos de reproducción están en [verificacion.md](verificacion.md).

[Plataformas y paridad aprobadas](https://github.com/Rolando8-03/NexoLineal/actions/runs/44013863774) · [Núcleo aprobado](https://github.com/Rolando8-03/NexoLineal/actions/runs/44013863790) · [Regresiones e interfaz anterior aprobadas](https://github.com/Rolando8-03/NexoLineal/actions/runs/44013863957)

Una ejecución anterior detectó una etiqueta duplicada en TypeScript. Se corrigió en 368ffdb8e52c4f3835154d629febaa2df04dbeb4. La ejecución citada arriba verifica esa corrección y el ajuste posterior de precisión; el fallo anterior no se presenta como una ejecución aprobada.

## Artefactos revisables

| Artefacto | Contenido | Descarga |
| --- | --- | --- |
| fase03-web | Web 0.5.0 con Python y recursos incluidos, informes y capturas numéricas | [ZIP web](https://github.com/Rolando8-03/NexoLineal/actions/runs/44013863774/artifacts/14298345507) |
| fase03-windows | NexoLineal-Prototipo.exe e informes de ambos recorridos | [ZIP Windows](https://github.com/Rolando8-03/NexoLineal/actions/runs/44013863774/artifacts/14298260695) |
| fase03-android | app-debug.apk, informe offline y captura | [ZIP Android](https://github.com/Rolando8-03/NexoLineal/actions/runs/44013863774/artifacts/14298156850) |
| fase03-paridad | Comparación conjunta de 113 contratos y 46 fuentes | [Informe](https://github.com/Rolando8-03/NexoLineal/actions/runs/44013863774/artifacts/14297723560) |

Los nombres fase03-* corresponden a la infraestructura reutilizada y no identifican una compilación antigua. Estos enlaces están asociados al SHA de fase 05 indicado. Los ZIP conservan su SHA-256 en evidencias.json y caducan a los 30 días; las instrucciones permiten regenerarlos.

## Límites y continuidad

No quedan pendientes de B27–B34. Las cotas se limitan a las hipótesis justificadas: polinomios racionales e intervalos conservados, o contracción exacta de sistemas. Un residual no es error verdadero; una estimación de Simpson para una función general no es garantía. La precisión decimal de trabajo no equivale a cifras correctas certificadas. Las baterías finitas y la ventana de ocho iterados para detectar ciclos no demuestran convergencia o divergencia global.

[Punto fijo, SOR, falsa posición modificada, raíces múltiples, Bairstow, integración adicional, ajuste e interpolación](ampliaciones.md) conservan especificación y bloques propios, sin declararse terminados. También se conservan las ampliaciones de fase 04.

Este cierre permite comenzar fase 06; no la ejecuta automáticamente. La experiencia visual completa y el historial pertenecen a esa fase. Instalador Windows, firma permanente del APK, actualizaciones y validación física siguen en fase 08. Las comprobaciones actuales acreditan Chromium, Windows Server 2022/WebView2 y Android 15 emulado, con bibliotecas ARM64 incluidas; no acreditan un teléfono físico ni Windows 11.

La fase se publica mediante commits reales con la autoría del propietario y sin coautoría del asistente. El historial conserva las atribuciones recibidas y fechas reales. La rama fase-05-numericos se integra en main y fase-05-base conserva el cierre; las ramas de fases anteriores permanecen disponibles.
