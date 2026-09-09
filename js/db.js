// ============================================================
// APP VISTORIAS - V1
// Banco local simplificado
// ============================================================

const DB_CONFIG = {
    nome: "appVistoriasV1",
    versao: 1
};

const DB_STORES = {
    relatorios: {
        keyPath: "id",
        indexes: [
            {
                name: "data",
                keyPath: "data",
                options: { unique: false }
            },
            {
                name: "status",
                keyPath: "status",
                options: { unique: false }
            }
        ]
    },

    registros: {
        keyPath: "id",
        indexes: [
            {
                name: "relatorioId",
                keyPath: "relatorioId",
                options: { unique: false }
            },
            {
                name: "tipo",
                keyPath: "tipo",
                options: { unique: false }
            },
            {
                name: "ordem",
                keyPath: "ordem",
                options: { unique: false }
            }
        ]
    }
};

// ------------------------------------------------------------
// Gerar ID único
// ------------------------------------------------------------

function gerarId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ------------------------------------------------------------
// Abrir / criar banco
// ------------------------------------------------------------

function abrirBancoV1() {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_CONFIG.nome,
            DB_CONFIG.versao
        );

        request.onupgradeneeded = (event) => {

            const db = event.target.result;

            for (const [storeName, config] of Object.entries(DB_STORES)) {

                if (!db.objectStoreNames.contains(storeName)) {

                    const store = db.createObjectStore(
                        storeName,
                        {
                            keyPath: config.keyPath
                        }
                    );

                    for (const index of config.indexes) {

                        store.createIndex(
                            index.name,
                            index.keyPath,
                            index.options
                        );
                    }
                }
            }
        };

        request.onsuccess = () => {

            const db = request.result;

            db.onversionchange = () => {
                db.close();
            };

            resolve(db);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// ------------------------------------------------------------
// Salvar registro
// ------------------------------------------------------------

async function salvarRegistro(storeName, dados) {

    const db = await abrirBancoV1();

    const registro = {
        ...dados,
        id: dados.id || gerarId()
    };

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.put(registro);

        request.onsuccess = () => {
            resolve(registro);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

// ------------------------------------------------------------
// Buscar registro por ID
// ------------------------------------------------------------

async function buscarRegistro(storeName, id) {

    const db = await abrirBancoV1();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);

        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

// ------------------------------------------------------------
// Listar registros
// ------------------------------------------------------------

async function listarRegistros(storeName) {

    const db = await abrirBancoV1();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);

        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

// ------------------------------------------------------------
// Excluir registro
// ------------------------------------------------------------

async function excluirRegistro(storeName, id) {

    const db = await abrirBancoV1();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);

        const request = store.delete(id);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

// ------------------------------------------------------------
// API pública da V1
// ------------------------------------------------------------

window.AppVistoriasDB = {

    config: DB_CONFIG,

    stores: DB_STORES,

    abrir: abrirBancoV1,

    gerarId,

    salvar: salvarRegistro,

    buscar: buscarRegistro,

    listar: listarRegistros,

    excluir: excluirRegistro
};

console.log(
    `Banco V1 carregado: ${DB_CONFIG.nome} v${DB_CONFIG.versao}`
);