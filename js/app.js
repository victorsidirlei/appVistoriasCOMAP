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
// 1. UTILITÁRIOS
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


function escaparHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// 2. RELATÓRIOS
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
// 3. CRIAR RELATÓRIO
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

        id:
            AppVistoriasDB.gerarId(),

        titulo,

        local,

        responsavel,

        data:
            data || dataHoje(),

        criadoEm:
            agora,

        atualizadoEm:
            agora,

        status:
            "em_andamento"
    };

    await AppVistoriasDB.salvar(
        "relatorios",
        relatorio
    );

    relatorioAtual =
        relatorio;

    limparFormularioRelatorio();

    mostrarRelatorio(
        relatorio
    );

    mostrarTela(
        "tela-relatorio"
    );
}


// ============================================================
// 4. ABRIR RELATÓRIO
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

    relatorioAtual =
        relatorio;

    mostrarRelatorio(
        relatorio
    );

    mostrarTela(
        "tela-relatorio"
    );
}


// ============================================================
// 5. MOSTRAR RELATÓRIO
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
// 6. REGISTROS
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

            const quantidadeFotos =
                Array.isArray(registro.fotos)
                    ? registro.fotos.length
                    : 0;

            elemento.innerHTML = `

                <div class="registro-cabecalho">

                    <span class="registro-numero">
                        ${String(
                            indice + 1
                        ).padStart(2, "0")}
                    </span>

                    <span class="tipo ${classeTipo(
                        registro.tipo
                    )}">
                        ${tipoTexto}
                    </span>

                </div>

                <div class="registro-observacao">
                    ${escaparHTML(
                        registro.observacao ||
                        ""
                    )}
                </div>

                ${
                    quantidadeFotos > 0
                        ? `
                            <div class="registro-fotos-info">
                                📷 ${quantidadeFotos}
                                ${
                                    quantidadeFotos === 1
                                        ? "foto"
                                        : "fotos"
                                }
                            </div>
                          `
                        : ""
                }

                <div class="registro-acoes">

                    <button
                        type="button"
                        class="botao botao-secundario btn-visualizar-registro"
                        data-id="${registro.id}"
                    >
                        👁️ Visualizar
                    </button>

                </div>
            `;

            lista.appendChild(
                elemento
            );
        }
    );

    document
        .querySelectorAll(
            ".btn-visualizar-registro"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    async () => {

                        const id =
                            botao.dataset.id;

                        const registro =
                            await AppVistoriasDB.buscar(
                                "registros",
                                id
                            );

                        if (!registro) {

                            alert(
                                "Registro não encontrado."
                            );

                            return;
                        }

                        abrirVisualizacaoRegistro(
                            registro
                        );
                    }
                );

            }
        );
}


// ============================================================
// 7. VISUALIZAÇÃO DO REGISTRO
// ============================================================

function abrirVisualizacaoRegistro(registro) {

    window.registroEmEdicao =
        registro;

    const modal =
        document.getElementById(
            "modal-registro"
        );

    const titulo =
        document.getElementById(
            "modal-registro-titulo"
        );

    const tipo =
        document.getElementById(
            "modal-registro-tipo"
        );

    const observacao =
        document.getElementById(
            "modal-registro-observacao"
        );

    const fotos =
        document.getElementById(
            "modal-registro-fotos"
        );


    titulo.textContent =
        "Registro";


    tipo.textContent =
        obterNomeTipo(
            registro.tipo
        );

    tipo.className =
        "modal-tipo " +
        classeTipo(
            registro.tipo
        );


    observacao.textContent =
        registro.observacao ||
        "Nenhuma observação informada.";


    fotos.innerHTML = "";

    const listaFotos =
        Array.isArray(registro.fotos)
            ? registro.fotos
            : [];


    if (listaFotos.length === 0) {

        fotos.innerHTML = `
            <p>
                Nenhuma foto registrada.
            </p>
        `;

    } else {

        listaFotos.forEach(
            (foto, indice) => {

                const imagem =
                    document.createElement(
                        "img"
                    );

                imagem.src =
                    foto;

                imagem.alt =
                    `Foto ${indice + 1}`;

                imagem.className =
                    "modal-foto";

                fotos.appendChild(
                    imagem
                );
            }
        );
    }


    modal.style.display =
        "flex";
}


// ============================================================
// 8. FECHAR VISUALIZAÇÃO
// ============================================================

function fecharVisualizacaoRegistro() {

    const modal =
        document.getElementById(
            "modal-registro"
        );

    modal.style.display =
        "none";
}


// ============================================================
// 9. EDITAR REGISTRO
// ============================================================

function editarRegistro() {

    const registro =
        window.registroEmEdicao;

    if (!registro) {

        alert(
            "Nenhum registro selecionado para edição."
        );

        return;
    }


    tipoRegistroAtual =
        registro.tipo;


    document.getElementById(
        "titulo-tipo-registro"
    ).textContent =
        obterNomeTipo(
            registro.tipo
        );


    document.getElementById(
        "observacao"
    ).value =
        registro.observacao ||
        "";


    window.fotosTemporarias =
        Array.isArray(
            registro.fotos
        )
            ? [...registro.fotos]
            : [];


    mostrarMiniaturasFotos();


    fecharVisualizacaoRegistro();


    document.getElementById(
        "form-registro"
    ).style.display =
        "block";


    document.getElementById(
        "btn-excluir-registro-edicao"
    ).style.display =
        "block";


    mostrarTela(
        "tela-registro"
    );


    document.getElementById(
        "form-registro"
    ).scrollIntoView({
        behavior: "smooth"
    });
}


// ============================================================
// 10. EXCLUIR REGISTRO
// ============================================================

async function excluirRegistroAtual() {

    const registro =
        window.registroEmEdicao;

    if (!registro) {

        alert(
            "Nenhum registro selecionado."
        );

        return;
    }


    const confirmar =
        confirm(
            "Excluir este registro?\n\n" +
            "Esta ação não poderá ser desfeita."
        );


    if (!confirmar) {
        return;
    }


    try {

        await AppVistoriasDB.excluir(
            "registros",
            registro.id
        );


        const todos =
            await AppVistoriasDB.listar(
                "registros"
            );


        const registrosRestantes =
            todos
                .filter(
                    item =>
                        item.relatorioId ===
                        registro.relatorioId
                )
                .sort(
                    (a, b) =>
                        a.ordem - b.ordem
                );


        for (
            let indice = 0;
            indice < registrosRestantes.length;
            indice++
        ) {

            const registroRestante =
                registrosRestantes[indice];

            registroRestante.ordem =
                indice + 1;

            await AppVistoriasDB.salvar(
                "registros",
                registroRestante
            );
        }


        window.registroEmEdicao =
            null;

        window.fotosTemporarias =
            [];

        tipoRegistroAtual =
            null;


        fecharVisualizacaoRegistro();


        await mostrarRelatorio(
            relatorioAtual
        );


        mostrarTela(
            "tela-relatorio"
        );


    } catch (erro) {

        console.error(
            "Erro ao excluir registro:",
            erro
        );

        alert(
            "Não foi possível excluir o registro."
        );
    }
}


// ============================================================
// 11. TIPOS DE REGISTRO
// ============================================================

function obterNomeTipo(tipo) {

    if (
        tipo === "concluida"
    ) {
        return "Atividade concluída";
    }

    if (
        tipo === "pendencia"
    ) {
        return "Pendência de serviço";
    }

    if (
        tipo === "problema"
    ) {
        return "Problema / anomalia";
    }

    return "Registro";
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
// 12. NOVO REGISTRO
// ============================================================

function selecionarTipo(tipo) {

    tipoRegistroAtual =
        tipo;


    document.getElementById(
        "titulo-tipo-registro"
    ).textContent =
        obterNomeTipo(
            tipo
        );


    document.getElementById(
        "observacao"
    ).value =
        "";


    document.getElementById(
        "form-registro"
    ).style.display =
        "block";


    document
        .getElementById(
            "form-registro"
        )
        .scrollIntoView({
            behavior: "smooth"
        });
}


// ============================================================
// 13. SALVAR REGISTRO
// ============================================================

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
            .getElementById(
                "observacao"
            )
            .value
            .trim();


    if (!observacao) {

        alert(
            "Informe uma observação."
        );

        return;
    }


    // --------------------------------------------------------
    // EDIÇÃO
    // --------------------------------------------------------

    if (window.registroEmEdicao) {

        const registro =
            window.registroEmEdicao;


        registro.tipo =
            tipoRegistroAtual;


        registro.observacao =
            observacao;


        registro.fotos =
            window.fotosTemporarias || [];


        registro.atualizadoEm =
            new Date().toISOString();


        await AppVistoriasDB.salvar(
            "registros",
            registro
        );


        window.registroEmEdicao =
            null;


    } else {

        // ----------------------------------------------------
        // NOVO REGISTRO
        // ----------------------------------------------------

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

            id:
                AppVistoriasDB.gerarId(),

            relatorioId:
                relatorioAtual.id,

            ordem:
                registrosDoRelatorio.length + 1,

            tipo:
                tipoRegistroAtual,

            observacao,

            fotos:
                window.fotosTemporarias || [],

            criadoEm:
                new Date().toISOString()
        };


        await AppVistoriasDB.salvar(
            "registros",
            registro
        );
    }


    // --------------------------------------------------------
    // ATUALIZAR RELATÓRIO
    // --------------------------------------------------------

    relatorioAtual.atualizadoEm =
        new Date().toISOString();


    await AppVistoriasDB.salvar(
        "relatorios",
        relatorioAtual
    );


    // --------------------------------------------------------
    // LIMPAR FORMULÁRIO
    // --------------------------------------------------------

    tipoRegistroAtual =
        null;

    window.fotosTemporarias =
        [];

    document.getElementById(
        "observacao"
    ).value = "";

    document.getElementById(
        "form-registro"
    ).style.display =
        "none";


    // --------------------------------------------------------
    // ATUALIZAR RELATÓRIO NA TELA
    // --------------------------------------------------------

    await mostrarRelatorio(
        relatorioAtual
    );


    mostrarTela(
        "tela-relatorio"
    );
}


// ============================================================
// 14. LIMPAR FORMULÁRIO DE RELATÓRIO
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
    ).value =
        dataHoje();
}


// ============================================================
// 15. FOTOS
// ============================================================

window.fotosTemporarias = [];


const btnTirarFoto =
    document.getElementById(
        "btn-tirar-foto"
    );


const btnEscolherFoto =
    document.getElementById(
        "btn-escolher-foto"
    );


const inputCamera =
    document.getElementById(
        "input-camera"
    );


const inputGaleria =
    document.getElementById(
        "input-galeria"
    );


const listaFotos =
    document.getElementById(
        "lista-fotos"
    );


// ============================================================
// 16. MOSTRAR MINIATURAS
// ============================================================

function mostrarMiniaturasFotos() {

    listaFotos.innerHTML = "";


    window.fotosTemporarias.forEach(
        (foto, indice) => {

            const container =
                document.createElement(
                    "div"
                );


            container.className =
                "foto-item";


            container.innerHTML = `

                <img
                    src="${foto}"
                    alt="Foto ${indice + 1}"
                    class="miniatura-foto"
                >

                <button
                    type="button"
                    class="botao-remover-foto"
                    data-indice="${indice}"
                >
                    ✕
                </button>
            `;


            listaFotos.appendChild(
                container
            );


            const imagem =
                container.querySelector(
                    ".miniatura-foto"
                );


            imagem.addEventListener(
                "click",
                () => {

                    abrirFotoAmpliada(
                        foto,
                        indice
                    );
                }
            );
        }
    );


    document
        .querySelectorAll(
            ".botao-remover-foto"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        const indice =
                            Number(
                                botao.dataset.indice
                            );


                        window.fotosTemporarias.splice(
                            indice,
                            1
                        );


                        mostrarMiniaturasFotos();
                    }
                );
            }
        );
}


// ============================================================
// 17. FOTO AMPLIADA
// ============================================================

function abrirFotoAmpliada(
    foto,
    indice = 0
) {

    const modal =
        document.getElementById(
            "modal-foto-ampliada"
        );


    const imagem =
        document.getElementById(
            "foto-ampliada"
        );


    if (
        !modal ||
        !imagem
    ) {
        return;
    }


    imagem.src =
        foto;


    imagem.alt =
        `Foto ampliada ${indice + 1}`;


    modal.style.display =
        "flex";
}


// ============================================================
// 18. FECHAR FOTO AMPLIADA
// ============================================================

function fecharFotoAmpliada() {

    const modal =
        document.getElementById(
            "modal-foto-ampliada"
        );


    const imagem =
        document.getElementById(
            "foto-ampliada"
        );


    if (imagem) {

        imagem.src =
            "";
    }


    if (modal) {

        modal.style.display =
            "none";
    }
}


// ============================================================
// 19. ADICIONAR FOTOS
// ============================================================

function adicionarFotos(arquivos) {

    Array.from(
        arquivos
    ).forEach(
        arquivo => {

            if (
                !arquivo.type.startsWith(
                    "image/"
                )
            ) {
                return;
            }


            const leitor =
                new FileReader();


            leitor.onload =
                function(evento) {

                    window.fotosTemporarias.push(
                        evento.target.result
                    );


                    mostrarMiniaturasFotos();
                };


            leitor.readAsDataURL(
                arquivo
            );
        }
    );
}


// ============================================================
// 20. GERAÇÃO DO PDF
// ============================================================

async function gerarPDF() {

    if (!relatorioAtual) {

        alert(
            "Nenhum relatório está aberto."
        );

        return;
    }


    const todos =
        await AppVistoriasDB.listar(
            "registros"
        );


    const registros =
        todos
            .filter(
                registro =>
                    registro.relatorioId ===
                    relatorioAtual.id
            )
            .sort(
                (a, b) =>
                    a.ordem - b.ordem
            );


    if (
        registros.length === 0
    ) {

        alert(
            "Adicione pelo menos um registro antes de gerar o PDF."
        );

        return;
    }


    const janela =
        window.open(
            "",
            "_blank"
        );


    if (!janela) {

        alert(
            "O navegador bloqueou a abertura do PDF. Permita pop-ups para este aplicativo e tente novamente."
        );

        return;
    }


    const titulo =
        escaparHTML(
            relatorioAtual.titulo ||
            "Relatório Fotográfico"
        );


    const local =
        escaparHTML(
            relatorioAtual.local ||
            ""
        );


    const responsavel =
        escaparHTML(
            relatorioAtual.responsavel ||
            ""
        );


    const data =
        formatarData(
            relatorioAtual.data
        );


    let htmlRegistros =
        "";


    registros.forEach(
        (registro, indice) => {

            const tipo =
                escaparHTML(
                    obterNomeTipo(
                        registro.tipo
                    )
                );


            const observacao =
                escaparHTML(
                    registro.observacao ||
                    "Nenhuma observação informada."
                );


            const fotos =
                Array.isArray(
                    registro.fotos
                )
                    ? registro.fotos
                    : [];


            let htmlFotos =
                "";


            if (
                fotos.length > 0
            ) {

                htmlFotos = `
                    <div class="fotos">
                        ${fotos
                            .map(
                                (foto, fotoIndice) => `
                                    <div class="foto">
                                        <img
                                            src="${foto}"
                                            alt="Foto ${fotoIndice + 1}"
                                        >
                                    </div>
                                `
                            )
                            .join("")}
                    </div>
                `;

            } else {

                htmlFotos = `
                    <div class="sem-fotos">
                        Nenhuma foto registrada.
                    </div>
                `;
            }


            htmlRegistros += `

                <section class="registro">

                    <div class="registro-cabecalho">

                        <div class="numero">
                            ${String(
                                indice + 1
                            ).padStart(2, "0")}
                        </div>

                        <div class="tipo">
                            ${tipo}
                        </div>

                    </div>

                    <div class="observacao-titulo">
                        Observação
                    </div>

                    <div class="observacao">
                        ${observacao}
                    </div>

                    ${htmlFotos}

                </section>
            `;
        }
    );


    const dataArquivo =
        relatorioAtual.data ||
        dataHoje();


    const nomeArquivo =
        `Relatorio_Fotografico_${relatorioAtual.titulo || "Relatorio"}_${dataArquivo}`
            .replace(
                /[\\/:*?"<>|]/g,
                "_"
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
                    margin: 15mm;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    margin: 0;

                    padding: 0;

                    color: #222;

                    background: white;

                    font-size: 12px;
                }

                .pagina {

                    width: 100%;

                    margin: 0 auto;
                }

                .cabecalho {

                    border-bottom:
                        2px solid #222;

                    padding-bottom: 12px;

                    margin-bottom: 18px;
                }

                .titulo {

                    font-size: 22px;

                    font-weight: bold;

                    margin-bottom: 12px;

                    text-transform:
                        uppercase;
                }

                .informacoes {

                    display: grid;

                    grid-template-columns:
                        1fr 1fr;

                    gap: 6px 20px;

                    font-size: 12px;
                }

                .informacao {

                    padding: 3px 0;
                }

                .rotulo {

                    font-weight: bold;
                }

                .registro {

                    border:
                        1px solid #bbb;

                    border-radius: 6px;

                    padding: 12px;

                    margin-bottom: 16px;

                    page-break-inside:
                        avoid;
                }

                .registro-cabecalho {

                    display: flex;

                    align-items: center;

                    gap: 10px;

                    margin-bottom: 12px;

                    border-bottom:
                        1px solid #ddd;

                    padding-bottom: 8px;
                }

                .numero {

                    font-size: 18px;

                    font-weight: bold;

                    min-width: 32px;
                }

                .tipo {

                    font-size: 14px;

                    font-weight: bold;
                }

                .observacao-titulo {

                    font-weight: bold;

                    margin-bottom: 4px;
                }

                .observacao {

                    white-space: pre-wrap;

                    line-height: 1.45;

                    margin-bottom: 12px;
                }

                .fotos {

                    display: grid;

                    grid-template-columns:
                        1fr 1fr;

                    gap: 10px;
                }

                .foto {

                    width: 100%;

                    height: 180px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    overflow: hidden;

                    border:
                        1px solid #ddd;

                    border-radius: 4px;

                    background: #f5f5f5;
                }

                .foto img {

                    width: 100%;

                    height: 100%;

                    object-fit: contain;
                }

                .sem-fotos {

                    font-style: italic;

                    color: #666;
                }

                .rodape {

                    margin-top: 20px;

                    padding-top: 8px;

                    border-top:
                        1px solid #ccc;

                    text-align: center;

                    font-size: 10px;

                    color: #666;
                }

                @media print {

                    body {
                        -webkit-print-color-adjust:
                            exact;

                        print-color-adjust:
                            exact;
                    }

                    .nao-imprimir {
                        display: none;
                    }

                }

            </style>

        </head>

        <body>

            <div class="pagina">

                <header class="cabecalho">

                    <div class="titulo">
                        ${titulo}
                    </div>

                    <div class="informacoes">

                        <div class="informacao">
                            <span class="rotulo">
                                Local:
                            </span>
                            ${local}
                        </div>

                        <div class="informacao">
                            <span class="rotulo">
                                Data:
                            </span>
                            ${data}
                        </div>

                        <div class="informacao">
                            <span class="rotulo">
                                Responsável:
                            </span>
                            ${responsavel}
                        </div>

                        <div class="informacao">
                            <span class="rotulo">
                                Registros:
                            </span>
                            ${registros.length}
                        </div>

                    </div>

                </header>


                <main>

                    ${htmlRegistros}

                </main>


                <footer class="rodape">

                    Relatório Fotográfico —
                    ${data}

                </footer>

            </div>


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


    console.log(
        "PDF preparado:",
        nomeArquivo + ".pdf"
    );
}


// ============================================================
// 21. EVENTOS DA INTERFACE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Interface V1 carregada."
        );


        document.getElementById(
            "data"
        ).value =
            dataHoje();


        await carregarRelatorios();


        // ----------------------------------------------------
        // NOVO RELATÓRIO
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // VOLTAR PARA INÍCIO
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // CRIAR RELATÓRIO
        // ----------------------------------------------------

        document.getElementById(
            "btn-iniciar-relatorio"
        ).addEventListener(
            "click",
            criarRelatorio
        );


        // ----------------------------------------------------
        // VOLTAR DOS RELATÓRIOS
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // NOVO REGISTRO
        // ----------------------------------------------------

        document.getElementById(
            "btn-novo-registro"
        ).addEventListener(
            "click",
            () => {

                tipoRegistroAtual =
                    null;

                window.registroEmEdicao =
                    null;

                window.fotosTemporarias =
                    [];

                mostrarMiniaturasFotos();


                document.getElementById(
                    "btn-excluir-registro-edicao"
                ).style.display =
                    "none";


                document.getElementById(
                    "form-registro"
                ).style.display =
                    "none";


                document.getElementById(
                    "observacao"
                ).value =
                    "";


                mostrarTela(
                    "tela-registro"
                );
            }
        );


        // ----------------------------------------------------
        // ESCOLHA DO TIPO
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
        // SALVAR REGISTRO
        // ----------------------------------------------------

        document.getElementById(
            "btn-salvar-registro"
        ).addEventListener(
            "click",
            salvarNovoRegistro
        );


        // ----------------------------------------------------
        // VOLTAR DO REGISTRO
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // GERAR PDF
        // ----------------------------------------------------

        document.getElementById(
            "btn-gerar-pdf"
        ).addEventListener(
            "click",
            gerarPDF
        );

    }
);


// ============================================================
// 22. EVENTOS DO MODAL DE REGISTRO
// ============================================================

const btnFecharModalRegistro =
    document.getElementById(
        "btn-fechar-modal-registro"
    );


const btnFecharModalRegistroRodape =
    document.getElementById(
        "btn-fechar-modal-registro-rodape"
    );


if (
    btnFecharModalRegistro
) {

    btnFecharModalRegistro.addEventListener(
        "click",
        fecharVisualizacaoRegistro
    );
}


if (
    btnFecharModalRegistroRodape
) {

    btnFecharModalRegistroRodape.addEventListener(
        "click",
        fecharVisualizacaoRegistro
    );
}


// ============================================================
// 23. BOTÃO EDITAR
// ============================================================

const btnEditarRegistro =
    document.getElementById(
        "btn-editar-registro"
    );


if (
    btnEditarRegistro
) {

    btnEditarRegistro.addEventListener(
        "click",
        editarRegistro
    );
}


// ============================================================
// 24. BOTÃO EXCLUIR
// ============================================================

const btnExcluirRegistroEdicao =
    document.getElementById(
        "btn-excluir-registro-edicao"
    );


if (
    btnExcluirRegistroEdicao
) {

    btnExcluirRegistroEdicao.addEventListener(
        "click",
        excluirRegistroAtual
    );
}


// ============================================================
// 25. EVENTOS DA FOTO AMPLIADA
// ============================================================

const btnFecharFotoAmpliada =
    document.getElementById(
        "btn-fechar-foto-ampliada"
    );


if (
    btnFecharFotoAmpliada
) {

    btnFecharFotoAmpliada.addEventListener(
        "click",
        fecharFotoAmpliada
    );
}


const modalFotoAmpliada =
    document.getElementById(
        "modal-foto-ampliada"
    );


if (
    modalFotoAmpliada
) {

    modalFotoAmpliada.addEventListener(
        "click",
        evento => {

            if (
                evento.target ===
                modalFotoAmpliada
            ) {

                fecharFotoAmpliada();
            }
        }
    );
}


// ============================================================
// 26. TECLA ESC
// ============================================================

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


// ============================================================
// 27. BOTÃO TIRAR FOTO
// ============================================================

if (
    btnTirarFoto
) {

    btnTirarFoto.addEventListener(
        "click",
        () => {

            inputCamera.click();
        }
    );
}


// ============================================================
// 28. BOTÃO GALERIA
// ============================================================

if (
    btnEscolherFoto
) {

    btnEscolherFoto.addEventListener(
        "click",
        () => {

            inputGaleria.click();
        }
    );
}


// ============================================================
// 29. FOTO DA CÂMERA
// ============================================================

if (
    inputCamera
) {

    inputCamera.addEventListener(
        "change",
        evento => {

            adicionarFotos(
                evento.target.files
            );

            inputCamera.value =
                "";
        }
    );
}


// ============================================================
// 30. FOTO DA GALERIA
// ============================================================

if (
    inputGaleria
) {

    inputGaleria.addEventListener(
        "change",
        evento => {

            adicionarFotos(
                evento.target.files
            );

            inputGaleria.value =
                "";
        }
    );
}