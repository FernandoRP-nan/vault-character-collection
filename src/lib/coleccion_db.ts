/* coleccion_db.ts — migrado a módulo TS */
// @ts-nocheck
import { ScriptsRuntime } from "../runtime/scripts-runtime";

/* coleccion_db.js - Lógica de SQLite y persistencia de archivos */

export const ColeccionDB = {
    init: async (SQL, dbPath) => ScriptsRuntime.initDb(SQL, dbPath, (db, esNueva) => {
        if (esNueva) {
            db.run(`CREATE TABLE IF NOT EXISTS coleccion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                imagen TEXT,
                tier TEXT,
                tags TEXT,
                origen TEXT,
                type TEXT
            );`);
        }
    }),

    guardar: (db, dbPath) => ScriptsRuntime.guardarDb(db, dbPath)
};
