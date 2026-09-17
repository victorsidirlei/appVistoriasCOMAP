// ============================================================
// DB.JS
// CAMADA DE DADOS
//
// Relatório Fotográfico V1.1
//
// Responsabilidade:
// - abrir IndexedDB
// - salvar
// - buscar
// - listar
// - excluir
//
// O banco continua sendo:
//     appVistoriasV1
//
// A versão passa de 1 para 2.
// ============================================================


const DB_CONFIG = {

    nome: "appVistoriasV1",

    versao: 2

};


// ============================================================
// ESTRUTURA DOS STORES
// ============================================================

const DB_STORES = {

    // --------------------------------------------------------
    // RELATÓRIOS
    // --------------------------------------------------------

    relatorios: {

        keyPath: "id",

        indexes: [

            {
                name: "data",
                keyPath: "data",
                options: {
                    unique: false
                }
            },

            {
                name: "status",
                keyPath: "status",
                options: {
                    unique: false
                }
            },

            {
                name: "cidade",
                keyPath: "cidade",
                options: {
                    unique: false
                }
            },

            {
                name: "predio",
                keyPath: "predio",
                options: {
                    unique: false
                }
            }

        ]

    },


    // --------------------------------------------------------
    // REGISTROS
    // --------------------------------------------------------

    registros: {

        keyPath: "id",

        indexes: [

            {
                name: "relatorioId",
                keyPath: "relatorioId",
                options: {
                    unique: false
                }
            },

            {
                name: "tipo",
                keyPath: "tipo",
                options: {
                    unique: false
                }
            },

            {
                name: "ordem",
                keyPath: "ordem",
                options: {
                    unique: false
                }
            }

        ]

    },


    // --------------------------------------------------------
    // ARQUIVOS
    //
    // Ainda não utilizado pela interface.
    //
    // O store já fica reservado para uma futura evolução.
    // --------------------------------------------------------

    arquivos: {

        keyPath: "id",

        indexes: [

            {
                name: "relatorioId",
                keyPath: "relatorioId",
                options: {
                    unique: false
                }
            },

            {
                name: "tipo",
                keyPath: "tipo",
                options: {
                    unique: false
                }
            }

        ]

    }

};


// ============================================================
// GERADOR DE ID
// ============================================================

function gerarId() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }

    return (

        Date.now().toString(36) +

        Math.random()
            .toString(36)
            .slice(2)

    );

}


// ============================================================
// ABRIR BANCO
// ============================================================

function abrirBanco() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    DB_CONFIG.nome,
                    DB_CONFIG.versao
                );


            request.onupgradeneeded =
                event => {

                    const db =
                        event.target.result;

                    Object.entries(
                        DB_STORES
                    ).forEach(
                        ([nomeStore, configuracao]) => {

                            let store;


                            // ------------------------------------------------
                            // Cria store caso ainda não exista.
                            // ------------------------------------------------

                            if (
                                !db.objectStoreNames
                                    .contains(nomeStore)
                            ) {

                                store =
                                    db.createObjectStore(
                                        nomeStore,
                                        {
                                            keyPath:
                                                configuracao.keyPath
                                        }
                                    );

                            } else {

                                store =
                                    event.target.transaction
                                        .objectStore(
                                            nomeStore
                                        );

                            }


                            // ------------------------------------------------
                            // Cria índices que ainda não existem.
                            // ------------------------------------------------

                            configuracao.indexes
                                .forEach(
                                    indice => {

                                        if (
                                            !store.indexNames
                                                .contains(
                                                    indice.name
                                                )
                                        ) {

                                            store.createIndex(
                                                indice.name,
                                                indice.keyPath,
                                                indice.options
                                            );

                                        }

                                    }
                                );

                        }
                    );

                };


            request.onsuccess = () => {

                const db =
                    request.result;

                db.onversionchange =
                    () => db.close();

                resolve(db);

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}


// ============================================================
// SALVAR
// ============================================================

async function salvar(
    storeName,
    objeto
) {

    const db =
        await abrirBanco();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            transaction
                .objectStore(storeName)
                .put(objeto);


            transaction.oncomplete =
                () => {

                    db.close();

                    resolve(objeto);

                };


            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// BUSCAR
// ============================================================

async function buscar(
    storeName,
    id
) {

    const db =
        await abrirBanco();


    return new Promise(
        (resolve, reject) => {

            const request =
                db
                    .transaction(
                        storeName,
                        "readonly"
                    )
                    .objectStore(
                        storeName
                    )
                    .get(id);


            request.onsuccess =
                () => {

                    db.close();

                    resolve(
                        request.result ||
                        null
                    );

                };


            request.onerror =
                () => {

                    db.close();

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// LISTAR
// ============================================================

async function listar(
    storeName
) {

    const db =
        await abrirBanco();


    return new Promise(
        (resolve, reject) => {

            const request =
                db
                    .transaction(
                        storeName,
                        "readonly"
                    )
                    .objectStore(
                        storeName
                    )
                    .getAll();


            request.onsuccess =
                () => {

                    db.close();

                    resolve(
                        request.result ||
                        []
                    );

                };


            request.onerror =
                () => {

                    db.close();

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// EXCLUIR
// ============================================================

async function excluir(
    storeName,
    id
) {

    const db =
        await abrirBanco();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    storeName,
                    "readwrite"
                );


            transaction
                .objectStore(storeName)
                .delete(id);


            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };


            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// API PÚBLICA
// ============================================================

window.AppVistoriasDB = {

    config: DB_CONFIG,

    stores: DB_STORES,

    abrir: abrirBanco,

    gerarId,

    salvar,

    buscar,

    listar,

    excluir

};