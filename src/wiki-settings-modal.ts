import { App, Modal, Setting } from "obsidian";
import {
    WIKI_CATEGORY_LABELS,
    type WikiCategory,
    type WikiSourceConfig,
    wikiDisplayName
} from "./api-search-settings";

export class WikiSettingsModal extends Modal {
    private draft: WikiSourceConfig;

    constructor(
        app: App,
        private wiki: WikiSourceConfig,
        private onSave: (wiki: WikiSourceConfig) => void
    ) {
        super(app);
        this.draft = { ...wiki };
    }

    onOpen(): void {
        const { contentEl } = this;
        const esNueva = !this.wiki.slug || this.wiki.custom && this.wiki.slug === "mi-wiki";

        contentEl.createEl("h2", {
            text: esNueva ? "Añadir wiki MediaWiki" : `Editar: ${wikiDisplayName(this.wiki)}`
        });
        contentEl.createEl("p", {
            cls: "setting-item-description",
            text: "Fandom usa solo el slug (ej. genshin-impact). Miraheze u otros hosts requieren dominio y ruta API."
        });

        new Setting(contentEl)
            .setName("Slug / identificador")
            .setDesc("En Fandom: nombre de la wiki (genshin-impact → genshin-impact.fandom.com).")
            .addText(t => t
                .setValue(this.draft.slug)
                .setPlaceholder("genshin-impact")
                .onChange(v => { this.draft.slug = v.trim().toLowerCase().replace(/\s+/g, "-"); })
            );

        new Setting(contentEl)
            .setName("Nombre de la obra")
            .setDesc("Etiqueta mostrada como origen al importar (opcional).")
            .addText(t => t
                .setValue(this.draft.origen ?? "")
                .setPlaceholder("Genshin Impact")
                .onChange(v => { this.draft.origen = v.trim() || undefined; })
            );

        new Setting(contentEl)
            .setName("Categoría")
            .addDropdown(d => {
                (Object.keys(WIKI_CATEGORY_LABELS) as WikiCategory[]).forEach(k => {
                    d.addOption(k, WIKI_CATEGORY_LABELS[k]);
                });
                d.setValue(this.draft.cat);
                d.onChange(v => { this.draft.cat = v as WikiCategory; });
            });

        new Setting(contentEl)
            .setName("Host personalizado")
            .setDesc("Vacío = {slug}.fandom.com")
            .addText(t => t
                .setValue(this.draft.host ?? "")
                .setPlaceholder("browndust2.miraheze.org")
                .onChange(v => { this.draft.host = v.trim() || undefined; })
            );

        new Setting(contentEl)
            .setName("Ruta API")
            .setDesc("Por defecto: api.php (Miraheze suele usar w/api.php).")
            .addText(t => t
                .setValue(this.draft.apiPath ?? "")
                .setPlaceholder("api.php")
                .onChange(v => { this.draft.apiPath = v.trim() || undefined; })
            );

        new Setting(contentEl)
            .setName("Ruta de páginas")
            .setDesc("Por defecto: wiki")
            .addText(t => t
                .setValue(this.draft.wikiPath ?? "")
                .setPlaceholder("wiki")
                .onChange(v => { this.draft.wikiPath = v.trim() || undefined; })
            );

        new Setting(contentEl)
            .setName("Activa en búsquedas")
            .addToggle(t => t
                .setValue(this.draft.enabled)
                .onChange(v => { this.draft.enabled = v; })
            );

        const acciones = contentEl.createEl("div", { cls: "setting-item-control", attr: { style: "display:flex;gap:10px;justify-content:flex-end;margin-top:16px;" } });
        acciones.createEl("button", { text: "Cancelar" }).onclick = () => this.close();
        acciones.createEl("button", { text: "Guardar", cls: "mod-cta" }).onclick = () => {
            if (!this.draft.slug) return;
            const slug = this.draft.slug.trim();
            const guardado: WikiSourceConfig = {
                ...this.draft,
                slug,
                id: this.draft.custom ? `custom-${slug}` : this.draft.id
            };
            this.onSave(guardado);
            this.close();
        };
    }

    onClose(): void {
        this.contentEl.empty();
    }
}
