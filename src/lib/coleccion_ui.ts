/* coleccion_ui.ts — migrado a módulo TS */
// @ts-nocheck
import { ColeccionDB } from "./coleccion_db";
import { ColeccionModals } from "./coleccion_modals";

/* coleccion_ui.js - Renderizado del Dashboard adaptado a 3 columnas e inyección CSS */

export const ColeccionUI = {
    injectStyles: () => {
        const ID_ESTILOS = "estilos-tarjetas-coleccion-personajes";
        let styleEl = document.getElementById(ID_ESTILOS);
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = ID_ESTILOS;
            document.head.appendChild(styleEl);
        }

        const ALTO_FILA_PX = "125px";    
        const ALTO_IMAGEN_XY = "110px";  
        const ANCHO_IMAGEN_XY = "165px"; 
        const ALTO_TARJETA_NUEVO = "180px"; 

        styleEl.innerHTML = `
          .panel-configuracion-superior {
              background-color: var(--background-secondary) !important; 
              padding: 20px 24px !important; 
              border-radius: 8px !important; 
              margin-bottom: 35px !important; 
              border: 1px solid var(--background-modifier-border) !important;
          }
          .layout-herramientas-grid {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              gap: 24px !important; 
              flex-wrap: wrap !important;
              width: 100% !important;
          }
          .suggestion-container { padding: 10px 14px !important; }
          .suggestion-container .suggestion-item {
              display: flex !important; align-items: center !important; gap: 20px !important;
              padding: 12px 16px !important; height: ${ALTO_FILA_PX} !important; 
              margin-bottom: 16px !important; border-radius: 8px !important;
              background-color: var(--background-secondary) !important;
              border: 1px solid var(--background-modifier-border) !important; overflow: hidden !important;
          }
          .mi-contenedor-miniatura {
              display: block !important; position: relative !important; width: ${ANCHO_IMAGEN_XY} !important;
              height: ${ALTO_IMAGEN_XY} !important; border-radius: 6px !important; overflow: hidden !important;
              background-color: var(--background-primary) !important; border: 1px solid var(--background-modifier-border) !important; flex-shrink: 0 !important;
          }
          .suggestion-item .mi-contenedor-miniatura img,
          .suggestion-item img.mi-imagen-renderizada {
              width: auto !important; height: auto !important; max-width: ${ANCHO_IMAGEN_XY} !important;
              max-height: ${ALTO_IMAGEN_XY} !important; object-fit: contain !important; position: absolute !important;
              top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;
          }
          .modal:has(.formulario-personaje-grid) { padding: 26px 32px !important; }
          .formulario-personaje-grid {
              display: grid !important; grid-template-columns: 1.3fr 2.7fr !important; gap: 22px 18px !important; align-items: center !important;
          }
          .formulario-personaje-grid input[type="text"],
          .formulario-personaje-grid select {
              width: 100% !important; padding: 10px 14px !important; border-radius: 6px !important;
              border: 1px solid var(--background-modifier-border) !important; background-color: var(--background-primary) !important; height: 40px !important;
          }
          .formulario-acciones-div {
              display: flex !important; gap: 14px !important; justify-content: flex-end !important;
              margin-top: 30px !important; padding-top: 18px !important; border-top: 1px solid var(--background-modifier-border) !important;
          }
          .contenedor-grid-personajes {
              display: grid !important; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important; gap: 16px !important; width: 100% !important; margin-top: 10px !important;
          }
          .tarjeta-personaje-card {
              display: flex !important; flex-direction: row !important; background-color: var(--background-secondary) !important;
              border: 1px solid var(--background-modifier-border) !important; border-radius: 10px !important; height: ${ALTO_TARJETA_NUEVO} !important; overflow: hidden !important;
              box-shadow: 0 3px 8px rgba(0,0,0,0.06) !important; transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          }
          .tarjeta-personaje-card:hover {
              transform: translateY(-2px) !important; box-shadow: 0 5px 14px rgba(0,0,0,0.1) !important; border-color: var(--interactive-accent) !important;
          }
          .tarjeta-card-imagen-wrapper {
              width: ${ALTO_TARJETA_NUEVO} !important; height: ${ALTO_TARJETA_NUEVO} !important; min-width: ${ALTO_TARJETA_NUEVO} !important; max-width: ${ALTO_TARJETA_NUEVO} !important;
              background-color: var(--background-primary) !important; border-right: 1px solid var(--background-modifier-border) !important; overflow: hidden !important; position: relative !important;
          }
          .tarjeta-card-img { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
          .tarjeta-card-info-content {
              display: flex !important; flex-direction: column !important; justify-content: space-between !important; padding: 14px !important; flex: 1 !important; min-width: 0 !important; 
          }
          .tarjeta-card-cabecera { display: flex !important; flex-direction: column !important; gap: 4px !important; }
          .tarjeta-card-nombre {
              font-size: 1.15em !important; font-weight: 700 !important; color: var(--text-normal) !important; white-space: nowrap !important;
              overflow: hidden !important; text-overflow: ellipsis !important; margin: 0 !important; line-height: 1.2 !important;
          }
          .tarjeta-card-origen { font-size: 0.88em !important; color: var(--text-muted) !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
          .tarjeta-card-badge-tier {
              display: inline-block !important; width: max-content !important; background-color: var(--background-modifier-box) !important; color: var(--text-accent) !important;
              font-size: 0.78em !important; font-weight: 600 !important; padding: 2px 7px !important; border-radius: 4px !important; border: 1px solid var(--background-modifier-border) !important; margin-top: 2px !important;
          }
          .tarjeta-card-acciones {
              display: flex !important; justify-content: flex-end !important; gap: 14px !important; border-top: 1px solid var(--background-modifier-border-hover) !important; padding-top: 6px !important; margin-top: auto !important;
          }
          .tarjeta-card-btn {
              background: none !important; border: none !important; padding: 0 !important; margin: 0 !important; cursor: pointer !important;
              font-size: 1.1em !important; opacity: 0.75 !important; transition: opacity 0.15s ease, transform 0.1s ease !important;
          }
          .tarjeta-card-btn:hover { opacity: 1 !important; transform: scale(1.1) !important; }
        `;
    },

    renderDashboard: (mainContainer, db, dbPath, rutaImagenesConfigurada, guardarDbFunc, tierFiltroActual, setFiltroCallback) => {
        const Notice = require('obsidian').Notice;
        mainContainer.innerHTML = ""; 

        const configPanel = mainContainer.createEl("div");
        configPanel.className = "panel-configuracion-superior";

        const toolsGrid = configPanel.createEl("div");
        toolsGrid.className = "layout-herramientas-grid";

        const btnNuevo = toolsGrid.createEl("button", { 
            text: "➕ Agregar Nuevo Personaje", 
            style: "background-color: var(--interactive-accent); color: var(--text-on-accent); padding: 10px 22px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; white-space: nowrap;" 
        });
        
        btnNuevo.onclick = () => {
            new ColeccionModals.PersonajeFormModal(app, null, rutaImagenesConfigurada, () => {
                setTimeout(() => ColeccionUI.renderDashboard(mainContainer, db, dbPath, rutaImagenesConfigurada, guardarDbFunc, tierFiltroActual, setFiltroCallback), 150);
            }, db, dbPath).open();
        };

        const filterDiv = toolsGrid.createEl("div", { style: "display: flex; align-items: center; gap: 12px; white-space: nowrap;" });
        filterDiv.createEl("label", { text: "🔍 Filtrar Tablero:", style: "font-weight: bold; font-size: 0.95em;" });
        const selectFiltro = filterDiv.createEl("select", { style: "padding: 6px 12px; border-radius: 6px; height: 38px;" });

        ["0", "1", "2", "3"].forEach(t => {
            const opt = selectFiltro.createEl("option", { text: "Tier " + t, value: t });
            if(t === tierFiltroActual) opt.selected = true;
        });
        selectFiltro.onchange = () => {
            setFiltroCallback(selectFiltro.value);
        };

        const dashboardDiv = mainContainer.createEl("div");
        const colContainer = dashboardDiv.createEl("div", { style: "width: 100%; margin-top: 5px; padding: 2px;" });
        colContainer.createEl("h3", { 
            text: `Visualizando: Rango Tier ${tierFiltroActual}`, 
            style: "color: var(--text-accent); margin-top: 0; margin-bottom: 20px; font-size: 1.25em;" 
        });

        const generarGridTarjetasHTML = (targetEl, rows) => {
            const gridWrapper = targetEl.createEl("div");
            gridWrapper.className = "contenedor-grid-personajes";
            
            rows.forEach(r => {
                const personajeObj = { id: r[0], nombre: r[1], imagen: r[2], tier: r[3], tags: r[4], origen: r[5], type: r[6] };

                const card = gridWrapper.createEl("div");
                card.className = "tarjeta-personaje-card";
                
                const imgWrapper = card.createEl("div");
                imgWrapper.className = "tarjeta-card-imagen-wrapper";
                
                if (personajeObj.imagen) {
                    const tFile = app.metadataCache.getFirstLinkpathDest(personajeObj.imagen, "");
                    if (tFile) {
                        const urlLocal = app.vault.adapter.getResourcePath(tFile.path);
                        const cardImg = imgWrapper.createEl("img");
                        cardImg.className = "tarjeta-card-img";
                        cardImg.src = urlLocal;
                    } else {
                        imgWrapper.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.8em;color:var(--text-muted);text-align:center;padding:10px;">⚠️ Foto no enc.</div>`;
                    }
                } else {
                    imgWrapper.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.85em;color:var(--text-muted);font-style:italic;">Sin Imagen</div>`;
                }
                
                const infoContent = card.createEl("div");
                infoContent.className = "tarjeta-card-info-content";
                
                const cabeceraTextos = infoContent.createEl("div");
                cabeceraTextos.className = "tarjeta-card-cabecera";
                
                cabeceraTextos.createEl("h4", { text: personajeObj.nombre, className: "tarjeta-card-nombre" });
                cabeceraTextos.createEl("span", { text: personajeObj.origen || "Origen desconocido", className: "tarjeta-card-origen" });
                cabeceraTextos.createEl("div", { text: "Tier " + personajeObj.tier, className: "tarjeta-card-badge-tier" });
                
                const accionesDiv = infoContent.createEl("div");
                accionesDiv.className = "tarjeta-card-acciones";
                
                const btnEdit = accionesDiv.createEl("button", { text: "📝", title: "Editar", className: "tarjeta-card-btn" });
                btnEdit.onclick = () => {
                    new ColeccionModals.PersonajeFormModal(app, personajeObj, rutaImagenesConfigurada, () => {
                        setTimeout(() => {
                            ColeccionUI.renderDashboard(mainContainer, db, dbPath, rutaImagenesConfigurada, guardarDbFunc, tierFiltroActual, setFiltroCallback);
                        }, 150);
                    }, db, dbPath).open();
                };

                const btnDel = accionesDiv.createEl("button", { text: "🗑️", title: "Eliminar", className: "tarjeta-card-btn" });
                btnDel.onclick = () => {
                    new ColeccionModals.ConfirmModal(app, `¿Estás completamente seguro de que deseas eliminar a "${personajeObj.nombre}" de tu base de datos?`, async () => {
                        try {
                            const stmt = db.prepare("DELETE FROM coleccion WHERE id = :id");
                            stmt.run({ ':id': personajeObj.id });
                            stmt.free();
                            ColeccionDB.guardar(db, dbPath);

                            new Notice(`🗑️ Registro de ${personajeObj.nombre} eliminado permanentemente.`);

                            setTimeout(() => {
                                ColeccionUI.renderDashboard(mainContainer, db, dbPath, rutaImagenesConfigurada, guardarDbFunc, tierFiltroActual, setFiltroCallback);
                            }, 150);
                        } catch (err) {
                            console.error("Error crítico al eliminar el personaje:", err);
                            new Notice("❌ Error al intentar eliminar el registro.");
                        }
                    }).open();
                };
            });
        };

        try {
            const stmt = db.prepare("SELECT id, nombre, imagen, tier, tags, origen, type FROM coleccion WHERE tier = :tier ORDER BY nombre ASC");
            stmt.bind({ ':tier': tierFiltroActual });
            
            const rows = [];
            while(stmt.step()) { rows.push(stmt.get()); }
            stmt.free();

            if (rows.length > 0) {
                generarGridTarjetasHTML(colContainer, rows);
            } else {
                colContainer.createEl("p", { 
                    text: `No hay personajes registrados en el Rango Tier ${tierFiltroActual} todavía.`, 
                    style: "font-style: italic; color: var(--text-muted); padding: 15px; text-align: center; background-color: var(--background-secondary); border-radius: 6px; border: 1px dashed var(--background-modifier-border);" 
                });
            }
        } catch(e) {
            dashboardDiv.createEl("p", { text: "❌ Error ejecutando la consulta SQL: " + e.message, style: "color: var(--text-error);" });
        }
    }
};
