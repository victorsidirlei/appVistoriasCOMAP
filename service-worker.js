// ============================================================
// SERVICE WORKER - RELATÓRIO FOTOGRÁFICO
// V1.1
//
// Estratégia:
// REDE PRIMEIRO
// Se a rede falhar, utiliza o cache.
//
// O cache é versionado para permitir atualizações controladas.
// ============================================================

const CACHE = "vistorias-v15";

const SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./js/db.js",
    "./js/app.js",
    "./icon-tjmg-192.png",
    "./icon-tjmg-512.png"
];


// ============================================================
// INSTALAÇÃO
// ============================================================

self.addEventListener("install", event => {

    event.waitUntil(
        caches
            .open(CACHE)
            .then(cache => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );

});


// ============================================================
// ATIVAÇÃO
// Remove caches antigos.
// ============================================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())

    );

});


// ============================================================
// REQUISIÇÕES
// ============================================================

self.addEventListener("fetch", event => {

    const request = event.request;

    // Só intercepta GET do próprio aplicativo.
    if (
        request.method !== "GET" ||
        new URL(request.url).origin !== location.origin
    ) {
        return;
    }

    event.respondWith(

        fetch(request)

            .then(response => {

                const copia = response.clone();

                caches
                    .open(CACHE)
                    .then(cache =>
                        cache.put(request, copia)
                    )
                    .catch(() => {});

                return response;

            })

            .catch(() =>

                caches
                    .match(request)
                    .then(cached =>

                        cached ||
                        caches.match("./index.html")

                    )

            )

    );

});