import { ItemView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import "./legacy";

declare global {
    interface Window {
        ScriptsRuntime: {
            configure: (app: unknown) => void;
            initSqlJs: () => Promise<unknown>;
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

export const VIEW_TYPE = "vault-item-collection-dashboard";
const CONFIG_FOLDER = "Ajustes";
const CONFIG_NOTE = "Configuración.md";
const DB_PATH = ".obsidian/scripts/coleccion_personajes.db";

export default class ItemCollectionPlugin extends Plugin {
    private sql: unknown = null;

    async onload(): Promise<void> {
        window.ScriptsRuntime.configure(this.app);

        this.registerView(VIEW_TYPE, (leaf) => new ItemCollectionView(leaf, this));
        this.addRibbonIcon("library", "Item Collection", () => this.activateView());
        this.addCommand({
            id: "open-dashboard",
            name: "Abrir colección",
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

class ItemCollectionView extends ItemView {
    private tierFiltro = "0";

    constructor(leaf: WorkspaceLeaf, private plugin: ItemCollectionPlugin) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Item Collection";
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
            new Notice("Item Collection: error al cargar.");
        }
    }
}
