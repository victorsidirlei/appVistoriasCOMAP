// ============================================================
// SERVICE WORKER - RELATÓRIO FOTOGRÁFICO
// V1.1
//
// Estratégia:
// CACHE PRIMEIRO
// Se não houver cache, utiliza a rede.
//
// Objetivo:
// Permitir que o PWA seja aberto e utilizado
// mesmo sem conexão com o Codespaces/internet.
//
// O cache é versionado para permitir atualizações controladas.
// ============================================================

const CACHE = "vistorias-v17";

const SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./js/db.js",
    "./js/app.js?v=1.1.1",
    "./icon-tjmg-192.png",
    "./icon-tjmg-512.png"
];


// ============================================================
// INSTALAÇÃO
// ============================================================

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE)

                .then(
                    cache =>
                        cache.addAll(SHELL)
                )

                .then(
                    () =>
                        self.skipWaiting()
                )

        );

    }
);


// ============================================================
// ATIVAÇÃO
// Remove caches antigos.
// ============================================================

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()

                .then(
                    keys =>
                        Promise.all(

                            keys

                                .filter(
                                    key =>
                                        key !== CACHE
                                )

                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )

                        )
                )

                .then(
                    () =>
                        self.clients.claim()
                )

        );

    }
);


// ============================================================
// REQUISIÇÕES
//
// Estratégia:
// 1. Procura primeiro no cache.
// 2. Se encontrar, entrega imediatamente.
// 3. Se não encontrar, tenta a rede.
// 4. Se a rede falhar, tenta o cache novamente.
// ============================================================

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        // ----------------------------------------------------
        // Só intercepta requisições GET.
        // ----------------------------------------------------

        if (
            request.method !== "GET"
        ) {

            return;

        }


        // ----------------------------------------------------
        // Só intercepta recursos do próprio aplicativo.
        // ----------------------------------------------------

        const url =
            new URL(
                request.url
            );


        if (
            url.origin !==
            location.origin
        ) {

            return;

        }


        event.respondWith(

            caches
                .match(
                    request
                )

                .then(
                    respostaEmCache => {

                        if (
                            respostaEmCache
                        ) {

                            return respostaEmCache;

                        }


                        return fetch(
                            request
                        )

                        .then(
                            resposta => {

                                if (
                                    !resposta ||
                                    !resposta.ok
                                ) {

                                    throw new Error(
                                        "Resposta de rede inválida."
                                    );

                                }


                                const copia =
                                    resposta.clone();


                                caches
                                    .open(
                                        CACHE
                                    )

                                    .then(
                                        cache =>
                                            cache.put(
                                                request,
                                                copia
                                            )
                                    )

                                    .catch(
                                        () => {}
                                    );


                                return resposta;

                            }
                        )

                        .catch(
                            () =>
                                caches.match(
                                    "./index.html"
                                )
                        );

                    }
                )

        );

    }
);