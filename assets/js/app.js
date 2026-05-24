const STORAGE_KEY = "fazendaJsPlantelV12";
let plantel = [];

document.addEventListener("DOMContentLoaded", iniciar);

function el(id) {
    return document.getElementById(id);
}

function getBusca() {
    return el("inputBusca") || el("buscaBrinco");
}

function getLote() {
    return el("inputLote") || el("novoLote");
}

function getLista() {
    return el("listaMatrizes") || el("listaContatos");
}

function iniciar() {
    carregarDados();
    atualizarTela();
    registrarServiceWorker();
}

function carregarDados() {
    try {
        const dados = JSON.parse(localStorage.getItem(STORAGE_KEY));
        plantel = Array.isArray(dados) ? dados : [];
    } catch {
        plantel = [];
    }
}

function salvarDados() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plantel));
}

function cadastrarMatriz() {
    const campoBusca = getBusca();
    const campoLote = getLote();

    const brinco = (campoBusca?.value || "").trim().toUpperCase();
    const lote = (campoLote?.value || "").trim() || "Sem lote";

    if (!brinco) {
        toast("Digite a identificação da matriz.");
        return;
    }

    if (plantel.some(m => m.brinco === brinco)) {
        toast("Matriz já cadastrada.");
        return;
    }

    plantel.push({
        brinco,
        lote,
        status: "Sem diagnóstico",
        historico: [],
        partos: [],
        criadoEm: new Date().toISOString()
    });

    salvarDados();

    if (campoBusca) campoBusca.value = "";
    if (campoLote) campoLote.value = "";

    atualizarTela();
    toast("Matriz cadastrada com sucesso.");
}

function atualizarTela() {
    atualizarResumo();
    atualizarFiltroLotes();
    renderizarLista();
}

function atualizarResumo() {
    const total = plantel.length;
    const prenhas = plantel.filter(m => m.status === "Prenha").length;
    const vazias = plantel.filter(m => m.status === "Vazia").length;

    if (el("statTotal")) el("statTotal").textContent = total;
    if (el("statPrenha")) el("statPrenha").textContent = prenhas;
    if (el("statVazia")) el("statVazia").textContent = vazias;

    if (el("totalMatrizes")) el("totalMatrizes").textContent = total;
    if (el("totalPrenhas")) el("totalPrenhas").textContent = prenhas;
    if (el("totalVazias")) el("totalVazias").textContent = vazias;
}

function renderizarLista() {
    const lista = getLista();
    if (!lista) return;

    const busca = (getBusca()?.value || "").trim().toUpperCase();
    const filtroLote = el("filtroLote")?.value || "";

    const filtradas = plantel.filter(m => {
        const passaBusca = !busca || m.brinco.includes(busca);
        const passaLote = !filtroLote || m.lote === filtroLote;
        return passaBusca && passaLote;
    });

    lista.innerHTML = "";

    if (filtradas.length === 0) {
        lista.innerHTML = `
            <li class="p-5 text-center text-gray-300 italic">
                Nenhuma matriz cadastrada.
            </li>
        `;
        return;
    }

    filtradas.forEach(m => {
        const li = document.createElement("li");

        li.innerHTML = `
            <div class="flex justify-between items-center gap-4">
                <div>
                    <div class="text-2xl font-black">${m.brinco}</div>
                    <div class="text-gray-400">${m.lote}</div>
                </div>

                <div class="font-bold px-4 py-2 rounded-full ${classeStatus(m.status)}">
                    ${m.status}
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                <button class="btn-secondary bg-green-700" onclick="alterarStatus('${m.brinco}', 'Prenha')">
                    Prenha
                </button>

                <button class="btn-secondary bg-red-700" onclick="alterarStatus('${m.brinco}', 'Vazia')">
                    Vazia
                </button>

                <button class="btn-secondary" onclick="registrarParto('${m.brinco}')">
                    Parto
                </button>

                <button class="btn-secondary bg-red-900" onclick="excluirMatriz('${m.brinco}')">
                    Excluir
                </button>
            </div>
        `;

        lista.appendChild(li);
    });
}

function classeStatus(status) {
    if (status === "Prenha") return "bg-green-800 text-green-100";
    if (status === "Vazia") return "bg-red-800 text-red-100";
    return "bg-slate-700 text-slate-100";
}

function alterarStatus(brinco, status) {
    const matriz = plantel.find(m => m.brinco === brinco);
    if (!matriz) return;

    matriz.status = status;

    matriz.historico.unshift({
        data: new Date().toISOString(),
        tipo: "Diagnóstico",
        status
    });

    salvarDados();
    atualizarTela();
    toast("Status atualizado.");
}

function registrarParto(brinco) {
    const matriz = plantel.find(m => m.brinco === brinco);
    if (!matriz) return;

    const data = prompt("Data do parto AAAA-MM-DD:", new Date().toISOString().slice(0, 10));
    if (!data) return;

    matriz.partos.unshift({
        data,
        criadoEm: new Date().toISOString()
    });

    salvarDados();
    atualizarTela();
    toast("Parto registrado.");
}

function excluirMatriz(brinco) {
    if (!confirm(`Excluir matriz ${brinco}?`)) return;

    plantel = plantel.filter(m => m.brinco !== brinco);

    salvarDados();
    atualizarTela();
    toast("Matriz excluída.");
}

function atualizarFiltroLotes() {
    const filtro = el("filtroLote");
    const datalist = el("opcoesLotes");

    const lotes = [...new Set(plantel.map(m => m.lote).filter(Boolean))];

    if (filtro) {
        const atual = filtro.value;
        filtro.innerHTML = `<option value="">Todos os lotes</option>`;

        lotes.forEach(lote => {
            const opt = document.createElement("option");
            opt.value = lote;
            opt.textContent = lote;
            filtro.appendChild(opt);
        });

        filtro.value = atual;
    }

    if (datalist) {
        datalist.innerHTML = "";
        lotes.forEach(lote => {
            const opt = document.createElement("option");
            opt.value = lote;
            datalist.appendChild(opt);
        });
    }
}

function filtrarMatrizes() {
    renderizarLista();
}

function onBuscaInput() {
    renderizarLista();
}

function limparFiltros() {
    if (getBusca()) getBusca().value = "";
    if (el("filtroLote")) el("filtroLote").value = "";

    renderizarLista();
}

function exportarBackup() {
    const blob = new Blob([JSON.stringify(plantel, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `fazendajs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
    toast("Backup exportado.");
}

function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
        try {
            const dados = JSON.parse(e.target.result);
            plantel = Array.isArray(dados) ? dados : dados.plantel || [];

            salvarDados();
            atualizarTela();
            toast("Backup importado.");
        } catch {
            toast("Arquivo inválido.");
        }
    };

    reader.readAsText(file);
}

function gerarPDFGeral() {
    if (!window.jspdf) {
        window.print();
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Fazenda JS - Plantel", 14, 15);

    plantel.forEach((m, i) => {
        doc.text(`${m.brinco} - ${m.lote} - ${m.status}`, 14, 30 + i * 8);
    });

    doc.save("fazendajs-plantel.pdf");
}

function alternarTema() {
    document.documentElement.classList.toggle("dark");
    toast("Tema alternado.");
}

function toast(msg) {
    const t = el("toast");
    if (!t) return;

    t.textContent = msg;
    t.classList.add("show");

    setTimeout(() => {
        t.classList.remove("show");
    }, 2500);
}

function registrarServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
}

window.cadastrarMatriz = cadastrarMatriz;
window.cadastrarMatrizRapido = cadastrarMatriz;
window.onBuscaInput = onBuscaInput;
window.filtrarMatrizes = filtrarMatrizes;
window.limparFiltros = limparFiltros;
window.alterarStatus = alterarStatus;
window.registrarParto = registrarParto;
window.excluirMatriz = excluirMatriz;
window.exportarBackup = exportarBackup;
window.importarDados = importarDados;
window.gerarPDFGeral = gerarPDFGeral;
window.alternarTema = alternarTema;
