import { App, PluginSettingTab, Setting } from "obsidian";
import type CharacterCollectionPlugin from "./main";
import type { CharacterCollectionSettings } from "./settings";

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
            .addText((text) =>
                text
                    .setPlaceholder("Adjuntos")
                    .setValue(this.plugin.settings.imageFolderPath)
                    .onChange(async (value) => {
                        this.plugin.settings.imageFolderPath = value.trim() || "Adjuntos";
                        await this.plugin.saveSettings();
                    })
            );
    }
}

export type { CharacterCollectionSettings };
