# Changelog

## [2.3.0] - 2026-06-27

### Added
- Variantes por obra en búsqueda API (mismo personaje en anime, manga y juego como entradas separadas).

### Fixed
- Scroll vertical en la vista del tablero con contenedor interno dedicado.

## [2.2.0] - 2026-06-27

### Added
- Panel de ajustes para fuentes API: activar AniList, Jikan y LoL.
- Gestión de wikis MediaWiki (editar, desactivar, añadir personalizadas, restaurar defaults).

## [2.1.0] - 2026-06-27

### Added
- Soporte MediaWiki genérico (Fandom, Miraheze u otros hosts) para importación desde wikis de juegos.
- Wikis: Brown Dust 2, Epic Seven, Azur Lane, Fate/GO, Princess Connect.

### Fixed
- Scroll vertical en la vista del tablero y en listas de sugerencias del modal API.

## [2.0.0] - 2026-06-27

### Added
- Panel de ajustes del complemento: carpeta de imágenes (ya no requiere nota `Configuración.md`).
- Importación única de `ruta_imagenes` desde la nota legada si existía.

### Changed
- Migración completa a TypeScript modular.

## [1.1.0] - 2026-06-27

### Added
- sql.js empaquetado en `assets/`.
- Migración desde `.obsidian/scripts/coleccion_personajes.db`.
- Datos en `.obsidian/plugins-data/vault-character-collection/`.

### Changed
- Identificador del complemento: `vault-character-collection` (antes `vault-item-collection`).

## [1.0.0] - 2026-06-27

### Added
- Colección visual de personajes con tiers, tags e imágenes.
