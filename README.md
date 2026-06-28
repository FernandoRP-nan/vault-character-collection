# Character Collection

Plugin local de Obsidian: colección visual de **personajes** (tiers, tags, imágenes).

Reemplaza la nota DataviewJS `Waifus.md` / tarjeta Home «Colección de personajes».

## Instalación

```bash
git clone https://github.com/FernandoRP-nan/vault-character-collection.git
cd vault-character-collection
npm install && npm run build
ln -sf "$(pwd)" /ruta/vault/.obsidian/plugins/vault-character-collection
```

## Datos

| Qué | Ruta |
|-----|------|
| SQLite | `.obsidian/plugins-data/vault-character-collection/coleccion_personajes.db` |
| Imágenes | `Ajustes/Configuración.md` → `ruta_imagenes` |
| sql.js | empaquetado en `assets/` del plugin |

Migración automática desde `.obsidian/scripts/coleccion_personajes.db`.

## Uso

- Cinta lateral → 📚
- Comando → **Abrir colección de personajes**

## Desarrollo

```bash
npm run dev && npm run build
```
