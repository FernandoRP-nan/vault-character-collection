export type WikiCategory = "juego" | "anime" | "manhwa" | "manhua";

export interface WikiSourceConfig {
    id: string;
    slug: string;
    cat: WikiCategory;
    enabled: boolean;
    host?: string;
    apiPath?: string;
    wikiPath?: string;
    origen?: string;
    custom?: boolean;
}

export interface ApiSearchSettings {
    enableAnilist: boolean;
    enableJikan: boolean;
    enableLoL: boolean;
    wikiSources: WikiSourceConfig[];
}

const wiki = (
    slug: string,
    cat: WikiCategory,
    extra: Partial<WikiSourceConfig> = {}
): WikiSourceConfig => ({
    id: slug,
    slug,
    cat,
    enabled: true,
    custom: false,
    ...extra
});

export const DEFAULT_WIKI_SOURCES: WikiSourceConfig[] = [
    wiki("zenless-zone-zero", "juego"),
    wiki("genshin-impact", "juego"),
    wiki("honkai-star-rail", "juego"),
    wiki("wuthering-waves", "juego"),
    wiki("bluearchive", "juego"),
    wiki("nikke-goddess-of-victory-international", "juego"),
    wiki("arknights", "juego"),
    wiki("persona", "juego"),
    wiki("valorant", "juego"),
    wiki("overwatch", "juego"),
    wiki("pokemon", "juego"),
    wiki("fireemblem", "juego"),
    wiki("epic-seven", "juego"),
    wiki("azur-lane", "juego"),
    wiki("fategrandorder", "juego"),
    wiki("princessconnectredive", "juego"),
    wiki("browndust2", "juego", {
        host: "browndust2.miraheze.org",
        apiPath: "w/api.php",
        origen: "Brown Dust 2"
    }),
    wiki("dr-stone", "anime"),
    wiki("onepiece", "anime"),
    wiki("naruto", "anime"),
    wiki("jujutsu-kaisen", "anime"),
    wiki("chainsaw-man", "anime"),
    wiki("bleach", "anime"),
    wiki("lycoris-recoil", "anime"),
    wiki("bug-player", "manhwa"),
    wiki("solo-leveling", "manhwa"),
    wiki("omniscient-readers-viewpoint", "manhwa"),
    wiki("tower-of-god", "manhwa"),
    wiki("eleceed", "manhwa"),
    wiki("lookism", "manhwa"),
    wiki("wind-breaker", "manhwa")
];

export const DEFAULT_API_SEARCH: ApiSearchSettings = {
    enableAnilist: true,
    enableJikan: true,
    enableLoL: true,
    wikiSources: DEFAULT_WIKI_SOURCES.map(w => ({ ...w }))
};

export const WIKI_CATEGORY_LABELS: Record<WikiCategory, string> = {
    juego: "Juego",
    anime: "Anime / Manga",
    manhwa: "Manhwa",
    manhua: "Manhua"
};

/** Fusiona ajustes guardados con wikis nuevas del complemento. */
export function normalizeApiSearchSettings(stored?: Partial<ApiSearchSettings>): ApiSearchSettings {
    if (!stored) return cloneApiSearch(DEFAULT_API_SEARCH);

    return {
        enableAnilist: stored.enableAnilist ?? DEFAULT_API_SEARCH.enableAnilist,
        enableJikan: stored.enableJikan ?? DEFAULT_API_SEARCH.enableJikan,
        enableLoL: stored.enableLoL ?? DEFAULT_API_SEARCH.enableLoL,
        wikiSources: mergeWikiSources(stored.wikiSources)
    };
}

function mergeWikiSources(stored?: WikiSourceConfig[]): WikiSourceConfig[] {
    const guardados = stored ?? [];
    const mapa = new Map(guardados.map(w => [w.id, w]));
    const fusionadas = DEFAULT_WIKI_SOURCES.map(def => {
        const prev = mapa.get(def.id);
        if (!prev) return { ...def };
        return {
            ...def,
            enabled: prev.enabled ?? def.enabled,
            host: prev.host ?? def.host,
            apiPath: prev.apiPath ?? def.apiPath,
            wikiPath: prev.wikiPath ?? def.wikiPath,
            origen: prev.origen ?? def.origen,
            custom: false
        };
    });
    const idsDefecto = new Set(DEFAULT_WIKI_SOURCES.map(w => w.id));
    const personalizadas = guardados.filter(w => w.custom && !idsDefecto.has(w.id));
    return [...fusionadas, ...personalizadas.map(w => ({ ...w, custom: true }))];
}

export function cloneApiSearch(src: ApiSearchSettings): ApiSearchSettings {
    return {
        enableAnilist: src.enableAnilist,
        enableJikan: src.enableJikan,
        enableLoL: src.enableLoL,
        wikiSources: src.wikiSources.map(w => ({ ...w }))
    };
}

export function wikiDisplayName(w: WikiSourceConfig): string {
    if (w.origen?.trim()) return w.origen.trim();
    return w.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export function createCustomWiki(partial: Partial<WikiSourceConfig> = {}): WikiSourceConfig {
    const slug = (partial.slug || "mi-wiki").trim().toLowerCase().replace(/\s+/g, "-");
    return {
        id: `custom-${Date.now()}`,
        slug,
        cat: partial.cat ?? "juego",
        enabled: true,
        host: partial.host?.trim() || undefined,
        apiPath: partial.apiPath?.trim() || undefined,
        wikiPath: partial.wikiPath?.trim() || undefined,
        origen: partial.origen?.trim() || undefined,
        custom: true
    };
}
