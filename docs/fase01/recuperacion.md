# Recuperación y continuidad

Para recuperar la versión publicada, clonar https://github.com/Rolando8-03/NexoLineal.git y usar la referencia de cierre indicada en docs/fase01/cierre.md. Una rama fase-01-base fijará el commit de esa línea de partida. El identificador del commit permite recuperarla aun cuando main avance.

```sh
git clone https://github.com/Rolando8-03/NexoLineal.git
cd NexoLineal
git switch fase-01-base
git fsck --full
python -B pruebas.py -v
```

El paquete privado NexoLineal_Fase_01_62_Commits_Locales.zip entregado al propietario incluye NexoLineal con la historia local preparada, el ZIP original intacto, las evidencias y el informe local. En ese paquete, docs/origen/historial_original.bundle conserva los 21 commits originales. Puede recuperarse con git clone seguido de la ruta del bundle y el nombre de la carpeta de destino.

La historia remota recrea la incorporación con identificadores diferentes a los locales por las fechas de publicación. Los 45 archivos fuente y recursos tienen identificadores de contenido en inventario.json. Las verificaciones remotas y el cierre están en GitHub.

Para servir la aplicación recibida en desarrollo, usar python -m http.server 8000 y abrir http://localhost:8000. El navegador necesita acceso a los CDN. La fase 02 trabaja desde la línea de partida y los hallazgos documentados.
