import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type CharacterCollectionPlugin from "./main";
import { ColeccionAPI } from "./lib/coleccion_api";
import {
    cloneApiSearch,
    createCustomWiki,
    DEFAULT_API_SEARCH,
    normalizeApiSearchSettings,
    WIKI_CATEGORY_LABELS,
    wikiDisplayName,
    type ApiSearchSettings,
    type WikiSourceConfig
} from "./api-search-settings";
import { WikiSettingsModal } from "./wiki-settings-modal";

export class CharacterCollectionSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: CharacterCollectionPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Character Collection" });

        new Setting(containerEl)
            .setName("Carpeta de imágenes")
            .setDesc("Ruta relativa al vault donde se buscan y guardan las imágenes de personajes.")
            .addText(text =>
                text
                    .setPlaceholder("Adjuntos")
                    .setValue(this.plugin.settings.imageFolderPath)
                    .onChange(async value => {
                        this.plugin.settings.imageFolderPath = value.trim() || "Adjuntos";
                        await this.plugin.saveSettings();
                    })
            );

        this.renderApiSection(containerEl);
    }

    private renderApiSection(containerEl: HTMLElement): void {
        containerEl.createEl("h3", { text: "Búsqueda API (Auto-Importar)" });
        containerEl.createEl("p", {
            cls: "setting-item-description",
            text: "Activa o desactiva fuentes y wikis MediaWiki usadas al importar personajes desde la red."
        });

        const api = this.plugin.settings.apiSearch;

        const guardarApi = async () => {
            this.plugin.settings.apiSearch = normalizeApiSearchSettings(api);
            ColeccionAPI.configureSearch(this.plugin.settings.apiSearch);
            await this.plugin.saveSettings();
        };

        new Setting(containerEl)
            .setName("AniList")
            .setDesc("Anime, manga y personajes con metadatos de obra.")
            .addToggle(t => t
                .setValue(api.enableAnilist)
                .onChange(async v => { api.enableAnilist = v; await guardarApi(); })
            );

        new Setting(containerEl)
            .setName("Jikan (MyAnimeList)")
            .setDesc("Personajes de anime y manga vía MAL.")
            .addToggle(t => t
                .setValue(api.enableJikan)
                .onChange(async v => { api.enableJikan = v; await guardarApi(); })
            );

        new Setting(containerEl)
            .setName("League of Legends")
            .setDesc("Campeones del MOBA (Data Dragon).")
            .addToggle(t => t
                .setValue(api.enableLoL)
                .onChange(async v => { api.enableLoL = v; await guardarApi(); })
            );

        containerEl.createEl("h4", { text: "Wikis MediaWiki" });

        const lista = containerEl.createEl("div", { cls: "cc-wiki-settings-list" });

        const redibujarLista = () => {
            lista.empty();
            api.wikiSources.forEach((wiki, index) => {
                this.renderWikiRow(lista, wiki, index, api, guardarApi, redibujarLista);
            });
        };
        redibujarLista();

        new Setting(containerEl)
            .setName("Añadir wiki")
            .setDesc("Fandom, Miraheze u otro sitio con API MediaWiki.")
            .addButton(btn => btn
                .setButtonText("Nueva wiki")
                .setCta()
                .onClick(() => {
                    new WikiSettingsModal(this.app, createCustomWiki(), async wiki => {
                        api.wikiSources.push(wiki);
                        await guardarApi();
                        redibujarLista();
                        new Notice("Wiki añadida.");
                    }).open();
                })
            );

        new Setting(containerEl)
            .setName("Restaurar wikis por defecto")
            .setDesc("Mantiene tus toggles de AniList/Jikan/LoL; restablece solo la lista de wikis.")
            .addButton(btn => btn
                .setButtonText("Restaurar")
                .onClick(async () => {
                    api.wikiSources = cloneApiSearch(DEFAULT_API_SEARCH).wikiSources;
                    await guardarApi();
                    redibujarLista();
                    new Notice("Lista de wikis restaurada.");
                })
            );
    }

    private renderWikiRow(
        lista: HTMLElement,
        wiki: WikiSourceConfig,
        index: number,
        api: ApiSearchSettings,
        guardarApi: () => Promise<void>,
        redibujar: () => void
    ): void {
        const host = wiki.host || `${wiki.slug}.fandom.com`;
        const row = new Setting(lista)
            .setName(wikiDisplayName(wiki))
            .setDesc(`${WIKI_CATEGORY_LABELS[wiki.cat]} · ${host}${wiki.custom ? " · personalizada" : ""}`);

        row.addToggle(t => t
            .setValue(wiki.enabled)
            .onChange(async v => {
                wiki.enabled = v;
                await guardarApi();
            })
        );

        row.addExtraButton(btn => btn
            .setIcon("pencil")
            .setTooltip("Editar")
            .onClick(() => {
                new WikiSettingsModal(this.app, { ...wiki }, async actualizada => {
                    api.wikiSources[index] = actualizada;
                    await guardarApi();
                    redibujar();
                }).open();
            })
        );

        if (wiki.custom) {
            row.addExtraButton(btn => btn
                .setIcon("trash")
                .setTooltip("Eliminar")
                .onClick(async () => {
                    api.wikiSources.splice(index, 1);
                    await guardarApi();
                    redibujar();
                })
            );
        }
    }
}
