const STORAGE_KEY = 'fazendajs_matrizes_v13';
const BACKUP_KEY = 'fazendajs_backup_auto_v13';

let matrizes = [];

document.addEventListener('DOMContentLoaded', iniciarSistema);

function iniciarSistema() {
    carregarStorage();
    criarModalFicha();
    atualizarTudo();
}

/* ================= STORAGE ================= */

function carregarStorage() {
    try {
        const atual = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const anteriorV12 = JSON.parse(localStorage.getItem('fazendajs_matrizes_v12'));
        const anterior = JSON.parse(localStorage.getItem('fazendajs_matrizes_v11'));

        matrizes = Array.isArray(atual)
            ? atual
            : Array.isArray(anteriorV12)
                ? anteriorV12
                : Array.isArray(anterior)
                    ? anterior
                    : [];
    } catch {
        matrizes = [];
    }
}

function salvarStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrizes));
    salvarBackupAutomatico();
}

function salvarBackupAutomatico() {
    const backup = {
        versao: 'v13',
        data: new Date().toISOString(),
        matrizes
    };

    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

/* ================= TOAST ================= */

function mostrarToast(texto) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerText = texto;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/* ================= MODAL CADASTRO ================= */

function abrirModalCadastro() {
    const busca = document.getElementById('buscaInput')?.value || '';
    const lote = document.getElementById('loteInput')?.value || '';

    document.getElementById('modalNumero').value = busca.toUpperCase();
    document.getElementById('modalLote').value = lote;

    document.getElementById('modalCadastro').classList.remove('hidden');
}

function fecharModalCadastro() {
    document.getElementById('modalCadastro').classList.add('hidden');
}

function salvarMatrizModal() {
    const numero = document.getElementById('modalNumero').value.trim().toUpperCase();
    const lote = document.getElementById('modalLote').value.trim();
    const obs = document.getElementById('modalObs').value.trim();
    const status = document.getElementById('modalStatus').value;

    if (!numero) {
        mostrarToast('Digite o número da matriz');
        return;
    }

    if (matrizes.some(m => m.numero === numero)) {
        mostrarToast('Matriz já cadastrada');
        return;
    }

    const nova = {
        id: Date.now(),
        numero,
        lote,
        obs,
        status,
        criadoEm: new Date().toISOString(),
        historico: [
            {
                tipo: 'Diagnóstico',
                status,
                obs: obs || 'Cadastro inicial',
                data: new Date().toISOString()
            }
        ],
        partos: []
    };

    matrizes.unshift(nova);

    salvarStorage();
    limparModalCadastro();
    fecharModalCadastro();
    atualizarTudo();

    mostrarToast('Matriz cadastrada com sucesso');
}

function limparModalCadastro() {
    document.getElementById('modalNumero').value = '';
    document.getElementById('modalLote').value = '';
    document.getElementById('modalObs').value = '';
    document.getElementById('modalStatus').value = 'Prenha';

    const busca = document.getElementById('buscaInput');
    const lote = document.getElementById('loteInput');

    if (busca) busca.value = '';
    if (lote) lote.value = '';
}

/* ================= DASHBOARD ================= */

function atualizarDashboard() {
    document.getElementById('totalMatrizes').innerText = matrizes.length;

    document.getElementById('totalPrenhas').innerText =
        matrizes.filter(m => m.status === 'Prenha').length;

    document.getElementById('totalVazias').innerText =
        matrizes.filter(m => m.status === 'Vazia').length;
}

/* ================= RENDER MATRIZES ================= */

function renderizarMatrizes(lista = matrizes) {
    const container = document.getElementById('listaMatrizes');
    if (!container) return;

    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                Nenhuma matriz cadastrada.
            </div>
        `;
        return;
    }

    lista.forEach(item => {
        const badge = item.status === 'Prenha'
            ? 'badge-prenha'
            : 'badge-vazia';

        const card = document.createElement('div');
        card.className = 'matriz-card';

        card.innerHTML = `
            <div class="card-top">
                <div>
                    <div class="matriz-numero">${escaparHtml(item.numero)}</div>
                    <div class="matriz-lote">${escaparHtml(item.lote || 'Sem lote')}</div>
                </div>

                <div class="status-badge ${badge}">
                    ${escaparHtml(item.status)}
                </div>
            </div>

            <div class="card-obs">
                ${escaparHtml(item.obs || 'Sem observações')}
            </div>

            <div class="card-actions">
                <button class="btn-prenha" onclick="abrirModalDiagnostico(${item.id}, 'Prenha')">
                    Prenha
                </button>

                <button class="btn-vazia" onclick="abrirModalDiagnostico(${item.id}, 'Vazia')">
                    Vazia
                </button>

                <button class="btn-info" onclick="abrirFicha(${item.id})">
                    Ficha
                </button>

                <button class="btn-delete" onclick="excluirMatriz(${item.id})">
                    Excluir
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

/* ================= MODAL DIAGNÓSTICO ================= */

function abrirModalDiagnostico(id, status = 'Prenha') {
    document.getElementById('diagMatrizId').value = id;
    document.getElementById('diagStatus').value = status;
    document.getElementById('diagObs').value = '';

    document.getElementById('modalDiagnostico').classList.remove('hidden');
}

function fecharModalDiagnostico() {
    document.getElementById('modalDiagnostico').classList.add('hidden');
}

function salvarDiagnosticoModal() {
    const id = Number(document.getElementById('diagMatrizId').value);
    const status = document.getElementById('diagStatus').value;
    const obs = document.getElementById('diagObs').value.trim() || '-';

    const matriz = matrizes.find(m => m.id === id);
    if (!matriz) return;

    matriz.status = status;

    if (!Array.isArray(matriz.historico)) {
        matriz.historico = [];
    }

    matriz.historico.unshift({
        tipo: 'Diagnóstico',
        status,
        obs,
        data: new Date().toISOString()
    });

    salvarStorage();
    atualizarTudo();
    fecharModalDiagnostico();

    if (!document.getElementById('modalFicha')?.classList.contains('hidden')) {
        abrirFicha(id);
    }

    mostrarToast('Diagnóstico salvo');
}

/* ================= MODAL PARTO ================= */

function abrirModalParto(id) {
    document.getElementById('partoMatrizId').value = id;
    document.getElementById('partoData').value = new Date().toISOString().slice(0, 10);
    document.getElementById('partoSexo').value = 'Macho';
    document.getElementById('partoObs').value = '';

    document.getElementById('modalParto').classList.remove('hidden');
}

function fecharModalParto() {
    document.getElementById('modalParto').classList.add('hidden');
}

function salvarPartoModal() {
    const id = Number(document.getElementById('partoMatrizId').value);
    const data = document.getElementById('partoData').value;
    const sexo = document.getElementById('partoSexo').value;
    const obs = document.getElementById('partoObs').value.trim() || '-';

    if (!data) {
        mostrarToast('Informe a data do parto');
        return;
    }

    const matriz = matrizes.find(m => m.id === id);
    if (!matriz) return;

    if (!Array.isArray(matriz.partos)) {
        matriz.partos = [];
    }

    if (!Array.isArray(matriz.historico)) {
        matriz.historico = [];
    }

    matriz.partos.unshift({
        data,
        sexo,
        obs,
        criadoEm: new Date().toISOString()
    });

    matriz.historico.unshift({
        tipo: 'Parto',
        status: `Nascimento - ${sexo}`,
        obs,
        data: new Date().toISOString()
    });

    salvarStorage();
    atualizarTudo();
    fecharModalParto();
    abrirFicha(id);

    mostrarToast('Parto registrado');
}

/* ================= FICHA INDIVIDUAL ================= */

function criarModalFicha() {
    if (document.getElementById('modalFicha')) return;

    const modal = document.createElement('div');
    modal.id = 'modalFicha';
    modal.className = 'modal-overlay hidden';

    modal.innerHTML = `
        <div class="modal-box ficha-box">
            <h2 class="modal-title" id="fichaTitulo">
                Ficha da Matriz
            </h2>

            <div id="fichaConteudo"></div>

            <div class="modal-actions">
                <button class="cancel-btn" onclick="fecharFicha()">
                    Fechar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function abrirFicha(id) {
    const matriz = matrizes.find(m => m.id === id);
    if (!matriz) return;

    document.getElementById('modalFicha').classList.remove('hidden');
    document.getElementById('fichaTitulo').innerText = `Matriz ${matriz.numero}`;

    const partos = Array.isArray(matriz.partos) && matriz.partos.length
        ? matriz.partos.map(p => `
            <div class="historico-item">
                <strong>Parto:</strong> ${formatarData(p.data)}<br>
                <span>Sexo: ${escaparHtml(p.sexo)}</span><br>
                <small>${escaparHtml(p.obs || '-')}</small>
            </div>
        `).join('')
        : `<div class="historico-item">Nenhum parto registrado.</div>`;

    const historico = Array.isArray(matriz.historico) && matriz.historico.length
        ? matriz.historico.map(h => `
            <div class="historico-item">
                <strong>${escaparHtml(h.tipo)}:</strong> ${escaparHtml(h.status)}<br>
                <span>${formatarDataHora(h.data)}</span><br>
                <small>${escaparHtml(h.obs || '-')}</small>
            </div>
        `).join('')
        : `<div class="historico-item">Nenhum histórico registrado.</div>`;

    document.getElementById('fichaConteudo').innerHTML = `
        <div class="ficha-resumo">
            <p><strong>Status:</strong> ${escaparHtml(matriz.status)}</p>
            <p><strong>Lote:</strong> ${escaparHtml(matriz.lote || 'Sem lote')}</p>
            <p><strong>Observação:</strong> ${escaparHtml(matriz.obs || '-')}</p>
        </div>

        <div class="card-actions mt-4">
            <button class="btn-prenha" onclick="abrirModalDiagnostico(${matriz.id}, 'Prenha')">
                Prenha
            </button>

            <button class="btn-vazia" onclick="abrirModalDiagnostico(${matriz.id}, 'Vazia')">
                Vazia
            </button>

            <button class="btn-info" onclick="abrirModalParto(${matriz.id})">
                Registrar Parto
            </button>
        </div>

        <h3 class="subtitulo-ficha">Partos</h3>
        ${partos}

        <h3 class="subtitulo-ficha">Histórico</h3>
        ${historico}
    `;
}

function fecharFicha() {
    document.getElementById('modalFicha').classList.add('hidden');
}

/* ================= EXCLUIR ================= */

function excluirMatriz(id) {
    if (!confirm('Deseja excluir esta matriz?')) return;

    matrizes = matrizes.filter(m => m.id !== id);

    salvarStorage();
    atualizarTudo();

    mostrarToast('Matriz excluída');
}

/* ================= FILTROS ================= */

function atualizarFiltroLotes() {
    const select = document.getElementById('filtroLote');
    if (!select) return;

    const valorAtual = select.value;

    const lotes = [...new Set(
        matrizes
            .map(m => m.lote)
            .filter(Boolean)
    )];

    select.innerHTML = '<option value="">Todos os lotes</option>';

    lotes.forEach(lote => {
        const option = document.createElement('option');
        option.value = lote;
        option.textContent = lote;
        select.appendChild(option);
    });

    select.value = valorAtual;
}

function filtrarMatrizes() {
    const busca = document.getElementById('buscaInput')?.value.toLowerCase() || '';
    const lote = document.getElementById('filtroLote')?.value || '';

    const filtradas = matrizes.filter(item => {
        const buscaOk = item.numero.toLowerCase().includes(busca);
        const loteOk = !lote || item.lote === lote;

        return buscaOk && loteOk;
    });

    renderizarMatrizes(filtradas);
}

function limparFiltros() {
    document.getElementById('buscaInput').value = '';
    document.getElementById('filtroLote').value = '';

    renderizarMatrizes();
}

/* ================= BACKUP ================= */

function exportarBackup() {
    const backup = {
        versao: 'v13',
        exportadoEm: new Date().toISOString(),
        total: matrizes.length,
        matrizes
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `fazendajs-backup-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    mostrarToast('Backup exportado');
}

/* ================= UTIL ================= */

function atualizarTudo() {
    atualizarDashboard();
    renderizarMatrizes();
    atualizarFiltroLotes();
}

function formatarData(data) {
    if (!data) return '-';

    const partes = data.split('-');

    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
}

function formatarDataHora(data) {
    try {
        return new Date(data).toLocaleString('pt-BR');
    } catch {
        return '-';
    }
}

function escaparHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ================= GLOBAIS ================= */

window.abrirModalCadastro = abrirModalCadastro;
window.fecharModalCadastro = fecharModalCadastro;
window.salvarMatrizModal = salvarMatrizModal;

window.abrirModalDiagnostico = abrirModalDiagnostico;
window.fecharModalDiagnostico = fecharModalDiagnostico;
window.salvarDiagnosticoModal = salvarDiagnosticoModal;

window.abrirModalParto = abrirModalParto;
window.fecharModalParto = fecharModalParto;
window.salvarPartoModal = salvarPartoModal;

window.abrirFicha = abrirFicha;
window.fecharFicha = fecharFicha;

window.excluirMatriz = excluirMatriz;
window.filtrarMatrizes = filtrarMatrizes;
window.limparFiltros = limparFiltros;
window.exportarBackup = exportarBackup;
window.mostrarToast = mostrarToast;
