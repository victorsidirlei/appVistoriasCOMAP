// ============================================================
// APP VISTORIAS - V1
// Aplicativo de Relatório Fotográfico
// ============================================================

const APP_CONFIG = {
    nome: "Relatório Fotográfico",
    versao: "1.0.0"
};

console.log(
    `${APP_CONFIG.nome} - versão ${APP_CONFIG.versao}`
);


// ============================================================
// ESTADO DA APLICAÇÃO
// ============================================================

let relatorioAtual = null;
let tipoRegistroAtual = null;


// ============================================================
// UTILITÁRIOS
// ============================================================

function mostrarTela(id) {

    document.querySelectorAll(".tela").forEach(tela => {
        tela.classList.remove("ativa");
    });

    document
        .getElementById(id)
        .classList.add("ativa");

    window.scrollTo(0, 0);
}


function dataHoje() {

    const agora = new Date();

    const ano = agora.getFullYear();

    const mes = String(
        agora.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        agora.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


function formatarData(data) {

    if (!data) {
        return "";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
        return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// ============================================================
// RELATÓRIOS
// ============================================================

async function carregarRelatorios() {

    const lista = document.getElementById(
        "lista-relatorios"
    );

    const relatorios =
        await AppVistoriasDB.listar("relatorios");

    relatorios.sort(
        (a, b) =>
            new Date(b.criadoEm) -
            new Date(a.criadoEm)
    );

    if (relatorios.length === 0) {

        lista.innerHTML = `
            <div class="vazio">
                Nenhum relatório salvo.
            </div>
        `;

        return;
    }

    lista.innerHTML = "";

    for (const relatorio of relatorios) {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <div class="relatorio-titulo">
                ${escaparHTML(
                    relatorio.titulo ||
                    "Relatório sem título"
                )}
            </div>

            <div class="relatorio-info">
                ${escaparHTML(
                    relatorio.local || ""
                )}
            </div>

            <div class="relatorio-info">
                ${formatarData(relatorio.data)}
                ·
                ${escaparHTML(
                    relatorio.responsavel || ""
                )}
            </div>

            <button
                class="botao botao-secundario"
                data-abrir="${relatorio.id}"
            >
                Abrir relatório
            </button>
        `;

        lista.appendChild(card);
    }

    lista
        .querySelectorAll("[data-abrir]")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => abrirRelatorio(
                    botao.dataset.abrir
                )
            );

        });
}


// ============================================================
// CRIAR RELATÓRIO
// ============================================================

async function criarRelatorio() {

    const titulo =
        document.getElementById("titulo").value.trim();

    const local =
        document.getElementById("local").value.trim();

    const responsavel =
        document.getElementById("responsavel").value.trim();

    const data =
        document.getElementById("data").value;


    if (!titulo) {

        alert(
            "Informe um título para o relatório."
        );

        return;
    }


    const agora = new Date().toISOString();


    const relatorio = {

        id: AppVistoriasDB.gerarId(),

        titulo,

        local,

        responsavel,

        data: data || dataHoje(),

        criadoEm: agora,

        atualizadoEm: agora,

        status: "em_andamento"

    };


    await AppVistoriasDB.salvar(
        "relatorios",
        relatorio
    );


    relatorioAtual = relatorio;


    limparFormularioRelatorio();

    mostrarRelatorio(relatorio);

    mostrarTela("tela-relatorio");
}


// ============================================================
// ABRIR RELATÓRIO
// ============================================================

async function abrirRelatorio(id) {

    const relatorio =
        await AppVistoriasDB.buscar(
            "relatorios",
            id
        );


    if (!relatorio) {

        alert(
            "Não foi possível encontrar o relatório."
        );

        return;
    }


    relatorioAtual = relatorio;

    mostrarRelatorio(relatorio);

    mostrarTela("tela-relatorio");
}


// ============================================================
// MOSTRAR RELATÓRIO
// ============================================================

async function mostrarRelatorio(relatorio) {

    document.getElementById(
        "relatorio-titulo"
    ).textContent =
        relatorio.titulo ||
        "Relatório";


    document.getElementById(
        "relatorio-info"
    ).textContent =
        [
            relatorio.local,
            formatarData(relatorio.data),
            relatorio.responsavel
        ]
        .filter(Boolean)
        .join(" · ");


    await carregarRegistros(
        relatorio.id
    );
}


// ============================================================
// REGISTROS
// ============================================================

async function carregarRegistros(relatorioId) {

    const lista =
        document.getElementById(
            "lista-registros"
        );


    const todos =
        await AppVistoriasDB.listar(
            "registros"
        );


    const registros =
        todos
            .filter(
                registro =>
                    registro.relatorioId ===
                    relatorioId
            )
            .sort(
                (a, b) =>
                    a.ordem - b.ordem
            );


    if (registros.length === 0) {

        lista.innerHTML = `
            <div class="vazio">
                Nenhum registro adicionado.
            </div>
        `;

        return;
    }


    lista.innerHTML = "";


    registros.forEach(
        (registro, indice) => {

            const elemento =
                document.createElement("div");

            elemento.className =
                "registro";


            const tipoTexto =
                obterNomeTipo(
                    registro.tipo
                );


            elemento.innerHTML = `

                <div class="registro-cabecalho">

                    <span class="registro-numero">
                        ${String(indice + 1).padStart(2, "0")}
                    </span>

                    <span class="tipo ${classeTipo(registro.tipo)}">
                        ${tipoTexto}
                    </span>

                </div>

                <div class="registro-observacao">
                    ${escaparHTML(
                        registro.observacao ||
                        ""
                    )}
                </div>

            `;


            lista.appendChild(elemento);
        }
    );
}


function obterNomeTipo(tipo) {

    switch (tipo) {

        case "concluida":
            return "Atividade concluída";

        case "pendencia":
            return "Pendência";

        case "problema":
            return "Problema";

        default:
            return "Registro";
    }
}


function classeTipo(tipo) {

    switch (tipo) {

        case "concluida":
            return "tipo-concluida";

        case "pendencia":
            return "tipo-pendencia";

        case "problema":
            return "tipo-problema";

        default:
            return "";
    }
}


// ============================================================
// NOVO REGISTRO
// ============================================================

function selecionarTipo(tipo) {

    tipoRegistroAtual = tipo;


    document.getElementById(
        "titulo-tipo-registro"
    ).textContent =
        obterNomeTipo(tipo);


    document.getElementById(
        "observacao"
    ).value = "";


    document.getElementById(
        "form-registro"
    ).style.display = "block";


    document
        .getElementById("form-registro")
        .scrollIntoView({
            behavior: "smooth"
        });
}


async function salvarNovoRegistro() {

    if (!relatorioAtual) {

        alert(
            "Nenhum relatório está aberto."
        );

        return;
    }


    if (!tipoRegistroAtual) {

        alert(
            "Selecione o tipo do registro."
        );

        return;
    }


    const observacao =
        document
            .getElementById("observacao")
            .value
            .trim();


    if (!observacao) {

        alert(
            "Informe uma observação."
        );

        return;
    }


    const registros =
        await AppVistoriasDB.listar(
            "registros"
        );


    const registrosDoRelatorio =
        registros.filter(
            registro =>
                registro.relatorioId ===
                relatorioAtual.id
        );


    const registro = {

        id: AppVistoriasDB.gerarId(),

        relatorioId:
            relatorioAtual.id,

        ordem:
            registrosDoRelatorio.length + 1,

        tipo:
            tipoRegistroAtual,

        observacao,

        fotos: [],

        criadoEm:
            new Date().toISOString()

    };


    await AppVistoriasDB.salvar(
        "registros",
        registro
    );


    relatorioAtual.atualizadoEm =
        new Date().toISOString();


    await AppVistoriasDB.salvar(
        "relatorios",
        relatorioAtual
    );


    tipoRegistroAtual = null;


    document.getElementById(
        "form-registro"
    ).style.display = "none";


    await mostrarRelatorio(
        relatorioAtual
    );


    mostrarTela(
        "tela-relatorio"
    );
}


// ============================================================
// LIMPAR FORMULÁRIO
// ============================================================

function limparFormularioRelatorio() {

    document.getElementById(
        "titulo"
    ).value = "";

    document.getElementById(
        "local"
    ).value = "";

    document.getElementById(
        "responsavel"
    ).value = "";

    document.getElementById(
        "data"
    ).value = dataHoje();
}


// ============================================================
// SEGURANÇA BÁSICA PARA TEXTO HTML
// ============================================================

function escaparHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// EVENTOS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Interface V1 carregada."
        );


        document.getElementById(
            "data"
        ).value = dataHoje();


        await carregarRelatorios();


        // Novo relatório

        document.getElementById(
            "btn-novo-relatorio"
        ).addEventListener(
            "click",
            () => {

                limparFormularioRelatorio();

                mostrarTela(
                    "tela-novo"
                );
            }
        );


        // Voltar para início

        document.getElementById(
            "btn-voltar-inicio"
        ).addEventListener(
            "click",
            () => {

                carregarRelatorios();

                mostrarTela(
                    "tela-inicio"
                );
            }
        );


        // Criar relatório

        document.getElementById(
            "btn-iniciar-relatorio"
        ).addEventListener(
            "click",
            criarRelatorio
        );


        // Voltar dos relatórios

        document.getElementById(
            "btn-voltar-relatorios"
        ).addEventListener(
            "click",
            () => {

                carregarRelatorios();

                mostrarTela(
                    "tela-inicio"
                );
            }
        );


        // Novo registro

        document.getElementById(
            "btn-novo-registro"
        ).addEventListener(
            "click",
            () => {

                tipoRegistroAtual = null;

                document.getElementById(
                    "form-registro"
                ).style.display = "none";

                document.getElementById(
                    "observacao"
                ).value = "";

                mostrarTela(
                    "tela-registro"
                );
            }
        );


        // Escolha do tipo

        document
            .querySelectorAll(".btn-tipo")
            .forEach(botao => {

                botao.addEventListener(
                    "click",
                    () => selecionarTipo(
                        botao.dataset.tipo
                    )
                );

            });


        // Salvar registro

        document.getElementById(
            "btn-salvar-registro"
        ).addEventListener(
            "click",
            salvarNovoRegistro
        );


        // Voltar do registro

        document.getElementById(
            "btn-voltar-relatorio"
        ).addEventListener(
            "click",
            () => {

                mostrarTela(
                    "tela-relatorio"
                );
            }
        );


        // PDF - será implementado depois

        document.getElementById(
            "btn-gerar-pdf"
        ).addEventListener(
            "click",
            () => {

                alert(
                    "A geração do PDF será adicionada na próxima etapa."
                );
            }
        );

    }
);