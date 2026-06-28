import { ItemView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { ColeccionDB } from "./lib/coleccion_db";
import { ColeccionUI } from "./lib/coleccion_ui";
import { ScriptsRuntime } from "./runtime/scripts-runtime";
import { CharacterCollectionSettingTab } from "./settings-tab";
import {
    DEFAULT_SETTINGS,
    LEGACY_CONFIG_PATH,
    type CharacterCollectionSettings
} from "./settings";

import "./lib/coleccion_modals";

const PLUGIN_ID = "vault-character-collection";
const PLUGIN_ROOT = `.obsidian/plugins/${PLUGIN_ID}`;
const LEGACY_DB = ".obsidian/scripts/coleccion_personajes.db";
const DB_PATH = ".obsidian/plugins-data/vault-character-collection/coleccion_personajes.db";

export const VIEW_TYPE = "vault-character-collection-dashboard";

export default class CharacterCollectionPlugin extends Plugin {
    settings: CharacterCollectionSettings = { ...DEFAULT_SETTINGS };
    private sql: unknown = null;

    async onload(): Promise<void> {
        await this.loadSettings();

        ScriptsRuntime.configure(this.app, {
            sqlJsRel: `${PLUGIN_ROOT}/assets/sql-wasm.js`,
            sqlWasmRel: `${PLUGIN_ROOT}/assets/sql-wasm.wasm`
        });

        if (await ScriptsRuntime.migrarArchivoBinario(LEGACY_DB, DB_PATH)) {
            new Notice("Character Collection: base de datos migrada a plugins-data.");
        }

        this.addSettingTab(new CharacterCollectionSettingTab(this.app, this));

        this.registerView(VIEW_TYPE, (leaf) => new CharacterCollectionView(leaf, this));
        this.addRibbonIcon("library", "Character Collection", () => this.activateView());
        this.addCommand({
            id: "open-dashboard",
            name: "Abrir colección de personajes",
            callback: () => this.activateView()
        });
    }

    async loadSettings(): Promise<void> {
        const stored = (await this.loadData()) as Partial<CharacterCollectionSettings> | null;
        this.settings = { ...DEFAULT_SETTINGS, ...stored };

        if (!stored?.imageFolderPath) {
            await this.migrateImagePathFromLegacyNote();
        }
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    /** Migra ruta_imagenes desde la nota de configuración legada (una sola vez). */
    private async migrateImagePathFromLegacyNote(): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(LEGACY_CONFIG_PATH);
        if (!(file instanceof TFile)) return;

        const cache = this.app.metadataCache.getFileCache(file);
        const ruta = cache?.frontmatter?.ruta_imagenes;
        if (typeof ruta === "string" && ruta.trim()) {
            this.settings.imageFolderPath = ruta.trim();
            await this.saveSettings();
            new Notice("Character Collection: ruta de imágenes importada desde Configuración.md");
        }
    }

    async ensureSql(): Promise<unknown> {
        if (!this.sql) this.sql = await ScriptsRuntime.initSqlJs();
        return this.sql;
    }

    private async activateView(): Promise<void> {
        let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
        if (!leaf) {
            leaf = this.app.workspace.getLeaf(true);
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
        }
        this.app.workspace.revealLeaf(leaf);
    }
}

class CharacterCollectionView extends ItemView {
    private tierFiltro = "0";

    constructor(leaf: WorkspaceLeaf, private plugin: CharacterCollectionPlugin) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Character Collection";
    }

    getIcon(): string {
        return "library";
    }

    async onOpen(): Promise<void> {
        await this.render();
    }

    async onClose(): Promise<void> {
        this.containerEl.empty();
    }

    async render(): Promise<void> {
        const root = this.containerEl;
        root.empty();
        root.addClass("vault-character-collection-root");

        try {
            const SQL = await this.plugin.ensureSql();
            const rutaImagenes = this.plugin.settings.imageFolderPath;
            let db = await ColeccionDB.init(SQL, DB_PATH);
            const guardarDB = () => ColeccionDB.guardar(db, DB_PATH);

            ColeccionUI.injectStyles();

            ColeccionUI.renderDashboard(
                root, db, DB_PATH, rutaImagenes, guardarDB,
                this.tierFiltro,
                (tier: string) => { this.tierFiltro = tier; void this.render(); }
            );
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            root.createEl("p", { text: `❌ Error: ${msg}` });
            new Notice("Character Collection: error al cargar.");
        }
    }
}
