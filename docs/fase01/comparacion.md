# Comparación con el material recibido

La comprobación local de incorporación verificó 45 archivos originales idénticos byte a byte frente a una extracción limpia del ZIP. Las dos extracciones de respaldo también coincidieron antes de usar Git. La consulta del estado Git actualiza su índice interno y no representa un cambio del código.

El inventario identifica los blobs Git de esos 45 archivos publicados. La comprobación automática de origen calcula SHA-1 sobre la representación Git de los bytes actuales y exige coincidencia con el inventario.

Los __pycache__ y archivos .pyc recibidos se excluyen por ser bytecode generado. La historia Git original se conserva en el respaldo privado. main registra la importación actual independiente solicitada.

Se agregan exclusiones, documentación de esta fase y herramientas CI de verificación. Los algoritmos, la interfaz, los recursos y los lanzadores originales conservan su contenido. Los cambios de arquitectura se planifican para la fase 02.
