const STORAGE_KEY = 'fazendajs_matrizes_v13';
const BACKUP_KEY = 'fazendajs_backup_auto_v13';

let matrizes = [];

document.addEventListener('DOMContentLoaded', iniciarSistema);

function iniciarSistema() {
    carregarStorage();
    criarModalFicha();
    atualizarDashboard();
    renderizarMatrizes();
    atualizarFiltroLotes();
}

/* ================= STORAGE ================= */

function carregarStorage() {
    try {
        const atual = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const anterior = JSON.parse(localStorage.getItem('fazendajs_matrizes_v12'));

        matrizes = Array.isArray(atual)
            ? atual
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
    localStorage.setItem(BACKUP_KEY, JSON.stringify({
        versao: 'v13',
        data: new Date().toISOString(),
        matrizes
    }));
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
    document.getElementById('modalCadastro').classList.remove('hidden');

    const busca = document.getElementById('buscaInput')?.value || '';
    const lote = document.getElementById('loteInput')?.value || '';

    document.getElementById('modalNumero').value = busca.toUpperCase();
    document.getElementById('modalLote').value = lote;
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

    if (document.getElementById('buscaInput')) {
        document.getElementById('buscaInput').value = '';
    }

    if (document.getElementById('loteInput')) {
        document.getElementById('loteInput').value = '';
    }
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
                    <div class="matriz-numero">${item.numero}</div>
                    <div class="matriz-lote">${item.lote || 'Sem lote'}</div>
                </div>

                <div class="status-badge ${badge}">
                    ${item.status}
                </div>
            </div>

            <div class="card-obs">
                ${item.obs || 'Sem observações'}
            </div>

            <div class="card-actions">
                <button class="btn-prenha" onclick="alterarStatus(${item.id}, 'Prenha')">
                    Prenha
                </button>

                <button class="btn-vazia" onclick="alterarStatus(${item.id}, 'Vazia')">
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

/* ================= STATUS ================= */

function alterarStatus(id, status) {
    const matriz = matrizes.find(m => m.id === id);
    if (!matriz) return;

    const obs = prompt('Observação do diagnóstico:', '') || '-';

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

    mostrarToast('Diagnóstico atualizado');
}

/* ================= PARTO ================= */

function registrarParto(id) {
    const matriz = matrizes.find(m => m.id === id);
    if (!matriz) return;

    const data = prompt('Data do parto no formato AAAA-MM-DD:', new Date().toISOString().slice(0, 10));

    if (!data) return;

    const sexo = prompt('Sexo do bezerro: Macho ou Fêmea', 'Macho') || 'Macho';
    const obs = prompt('Observação do parto:', '') || '-';

    if (!Array.isArray(matriz.partos)) {
        matriz.partos = [];
    }

    matriz.partos.unshift({
        data,
        sexo,
        obs,
        criadoEm: new Date().toISOString()
    });

    if (!Array.isArray(matriz.historico)) {
        matriz.historico = [];
    }

    matriz.historico.unshift({
        tipo: 'Parto',
        status: `Nascimento - ${sexo}`,
        obs,
        data: new Date().toISOString()
    });

    salvarStorage();
    atualizarTudo();
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
            <h2 class="modal-title" id="fichaTitulo">Ficha da Matriz</h2>

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
                <span>Sexo: ${p.sexo}</span><br>
                <small>${p.obs || '-'}</small>
            </div>
        `).join('')
        : `<div class="historico-item">Nenhum parto registrado.</div>`;

    const historico = Array.isArray(matriz.historico) && matriz.historico.length
        ? matriz.historico.map(h => `
            <div class="historico-item">
                <strong>${h.tipo}:</strong> ${h.status}<br>
                <span>${formatarDataHora(h.data)}</span><br>
                <small>${h.obs || '-'}</small>
            </div>
        `).join('')
        : `<div class="historico-item">Nenhum histórico registrado.</div>`;

    document.getElementById('fichaConteudo').innerHTML = `
        <div class="ficha-resumo">
            <p><strong>Status:</strong> ${matriz.status}</p>
            <p><strong>Lote:</strong> ${matriz.lote || 'Sem lote'}</p>
            <p><strong>Observação:</strong> ${matriz.obs || '-'}</p>
        </div>

        <div class="card-actions mt-4">
            <button class="btn-prenha" onclick="alterarStatus(${matriz.id}, 'Prenha')">
                Prenha
            </button>

            <button class="btn-vazia" onclick="alterarStatus(${matriz.id}, 'Vazia')">
                Vazia
            </button>

            <button class="btn-info" onclick="registrarParto(${matriz.id})">
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
}

function filtrarMatrizes() {
    const busca = document.getElementById('buscaInput').value.toLowerCase();
    const lote = document.getElementById('filtroLote').value;

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

/* ================= GLOBAIS ================= */

window.abrirModalCadastro = abrirModalCadastro;
window.fecharModalCadastro = fecharModalCadastro;
window.salvarMatrizModal = salvarMatrizModal;
window.alterarStatus = alterarStatus;
window.excluirMatriz = excluirMatriz;
window.filtrarMatrizes = filtrarMatrizes;
window.limparFiltros = limparFiltros;
window.exportarBackup = exportarBackup;
window.abrirFicha = abrirFicha;
window.fecharFicha = fecharFicha;
window.registrarParto = registrarParto;
window.mostrarToast = mostrarToast;
