/* coleccion_modals.ts — migrado a módulo TS */
// @ts-nocheck
import { ColeccionAPI } from "./coleccion_api";
import { ColeccionDB } from "./coleccion_db";
import { Modal, Setting, SuggestModal, Notice } from "obsidian";

// coleccion_modals.js - Modales de interacción e importación de archivos
const { Modal, SuggestModal, Notice } = require('obsidian');

class ImagenVisualSuggestModal extends SuggestModal {
    constructor(app, rutaFiltro, onSelect) {
        super(app);
        const path = require('path');
        this.rutaFiltro = rutaFiltro.trim().replace(/^\/+|\/+$/g, "");
        this.onSelect = onSelect;
        this.setPlaceholder("🔍 Escribe el nombre de un archivo o de su carpeta contenedora...");
    }

    getSuggestions(query) {
        const archivos = this.app.vault.getFiles();
        const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
        const queryLower = query.toLowerCase();
        return archivos.filter(file => {
            const ext = file.extension.toLowerCase();
            if (!extensionesPermitidas.includes(ext)) return false;
            if (this.rutaFiltro) {
                if (!file.path.startsWith(this.rutaFiltro + "/")) return false;
            }
            return file.path.toLowerCase().includes(queryLower);
        });
    }

    renderSuggestion(file, el) {
        const path = require('path');
        el.style.setProperty("display", "flex", "important");
        el.style.setProperty("align-items", "center", "important");
        const urlLocal = this.app.vault.adapter.getResourcePath(file.path);
        const imgCont = el.createEl("div");
        imgCont.className = "mi-contenedor-miniatura";
        const imgElement = imgCont.createEl("img", { attr: { src: urlLocal } });
        imgElement.className = "mi-imagen-renderizada";
        const textCont = el.createEl("div", { style: "display: flex; flex-direction: column; min-width: 0; flex: 1; justify-content: center; gap: 6px; padding-left: 4px;" });
        textCont.createEl("strong", { text: file.name, style: "white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 1.15em; color: var(--text-normal);" });
        textCont.createEl("small", { text: `📁 ${path.dirname(file.path)}`, style: "color: var(--text-muted); font-size: 0.88em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" });
    }

    onChooseSuggestion(file, evt) { 
        this.onSelect(file.name); 
    }
}

class ConfirmModal extends Modal {
    constructor(app, mensaje, onConfirm) {
        super(app);
        this.mensaje = mensaje;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h3", { text: "⚠️ Confirmar acción", style: "margin-top: 0; margin-bottom: 15px;" });
        contentEl.createEl("p", { text: this.mensaje, style: "margin-bottom: 25px; line-height: 1.4;" });

        const btnDiv = contentEl.createEl("div", { className: "formulario-acciones-div" });
        const btnCancel = btnDiv.createEl("button", { text: "Cancelar", style: "padding: 8px 16px;" });
        btnCancel.onclick = () => this.close();

        const btnConfirm = btnDiv.createEl("button", { text: "Eliminar", style: "background-color: var(--text-error); color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px;" });
        btnConfirm.onclick = () => { this.onConfirm(); this.close(); };
    }

    onClose() { 
        this.contentEl.empty(); 
    }
}

class PersonajeFormModal extends Modal {
    constructor(app, datosEdicion = null, rutaRaizConfig, onSaved, dbInstance, dbPath) {
        super(app);
        this.datos = datosEdicion;
        this.rutaRaizConfig = rutaRaizConfig;
        this.onSaved = onSaved;
        this.db = dbInstance;
        this.dbPath = dbPath; 
        this.imagenSeleccionada = datosEdicion ? (datosEdicion.imagen || "") : "";
        this.archivoBinarioCargar = null;
        this.guardadoExitoso = false;
        this.imagenTemporalCreada = null;
        this.carpetaTemporalCreada = null;
    }

    onOpen() {
        const { contentEl } = this;
        const esEdicion = this.datos !== null;
        
        contentEl.createEl("h2", { 
            text: esEdicion ? `📝 Modificar Personaje` : "✨ Registrar Nuevo Personaje",
            style: "margin-top: 0; margin-bottom: 24px; color: var(--text-accent);" 
        });

        if (!esEdicion) {
            const apiBtnContainer = contentEl.createEl("div", { style: "margin-bottom: 20px; text-align: right;" });
            const btnAutoImportar = apiBtnContainer.createEl("button", {
                text: "⚡ Auto-Importar desde API",
                style: "background-color: #2b7bc4; color: white; border: none; font-weight: bold; padding: 6px 14px; border-radius: 4px; cursor: pointer;"
            });
            
            btnAutoImportar.onclick = (e) => { 
                e.preventDefault(); 
                new ColeccionModals.APISuggestModal(this.app, async (personajeAPI) => { 
                    new Notice("📥 Descargando recursos e información precisa..."); 
                    
                    const nombreCarpetaLimpio = personajeAPI.nombre.replace(/[^a-zA-Z0-9\s-_]/g, "").trim(); 
                    const rutaDestinoConSubcarpeta = `${this.rutaRaizConfig}/${nombreCarpetaLimpio}`; 
                    
                    if (!this.app.vault.getAbstractFileByPath(rutaDestinoConSubcarpeta)) {
                        this.carpetaTemporalCreada = rutaDestinoConSubcarpeta;
                    }

                    const [nombreImagenGuardada, origenReal] = await Promise.all([ 
                        ColeccionAPI.descargarImagenABoveda(this.app, personajeAPI.urlImagen, rutaDestinoConSubcarpeta, personajeAPI.nombre), 
                        ColeccionAPI.obtenerOrigenPreciso(personajeAPI.idExterno, personajeAPI.tipoFuente, personajeAPI.origen) 
                    ]); 
                    
                    this.imagenTemporalCreada = `${rutaDestinoConSubcarpeta}/${nombreImagenGuardada}`;

                    inNombre.value = personajeAPI.nombre; 
                    inOrigen.value = origenReal; 
                    inSubcarpeta.value = nombreCarpetaLimpio; 
                    this.imagenSeleccionada = nombreImagenGuardada; 
                    inImagenDisplay.value = nombreImagenGuardada; 
                    
                    new Notice(`✨ ¡Datos importados! Origen: ${origenReal}`); 
                }).open(); 
            };
        }

        const formGrid = contentEl.createEl("div");
        formGrid.className = "formulario-personaje-grid";

        formGrid.createEl("label", { text: "Nombre *:" });
        const inNombre = formGrid.createEl("input", { type: "text", placeholder: "Ej. Ganyu" });
        if(esEdicion) inNombre.value = this.datos.nombre;

        formGrid.createEl("label", { text: "Subcarpeta Destino:" });
        const folderContainer = formGrid.createEl("div", { style: "display: flex; gap: 10px; width: 100%;" });
        const inSubcarpeta = folderContainer.createEl("input", { type: "text", placeholder: "Opcional (Ej. Gwen o dejar vacío para la raíz)", style: "flex: 1;" });
        if(esEdicion && this.datos.imagen) {
            const paths = this.datos.imagen.split('/');
            if(paths.length > 1) inSubcarpeta.value = paths.slice(0, -1).join('/');
        }
        
        formGrid.createEl("label", { text: "Imagen (Cargar de PC):" });
        const inFileImport = formGrid.createEl("input", { type: "file", attr: { accept: "image/*" } });
        inFileImport.onchange = (e) => {
            if (e.target.files.length > 0) {
                this.archivoBinarioCargar = e.target.files[0];
                inImagenDisplay.value = `[Local] ${this.archivoBinarioCargar.name}`;
                this.imagenSeleccionada = this.archivoBinarioCargar.name;
            }
        };

        formGrid.createEl("label", { text: "O seleccionar de Bóveda:" });
        const imgSelectorContainer = formGrid.createEl("div", { style: "display: flex; gap: 10px; align-items: center;" });
        const inImagenDisplay = imgSelectorContainer.createEl("input", { type: "text", placeholder: "Ninguna imagen seleccionada", style: "flex: 1; background-color: var(--background-modifier-form-field-disabled); color: var(--text-muted);" });
        inImagenDisplay.disabled = true;
        inImagenDisplay.value = this.imagenSeleccionada;

        const btnBuscarImg = imgSelectorContainer.createEl("button", { text: "🖼️ Galería", style: "padding: 0 14px; cursor: pointer; font-weight: bold; height: 40px; border-radius: 6px; white-space: nowrap;" });
        btnBuscarImg.onclick = (e) => {
            e.preventDefault();
            new ColeccionModals.ImagenVisualSuggestModal(this.app, this.rutaRaizConfig, (nombreArchivo) => {
                this.archivoBinarioCargar = null;
                this.imagenSeleccionada = nombreArchivo;
                inImagenDisplay.value = nombreArchivo;
            }).open();
        };

        formGrid.createEl("label", { text: "Tier:" });
        const inTier = formGrid.createEl("select");
        ["0", "1", "2", "3"].forEach(t => {
            const o = inTier.createEl("option", { text: "Tier " + t, value: t });
            if(esEdicion && this.datos.tier === t) o.selected = true;
        });

        formGrid.createEl("label", { text: "Origen / Juego:" });
        const inOrigen = formGrid.createEl("input", { type: "text", placeholder: "Ej. Genshin Impact" });
        if(esEdicion) inOrigen.value = this.datos.origen || "";

        const inType = formGrid.createEl("input", { type: "hidden" });
        inType.value = esEdicion ? (this.datos.type || "horizontal") : "horizontal";

        const accionesDiv = contentEl.createEl("div");
        accionesDiv.className = "formulario-acciones-div";
        const btnCancelar = accionesDiv.createEl("button", { text: "Cancelar", style: "padding: 8px 18px; border-radius: 6px;" });
        btnCancelar.onclick = () => this.close();

        const btnGuardar = accionesDiv.createEl("button", { text: esEdicion ? "Guardar Cambios" : "Añadir a Base de Datos", style: "background-color: var(--interactive-accent); color: var(--text-on-accent); font-weight: bold; border: none; padding: 8px 18px; border-radius: 6px;" });
        
        btnGuardar.onclick = async () => { 
            const nom = inNombre.value.trim(); 
            const tie = inTier.value; 
            const ori = inOrigen.value.trim(); 
            const tag = ""; 
            const typ = inType.value; 
            let subFolderText = inSubcarpeta.value.trim().replace(/^\/+|\/+$/g, ""); 

            if (!nom) { 
                new Notice("⚠️ El nombre es obligatorio."); 
                return; 
            } 

            const stmtCheck = this.db.prepare("SELECT COUNT(*) FROM coleccion WHERE LOWER(nombre) = LOWER(:nom) AND LOWER(origen) = LOWER(:ori)"); 
            stmtCheck.bind({ ':nom': nom, ':ori': ori }); 
            stmtCheck.step(); 
            const duplicadosEncontrados = stmtCheck.get()[0]; 
            stmtCheck.free(); 

            if (!esEdicion && duplicadosEncontrados > 0) { 
                new Notice(`❌ Error: "${nom}" de "${ori}" ya existe en tu colección.`); 
                return; 
            } 

            let rutaDestinoFinal = this.rutaRaizConfig; 
            if (subFolderText) { 
                rutaDestinoFinal = `${this.rutaRaizConfig}/${subFolderText}`; 
            } 
            if (!this.app.vault.getAbstractFileByPath(rutaDestinoFinal)) { 
                await this.app.vault.createFolder(rutaDestinoFinal); 
            } 

            const guardarRegistroSQL = async () => { 
                const nombreImagenFinalDb = subFolderText ? `${subFolderText}/${this.imagenSeleccionada}` : this.imagenSeleccionada;

                if (!esEdicion) { 
                    const stmt = this.db.prepare("INSERT INTO coleccion (nombre, imagen, tier, tags, origen, type) VALUES (:nom, :img, :tie, :tag, :ori, :typ)"); 
                    stmt.run({ ':nom': nom, ':img': nombreImagenFinalDb, ':tie': tie, ':tag': tag, ':ori': ori, ':typ': typ }); 
                    stmt.free(); 
                    new Notice(`💾 ¡${nom} añadida correctamente!`); 
                } else { 
                    const stmt = this.db.prepare("UPDATE coleccion SET nombre = :nom, imagen = :img, tier = :tie, tags = :tag, origen = :ori, type = :typ WHERE id = :id"); 
                    stmt.run({ ':nom': nom, ':img': nombreImagenFinalDb, ':tie': tie, ':tag': tag, ':ori': ori, ':typ': typ, ':id': this.datos.id }); 
                    stmt.free(); 
                    new Notice(`🔄 ¡${nom} actualizada correctamente!`); 
                } 
                
                try {
                    ColeccionDB.guardar(this.db, this.dbPath);
                    this.guardadoExitoso = true;
                } catch (err) {
                    console.error("Error crítico guardando el archivo SQLite:", err); 
                    new Notice("❌ Error al escribir en el disco."); 
                } 
                this.onSaved(); 
                this.close(); 
            }; 

            if (this.archivoBinarioCargar) { 
                const reader = new FileReader(); 
                reader.onload = async () => { 
                    const arrayBuffer = reader.result; 
                    const bVaultPath = `${rutaDestinoFinal}/${this.archivoBinarioCargar.name}`; 
                    const archivoExistente = this.app.vault.getAbstractFileByPath(bVaultPath); 
                    if (archivoExistente) { 
                        await this.app.vault.modifyBinary(archivoExistente, arrayBuffer); 
                    } else { 
                        await this.app.vault.createBinary(bVaultPath, arrayBuffer); 
                    } 
                    this.imagenSeleccionada = this.archivoBinarioCargar.name; 
                    await guardarRegistroSQL(); 
                }; 
                reader.readAsArrayBuffer(this.archivoBinarioCargar); 
            } else { 
                await guardarRegistroSQL(); 
            } 
        };
    }

    async onClose() { 
        this.contentEl.empty(); 
        
        if (!this.guardadoExitoso) {
            try {
                if (this.imagenTemporalCreada) {
                    const tImg = this.app.vault.getAbstractFileByPath(this.imagenTemporalCreada);
                    if (tImg) await this.app.vault.delete(tImg);
                }
                if (this.carpetaTemporalCreada) {
                    const tFolder = this.app.vault.getAbstractFileByPath(this.carpetaTemporalCreada);
                    if (tFolder && tFolder.children?.length === 0) {
                        await this.app.vault.delete(tFolder);
                    }
                }
            } catch (err) {
                console.error("Error ejecutando limpieza preventiva de huérfanos:", err);
            }
        }
    }
}

class APISuggestModal extends SuggestModal {
    constructor(app, onSelect) {
        super(app);
        this.onSelect = onSelect;
        // Obsidian muestra solo 5 sugerencias por defecto; la API puede devolver hasta 32 variantes
        this.limit = 32;
        this.setPlaceholder("🌐 Busca personaje (anime, manga, manhwa, juegos… ej: Ganyu, Sung Jinwoo, Ellen Joe)");
        this.resultadosLocales = [];
        this.ultimoQuery = "";
        this.timeoutBusqueda = null;
    }

    getSuggestions(query) {
        const q = query.trim();
        
        if (q.length < 3 || q === this.ultimoQuery) {
            return this.resultadosLocales;
        }

        if (this.timeoutBusqueda) clearTimeout(this.timeoutBusqueda);
        
        this.timeoutBusqueda = setTimeout(async () => {
            this.ultimoQuery = q;
            new Notice("🔍 Buscando en la red...");
            
            const res = await ColeccionAPI.buscarPersonajeEnRed(q);
            
            if (res && res.length > 0) {
                this.resultadosLocales = res;
                this.updateSuggestions();
            } else {
                new Notice("⚠️ No se encontraron resultados en la API.");
            }
        }, 400);

        return this.resultadosLocales;
    }

    renderSuggestion(item, el) {
        el.style.setProperty("display", "flex", "important");
        el.style.setProperty("align-items", "center", "important");
        el.style.setProperty("gap", "15px", "important");

        const imgCont = el.createEl("div", { className: "mi-contenedor-miniatura" });
        imgCont.createEl("img", { attr: { src: item.urlImagen }, className: "mi-imagen-renderizada" });

        const textCont = el.createEl("div", { style: "display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 3px;" });
        textCont.createEl("strong", { text: item.nombre, style: "color: var(--text-normal);" });

        const etiquetas = {
            juego: "🎮 Juego",
            anime: "🎬 Anime",
            manga: "📖 Manga",
            manhwa: "🇰🇷 Manhwa",
            manhua: "🇨🇳 Manhua"
        };
        const iconoFuente = etiquetas[item.categoriaMedio] || etiquetas[item.tipoFuente] || "🎬 Obra";
        const obra = item.origen && item.origen !== "Cargando obra precisa..."
            ? item.origen
            : "Sin datos de obra";
        const rol = item.rolObra === "MAIN" ? " · Protagonista"
            : item.rolObra === "SUPPORTING" ? " · Secundario"
            : "";
        textCont.createEl("small", {
            text: `${iconoFuente}: ${obra}${rol}`,
            style: "color: var(--text-accent); font-weight: 600;"
        });
        if (item.tipoFuente === "wiki" || item.tipoFuente === "juego") {
            textCont.createEl("small", {
                text: `Fuente: ${item.tipoFuente === "wiki" ? "Wiki" : "API"}`,
                style: "color: var(--text-muted); font-size: 0.82em;"
            });
        }
    }

    onChooseSuggestion(item, evt) {
        this.onSelect(item);
    }
}

export const ColeccionModals = {
    ImagenVisualSuggestModal,
    ConfirmModal,
    PersonajeFormModal,
    APISuggestModal
};
