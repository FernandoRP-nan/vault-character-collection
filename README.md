# Character Collection

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Complemento local para [Obsidian](https://obsidian.md) para organizar y visualizar una colección de personajes (ficticios, referencias creativas, etc.) con tiers, etiquetas, imágenes y metadatos. Los datos permanecen en tu dispositivo.

## Características

- Galería filtrable por tier.
- Campos personalizables: nombre, imagen, tags, origen, tipo.
- Rutas de imágenes configurables desde una nota de ajustes del vault.
- Almacenamiento local en SQLite.

## Requisitos

- Obsidian 1.5.0 o superior.
- Node.js 18+ (solo para compilar desde el código fuente).

## Instalación

```bash
git clone https://github.com/FernandoRP-nan/vault-character-collection.git
cd vault-character-collection
npm install && npm run build
ln -sf "$(pwd)" /ruta/a/tu/vault/.obsidian/plugins/vault-character-collection
```

Activa **Character Collection** en Ajustes → Complementos.

Releases precompilados: [GitHub Releases](https://github.com/FernandoRP-nan/vault-character-collection/releases).

## Configuración

Ajustes → Complementos → **Character Collection** → icono de engranaje.

- **Carpeta de imágenes:** ruta relativa al vault (p. ej. `Adjuntos/Personajes`).

Si antes usabas `ruta_imagenes` en `Ajustes/Configuración.md`, se importa automáticamente la primera vez.

## Datos y privacidad

- Cinta lateral → icono de biblioteca.
- Paleta de comandos → **Abrir colección de personajes**.

## Datos y privacidad

| Elemento | Ubicación |
|----------|-----------|
| Base de datos | `.obsidian/plugins-data/vault-character-collection/coleccion_personajes.db` |
| sql.js | `.obsidian/plugins/vault-character-collection/assets/` |

Migración automática desde `.obsidian/scripts/coleccion_personajes.db` si existe.

## Complementos relacionados

Parte del ecosistema **vault-***, junto a [Task Board](https://github.com/FernandoRP-nan/vault-task-board) y [Social Agenda](https://github.com/FernandoRP-nan/vault-social-agenda). Este complemento funciona de forma independiente.

## Desarrollo

```bash
npm run dev && npm run build
```

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 FernandoRP-nan.
