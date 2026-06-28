/* coleccion_api.ts — migrado a módulo TS */
// @ts-nocheck
import {
    DEFAULT_API_SEARCH,
    type ApiSearchSettings
} from "../api-search-settings";

export const ColeccionAPI = {

    _searchConfig: null,

    configureSearch: (config) => {
        ColeccionAPI._searchConfig = config;
    },

    _getSearchConfig: () => ColeccionAPI._searchConfig || DEFAULT_API_SEARCH,

    _getWikisActivas: () =>
        ColeccionAPI._getSearchConfig().wikiSources.filter(w => w.enabled),

    _cacheLoL: null,

    _normalizarNombre: (nombre) =>
        String(nombre).toLowerCase().trim().replace(/[^a-z0-9áéíóúñ]/gi, ""),

    _puntuarCoincidencia: (query, nombre) => {
        const q = query.toLowerCase().trim();
        const t = String(nombre).toLowerCase().trim();
        if (!q || !t) return 0;
        if (t === q) return 100;
        const palabras = q.split(/\s+/).filter(Boolean);
        if (palabras.length > 1 && palabras.every(p => t.includes(p))) return 90;
        if (t.includes(q) || q.includes(t)) return 70;
        if (palabras.some(p => t.includes(p))) return 40;
        return 0;
    },

    _nombreWikiDesdeSlug: (slug) =>
        slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),

    _baseWikiApi: (wiki) => {
        const host = wiki.host || `${wiki.slug}.fandom.com`;
        const apiPath = wiki.apiPath || "api.php";
        return `https://${host}/${apiPath}`;
    },

    _urlWikiPagina: (wiki, titulo) => {
        const host = wiki.host || `${wiki.slug}.fandom.com`;
        const wikiPath = wiki.wikiPath || "wiki";
        return `https://${host}/${wikiPath}/${encodeURIComponent(titulo.replace(/ /g, "_"))}`;
    },

    _origenWiki: (wiki) =>
        wiki.origen || ColeccionAPI._nombreWikiDesdeSlug(wiki.slug),

    // Variantes de búsqueda: "Granadair Brown Dust" también prueba solo "Granadair"
    _terminosBusquedaWiki: (query) => {
        const q = query.trim();
        const palabras = q.split(/\s+/).filter(Boolean);
        const terminos = new Set([q]);
        if (palabras.length > 1) {
            terminos.add(palabras[0]);
            const masLargo = palabras.reduce((a, b) => (a.length >= b.length ? a : b));
            terminos.add(masLargo);
        }
        return [...terminos];
    },

    _umbralRelevanciaWiki: (query, titulo, wiki) => {
        const t = titulo.toLowerCase();
        const palabras = query.trim().split(/\s+/).filter(Boolean);
        if (palabras.some(p => p.toLowerCase() === t)) return 40;
        const origen = ColeccionAPI._origenWiki(wiki).toLowerCase();
        if (origen && query.toLowerCase().includes(origen)) return 40;
        return wiki.cat === "manhwa" ? 40 : 50;
    },

    _etiquetaMedioAniList: (media) => {
        if (!media) return { origen: "Desconocido", categoriaMedio: "anime" };
        const origen = media.title?.userPreferred || media.title?.romaji || media.title?.english || "Desconocido";
        if (media.type === "ANIME") return { origen, categoriaMedio: "anime" };
        if (media.format === "MANHWA" || media.countryOfOrigin === "KR") return { origen, categoriaMedio: "manhwa" };
        if (media.format === "MANHUA" || media.countryOfOrigin === "CN") return { origen, categoriaMedio: "manhua" };
        return { origen, categoriaMedio: "manga" };
    },

    // Prioriza la obra original (MAIN + anime/manga) frente a colaboraciones en juegos
    _seleccionarMedioAniList: (mediaConnection) => {
        if (!mediaConnection) return null;
        let entries = [];
        if (mediaConnection.edges?.length) {
            entries = mediaConnection.edges.map(e => ({
                characterRole: e.characterRole,
                title: e.node?.title,
                type: e.node?.type,
                format: e.node?.format,
                countryOfOrigin: e.node?.countryOfOrigin
            }));
        } else if (Array.isArray(mediaConnection)) {
            entries = mediaConnection;
        } else if (mediaConnection.nodes?.length) {
            entries = mediaConnection.nodes;
        }
        if (!entries.length) return null;
        const ordenTipo = { ANIME: 0, MANGA: 1 };
        const puntajeMedio = (m) => {
            let p = ordenTipo[m.type] ?? 5;
            if (m.characterRole === "MAIN") p -= 3;
            else if (m.characterRole === "SUPPORTING") p -= 1;
            return p;
        };
        return [...entries].sort((a, b) => puntajeMedio(a) - puntajeMedio(b))[0];
    },

    // Fuentes canónicas (anime/manga) deben ganar a wikis de juegos con el mismo nombre
    _rankFuenteCanonica: (item) => {
        if (item.tipoFuente === "anilist") return 4;
        if (item.tipoFuente === "anime") return 3;
        if (["anime", "manga", "manhwa", "manhua"].includes(item.categoriaMedio)) return 2;
        return 0;
    },

    _extraerOrigenJikan: (datos) => {
        if (!datos) return null;
        if (Array.isArray(datos.anime) && datos.anime.length > 0) {
            const main = datos.anime.find(i => i.role === "Main") || datos.anime[0];
            if (main?.anime?.title) return { origen: main.anime.title, categoriaMedio: "anime" };
        }
        if (Array.isArray(datos.manga) && datos.manga.length > 0) {
            const main = datos.manga.find(i => i.role === "Main") || datos.manga[0];
            if (main?.manga?.title) return { origen: main.manga.title, categoriaMedio: "manga" };
        }
        return null;
    },

    _enriquecerOriginesJikan: async (requestUrl, items) => {
        const pendientes = items.filter(i => i.tipoFuente === "anime" && i.idExterno).slice(0, 8);
        await Promise.all(pendientes.map(async (item) => {
            try {
                const res = await requestUrl({
                    url: `https://api.jikan.moe/v4/characters/${item.idExterno}/full`,
                    method: "GET"
                });
                const info = ColeccionAPI._extraerOrigenJikan(res?.json?.data);
                if (info) {
                    item.origen = info.origen;
                    item.categoriaMedio = info.categoriaMedio;
                } else if (!item.origen || item.origen === "Cargando obra precisa...") {
                    item.origen = "Sin obra registrada";
                }
            } catch (e) {
                if (!item.origen || item.origen === "Cargando obra precisa...") {
                    item.origen = "Sin obra registrada";
                }
            }
        }));
    },

    _enriquecerOriginesAnilist: async (requestUrl, items) => {
        const pendientes = items.filter(i =>
            i.tipoFuente === "anilist" && i.idExterno && (!i.origen || i.origen === "Desconocido")
        ).slice(0, 6);
        await Promise.all(pendientes.map(async (item) => {
            try {
                const query = `query ($id: Int) {
                    Character(id: $id) {
                        media(perPage: 8) {
                            edges {
                                characterRole
                                node {
                                    title { romaji english userPreferred }
                                    type format countryOfOrigin
                                }
                            }
                        }
                    }
                }`;
                const res = await requestUrl({
                    url: "https://graphql.anilist.co",
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ query, variables: { id: item.idExterno } })
                });
                const media = ColeccionAPI._seleccionarMedioAniList(
                    res?.json?.data?.Character?.media
                );
                if (media) {
                    const { origen, categoriaMedio } = ColeccionAPI._etiquetaMedioAniList(media);
                    item.origen = origen;
                    item.categoriaMedio = categoriaMedio;
                }
            } catch (e) { /* ignorar fallo puntual */ }
        }));
    },

    _procesarJikan: (res, query) => {
        if (!res || res.status !== 200 || !res.json?.data) return [];
        const items = res.json.data.map(p => ({
            idExterno: p.mal_id,
            nombre: p.name || "Sin nombre",
            origen: "Cargando obra precisa...",
            urlImagen: p.images?.jpg?.image_url || p.images?.webp?.image_url || "",
            tipoFuente: "anime",
            categoriaMedio: "anime",
            prioridad: 4,
            relevancia: ColeccionAPI._puntuarCoincidencia(query, p.name)
        }));
        const filtrados = items.filter(i => i.relevancia >= 40);
        return (filtrados.length ? filtrados : items).sort((a, b) => b.relevancia - a.relevancia);
    },

    _procesarAniList: (res, query) => {
        if (!res || res.status !== 200 || !res.json?.data?.Page?.characters) return [];
        return res.json.data.Page.characters.map(c => {
            const nombre = c.name?.userPreferred || c.name?.full || "Sin nombre";
            const media = ColeccionAPI._seleccionarMedioAniList(c.media);
            const { origen, categoriaMedio } = ColeccionAPI._etiquetaMedioAniList(media);
            return {
                idExterno: c.id,
                nombre,
                origen,
                urlImagen: c.image?.large || c.image?.medium || "",
                tipoFuente: "anilist",
                categoriaMedio,
                prioridad: 5,
                relevancia: ColeccionAPI._puntuarCoincidencia(query, nombre)
            };
        });
    },

    _buscarLoL: async (requestUrl, query) => {
        try {
            if (!ColeccionAPI._cacheLoL) {
                const verRes = await requestUrl({ url: "https://ddragon.leagueoflegends.com/api/versions.json", method: "GET" });
                const version = verRes.json[0];
                const champRes = await requestUrl({
                    url: `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
                    method: "GET"
                });
                ColeccionAPI._cacheLoL = { version, data: champRes.json.data };
            }
            const { version, data } = ColeccionAPI._cacheLoL;
            const q = query.toLowerCase().trim();
            return Object.values(data)
                .filter(c => {
                    const n = c.name.toLowerCase();
                    const id = c.id.toLowerCase();
                    return n.includes(q) || id.includes(q) || q.includes(n);
                })
                .map(c => ({
                    idExterno: `lol:${c.key}`,
                    nombre: c.name,
                    origen: "League of Legends",
                    urlImagen: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`,
                    tipoFuente: "juego",
                    categoriaMedio: "juego",
                    prioridad: 1,
                    relevancia: ColeccionAPI._puntuarCoincidencia(query, c.name)
                }));
        } catch (e) {
            return [];
        }
    },

    _buscarEnWiki: async (requestUrl, wiki, query) => {
        try {
            const base = ColeccionAPI._baseWikiApi(wiki);
            const consultas = ColeccionAPI._terminosBusquedaWiki(query);

            const hitsMap = new Map();
            for (const termino of consultas) {
                const searchRes = await requestUrl({
                    url: `${base}?action=query&list=search&srsearch=${encodeURIComponent(termino)}&srlimit=6&format=json`,
                    method: "GET"
                });
                (searchRes?.json?.query?.search || []).forEach(h => {
                    if (h.ns !== 0 || h.title.includes("/")) return;
                    if (h.title.includes("Chapter ") || h.title.includes("Episode ")) return;
                    const relevancia = ColeccionAPI._puntuarCoincidencia(query, h.title);
                    const umbral = ColeccionAPI._umbralRelevanciaWiki(query, h.title, wiki);
                    if (relevancia < umbral) return;
                    const prev = hitsMap.get(h.title);
                    if (!prev || relevancia > prev.relevancia) hitsMap.set(h.title, { ...h, relevancia });
                });
            }

            const hits = Array.from(hitsMap.values())
                .sort((a, b) => b.relevancia - a.relevancia)
                .slice(0, 2);

            if (!hits.length) return [];

            const titulos = hits.map(h => h.title).join("|");
            const imgRes = await requestUrl({
                url: `${base}?action=query&prop=pageimages&titles=${encodeURIComponent(titulos)}&pithumbsize=500&format=json`,
                method: "GET"
            });
            const paginas = imgRes?.json?.query?.pages || {};

            return hits.map(h => {
                const pagina = Object.values(paginas).find(p => p.title === h.title);
                return {
                    idExterno: ColeccionAPI._urlWikiPagina(wiki, h.title),
                    nombre: h.title,
                    origen: ColeccionAPI._origenWiki(wiki),
                    urlImagen: pagina?.thumbnail?.source || "",
                    tipoFuente: "wiki",
                    categoriaMedio: wiki.cat,
                    prioridad: wiki.cat === "juego" ? 1 : 2,
                    relevancia: h.relevancia || ColeccionAPI._puntuarCoincidencia(query, h.title)
                };
            });
        } catch (e) {
            return [];
        }
    },

    _finalizarResultados: (lista, query) => {
        const mapa = new Map();
        lista.forEach(item => {
            const puntaje = (item.relevancia || ColeccionAPI._puntuarCoincidencia(query, item.nombre))
                + (item.prioridad || 0) * 4
                + (item.urlImagen ? 6 : 0)
                + (item.origen && item.origen !== "Cargando obra precisa..." && item.origen !== "Sin obra registrada" ? 3 : 0)
                + ColeccionAPI._rankFuenteCanonica(item) * 12;
            const clave = ColeccionAPI._normalizarNombre(item.nombre);
            if (!clave) return;
            const prev = mapa.get(clave);
            const rankNuevo = ColeccionAPI._rankFuenteCanonica(item);
            const rankPrev = prev ? ColeccionAPI._rankFuenteCanonica(prev) : -1;
            const reemplazar = !prev
                || rankNuevo > rankPrev
                || (rankNuevo === rankPrev && puntaje > prev._puntaje);
            if (reemplazar) mapa.set(clave, { ...item, _puntaje: puntaje });
        });
        return Array.from(mapa.values())
            .sort((a, b) => b._puntaje - a._puntaje)
            .slice(0, 24)
            .map(({ _puntaje, relevancia, prioridad, ...rest }) => rest);
    },

    buscarPersonajeEnRed: async (nombreQuery) => {
        try {
            const { requestUrl } = require('obsidian');
            const cfg = ColeccionAPI._getSearchConfig();
            const q = nombreQuery.trim();
            if (q.length < 2) return [];
            const qEscaped = encodeURIComponent(q);

            const queryAniList = `query ($search: String) {
                Page(page: 1, perPage: 10) {
                    characters(search: $search, sort: SEARCH_MATCH) {
                        id
                        name { full userPreferred }
                        image { large medium }
                        media(perPage: 8) {
                            edges {
                                characterRole
                                node {
                                    title { romaji english userPreferred }
                                    type format countryOfOrigin
                                }
                            }
                        }
                    }
                }
            }`;

            const peticiones = [];

            if (cfg.enableJikan) {
                peticiones.push(
                    requestUrl({ url: `https://api.jikan.moe/v4/characters?q=${qEscaped}&limit=10`, method: "GET" }).catch(() => null)
                );
            } else {
                peticiones.push(Promise.resolve(null));
            }

            if (cfg.enableAnilist) {
                peticiones.push(
                    requestUrl({
                        url: "https://graphql.anilist.co",
                        method: "POST",
                        headers: { "Content-Type": "application/json", Accept: "application/json" },
                        body: JSON.stringify({ query: queryAniList, variables: { search: q } })
                    }).catch(() => null)
                );
            } else {
                peticiones.push(Promise.resolve(null));
            }

            if (cfg.enableLoL) {
                peticiones.push(ColeccionAPI._buscarLoL(requestUrl, q));
            } else {
                peticiones.push(Promise.resolve([]));
            }

            peticiones.push(
                ...ColeccionAPI._getWikisActivas().map(w => ColeccionAPI._buscarEnWiki(requestUrl, w, q))
            );

            const resultados = await Promise.all(peticiones);
            const wikisCount = ColeccionAPI._getWikisActivas().length;
            const resJikan = cfg.enableJikan ? resultados[0] : null;
            const resAnilist = cfg.enableAnilist ? resultados[1] : null;
            const resLol = cfg.enableLoL ? resultados[2] : [];
            const resWikis = resultados.slice(3, 3 + wikisCount);

            const unificados = [
                ...ColeccionAPI._procesarAniList(resAnilist, q),
                ...ColeccionAPI._procesarJikan(resJikan, q),
                ...(Array.isArray(resLol) ? resLol : []),
                ...resWikis.flat()
            ];

            const jikanItems = unificados.filter(i => i.tipoFuente === "anime");
            const anilistItems = unificados.filter(i => i.tipoFuente === "anilist");
            await Promise.all([
                ColeccionAPI._enriquecerOriginesJikan(requestUrl, jikanItems),
                ColeccionAPI._enriquecerOriginesAnilist(requestUrl, anilistItems)
            ]);

            return ColeccionAPI._finalizarResultados(unificados, q);
        } catch (error) {
            console.error("Error en búsqueda multi-api:", error);
            return [];
        }
    },

    obtenerOrigenPreciso: async (idExterno, tipoFuente, origenSugerido) => {
        if (tipoFuente === "juego" || tipoFuente === "wiki" || tipoFuente === "anilist") {
            return origenSugerido || (tipoFuente === "juego" ? "Videojuego" : "Desconocido");
        }
        if (origenSugerido && origenSugerido !== "Cargando obra precisa..." && origenSugerido !== "Sin obra registrada") {
            return origenSugerido;
        }
        try {
            const { requestUrl } = require('obsidian');
            const response = await requestUrl({
                url: `https://api.jikan.moe/v4/characters/${idExterno}/full`,
                method: "GET"
            });
            const info = ColeccionAPI._extraerOrigenJikan(response?.json?.data);
            return info?.origen || origenSugerido || "Desconocido";
        } catch (error) {
            return origenSugerido || "Desconocido";
        }
    },

    descargarImagenABoveda: async (app, urlInternet, rutaCarpetaDestino, nombrePersonaje) => {
        try {
            const { requestUrl } = require('obsidian');
            if (!urlInternet) return "";
            const nombreArchivoLimpio = `${nombrePersonaje.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
            const rutaCompletaVault = `${rutaCarpetaDestino}/${nombreArchivoLimpio}`;
            if (!app.vault.getAbstractFileByPath(rutaCarpetaDestino)) {
                await app.vault.createFolder(rutaCarpetaDestino);
            }
            const response = await requestUrl({ url: urlInternet, method: "GET" });
            if (response.status === 200) {
                const archivoExistente = app.vault.getAbstractFileByPath(rutaCompletaVault);
                if (archivoExistente) await app.vault.modifyBinary(archivoExistente, response.arrayBuffer);
                else await app.vault.createBinary(rutaCompletaVault, response.arrayBuffer);
                return nombreArchivoLimpio;
            }
            return "";
        } catch (error) {
            console.error("Error descargando imagen:", error);
            return "";
        }
    }
};
