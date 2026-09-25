// ============================================================
// APP.JS
// RELATÓRIO FOTOGRÁFICO V1.1
// ============================================================
//
// Principais recursos:
// - relatórios
// - cidade/prédio
// - registros categorizados
// - observação livre por registro
// - fotos
// - compressão
// - miniaturas
// - GPS obrigatório
// - carimbo de data/hora + GPS
// - salvamento automático
// - reordenação
// - revisão
// - PDF/ impressão
//
// Reservado:
// - disciplina
// - sincronização
// - Firebase
// - retificação
//
// ============================================================


const APP_CONFIG = {

    nome:
        "Relatório Fotográfico",

    versao:
        "1.1.0"

};


// ============================================================
// 1. CONFIGURAÇÕES FUTURAS
// ============================================================


// ------------------------------------------------------------
// DISCIPLINAS
//
// A disciplina NÃO aparece na interface nesta versão.
//
// Quando decidirmos ativá-la, basta criar a seleção na tela
// utilizando esta lista.
//
// ------------------------------------------------------------

const DISCIPLINAS = [

    "Elétrica",

    "Civil",

    "Hidráulica",

    "Ar-condicionado",

    "Lógica",

    "Segurança",

    "Outros"

];


// ------------------------------------------------------------
// CATÁLOGO DE CIDADES / PRÉDIOS
//
// Este é o ponto principal para cadastrar novos locais.
//
// Estrutura:
//
// cidade:
//     [
//         prédio,
//         prédio
//     ]
//
// ------------------------------------------------------------

const CATALOGO_LOCAIS = {

    "Belo Horizonte": [

        "CEOP"

    ],


    "Uberlândia": [

        "Prédio principal"

    ],


    "Contagem": [

        "Unidade principal"

    ]

};


// ============================================================
// 2. BACKEND FUTURO
// ============================================================
//
// NÃO ATIVAR AGORA.
//
// Quando Firebase/sincronização forem implementados,
// concentrar a integração aqui.
//
// ------------------------------------------------------------
//
// async function sincronizarRelatorio(relatorio) {
//
// }
//
// async function enviarFilaOffline() {
//
// }
//
// async function retificarRelatorio(id) {
//
// }
//
// ============================================================


// ============================================================
// 3. ESTADO DA APLICAÇÃO
// ============================================================

let relatorioAtual = null;

let tipoRegistroAtual = null;

let registroEmEdicao = null;

let fotosTemporarias = [];

let autosaveTimer = null;


// ============================================================
// 4. UTILITÁRIOS
// ============================================================

function el(id) {

    return document.getElementById(id);

}


function aviso(mensagem) {

    alert(mensagem);

}


function dataHoje() {

    const agora =
        new Date();

    return [

        agora.getFullYear(),

        String(
            agora.getMonth() + 1
        ).padStart(2, "0"),

        String(
            agora.getDate()
        ).padStart(2, "0")

    ].join("-");

}


function formatarData(data) {

    if (!data) {

        return "";

    }

    const partes =
        data.split("-");

    if (
        partes.length !== 3
    ) {

        return data;

    }

    return (

        `${partes[2]}/` +
        `${partes[1]}/` +
        `${partes[0]}`

    );

}


function escaparHTML(valor) {

    return String(valor ?? "")

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function mostrarTela(id) {

    document
        .querySelectorAll(".tela")
        .forEach(
            tela =>
                tela.classList.remove(
                    "ativa"
                )
        );

    el(id)
        .classList.add(
            "ativa"
        );

    window.scrollTo(
        0,
        0
    );

}


// ============================================================
// 5. CATÁLOGO DE LOCAIS
// ============================================================

function carregarCatalogoLocais() {

    const cidade =
        el("cidade");

    const predio =
        el("predio");


    cidade.innerHTML =
        `<option value="">
            Selecione a cidade
        </option>`;


    Object.keys(
        CATALOGO_LOCAIS
    )
        .sort()
        .forEach(
            nomeCidade => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    nomeCidade;

                option.textContent =
                    nomeCidade;

                cidade.appendChild(
                    option
                );

            }
        );


    predio.innerHTML =
        `<option value="">
            Selecione primeiro a cidade
        </option>`;

    predio.disabled = true;

}


function atualizarPredios() {

    const cidade =
        el("cidade").value;

    const predio =
        el("predio");


    predio.innerHTML =
        `<option value="">
            Selecione o prédio / unidade
        </option>`;


    if (
        !cidade ||
        !CATALOGO_LOCAIS[cidade]
    ) {

        predio.disabled = true;

        return;

    }


    CATALOGO_LOCAIS[cidade]
        .slice()
        .sort()
        .forEach(
            nomePredio => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    nomePredio;

                option.textContent =
                    nomePredio;

                predio.appendChild(
                    option
                );

            }
        );


    predio.disabled = false;

}


// ============================================================
// 6. RELATÓRIOS
// ============================================================

async function carregarRelatorios() {

    const lista =
        el("lista-relatorios");


    const relatorios =
        await AppVistoriasDB.listar(
            "relatorios"
        );


    relatorios.sort(
        (a, b) =>

            new Date(
                b.criadoEm || 0
            ) -

            new Date(
                a.criadoEm || 0
            )

    );


    if (!relatorios.length) {

        lista.innerHTML =
            `<div class="vazio">
                Nenhum relatório salvo.
            </div>`;

        return;

    }


    lista.innerHTML = "";


    relatorios.forEach(
        relatorio => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "card";


            const local = [

                relatorio.cidade,

                relatorio.predio

            ]
                .filter(Boolean)
                .join(" - ");


            const concluido =
                relatorio.status ===
                "concluido";


            card.innerHTML = `

                <strong>
                    ${escaparHTML(
                        relatorio.titulo ||
                        "Relatório"
                    )}
                </strong>

                <div class="meta">
                    ${escaparHTML(
                        local ||
                        relatorio.local ||
                        ""
                    )}
                </div>

                <div class="meta">
                    ${formatarData(
                        relatorio.data
                    )}

                    ·

                    ${escaparHTML(
                        relatorio.responsavel ||
                        ""
                    )}
                </div>

                <div style="margin-top:8px;">

                    <span class="status ${
                        concluido
                            ? "concluido"
                            : ""
                    }">

                        ${
                            concluido
                                ? "Concluído"
                                : "Em andamento"
                        }

                    </span>

                </div>

                <button
                    class="botao botao-secundario"
                    data-abrir="${
                        escaparHTML(
                            relatorio.id
                        )
                    }"
                >
                    Abrir relatório
                </button>

            `;


            lista.appendChild(
                card
            );

        }
    );


    lista
        .querySelectorAll(
            "[data-abrir]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () =>
                        abrirRelatorio(
                            botao.dataset.abrir
                        )
                );

            }
        );

}


// ============================================================
// 7. CRIAR RELATÓRIO
// ============================================================

async function criarRelatorio() {

    const titulo =
        el("titulo")
            .value
            .trim();

    const cidade =
        el("cidade")
            .value;

    const predio =
        el("predio")
            .value;

    const responsavel =
        el("responsavel")
            .value
            .trim();

    const data =
        el("data")
            .value ||
        dataHoje();


    if (!titulo) {

        aviso(
            "Informe um título para o relatório."
        );

        return;

    }


    if (!cidade) {

        aviso(
            "Selecione a cidade."
        );

        return;

    }


    if (!predio) {

        aviso(
            "Selecione o prédio / unidade."
        );

        return;

    }


    const agora =
        new Date().toISOString();


    relatorioAtual = {

        id:
            AppVistoriasDB.gerarId(),

        titulo,

        cidade,

        predio,

        // Compatibilidade com V1.
        local:
            `${cidade} - ${predio}`,

        responsavel,

        data,

        // Reservado para futura disciplina.
        disciplina:
            null,

        status:
            "em_andamento",

        criadoEm:
            agora,

        atualizadoEm:
            agora

    };


    await AppVistoriasDB.salvar(
        "relatorios",
        relatorioAtual
    );


    limparFormularioRelatorio();


    await mostrarRelatorio(
        relatorioAtual
    );


    mostrarTela(
        "tela-relatorio"
    );

}


// ============================================================
// 8. ABRIR RELATÓRIO
// ============================================================

async function abrirRelatorio(id) {

    const relatorio =
        await AppVistoriasDB.buscar(
            "relatorios",
            id
        );


    if (!relatorio) {

        aviso(
            "Não foi possível encontrar o relatório."
        );

        return;

    }


    relatorioAtual =
        relatorio;


    await mostrarRelatorio(
        relatorio
    );


    mostrarTela(
        "tela-relatorio"
    );

}


// ============================================================
// 9. MOSTRAR RELATÓRIO
// ============================================================

async function mostrarRelatorio(
    relatorio
) {

    el("relatorio-titulo")
        .textContent =
            relatorio.titulo ||
            "Relatório";


    const local = [

        relatorio.cidade,

        relatorio.predio

    ]
        .filter(Boolean)
        .join(" - ");


    el("relatorio-info")
        .textContent = [

            local ||
            relatorio.local,

            formatarData(
                relatorio.data
            ),

            relatorio.responsavel

        ]
            .filter(Boolean)
            .join(" · ");


    const concluido =
        relatorio.status ===
        "concluido";


    el("status-relatorio")
        .innerHTML = `

            <span class="status ${
                concluido
                    ? "concluido"
                    : ""
            }">

                ${
                    concluido
                        ? "Concluído"
                        : "Em andamento"
                }

            </span>

        `;


    // --------------------------------------------------------
    // Ações do relatório
    // --------------------------------------------------------

    const btnNovoRegistro =
        el("btn-novo-registro");

    const btnRevisar =
        el("btn-revisar");


    if (concluido) {

        btnNovoRegistro.style.display =
            "none";

        btnRevisar.style.display =
            "none";

    } else {

        btnNovoRegistro.style.display =
            "block";

        btnRevisar.style.display =
            "block";

    }


    // --------------------------------------------------------
    // Carrega os registros.
    //
    // A função carregarRegistros também recebe
    // o estado atual do relatório para controlar
    // as ações de cada registro.
    // --------------------------------------------------------

    await carregarRegistros(
        relatorio.id
    );


    // --------------------------------------------------------
    // Retificação
    //
    // O botão é criado dinamicamente na área
    // inferior da tela do relatório.
    // --------------------------------------------------------

    let btnRetificar =
        el("btn-retificar-relatorio");


    if (!btnRetificar) {

        btnRetificar =
            document.createElement(
                "button"
            );

        btnRetificar.id =
            "btn-retificar-relatorio";

        btnRetificar.className =
            "botao botao-secundario";

        btnRetificar.textContent =
            "↩ Retificar relatório";


        const btnGerarPDF =
            el("btn-gerar-pdf");


        btnGerarPDF
            .parentElement
            .insertBefore(
                btnRetificar,
                btnGerarPDF
            );


        btnRetificar.addEventListener(
            "click",
            retificarRelatorio
        );

    }


    btnRetificar.style.display =
        concluido
            ? "block"
            : "none";

}


// ============================================================
// 10. REGISTROS
// ============================================================

async function listarRegistrosDoRelatorio(
    relatorioId
) {

    const todos =
        await AppVistoriasDB.listar(
            "registros"
        );


    return todos

        .filter(
            registro =>
                registro.relatorioId ===
                relatorioId
        )

        .sort(
            (a, b) =>

                Number(
                    a.ordem || 0
                ) -

                Number(
                    b.ordem || 0
                )

        );

}


async function carregarRegistros(
    relatorioId
) {

    const lista =
        el("lista-registros");


    const registros =
        await listarRegistrosDoRelatorio(
            relatorioId
        );


    if (!registros.length) {

        lista.innerHTML =
            `<div class="vazio">
                Nenhum registro adicionado.
            </div>`;

        return;

    }


    lista.innerHTML = "";


    registros.forEach(
        (registro, indice) => {

            const elemento =
                document.createElement(
                    "article"
                );


            elemento.className =
                "registro";


            const fotos =
                Array.isArray(
                    registro.fotos
                )
                    ? registro.fotos
                    : [];


            elemento.innerHTML = `

                <div class="registro-cabecalho">

                    <span class="registro-numero">

                        ${String(
                            indice + 1
                        ).padStart(
                            2,
                            "0"
                        )}

                    </span>


                    <span class="tipo ${
                        classeTipo(
                            registro.tipo
                        )
                    }">

                        ${escaparHTML(
                            obterNomeTipo(
                                registro.tipo
                            )
                        )}

                    </span>

                </div>


                <div class="registro-observacao">

                    ${escaparHTML(
                        registro.observacao ||
                        ""
                    )}

                </div>


                <div class="meta"
                     style="margin-top:8px;">

                    📷 ${fotos.length}

                    ${
                        fotos.length === 1
                            ? "foto"
                            : "fotos"
                    }

                </div>


<div class="acoes-registro">

    <div
        class="reordenar-registro"
        style="
            display:flex;
            justify-content:flex-end;
            align-items:center;
            gap:6px;
            margin-bottom:10px;
        "
    >

        <span
            style="
                font-size:13px;
                color:#666;
                margin-right:4px;
            "
        >
            Reordenar
        </span>


        <button
            class="botao botao-secundario botao-pequeno"
            data-acao="cima"
            title="Mover registro para cima"
            aria-label="Mover registro para cima"
            style="
                min-width:42px;
                padding:8px 12px;
            "
            ${
                indice === 0
                    ? "disabled"
                    : ""
            }
        >
            ↑
        </button>


        <button
            class="botao botao-secundario botao-pequeno"
            data-acao="baixo"
            title="Mover registro para baixo"
            aria-label="Mover registro para baixo"
            style="
                min-width:42px;
                padding:8px 12px;
            "
            ${
                indice ===
                registros.length - 1
                    ? "disabled"
                    : ""
            }
        >
            ↓
        </button>

    </div>


    <div
        style="
            display:flex;
            gap:10px;
        "
    >

        <button
            class="botao botao-secundario botao-pequeno"
            data-acao="visualizar"
            style="flex:1;"
        >
            Visualizar
        </button>


        <button
            class="botao botao-secundario botao-pequeno"
            data-acao="editar"
            style="flex:1;"
        >
            Editar
        </button>

    </div>

</div>

            `;


            elemento
                .querySelector(
                    '[data-acao="visualizar"]'
                )
                .addEventListener(
                    "click",
                    () =>
                        visualizarRegistro(
                            registro
                        )
                );


            elemento
                .querySelector(
                    '[data-acao="editar"]'
                )
                .addEventListener(
                    "click",
                    () =>
                        prepararEdicao(
                            registro
                        )
                );


            elemento
                .querySelector(
                    '[data-acao="cima"]'
                )
                .addEventListener(
                    "click",
                    () =>
                        moverRegistro(
                            registro.id,
                            -1
                        )
                );


            elemento
                .querySelector(
                    '[data-acao="baixo"]'
                )
                .addEventListener(
                    "click",
                    () =>
                        moverRegistro(
                            registro.id,
                            1
                        )
                );


            lista.appendChild(
                elemento
            );

        }
    );

}


// ============================================================
// 11. TIPOS DE REGISTRO
// ============================================================

function obterNomeTipo(tipo) {

    const nomes = {

        concluida:
            "Atividade concluída",

        pendencia:
            "Pendência de serviço",

        problema:
            "Problema / anomalia"

    };


    return (
        nomes[tipo] ||
        "Registro"
    );

}


function classeTipo(tipo) {

    const classes = {

        concluida:
            "tipo-concluida",

        pendencia:
            "tipo-pendencia",

        problema:
            "tipo-problema"

    };


    return (
        classes[tipo] ||
        ""
    );

}


// ============================================================
// 12. NOVO REGISTRO
// ============================================================

function novoRegistro() {
    if (
        relatorioAtual &&
        relatorioAtual.status ===
            "concluido"
    ) {

        aviso(
            "Este relatório está concluído. " +
            "Use \"Retificar relatório\" para realizar alterações."
        );

        return;

    }
    registroEmEdicao =
        null;

    tipoRegistroAtual =
        null;

    fotosTemporarias =
        [];


    el("titulo-tela-registro")
        .textContent =
            "Novo registro";


    el("form-registro")
        .style.display =
            "none";


    el("btn-excluir-registro")
        .style.display =
            "none";


    el("observacao")
        .value = "";


    el("salvamento-status")
        .textContent = "";


    delete el(
        "form-registro"
    ).dataset.rascunhoId;


    renderizarFotos();


    mostrarTela(
        "tela-registro"
    );

}


function selecionarTipo(tipo) {

    tipoRegistroAtual =
        tipo;


    el("titulo-tipo-registro")
        .textContent =
            obterNomeTipo(
                tipo
            );


    el("form-registro")
        .style.display =
            "block";


    window.scrollTo({

        top:
            document.body.scrollHeight,

        behavior:
            "smooth"

    });

}


// ============================================================
// 13. EDITAR REGISTRO
// ============================================================

async function prepararEdicao(
    registro
) {
    if (
        relatorioAtual &&
        relatorioAtual.status ===
            "concluido"
    ) {

        aviso(
            "Este relatório está concluído. " +
            "Use \"Retificar relatório\" para realizar alterações."
        );

        return;

    }
    registroEmEdicao =
        registro;

    tipoRegistroAtual =
        registro.tipo;


    el("titulo-tela-registro")
        .textContent =
            "Editar registro";


    el("titulo-tipo-registro")
        .textContent =
            obterNomeTipo(
                registro.tipo
            );


    el("observacao")
        .value =
            registro.observacao ||
            "";


    fotosTemporarias =
        await prepararFotosParaEdicao(
            registro.fotos ||
            []
        );


    renderizarFotos();


    el("form-registro")
        .style.display =
            "block";


    el("btn-excluir-registro")
        .style.display =
            "block";


    mostrarTela(
        "tela-registro"
    );

}


// ============================================================
// 14. FOTOS ANTIGAS E NOVAS
// ============================================================

async function prepararFotosParaEdicao(
    fotos
) {

    const resultado =
        [];


    for (
        const foto of fotos
    ) {

        // ----------------------------------------------------
        // Foto nova:
        // objeto contendo Blob.
        // ----------------------------------------------------

        if (
            foto &&
            typeof foto === "object" &&
            foto.blob
        ) {

            resultado.push({

                blob:
                    foto.blob,

                thumb:
                    foto.thumb ||
                    foto.blob,

                url:
                    URL.createObjectURL(
                        foto.thumb ||
                        foto.blob
                    ),

                lat:
                    foto.lat ??
                    null,

                lng:
                    foto.lng ??
                    null,

                precisao:
                    foto.precisao ??
                    null,

                capturadaEm:
                    foto.capturadaEm ||
                    null,

                origem:
                    foto.origem ||
                    null,

                carimbada:
                    foto.carimbada !== false

            });


            continue;

        }


        // ----------------------------------------------------
        // Foto antiga:
        // DataURL da V1.
        //
        // É convertida para Blob quando o registro é editado.
        // ----------------------------------------------------

        if (
            typeof foto ===
            "string"
        ) {

            try {

                const blob =
                    await dataURLParaBlob(
                        foto
                    );


                const thumb =
                    await criarMiniatura(
                        blob
                    );


                resultado.push({

                    blob,

                    thumb,

                    url:
                        URL.createObjectURL(
                            thumb
                        ),

                    lat:
                        null,

                    lng:
                        null,

                    precisao:
                        null,

                    capturadaEm:
                        null,

                    // Foto antiga não recebeu o novo
                    // carimbo/GPS.
                    carimbada:
                        false

                });

            } catch (erro) {

                console.error(
                    "Erro ao converter foto antiga:",
                    erro
                );

            }

        }

    }


    return resultado;

}


function dataURLParaBlob(
    dataURL
) {

    return fetch(
        dataURL
    )
        .then(
            resposta =>
                resposta.blob()
        );

}


// ============================================================
// 15. RENDERIZAR FOTOS
// ============================================================

function renderizarFotos() {

    const lista =
        el("lista-fotos");


    lista.innerHTML =
        "";


    fotosTemporarias
        .forEach(
            (foto, indice) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "foto-editor";


                item.innerHTML = `

                    <img
                        src="${foto.url}"
                        alt="Foto ${
                            indice + 1
                        }"
                    >


                    <div class="meta"
                         style="margin:6px 0;">

                        Foto ${
                            indice + 1
                        }

                    </div>


                    <div class="foto-acoes">

                        <button
                            type="button"
                            data-acao="abrir"
                        >
                            Ampliar
                        </button>


                        <button
                            type="button"
                            data-acao="remover"
                        >
                            Remover
                        </button>

                    </div>

                `;


                item
                    .querySelector(
                        '[data-acao="abrir"]'
                    )
                    .addEventListener(
                        "click",
                        () =>
                            abrirFotoAmpliada(
                                foto.blob
                            )
                    );


                item
                    .querySelector(
                        '[data-acao="remover"]'
                    )
                    .addEventListener(
                        "click",
                        () =>
                            removerFoto(
                                indice
                            )
                    );


                lista.appendChild(
                    item
                );

            }
        );

}


function removerFoto(
    indice
) {

    const foto =
        fotosTemporarias[
            indice
        ];


    if (foto?.url) {

        URL.revokeObjectURL(
            foto.url
        );

    }


    fotosTemporarias.splice(
        indice,
        1
    );


    renderizarFotos();


    agendarAutoSalvar();

}


// ============================================================
// 16. ADICIONAR FOTOS
// ============================================================

async function adicionarArquivos(
    arquivos,
    origem = "camera"
) {

    for (
        const arquivo of
        Array.from(arquivos)
    ) {

        if (
            !arquivo.type.startsWith(
                "image/"
            )
        ) {

            continue;

        }


        try {

            const foto =
                await processarNovaFoto(
                    arquivo,
                    origem
                );


            fotosTemporarias.push(
                foto
            );


            renderizarFotos();


            agendarAutoSalvar();

        } catch (erro) {

            console.error(
                erro
            );


            aviso(
                erro.message ||
                "Não foi possível adicionar a fotografia."
            );

        }

    }

}


async function processarNovaFoto(
    arquivo,
    origem = "camera"
) {

    const agora =
        new Date();


    let localizacao = null;


    // --------------------------------------------------------
    // GPS somente para fotos tiradas pela câmera
    // --------------------------------------------------------

    if (
        origem === "camera"
    ) {

        localizacao =
            await obterLocalizacaoObrigatoria();

    }


    // --------------------------------------------------------
    // Processa a fotografia
    // --------------------------------------------------------

    const fotoCarimbada =
        await processarFotoComCarimbo(
            arquivo,
            localizacao,
            agora,
            origem
        );


    // --------------------------------------------------------
    // Cria miniatura
    // --------------------------------------------------------

    const thumb =
        await criarMiniatura(
            fotoCarimbada
        );


    return {

        blob:
            fotoCarimbada,

        thumb,

        url:
            URL.createObjectURL(
                thumb
            ),

        lat:
            localizacao
                ? localizacao.lat
                : null,

        lng:
            localizacao
                ? localizacao.lng
                : null,

        precisao:
            localizacao
                ? localizacao.accuracy
                : null,

        capturadaEm:
            agora.toISOString(),

        origem:
            origem === "galeria"
                ? "Armazenamento"
                : "Câmera",

        carimbada:
            true

    };

}


// ============================================================
// 17. GPS OBRIGATÓRIO
// ============================================================

function obterLocalizacaoObrigatoria() {

    return new Promise(
        (resolve, reject) => {

            if (
                !navigator.geolocation
            ) {

                reject(
                    new Error(
                        "Este aparelho/navegador não disponibiliza GPS."
                    )
                );

                return;

            }


            navigator.geolocation.getCurrentPosition(

                posicao => {

                    const coords =
                        posicao.coords;


                    if (
                        typeof coords.latitude !==
                            "number" ||

                        typeof coords.longitude !==
                            "number"
                    ) {

                        reject(
                            new Error(
                                "Não foi possível obter uma localização GPS válida."
                            )
                        );

                        return;

                    }


                    resolve({

                        lat:
                            coords.latitude,

                        lng:
                            coords.longitude,

                        accuracy:
                            coords.accuracy

                    });

                },


                erro => {

                    let mensagem =
                        "Não foi possível obter a localização GPS.";


                    if (
                        erro.code ===
                        1
                    ) {

                        mensagem =
                            "Permita o acesso à localização para registrar a fotografia.";

                    }


                    if (
                        erro.code ===
                        2
                    ) {

                        mensagem =
                            "A localização GPS está indisponível. Tente novamente.";

                    }


                    if (
                        erro.code ===
                        3
                    ) {

                        mensagem =
                            "O GPS demorou para responder. Tente novamente.";

                    }


                    reject(
                        new Error(
                            mensagem
                        )
                    );

                },


                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        15000,

                    maximumAge:
                        0

                }

            );

        }
    );

}


// ============================================================
// 18. CARREGAR IMAGEM
// ============================================================

function carregarImagem(
    arquivoOuBlob
) {

    return new Promise(
        (resolve, reject) => {

            const url =
                URL.createObjectURL(
                    arquivoOuBlob
                );


            const imagem =
                new Image();


            imagem.onload =
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                    resolve(
                        imagem
                    );

                };


            imagem.onerror =
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                    reject(
                        new Error(
                            "Não foi possível processar a fotografia."
                        )
                    );

                };


            imagem.src =
                url;

        }
    );

}


// ============================================================
// 19. PROCESSAR FOTO
// COMPRESSÃO + CARIMBO
// ============================================================

async function processarFotoComCarimbo(

    arquivo,

    localizacao,

    dataHora,

    origem = "camera"

) {

    const imagem =
        await carregarImagem(
            arquivo
        );


    const maxDimensao =
        1600;


    let largura =
        imagem.naturalWidth;


    let altura =
        imagem.naturalHeight;


    if (
        largura >
            maxDimensao ||

        altura >
            maxDimensao
    ) {

        const fator =
            Math.min(

                maxDimensao /
                    largura,

                maxDimensao /
                    altura

            );


        largura =
            Math.round(
                largura * fator
            );


        altura =
            Math.round(
                altura * fator
            );

    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        largura;

    canvas.height =
        altura;


    const contexto =
        canvas.getContext(
            "2d"
        );


    contexto.drawImage(

        imagem,

        0,

        0,

        largura,

        altura

    );


    // --------------------------------------------------------
    // Texto do carimbo
    // --------------------------------------------------------

    const dataFormatada =
        dataHora.toLocaleString(
            "pt-BR",
            {
                dateStyle:
                    "short",

                timeStyle:
                    "medium"
            }
        );


const linhaLocalizacao =

    origem === "galeria"

        ? "Armazenamento"

        : (
            `${localizacao.lat.toFixed(6)}, ` +

            `${localizacao.lng.toFixed(6)} ` +

            `(±${Math.round(
                localizacao.accuracy
            )} m)`
        );


    const alturaCarimbo =
        Math.max(

            72,

            Math.round(
                altura * 0.07
            )

        );


    // --------------------------------------------------------
    // Fundo do carimbo
    // --------------------------------------------------------

    contexto.fillStyle =
        "rgba(0,0,0,0.72)";


    contexto.fillRect(

        0,

        altura -
            alturaCarimbo,

        largura,

        alturaCarimbo

    );


    // --------------------------------------------------------
    // Data/hora
    // --------------------------------------------------------

    const tamanhoFonte =
        Math.max(

            18,

            Math.round(
                largura * 0.018
            )

        );


    contexto.fillStyle =
        "#ffffff";


    contexto.font =
        `bold ${tamanhoFonte}px Arial`;


    contexto.textBaseline =
        "top";


    contexto.fillText(

        dataFormatada,

        16,

        altura -
            alturaCarimbo +
            10

    );


    // --------------------------------------------------------
    // GPS
    // --------------------------------------------------------

// --------------------------------------------------------
// Localização / origem
// --------------------------------------------------------

contexto.font =
    `${Math.max(
        15,
        tamanhoFonte - 3
    )}px Arial`;


contexto.fillText(

    origem === "galeria"
        ? "Origem: Armazenamento"
        : `GPS: ${linhaLocalizacao}`,

    16,

    altura -
        alturaCarimbo +
        10 +
        tamanhoFonte +
        4

);


    return new Promise(
        (resolve, reject) => {

            canvas.toBlob(

                blob => {

                    if (!blob) {

                        reject(
                            new Error(
                                "Não foi possível gerar a fotografia processada."
                            )
                        );

                        return;

                    }


                    resolve(
                        blob
                    );

                },

                "image/jpeg",

                0.88

            );

        }
    );

}


// ============================================================
// 20. MINIATURA
// ============================================================

async function criarMiniatura(
    blob
) {

    const imagem =
        await carregarImagem(
            blob
        );


    const maxDimensao =
        320;


    let largura =
        imagem.naturalWidth;


    let altura =
        imagem.naturalHeight;


    if (
        largura >
            maxDimensao ||

        altura >
            maxDimensao
    ) {

        const fator =
            Math.min(

                maxDimensao /
                    largura,

                maxDimensao /
                    altura

            );


        largura =
            Math.round(
                largura * fator
            );


        altura =
            Math.round(
                altura * fator
            );

    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        largura;

    canvas.height =
        altura;


    canvas
        .getContext("2d")
        .drawImage(

            imagem,

            0,

            0,

            largura,

            altura

        );


    return new Promise(
        (resolve, reject) => {

            canvas.toBlob(

                blobMiniatura => {

                    if (
                        !blobMiniatura
                    ) {

                        reject(
                            new Error(
                                "Não foi possível criar a miniatura."
                            )
                        );

                        return;

                    }


                    resolve(
                        blobMiniatura
                    );

                },

                "image/jpeg",

                0.72

            );

        }
    );

}


// ============================================================
// 21. SALVAR REGISTRO
// ============================================================

async function salvarRegistro() {

    if (!relatorioAtual) {

        aviso(
            "Nenhum relatório está aberto."
        );

        return;

    }


    if (!tipoRegistroAtual) {

        aviso(
            "Selecione o tipo do registro."
        );

        return;

    }


    const observacao =
        el("observacao")
            .value
            .trim();


    if (!observacao) {

        aviso(
            "Informe uma observação."
        );

        return;

    }


    if (!fotosTemporarias.length) {

        aviso(
            "Adicione pelo menos uma fotografia."
        );

        return;

    }


    const fotos =
        fotosTemporarias
            .map(
                foto => ({

                    blob:
                        foto.blob,

                    thumb:
                        foto.thumb,

                    lat:
                        foto.lat,

                    lng:
                        foto.lng,

                    precisao:
                        foto.precisao,

                    capturadaEm:
                        foto.capturadaEm,

                    origem:
                        foto.origem,

                    carimbada:
                        foto.carimbada

                })
            );


    // --------------------------------------------------------
    // EDIÇÃO
    // --------------------------------------------------------

    if (
        registroEmEdicao
    ) {

        const registro = {

            ...registroEmEdicao,

            tipo:
                tipoRegistroAtual,

            observacao,

            fotos,

            rascunho:
                false,

            atualizadoEm:
                new Date()
                    .toISOString()

        };


        await AppVistoriasDB.salvar(

            "registros",

            registro

        );

    }


    // --------------------------------------------------------
    // NOVO REGISTRO
    // --------------------------------------------------------

    else {

        const registros =
            await listarRegistrosDoRelatorio(
                relatorioAtual.id
            );


        // Remove eventual rascunho criado
        // pelo salvamento automático.
        const rascunhos =
            registros.filter(
                registro =>
                    registro.rascunho
            );


        for (
            const rascunho of
            rascunhos
        ) {

            await AppVistoriasDB.excluir(
                "registros",
                rascunho.id
            );

        }


        const registrosFinais =
            await listarRegistrosDoRelatorio(
                relatorioAtual.id
            );


        const registro = {

            id:
                AppVistoriasDB.gerarId(),

            relatorioId:
                relatorioAtual.id,

            ordem:
                registrosFinais.length + 1,

            tipo:
                tipoRegistroAtual,

            observacao,

            fotos,

            rascunho:
                false,

            criadoEm:
                new Date()
                    .toISOString()

        };


        await AppVistoriasDB.salvar(

            "registros",

            registro

        );

    }


    relatorioAtual.atualizadoEm =
        new Date()
            .toISOString();


    await AppVistoriasDB.salvar(

        "relatorios",

        relatorioAtual

    );


    limparFormularioRegistro();


    await mostrarRelatorio(
        relatorioAtual
    );


    mostrarTela(
        "tela-relatorio"
    );

}


// ============================================================
// 22. SALVAMENTO AUTOMÁTICO
// ============================================================

function agendarAutoSalvar() {

    clearTimeout(
        autosaveTimer
    );


    autosaveTimer =
        setTimeout(

            salvarRascunhoAutomaticamente,

            1200

        );

}


async function salvarRascunhoAutomaticamente() {

    if (!relatorioAtual) {

        return;

    }


    if (
        !el("tela-registro")
            .classList
            .contains("ativa")
    ) {

        return;

    }


    if (!tipoRegistroAtual) {

        return;

    }


    const observacao =
        el("observacao")
            .value
            .trim();


    if (
        !observacao &&
        !fotosTemporarias.length
    ) {

        return;

    }


    const fotos =
        fotosTemporarias
            .map(
                foto => ({

                    blob:
                        foto.blob,

                    thumb:
                        foto.thumb,

                    lat:
                        foto.lat,

                    lng:
                        foto.lng,

                    precisao:
                        foto.precisao,

                    capturadaEm:
                        foto.capturadaEm,

                    carimbada:
                        foto.carimbada

                })
            );


    // --------------------------------------------------------
    // Edição
    // --------------------------------------------------------

    if (
        registroEmEdicao
    ) {

        await AppVistoriasDB.salvar(

            "registros",

            {

                ...registroEmEdicao,

                tipo:
                    tipoRegistroAtual,

                observacao,

                fotos,

                atualizadoEm:
                    new Date()
                        .toISOString()

            }

        );


        el(
            "salvamento-status"
        ).textContent =
            "Salvo automaticamente ✓";


        return;

    }


    // --------------------------------------------------------
    // Novo registro
    // --------------------------------------------------------

    let rascunhoId =
        el(
            "form-registro"
        )
            .dataset
            .rascunhoId;


    if (!rascunhoId) {

        rascunhoId =
            AppVistoriasDB.gerarId();


        el(
            "form-registro"
        )
            .dataset
            .rascunhoId =
                rascunhoId;

    }


    const existente =
        await AppVistoriasDB.buscar(

            "registros",

            rascunhoId

        );


    const registros =
        await listarRegistrosDoRelatorio(

            relatorioAtual.id

        );


    await AppVistoriasDB.salvar(

        "registros",

        {

            id:
                rascunhoId,

            relatorioId:
                relatorioAtual.id,

            ordem:
                existente?.ordem ||
                registros.length + 1,

            tipo:
                tipoRegistroAtual,

            observacao,

            fotos,

            rascunho:
                true,

            criadoEm:
                existente?.criadoEm ||
                new Date()
                    .toISOString(),

            atualizadoEm:
                new Date()
                    .toISOString()

        }

    );


    el(
        "salvamento-status"
    ).textContent =
        "Rascunho salvo automaticamente ✓";

}


// ============================================================
// 23. EXCLUSÃO
// ============================================================

async function excluirRegistro() {

    if (!registroEmEdicao) {

        return;

    }


    if (
        !confirm(

            "Excluir este registro?\n\n" +

            "Esta ação não poderá ser desfeita."

        )
    ) {

        return;

    }


    await AppVistoriasDB.excluir(

        "registros",

        registroEmEdicao.id

    );


    await renumerarRegistros(

        registroEmEdicao.relatorioId

    );


    limparFormularioRegistro();


    await mostrarRelatorio(

        relatorioAtual

    );


    mostrarTela(

        "tela-relatorio"

    );

}


async function renumerarRegistros(
    relatorioId
) {

    const registros =
        await listarRegistrosDoRelatorio(

            relatorioId

        );


    for (
        let i = 0;

        i < registros.length;

        i++
    ) {

        if (
            registros[i].ordem !==
            i + 1
        ) {

            await AppVistoriasDB.salvar(

                "registros",

                {

                    ...registros[i],

                    ordem:
                        i + 1

                }

            );

        }

    }

}


// ============================================================
// 24. REORDENAÇÃO
// ============================================================

async function moverRegistro(

    id,

    deslocamento

) {

    const registros =
        await listarRegistrosDoRelatorio(

            relatorioAtual.id

        );


    const indice =
        registros.findIndex(

            registro =>
                registro.id ===
                id

        );


    const novoIndice =
        indice +
        deslocamento;


    if (

        indice < 0 ||

        novoIndice < 0 ||

        novoIndice >=
            registros.length

    ) {

        return;

    }


    const atual =
        registros[indice];


    const outro =
        registros[novoIndice];


    const ordemAtual =
        atual.ordem;


    atual.ordem =
        outro.ordem;


    outro.ordem =
        ordemAtual;


    await AppVistoriasDB.salvar(

        "registros",

        atual

    );


    await AppVistoriasDB.salvar(

        "registros",

        outro

    );


    await mostrarRelatorio(

        relatorioAtual

    );

}


// ============================================================
// 25. REVISÃO
// ============================================================

async function abrirRevisao() {

    if (!relatorioAtual) {

        return;

    }


    const registros =
        await listarRegistrosDoRelatorio(

            relatorioAtual.id

        );


    if (!registros.length) {

        aviso(

            "Adicione pelo menos um registro antes da revisão."

        );

        return;

    }


    const local = [

        relatorioAtual.cidade,

        relatorioAtual.predio

    ]
        .filter(Boolean)
        .join(" - ");


    const conteudo =
        el(
            "conteudo-revisao"
        );


    conteudo.innerHTML = `

        <div class="revisao">

            <h3>
                ${escaparHTML(
                    relatorioAtual.titulo
                )}
            </h3>

            <p>
                <strong>Local:</strong>
                ${escaparHTML(local)}
            </p>

            <p>
                <strong>Data:</strong>
                ${formatarData(
                    relatorioAtual.data
                )}
            </p>

            <p>
                <strong>Responsável:</strong>
                ${escaparHTML(
                    relatorioAtual.responsavel ||
                    "—"
                )}
            </p>

            <p>
                <strong>Registros:</strong>
                ${registros.length}
            </p>

        </div>

    `;


    registros.forEach(
        (registro, indice) => {

            const bloco =
                document.createElement(
                    "div"
                );


            bloco.className =
                "revisao";


            const fotos =
                Array.isArray(
                    registro.fotos
                )
                    ? registro.fotos
                    : [];


            bloco.innerHTML = `

                <h3>

                    ${String(
                        indice + 1
                    ).padStart(
                        2,
                        "0"
                    )}

                    —

                    ${escaparHTML(
                        obterNomeTipo(
                            registro.tipo
                        )
                    )}

                </h3>


                <p style="white-space:pre-wrap;">

                    ${escaparHTML(
                        registro.observacao ||
                        ""
                    )}

                </p>


                <div class="meta">

                    ${fotos.length}
                    foto(s)

                </div>


                <div class="lista-fotos">
                </div>

            `;


            const listaFotos =
                bloco.querySelector(
                    ".lista-fotos"
                );


            fotos.forEach(
                (
                    foto,
                    fotoIndice
                ) => {

                    const imagem =
                        document.createElement(
                            "img"
                        );


                    imagem.className =
                        "revisao-foto";


                    imagem.alt =
                        `Foto ${
                            fotoIndice + 1
                        }`;


                    const url =
                        obterUrlFoto(
                            foto
                        );


                    imagem.src =
                        url;


                    imagem.addEventListener(
                        "click",
                        async () => {

                            const blob =
                                await obterBlobFoto(
                                    foto
                                );


                            abrirFotoAmpliada(
                                blob
                            );

                        }
                    );


                    listaFotos.appendChild(
                        imagem
                    );

                }
            );


            conteudo.appendChild(
                bloco
            );

        }
    );


    mostrarTela(
        "tela-revisao"
    );

}


// ============================================================
// 26. CONCLUIR
// ============================================================

async function concluirRelatorio() {

    if (!relatorioAtual) {

        return;

    }


    const registros =
        await listarRegistrosDoRelatorio(

            relatorioAtual.id

        );


    if (!registros.length) {

        aviso(

            "Não é possível concluir um relatório sem registros."

        );

        return;

    }


    // --------------------------------------------------------
    // Confere GPS/carimbo.
    // --------------------------------------------------------

    for (
        const registro of
        registros
    ) {

        for (
            const foto of
            registro.fotos || []
        ) {

            // Fotos antigas da V1 são permitidas
            // para preservar dados já existentes.
            //
            // Fotos novas, porém, precisam ter
            // GPS + carimbo.

            if (
                foto &&
                typeof foto ===
                    "object" &&
                foto.blob
            ) {

                // ------------------------------------------------
                // Fotos da galeria / armazenamento:
                // GPS e carimbo não são obrigatórios.
                // ------------------------------------------------

                if (
                    foto.origem ===
                    "Armazenamento"
                ) {

                    continue;

                }


                // ------------------------------------------------
                // Fotos da câmera:
                // GPS + carimbo são obrigatórios.
                // ------------------------------------------------

                if (
                    foto.lat == null ||
                    foto.lng == null ||
                    foto.carimbada !== true
                ) {

                    aviso(

                        "Existe uma fotografia nova da câmera " +
                        "sem GPS/carimbo válido."

                    );

                    return;

                }

            }

        }

    }


    if (
        !confirm(

            "Concluir este relatório?\n\n" +

            "Ele continuará armazenado no aparelho " +

            "e será identificado como concluído."

        )
    ) {

        return;

    }


    relatorioAtual.status =
        "concluido";


    relatorioAtual.atualizadoEm =
        new Date()
            .toISOString();


    await AppVistoriasDB.salvar(

        "relatorios",

        relatorioAtual

    );


    await carregarRelatorios();


    mostrarTela(
        "tela-inicio"
    );

}
// ============================================================
// 26.1 RETIFICAR RELATÓRIO
// ============================================================

async function retificarRelatorio() {

    if (!relatorioAtual) {

        return;

    }


    if (
        relatorioAtual.status !==
        "concluido"
    ) {

        aviso(
            "Este relatório já está em andamento."
        );

        return;

    }


    const confirmar =
        confirm(

            "Retificar este relatório?\n\n" +

            "O relatório voltará para " +
            "\"Em andamento\" e poderá ser editado novamente.\n\n" +

            "Os registros, fotos, observações e " +
            "ordem atual serão preservados."

        );


    if (!confirmar) {

        return;

    }


    relatorioAtual.status =
        "em_andamento";


    relatorioAtual.versao =
        (
            Number(
                relatorioAtual.versao ||
                1
            ) + 1
        );


    relatorioAtual.retificadoEm =
        new Date()
            .toISOString();


    relatorioAtual.atualizadoEm =
        new Date()
            .toISOString();


    await AppVistoriasDB.salvar(

        "relatorios",

        relatorioAtual

    );


    await mostrarRelatorio(

        relatorioAtual

    );


    mostrarTela(
        "tela-relatorio"
    );

}

// ============================================================
// 27. VISUALIZAÇÃO SIMPLES
// ============================================================

async function visualizarRegistro(
    registro
) {

    const fotos =
        Array.isArray(
            registro.fotos
        )
            ? registro.fotos
            : [];


    let texto =

        `${obterNomeTipo(
            registro.tipo
        )}\n\n` +

        `${registro.observacao || ""}\n\n` +

        `Fotos: ${fotos.length}`;


    aviso(
        texto
    );

}


// ============================================================
// 28. UTILIDADES DE FOTOS
// ============================================================

async function obterBlobFoto(
    foto
) {

    if (
        foto &&
        typeof foto ===
            "object" &&
        foto.blob
    ) {

        return foto.blob;

    }


    if (
        typeof foto ===
        "string"
    ) {

        return dataURLParaBlob(
            foto
        );

    }


    return null;

}


function obterUrlFoto(
    foto
) {

    if (
        foto &&
        typeof foto ===
            "object"
    ) {

        if (
            foto.thumb
        ) {

            return URL.createObjectURL(
                foto.thumb
            );

        }


        if (
            foto.blob
        ) {

            return URL.createObjectURL(
                foto.blob
            );

        }

    }


    if (
        typeof foto ===
        "string"
    ) {

        return foto;

    }


    return "";

}


function abrirFotoAmpliada(
    blob
) {

    Promise
        .resolve(blob)

        .then(
            blobResultado => {

                if (
                    !blobResultado
                ) {

                    return;

                }


                const url =

                    typeof blobResultado ===
                    "string"

                        ? blobResultado

                        : URL.createObjectURL(
                            blobResultado
                        );


                el(
                    "foto-ampliada"
                ).src =
                    url;


                el(
                    "modal-foto"
                )
                    .classList
                    .add(
                        "ativo"
                    );


                el(
                    "modal-foto"
                )
                    .dataset
                    .url =

                        typeof blobResultado ===
                        "string"

                            ? ""

                            : url;

            }
        )

        .catch(
            erro =>
                console.error(
                    erro
                )
        );

}


function fecharFotoAmpliada() {

    const modal =
        el(
            "modal-foto"
        );


    const url =
        modal.dataset.url;


    if (url) {

        URL.revokeObjectURL(
            url
        );

    }


    modal.dataset.url =
        "";


    el(
        "foto-ampliada"
    ).src =
        "";


    modal
        .classList
        .remove(
            "ativo"
        );

}


// ============================================================
// 29. LIMPAR FORMULÁRIOS
// ============================================================

function limparFormularioRelatorio() {

    el("titulo").value =
        "";


    el("cidade").value =
        "";


    el("predio").innerHTML =
        `<option value="">
            Selecione primeiro a cidade
        </option>`;


    el("predio").disabled =
        true;


    el("responsavel").value =
        "";


    el("data").value =
        dataHoje();

}


function limparFormularioRegistro() {

    clearTimeout(
        autosaveTimer
    );


    fotosTemporarias
        .forEach(
            foto => {

                if (foto.url) {

                    URL.revokeObjectURL(
                        foto.url
                    );

                }

            }
        );


    fotosTemporarias =
        [];


    registroEmEdicao =
        null;


    tipoRegistroAtual =
        null;


    el("observacao")
        .value =
            "";


    el("form-registro")
        .style.display =
            "none";


    el("btn-excluir-registro")
        .style.display =
            "none";


    el("salvamento-status")
        .textContent =
            "";


    delete el(
        "form-registro"
    ).dataset.rascunhoId;


    renderizarFotos();

}


// ============================================================
// 30. PDF
// ============================================================

async function gerarPDF() {

    if (!relatorioAtual) {

        aviso(
            "Nenhum relatório está aberto."
        );

        return;

    }


    const registros =
        await listarRegistrosDoRelatorio(

            relatorioAtual.id

        );


    if (!registros.length) {

        aviso(
            "Adicione pelo menos um registro."
        );

        return;

    }


    const janela =
        window.open(
            "",
            "_blank"
        );


    if (!janela) {

        aviso(
            "Permita pop-ups para gerar o PDF."
        );

        return;

    }


    const local = [

        relatorioAtual.cidade,

        relatorioAtual.predio

    ]
        .filter(Boolean)
        .join(" - ");


    let htmlRegistros =
        "";


    for (
        let i = 0;

        i < registros.length;

        i++
    ) {

        const registro =
            registros[i];


        let htmlFotos =
            "";


        for (
            const foto of
            registro.fotos ||
            []
        ) {

            const blob =
                await obterBlobFoto(
                    foto
                );


            if (!blob) {

                continue;

            }


            const dataURL =
                await blobParaDataURL(
                    blob
                );


            htmlFotos += `

                <div class="foto">

                    <img
                        src="${dataURL}"
                    >

                </div>

            `;

        }


        htmlRegistros += `

            <section class="registro">

                <div class="cabecalho-registro">

                    ${String(
                        i + 1
                    ).padStart(
                        2,
                        "0"
                    )}

                    —

                    ${escaparHTML(
                        obterNomeTipo(
                            registro.tipo
                        )
                    )}

                </div>


                <div class="observacao">

                    ${escaparHTML(
                        registro.observacao ||
                        ""
                    )}

                </div>


                <div class="fotos">

                    ${htmlFotos}

                </div>

            </section>

        `;

    }


    const titulo =
        escaparHTML(

            relatorioAtual.titulo ||

            "Relatório Fotográfico"

        );


    const data =
        formatarData(
            relatorioAtual.data
        );


    janela.document.write(`

        <!DOCTYPE html>

        <html lang="pt-BR">

        <head>

            <meta charset="UTF-8">

            <title>
                ${titulo}
            </title>


            <style>

                @page {

                    size: A4;

                    margin: 12mm;

                }


                body {

                    font-family:
                        Arial,
                        sans-serif;

                    color:
                        #222;

                    font-size:
                        12px;

                    margin:
                        0;

                }


                .cabecalho {

                    border-bottom:
                        2px solid #222;

                    padding-bottom:
                        12px;

                    margin-bottom:
                        16px;

                }


                .titulo {

                    font-size:
                        22px;

                    font-weight:
                        bold;

                    margin-bottom:
                        10px;

                }


                .dados {

                    display:
                        grid;

                    grid-template-columns:
                        1fr 1fr;

                    gap:
                        5px 18px;

                }


                .registro {

                    border:
                        1px solid #aaa;

                    border-radius:
                        6px;

                    padding:
                        10px;

                    margin-bottom:
                        14px;

                    page-break-inside:
                        avoid;

                }


                .cabecalho-registro {

                    font-weight:
                        bold;

                    border-bottom:
                        1px solid #ddd;

                    padding-bottom:
                        7px;

                    margin-bottom:
                        8px;

                }


                .observacao {

                    white-space:
                        pre-wrap;

                    line-height:
                        1.45;

                    margin-bottom:
                        10px;

                }


                .fotos {

                    display:
                        grid;

                    grid-template-columns:
                        1fr 1fr;

                    gap:
                        8px;

                }


                .foto {

                    height:
                        180px;

                    border:
                        1px solid #ddd;

                    overflow:
                        hidden;

                }


                .foto img {

                    width:
                        100%;

                    height:
                        100%;

                    object-fit:
                        contain;

                }


                footer {

                    margin-top:
                        20px;

                    border-top:
                        1px solid #ccc;

                    padding-top:
                        8px;

                    text-align:
                        center;

                    font-size:
                        10px;

                }

            </style>

        </head>


        <body>


            <header class="cabecalho">

                <div class="titulo">

                    ${titulo}

                </div>


                <div class="dados">

                    <div>

                        <strong>
                            Local:
                        </strong>

                        ${escaparHTML(
                            local
                        )}

                    </div>


                    <div>

                        <strong>
                            Data:
                        </strong>

                        ${data}

                    </div>


                    <div>

                        <strong>
                            Responsável:
                        </strong>

                        ${escaparHTML(
                            relatorioAtual
                                .responsavel ||
                            ""
                        )}

                    </div>


                    <div>

                        <strong>
                            Registros:
                        </strong>

                        ${registros.length}

                    </div>

                </div>

            </header>


            ${htmlRegistros}


            <footer>

                Relatório Fotográfico —
                ${data}

            </footer>


            <script>

                window.onload =
                    function() {

                        setTimeout(

                            function() {

                                window.print();

                            },

                            500

                        );

                    };

            <\/script>


        </body>

        </html>

    `);


    janela.document.close();

}


function blobParaDataURL(
    blob
) {

    return new Promise(
        (resolve, reject) => {

            const leitor =
                new FileReader();


            leitor.onload =
                () =>
                    resolve(
                        leitor.result
                    );


            leitor.onerror =
                () =>
                    reject(
                        leitor.error
                    );


            leitor.readAsDataURL(
                blob
            );

        }
    );

}


// ============================================================
// 31. EVENTOS
// ============================================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        console.log(

            `${APP_CONFIG.nome} - ` +
            `${APP_CONFIG.versao}`

        );


        el("data").value =
            dataHoje();


        carregarCatalogoLocais();


        el("cidade")
            .addEventListener(
                "change",
                atualizarPredios
            );


        await carregarRelatorios();


        // ----------------------------------------------------
        // Novo relatório
        // ----------------------------------------------------

        el("btn-novo-relatorio")
            .addEventListener(
                "click",
                () => {

                    limparFormularioRelatorio();

                    mostrarTela(
                        "tela-novo"
                    );

                }
            );


        // ----------------------------------------------------
        // Voltar início
        // ----------------------------------------------------

        el("btn-voltar-inicio")
            .addEventListener(
                "click",
                async () => {

                    await carregarRelatorios();

                    mostrarTela(
                        "tela-inicio"
                    );

                }
            );


        // ----------------------------------------------------
        // Criar relatório
        // ----------------------------------------------------

        el("btn-iniciar-relatorio")
            .addEventListener(
                "click",
                criarRelatorio
            );


        // ----------------------------------------------------
        // Voltar relatório
        // ----------------------------------------------------

        el("btn-voltar-relatorios")
            .addEventListener(
                "click",
                async () => {

                    await carregarRelatorios();

                    mostrarTela(
                        "tela-inicio"
                    );

                }
            );


        // ----------------------------------------------------
        // Novo registro
        // ----------------------------------------------------

        el("btn-novo-registro")
            .addEventListener(
                "click",
                novoRegistro
            );


        // ----------------------------------------------------
        // Tipos
        // ----------------------------------------------------

        document
            .querySelectorAll(
                ".btn-tipo"
            )
            .forEach(
                botao => {

                    botao.addEventListener(
                        "click",
                        () =>
                            selecionarTipo(
                                botao.dataset.tipo
                            )
                    );

                }
            );


        // ----------------------------------------------------
        // Salvar registro
        // ----------------------------------------------------

        el("btn-salvar-registro")
            .addEventListener(
                "click",
                salvarRegistro
            );


        // ----------------------------------------------------
        // Excluir
        // ----------------------------------------------------

        el("btn-excluir-registro")
            .addEventListener(
                "click",
                excluirRegistro
            );


        // ----------------------------------------------------
        // Voltar registro
        // ----------------------------------------------------

        el("btn-voltar-relatorio")
            .addEventListener(
                "click",
                async () => {

                    if (
                        relatorioAtual
                    ) {

                        await mostrarRelatorio(
                            relatorioAtual
                        );

                    }


                    mostrarTela(
                        "tela-relatorio"
                    );

                }
            );


        // ----------------------------------------------------
        // Revisão
        // ----------------------------------------------------

        el("btn-revisar")
            .addEventListener(
                "click",
                abrirRevisao
            );


        // ----------------------------------------------------
        // Voltar revisão
        // ----------------------------------------------------

        el("btn-voltar-revisao")
            .addEventListener(
                "click",
                async () => {

                    if (
                        relatorioAtual
                    ) {

                        await mostrarRelatorio(
                            relatorioAtual
                        );

                    }


                    mostrarTela(
                        "tela-relatorio"
                    );

                }
            );


        // ----------------------------------------------------
        // Concluir
        // ----------------------------------------------------

        el("btn-concluir")
            .addEventListener(
                "click",
                concluirRelatorio
            );


        // ----------------------------------------------------
        // Câmera
        // ----------------------------------------------------

        el("btn-tirar-foto")
            .addEventListener(
                "click",
                () =>
                    el(
                        "input-camera"
                    ).click()
            );


        // ----------------------------------------------------
        // Galeria
        // ----------------------------------------------------

        el("btn-escolher-foto")
            .addEventListener(
                "click",
                () =>
                    el(
                        "input-galeria"
                    ).click()
            );


        // ----------------------------------------------------
        // Foto câmera
        // ----------------------------------------------------

        el("input-camera")
            .addEventListener(
                "change",
                async evento => {

                    try {

                        await adicionarArquivos(
    evento.target.files,
    "camera"
);

                    } finally {

                        evento.target.value =
                            "";

                    }

                }
            );


        // ----------------------------------------------------
        // Foto galeria
        // ----------------------------------------------------

        el("input-galeria")
            .addEventListener(
                "change",
                async evento => {

                    try {

                        await adicionarArquivos(
    evento.target.files,
    "galeria"
);

                    } finally {

                        evento.target.value =
                            "";

                    }

                }
            );


        // ----------------------------------------------------
        // Observação
        // ----------------------------------------------------

        el("observacao")
            .addEventListener(
                "input",
                agendarAutoSalvar
            );


        // ----------------------------------------------------
        // Modal foto
        // ----------------------------------------------------

        el("modal-foto")
            .addEventListener(
                "click",
                evento => {

                    if (
                        evento.target ===
                        el("modal-foto")
                    ) {

                        fecharFotoAmpliada();

                    }

                }
            );


        // ----------------------------------------------------
        // ESC
        // ----------------------------------------------------

        document.addEventListener(
            "keydown",
            evento => {

                if (
                    evento.key ===
                    "Escape"
                ) {

                    fecharFotoAmpliada();

                }

            }
        );


        // ----------------------------------------------------
        // Service Worker
        // ----------------------------------------------------

        if (
            "serviceWorker" in
            navigator
        ) {

            window.addEventListener(
                "load",
                () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js",
                    {
                        updateViaCache: "none"
                    }
                )
                .then(
                    registro => {

                        registro.update();

                    }
                )
                .catch(
                    erro =>
                        console.error(
                            "Service Worker:",
                            erro
                        )
                );

                }
            );

        }

    }

);


// ============================================================
// 32. BOTÃO PDF
// ============================================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        el("btn-gerar-pdf")
            .addEventListener(
                "click",
                gerarPDF
            );

    }

);