// ============================================================
// APP VISTORIAS V2
// Banco de dados local - IndexedDB
// ============================================================

const DB_CONFIG = {
    nome: "appVistoriasV2",
    versao: 1
};

// ------------------------------------------------------------
// Estrutura do banco
// ------------------------------------------------------------

const DB_STORES = {
    locais: {
        keyPath: "id",
        indexes: [
            { name: "nome", keyPath: "nome", options: { unique: false } },
            { name: "ativo", keyPath: "ativo", options: { unique: false } }
        ]
    },

    areas: {
        keyPath: "id",
        indexes: [
            { name: "localId", keyPath: "localId", options: { unique: false } },
            { name: "nome", keyPath: "nome", options: { unique: false } }
        ]
    },

    equipamentos: {
        keyPath: "id",
        indexes: [
            { name: "localId", keyPath: "localId", options: { unique: false } },
            { name: "areaId", keyPath: "areaId", options: { unique: false } },
            { name: "patrimonio", keyPath: "patrimonio", options: { unique: false } }
        ]
    },

    categorias: {
        keyPath: "id",
        indexes: [
            { name: "nome", keyPath: "nome", options: { unique: false } },
            { name: "ordem", keyPath: "ordem", options: { unique: false } }
        ]
    },

    checklists: {
        keyPath: "id",
        indexes: [
            { name: "nome", keyPath: "nome", options: { unique: false } },
            { name: "ativo", keyPath: "ativo", options: { unique: false } }
        ]
    },

    itensChecklist: {
        keyPath: "id",
        indexes: [
            { name: "checklistId", keyPath: "checklistId", options: { unique: false } },
            { name: "categoriaId", keyPath: "categoriaId", options: { unique: false } },
            { name: "ordem", keyPath: "ordem", options: { unique: false } }
        ]
    },

    vistorias: {
        keyPath: "id",
        indexes: [
            { name: "localId", keyPath: "localId", options: { unique: false } },
            { name: "checklistId", keyPath: "checklistId", options: { unique: false } },
            { name: "status", keyPath: "status", options: { unique: false } },
            { name: "dataInicio", keyPath: "dataInicio", options: { unique: false } }
        ]
    },

    respostas: {
        keyPath: "id",
        indexes: [
            { name: "vistoriaId", keyPath: "vistoriaId", options: { unique: false } },
            { name: "itemChecklistId", keyPath: "itemChecklistId", options: { unique: false } },
            { name: "resultado", keyPath: "resultado", options: { unique: false } }
        ]
    },

    fotos: {
        keyPath: "id",
        indexes: [
            { name: "vistoriaId", keyPath: "vistoriaId", options: { unique: false } },
            { name: "respostaId", keyPath: "respostaId", options: { unique: false } },
            { name: "equipamentoId", keyPath: "equipamentoId", options: { unique: false } },
            { name: "capturadaEm", keyPath: "capturadaEm", options: { unique: false } }
        ]
    },

    pendencias: {
        keyPath: "id",
        indexes: [
            { name: "vistoriaId", keyPath: "vistoriaId", options: { unique: false } },
            { name: "respostaId", keyPath: "respostaId", options: { unique: false } },
            { name: "status", keyPath: "status", options: { unique: false } },
            { name: "prioridade", keyPath: "prioridade", options: { unique: false } }
        ]
    },

    meta: {
        keyPath: "id",
        indexes: []
    }
};

// ------------------------------------------------------------
// Abre/cria o banco
// ------------------------------------------------------------

function abrirBancoV2() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(
            DB_CONFIG.nome,
            DB_CONFIG.versao
        );

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            for (const [storeName, config] of Object.entries(DB_STORES)) {
                let store;

                if (!db.objectStoreNames.contains(storeName)) {
                    store = db.createObjectStore(storeName, {
                        keyPath: config.keyPath
                    });
                } else {
                    store = event.target.transaction.objectStore(storeName);
                }

                for (const index of config.indexes) {
                    if (!store.indexNames.contains(index.name)) {
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
// Gera ID único
// ------------------------------------------------------------

function gerarId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ------------------------------------------------------------
// Salva um registro
// ------------------------------------------------------------

async function salvarRegistro(storeName, dados) {
    const db = await abrirBancoV2();

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
// Busca um registro pelo ID
// ------------------------------------------------------------

async function buscarRegistro(storeName, id) {
    const db = await abrirBancoV2();

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
// Lista todos os registros
// ------------------------------------------------------------

async function listarRegistros(storeName) {
    const db = await abrirBancoV2();

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
// Disponibiliza o banco para os demais módulos
// ------------------------------------------------------------

window.AppVistoriasDB = {
    config: DB_CONFIG,
    stores: DB_STORES,
    abrir: abrirBancoV2,
    gerarId,
    salvar: salvarRegistro,
    buscar: buscarRegistro,
    listar: listarRegistros
};

console.log(
    `Banco V2 carregado: ${DB_CONFIG.nome} v${DB_CONFIG.versao}`
);