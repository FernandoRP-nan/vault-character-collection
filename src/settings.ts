import {
    DEFAULT_API_SEARCH,
    normalizeApiSearchSettings,
    type ApiSearchSettings
} from "./api-search-settings";

export interface CharacterCollectionSettings {
    imageFolderPath: string;
    apiSearch: ApiSearchSettings;
}

export const DEFAULT_SETTINGS: CharacterCollectionSettings = {
    imageFolderPath: "Adjuntos",
    apiSearch: { ...DEFAULT_API_SEARCH, wikiSources: DEFAULT_API_SEARCH.wikiSources.map(w => ({ ...w })) }
};

export const LEGACY_CONFIG_PATH = "Ajustes/Configuración.md";

export { normalizeApiSearchSettings, type ApiSearchSettings };
