const STORAGE_KEY = "fazendaJsPlantelV12";
const OLD_KEYS = [
    "fazendaJsPlantelV11",
    "fazendaJsPlantelV10",
    "fazendaJsPlantelV9",
    "fazendaJsPlantelV8"
];

let plantel = [];
let buscaTimer = null;

document.addEventListener("DOMContentLoaded", iniciarSistema);

function iniciarSistema() {
    carregarDados();
    atualizarFiltroLotes();
    renderizarLista();
    registrarServiceWorker();
}

function normalizarTexto(valor, limite = 120) {
    return String(valor || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, limite);
}

function normalizarBrinco(valor) {
    return normalizarTexto(valor, 30).toUpperCase();
}

function normalizarLote(valor) {
    return normalizarTexto(valor, 40) || "-";
}

function normalizarObs(valor) {
    return normalizarTexto(valor, 120) || "-";
}

function carregarDados() {
    try {
        const atual = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(atual)) {
            plantel = atual;
            return;
        }

        for (const key of OLD_KEYS) {
            const antigo = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(antigo) && antigo.length > 0) {
                plantel = antigo;
                salvarDados();
                return;
            }
        }

        plantel = [];
    } catch {
        plantel = [];
    }
}

function salvarDados() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plantel));
    atualizarFiltroLotes();
}

function mostrarToast(mensagem, tipo = "sucesso") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = mensagem;
    toast.className = "show";

    if (tipo === "erro") toast.style.background = "#dc2626";
    else if (tipo === "aviso") toast.style.background = "#f59e0b";
    else toast.style.background = "#14532d";

    setTimeout(() => {
        toast.className = "";
    }, 2500);
}

function encontrarMatriz(brinco) {
    const alvo = normalizarBrinco(brinco);
    return plantel.find(m => normalizarBrinco(m.brinco) === alvo);
}

function obterLotesUnicos() {
    return [...new Set(plantel.map(m => m.lote))]
        .filter(l => l && l !== "-")
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function atualizarFiltroLotes() {
    const filtro = document.getElementById("filtroLote");
    const datalist = document.getElementById("opcoesLotes");

    if (filtro) {
        const valorAtual = filtro.value;
        filtro.innerHTML = `<option value="">Todos os lotes</option>`;

        obterLotesUnicos().forEach(lote => {
            const opt = document.createElement("option");
            opt.value = lote;
            opt.textContent = lote;
            filtro.appendChild(opt);
        });

        filtro.value = valorAtual;
    }

    if (datalist) {
        datalist.innerHTML = "";
        obterLotesUnicos().forEach(lote => {
            const opt = document.createElement("option");
            opt.value = lote;
            datalist.appendChild(opt);
        });
    }
}

function onBuscaInput() {
    clearTimeout(buscaTimer);
    buscaTimer = setTimeout(filtrarMatrizes, 200);
}

function filtrarMatrizes() {
    renderizarLista();
}

function limparFiltros() {
    const busca = document.getElementById("buscaBrinco");
    const filtro = document.getElementById("filtroLote");

    if (busca) busca.value = "";
    if (filtro) filtro.value = "";

    renderizarLista();
}

function listaFiltrada() {
    const busca = normalizarBrinco(document.getElementById("buscaBrinco")?.value || "");
    const lote = document.getElementById("filtroLote")?.value || "";

    return plantel
        .filter(m => !busca || normalizarBrinco(m.brinco).includes(busca))
        .filter(m => !lote || m.lote === lote)
        .sort((a, b) => String(a.brinco).localeCompare(String(b.brinco), "pt-BR", {
            numeric: true,
            sensitivity: "base"
        }));
}

function renderizarResumo(lista) {
    const resumo = document.getElementById("resumoPlantel");
    if (!resumo) return;

    const total = lista.length;
    const prenhas = lista.filter(m => ultimoStatus(m) === "Prenha").length;
    const vazias = lista.filter(m => ultimoStatus(m) === "Vazia").length;

    resumo.innerHTML = `
        <div class="card p-5 text-center">
            <div class="text-4xl font-black">${total}</div>
            <div class="text-sm text-gray-400 font-bold uppercase">Total</div>
        </div>

        <div class="card p-5 text-center">
            <div class="text-4xl font-black text-green-400">${prenhas}</div>
            <div class="text-sm text-gray-400 font-bold uppercase">Prenhas</div>
        </div>

        <div class="card p-5 text-center">
            <div class="text-4xl font-black text-red-400">${vazias}</div>
            <div class="text-sm text-gray-400 font-bold uppercase">Vazias</div>
        </div>
    `;
}

function renderizarLista() {
    const ul = document.getElementById("listaContatos");
    if (!ul) return;

    const lista = listaFiltrada();
    renderizarResumo(lista);

    ul.innerHTML = "";

    if (lista.length === 0) {
        ul.innerHTML = `
            <li class="card p-6 text-center italic text-gray-300">
                Nenhuma matriz encontrada com os filtros informados.
            </li>
        `;
        return;
    }

    lista.forEach(matriz => {
        const status = ultimoStatus(matriz);
        const badge = status === "Prenha"
            ? "bg-green-700 text-green-100"
            : status === "Vazia"
                ? "bg-red-700 text-red-100"
                : "bg-gray-700 text-gray-100";

        const li = document.createElement("li");
        li.className = "card p-5";

        li.innerHTML = `
            <div class="flex justify-between items-start gap-4">
                <div class="flex items-center gap-4 min-w-0">
                    <div class="avatar-app shrink-0">
                        ${escaparHtml(String(matriz.brinco).slice(0, 4))}
                    </div>

                    <div class="min-w-0">
                        <div class="text-2xl font-black truncate">
                            ${escaparHtml(matriz.brinco)}
                        </div>
                        <div class="text-sm text-gray-400">
                            ${matriz.lote && matriz.lote !== "-" ? escaparHtml(matriz.lote) : "Sem lote"}
                        </div>
                    </div>
                </div>

                <span class="px-4 py-2 rounded-full text-sm font-bold ${badge}">
                    ${status}
                </span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                <button class="btn-secondary bg-green-700" onclick="registrarDiagnostico('${encodeURIComponent(matriz.brinco)}','Prenha')">
                    Prenha
                </button>

                <button class="btn-secondary bg-red-700" onclick="registrarDiagnostico('${encodeURIComponent(matriz.brinco)}','Vazia')">
                    Vazia
                </button>

                <button class="btn-secondary" onclick="registrarParto('${encodeURIComponent(matriz.brinco)}')">
                    Parto
                </button>

                <button class="btn-secondary" onclick="editarLote('${encodeURIComponent(matriz.brinco)}')">
                    Lote
                </button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <button class="btn-secondary" onclick="verHistorico('${encodeURIComponent(matriz.brinco)}')">
                    Histórico
                </button>

                <button class="btn-secondary" onclick="enviarWhatsApp('${encodeURIComponent(matriz.brinco)}')">
                    WhatsApp
                </button>

                <button class="btn-secondary" onclick="gerarPDFIndividual('${encodeURIComponent(matriz.brinco)}')">
                    PDF
                </button>

                <button class="btn-secondary bg-red-900" onclick="excluirMatriz('${encodeURIComponent(matriz.brinco)}')">
                    Excluir
                </button>
            </div>
        `;

        ul.appendChild(li);
    });
}

function cadastrarMatrizRapido() {
    const campo = document.getElementById("buscaBrinco");
    const brinco = normalizarBrinco(campo?.value || "");

    if (!brinco) {
        mostrarToast("Digite a identificação da matriz.", "aviso");
        return;
    }

    if (encontrarMatriz(brinco)) {
        mostrarToast("Matriz já cadastrada.", "erro");
        return;
    }

    const lote = prompt("Informe o lote inicial, se houver:", "") || "-";

    plantel.push({
        brinco,
        lote: normalizarLote(lote),
        historico: [],
        partos: [],
        criadoEm: new Date().toISOString()
    });

    salvarDados();

    if (campo) campo.value = "";

    renderizarLista();
    mostrarToast("Matriz cadastrada com sucesso.");
}

function ultimoStatus(matriz) {
    if (Array.isArray(matriz.historico) && matriz.historico.length > 0) {
        return matriz.historico[0].situacao || "Sem diagnóstico";
    }

    if (matriz.status) return matriz.status;

    return "Sem diagnóstico";
}

function registrarDiagnostico(brincoCodificado, situacao) {
    const brinco = decodeURIComponent(brincoCodificado);
    const matriz = encontrarMatriz(brinco);

    if (!matriz) return;

    const ano = prompt("Ano do diagnóstico:", new Date().getFullYear());

    if (!ano || isNaN(Number(ano))) {
        mostrarToast("Ano inválido.", "erro");
        return;
    }

    const obs = prompt("Observação, se houver:", "") || "-";

    if (!Array.isArray(matriz.historico)) matriz.historico = [];

    matriz.historico = matriz.historico.filter(h => String(h.ano) !== String(ano));
    matriz.historico.unshift({
        ano: String(ano),
        situacao,
        obs: normalizarObs(obs),
        criadoEm: new Date().toISOString()
    });

    matriz.historico.sort((a, b) => Number(b.ano) - Number(a.ano));

    salvarDados();
    renderizarLista();
    mostrarToast("Diagnóstico registrado.");
}

function registrarParto(brincoCodificado) {
    const brinco = decodeURIComponent(brincoCodificado);
    const matriz = encontrarMatriz(brinco);

    if (!matriz) return;

    const data = prompt("Data do parto no formato AAAA-MM-DD:", new Date().toISOString().slice(0, 10));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        mostrarToast("Data inválida.", "erro");
        return;
    }

    const sexo = prompt("Sexo do bezerro: Macho ou Fêmea", "Macho");

    if (!["Macho", "Fêmea", "Femea"].includes(sexo)) {
        mostrarToast("Sexo inválido.", "erro");
        return;
    }

    const obs = prompt("Observação, se houver:", "") || "-";

    if (!Array.isArray(matriz.partos)) matriz.partos = [];

    matriz.partos.unshift({
        data,
        sexo: sexo === "Femea" ? "Fêmea" : sexo,
        obs: normalizarObs(obs),
        criadoEm: new Date().toISOString()
    });

    matriz.partos.sort((a, b) => new Date(b.data) - new Date(a.data));

    salvarDados();
    renderizarLista();
    mostrarToast("Parto registrado.");
}

function editarLote(brincoCodificado) {
    const brinco = decodeURIComponent(brincoCodificado);
    const matriz = encontrarMatriz(brinco);

    if (!matriz) return;

    const lote = prompt("Informe o lote:", matriz.lote && matriz.lote !== "-" ? matriz.lote : "");

    matriz.lote = normalizarLote(lote);

    salvarDados();
    renderizarLista();
    mostrarToast("Lote atualizado.");
}

function verHistorico(brincoCodificado) {
    const brinco = decodeURIComponent(brincoCodificado);
    const matriz = encontrarMatriz(brinco);

    if (!matriz) return;

    const partos = Array.isArray(matriz.partos) && matriz.partos.length
        ? matriz.partos.map(p => `Parto: ${formatarData(p.data)} - ${p.sexo} - ${p.obs || "-"}`).join("\n")
        : "Sem partos registrados.";

    const diagnosticos = Array.isArray(matriz.historico) && matriz.historico.length
        ? matriz.historico.map(h => `Diagnóstico ${h.ano}: ${h.situacao} - ${h.obs || "-"}`).join("\n")
        : "Sem diagnósticos registrados.";

    alert(
        `Matriz: ${matriz.brinco}\n` +
        `Lote: ${matriz.lote || "-"}\n\n` +
        `PARTOS:\n${partos}\n\n` +
        `DIAGNÓSTICOS:\n${diagnosticos}`
    );
}

function excluirMatriz(brincoCodificado) {
    const brinco = decodeURIComponent(brincoCodificado);

    if (!confirm(`Deseja excluir a matriz ${brinco}?`)) return;

    plantel = plantel.filter(m => normalizarBrinco(m.brinco) !== normalizarBrinco(brinco));

    salvarDados();
    renderizarLista();
    mostrarToast("Matriz excluída.");
}

function enviarWhatsApp(brincoCodificado) {
    const brinco = decodeURIComponent(brincoCodificado);
    const matriz = encontrarMatriz(brinco);

    if (!matriz) return;

    const msg = montarMensagemWhatsApp(matriz);

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
}

function montarMensagemWhatsApp(matriz) {
    const partos = Array.isArray(matriz.partos) && matriz.partos.length
        ? matriz.partos.map(p => `🍼 ${formatarData(p.data)} - ${p.sexo} ${p.obs && p.obs !== "-" ? `(${p.obs})` : ""}`).join("\n")
        : "Sem registros.";

    const diagnosticos = Array.isArray(matriz.historico) && matriz.historico.length
        ? matriz.historico.map(h => `${h.situacao === "Prenha" ? "✅" : "❌"} ${h.ano}: ${h.situacao} ${h.obs && h.obs !== "-" ? `(${h.obs})` : ""}`).join("\n")
        : "Sem registros.";

    return (
        `📄 *FICHA DE MATRIZ - FAZENDA JS*\n\n` +
        `🐄 *Identificação:* ${matriz.brinco}\n` +
        `🏷️ *Lote:* ${matriz.lote || "-"}\n` +
        `📌 *Status atual:* ${ultimoStatus(matriz)}\n\n` +
        `📋 *Partos:*\n${partos}\n\n` +
        `📊 *Diagnósticos:*\n${diagnosticos}`
    );
}

function exportarBackup() {
    if (plantel.length === 0) {
        mostrarToast("Não há dados para exportar.", "aviso");
        return;
    }

    const pacote = {
        sistema: "FazendaJS",
        versao: "v12",
        geradoEm: new Date().toISOString(),
        plantel
    };

    const blob = new Blob([JSON.stringify(pacote, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `FazendaJS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);

    mostrarToast("Backup exportado.");
}

function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
        try {
            const json = JSON.parse(e.target.result);
            const dados = Array.isArray(json) ? json : json.plantel;

            if (!Array.isArray(dados)) {
                mostrarToast("Arquivo inválido.", "erro");
                return;
            }

            if (!confirm(`Importar ${dados.length} matriz(es)? Isso substituirá os dados locais.`)) return;

            plantel = dados;
            salvarDados();
            renderizarLista();
            mostrarToast("Dados importados.");
        } catch {
            mostrarToast("Erro ao importar arquivo.", "erro");
        }
    };

    reader.readAsText(file);
}

function gerarPDFGeral() {
    if (!window.jspdf?.jsPDF) {
        window.print();
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("FazendaJS - Plantel Geral", 14, 15);

    const rows = plantel.map(m => [
        m.brinco,
        m.lote || "-",
        ultimoStatus(m),
        Array.isArray(m.partos) ? m.partos.length : 0
    ]);

    if (doc.autoTable) {
        doc.autoTable({
            head: [["Matriz", "Lote", "Status", "Partos"]],
            body: rows,
            startY: 25
        });
    } else {
        rows.forEach((r, i) => doc.text(r.join(" | "), 14, 30 + i * 8));
    }

    doc.save(`FazendaJS_Geral_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function gerarPDFIndividual(brincoCodificado) {
    const brinco = decodeURIComponent(brincoCodificado || "");
    const matriz = brinco ? encontrarMatriz(brinco) : null;

    if (!matriz) {
        mostrarToast("Matriz não localizada.", "erro");
        return;
    }

    if (!window.jspdf?.jsPDF) {
        alert(montarMensagemWhatsApp(matriz));
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Ficha da Matriz: ${matriz.brinco}`, 14, 15);

    doc.setFontSize(11);
    doc.text(`Lote: ${matriz.lote || "-"}`, 14, 25);
    doc.text(`Status: ${ultimoStatus(matriz)}`, 14, 32);

    let y = 45;

    doc.setFontSize(13);
    doc.text("Partos", 14, y);
    y += 8;

    if (Array.isArray(matriz.partos) && matriz.partos.length) {
        matriz.partos.forEach(p => {
            doc.text(`${formatarData(p.data)} - ${p.sexo} - ${p.obs || "-"}`, 14, y);
            y += 8;
        });
    } else {
        doc.text("Sem partos registrados.", 14, y);
        y += 8;
    }

    y += 8;
    doc.setFontSize(13);
    doc.text("Diagnósticos", 14, y);
    y += 8;

    if (Array.isArray(matriz.historico) && matriz.historico.length) {
        matriz.historico.forEach(h => {
            doc.text(`${h.ano} - ${h.situacao} - ${h.obs || "-"}`, 14, y);
            y += 8;
        });
    } else {
        doc.text("Sem diagnósticos registrados.", 14, y);
    }

    doc.save(`FazendaJS_${matriz.brinco}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function alternarTema() {
    document.documentElement.classList.toggle("dark");
    mostrarToast("Tema alternado.");
}

function formatarData(data) {
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

function escaparHtml(texto) {
    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function registrarServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(() => {});
    }
}

window.onBuscaInput = onBuscaInput;
window.filtrarMatrizes = filtrarMatrizes;
window.limparFiltros = limparFiltros;
window.cadastrarMatrizRapido = cadastrarMatrizRapido;
window.registrarDiagnostico = registrarDiagnostico;
window.registrarParto = registrarParto;
window.editarLote = editarLote;
window.verHistorico = verHistorico;
window.excluirMatriz = excluirMatriz;
window.enviarWhatsApp = enviarWhatsApp;
window.exportarBackup = exportarBackup;
window.importarDados = importarDados;
window.gerarPDFGeral = gerarPDFGeral;
window.gerarPDFIndividual = gerarPDFIndividual;
window.alternarTema = alternarTema;
