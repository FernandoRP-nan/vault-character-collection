# Character Collection

Plugin local de Obsidian: colección visual de **personajes** con tiers, tags, imágenes y metadatos.

Reemplaza la antigua vista DataviewJS `Waifus.md`. Independiente de Task Board y Social Agenda.

## Instalación local

> **Importante:** desarrolla **fuera del vault**. Si el repo con `node_modules` queda dentro de la bóveda, Obsidian puede colgarse al indexar.

### 1. Clonar (fuera del vault)

```bash
git clone https://github.com/FernandoRP-nan/vault-character-collection.git
```

### 2. sql.js (una vez por vault)

Ver [vault-task-board](https://github.com/FernandoRP-nan/vault-task-board#2-sqljs-una-vez-por-vault).

### 3. Compilar

```bash
cd /ruta/a/Obsidian-Plugins/vault-character-collection
npm install
npm run build
```

### 4. Enlazar al vault

```bash
VAULT="/ruta/a/tu/vault/.obsidian/plugins"
ln -sf /ruta/a/Obsidian-Plugins/vault-character-collection "$VAULT/vault-character-collection"
```

### 5. Activar

Ajustes → Complementos → **Character Collection**.

## Uso

- Icono 📚 en la cinta lateral
- Paleta de comandos → **Abrir colección de personajes**

## Configuración

Lee `ruta_imagenes` del frontmatter de `Ajustes/Configuración.md` (por defecto `Adjuntos`).

## Datos

- `.obsidian/scripts/coleccion_personajes.db`

## Desarrollo

```bash
npm run dev
npm run build
```

## Historial de nombres

| Antes | Ahora |
|-------|-------|
| Nota `Waifus.md` (DataviewJS) | Plugin `vault-character-collection` |
| Repo `vault-item-collection` | Repo `vault-character-collection` |
