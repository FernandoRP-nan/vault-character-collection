# Item Collection

Plugin local de Obsidian: colección visual de ítems con tiers, tags, imágenes y metadatos.

Independiente de los otros plugins del ecosistema.

## Instalación local

1. Copia en `.obsidian/plugins/vault-item-collection/`.
2. Asegura sql.js en `.obsidian/scripts/node_modules/` (ver README de task-board).
3. Compila:

```bash
cd .obsidian/plugins/vault-item-collection
npm install
npm run build
```

4. Activa **Item Collection** en complementos.

## Configuración

Lee `ruta_imagenes` del frontmatter de `Ajustes/Configuración.md` (por defecto `Adjuntos`).

## Datos

- `.obsidian/scripts/coleccion_personajes.db`

## Desarrollo

```bash
npm run dev
npm run build
```
