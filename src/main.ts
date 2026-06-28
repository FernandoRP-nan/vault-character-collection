import { ItemView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import "./legacy";

const PLUGIN_ID = "vault-character-collection";
const PLUGIN_ROOT = `.obsidian/plugins/${PLUGIN_ID}`;
const LEGACY_DB = ".obsidian/scripts/coleccion_personajes.db";
const DB_PATH = ".obsidian/plugins-data/vault-character-collection/coleccion_personajes.db";

declare global {
    interface Window {
        ScriptsRuntime: {
            configure: (app: unknown, opts?: { sqlJsRel?: string; sqlWasmRel?: string }) => void;
            initSqlJs: () => Promise<unknown>;
            migrarArchivoBinario: (legacy: string, dest: string) => Promise<boolean>;
        };
        ColeccionDB: {
            init: (SQL: unknown, dbPath: string) => Promise<unknown>;
            guardar: (db: unknown, dbPath: string) => void;
        };
        ColeccionUI: {
            injectStyles: () => void;
            renderDashboard: (
                container: HTMLElement,
                db: unknown,
                dbPath: string,
                rutaImagenes: string,
                guardarDb: () => void,
                tierFiltro: string,
                setFiltro: (tier: string) => void
            ) => void;
        };
    }
}

export const VIEW_TYPE = "vault-character-collection-dashboard";
const CONFIG_FOLDER = "Ajustes";
const CONFIG_NOTE = "Configuración.md";

export default class CharacterCollectionPlugin extends Plugin {
    private sql: unknown = null;

    async onload(): Promise<void> {
        window.ScriptsRuntime.configure(this.app, {
            sqlJsRel: `${PLUGIN_ROOT}/assets/sql-wasm.js`,
            sqlWasmRel: `${PLUGIN_ROOT}/assets/sql-wasm.wasm`
        });

        if (await window.ScriptsRuntime.migrarArchivoBinario(LEGACY_DB, DB_PATH)) {
            new Notice("Character Collection: base de datos migrada a plugins-data.");
        }

        this.registerView(VIEW_TYPE, (leaf) => new CharacterCollectionView(leaf, this));
        this.addRibbonIcon("library", "Character Collection", () => this.activateView());
        this.addCommand({
            id: "open-dashboard",
            name: "Abrir colección de personajes",
            callback: () => this.activateView()
        });
    }

    async ensureSql(): Promise<unknown> {
        if (!this.sql) this.sql = await window.ScriptsRuntime.initSqlJs();
        return this.sql;
    }

    async obtenerRutaImagenes(): Promise<string> {
        const path = `${CONFIG_FOLDER}/${CONFIG_NOTE}`;
        let file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) {
            if (!this.app.vault.getAbstractFileByPath(CONFIG_FOLDER)) {
                await this.app.vault.createFolder(CONFIG_FOLDER);
            }
            await this.app.vault.create(
                path,
                "---\nruta_imagenes: Adjuntos\n---\n# Configuración\n"
            );
            file = this.app.vault.getAbstractFileByPath(path);
        }
        if (file instanceof TFile) {
            const cache = this.app.metadataCache.getFileCache(file);
            const ruta = cache?.frontmatter?.ruta_imagenes;
            if (typeof ruta === "string" && ruta.trim()) return ruta.trim();
        }
        return "Adjuntos";
    }

    private async activateView(): Promise<void> {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
        if (!leaf) {
            leaf = workspace.getLeaf(true);
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
        }
        workspace.revealLeaf(leaf);
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

    private async render(): Promise<void> {
        const root = this.containerEl;
        root.empty();

        try {
            const SQL = await this.plugin.ensureSql();
            const rutaImagenes = await this.plugin.obtenerRutaImagenes();
            let db = await window.ColeccionDB.init(SQL, DB_PATH);
            const guardarDB = () => window.ColeccionDB.guardar(db, DB_PATH);

            window.ColeccionUI.injectStyles();

            const ejecutarRender = () => {
                window.ColeccionUI.renderDashboard(
                    root, db, DB_PATH, rutaImagenes, guardarDB,
                    this.tierFiltro,
                    (tier) => { this.tierFiltro = tier; void this.render(); }
                );
            };
            ejecutarRender();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            root.createEl("p", { text: `❌ Error: ${msg}` });
            new Notice("Character Collection: error al cargar.");
        }
    }
}
