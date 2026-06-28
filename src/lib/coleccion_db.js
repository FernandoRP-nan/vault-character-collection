/* coleccion_db.js - Lógica de SQLite y persistencia de archivos */

window.ColeccionDB = {
    init: async (SQL, dbPath) => window.ScriptsRuntime.initDb(SQL, dbPath, (db, esNueva) => {
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

    guardar: (db, dbPath) => window.ScriptsRuntime.guardarDb(db, dbPath)
};
