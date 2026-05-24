const STORAGE_KEY = 'fazendajs_matrizes_v12';
const BACKUP_KEY = 'fazendajs_backup_auto';

let matrizes = [];

// ======================================================
// INIT
// ======================================================

document.addEventListener('DOMContentLoaded', iniciarSistema);

function iniciarSistema() {

    carregarStorage();

    atualizarDashboard();

    renderizarMatrizes();

    atualizarFiltroLotes();
}

// ======================================================
// STORAGE
// ======================================================

function carregarStorage() {

    try {

        const dados =
            JSON.parse(localStorage.getItem(STORAGE_KEY));

        matrizes = Array.isArray(dados)
            ? dados
            : [];

    } catch {

        matrizes = [];
    }
}

function salvarStorage() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(matrizes)
    );

    salvarBackupAutomatico();
}

// ======================================================
// BACKUP AUTO
// ======================================================

function salvarBackupAutomatico() {

    const backup = {

        versao: 'v12',

        data: new Date().toISOString(),

        matrizes
    };

    localStorage.setItem(
        BACKUP_KEY,
        JSON.stringify(backup)
    );
}

// ======================================================
// EXPORTAR BACKUP
// ======================================================

function exportarBackup() {

    const backup = {

        versao: 'v12',

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

    a.download =
        `fazendajs-backup-${Date.now()}.json`;

    a.click();

    URL.revokeObjectURL(url);

    mostrarToast('Backup exportado');
}

// ======================================================
// IMPORTAR BACKUP
// ======================================================

function importarBackup(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        try {

            const dados =
                JSON.parse(e.target.result);

            if (!dados.matrizes) {

                mostrarToast('Backup inválido');

                return;
            }

            matrizes = dados.matrizes;

            salvarStorage();

            atualizarDashboard();

            renderizarMatrizes();

            atualizarFiltroLotes();

            mostrarToast('Backup restaurado');

        } catch {

            mostrarToast('Erro ao importar backup');
        }
    };

    reader.readAsText(file);
}

// ======================================================
// TOAST
// ======================================================

function mostrarToast(texto) {

    const toast =
        document.getElementById('toast');

    toast.innerText = texto;

    toast.classList.add('show');

    setTimeout(() => {

        toast.classList.remove('show');

    }, 3000);
}

// ======================================================
// MODAL
// ======================================================

function abrirModalCadastro() {

    document
        .getElementById('modalCadastro')
        .classList
        .remove('hidden');
}

function fecharModalCadastro() {

    document
        .getElementById('modalCadastro')
        .classList
        .add('hidden');
}

// ======================================================
// CADASTRAR
// ======================================================

function salvarMatrizModal() {

    const numero =
        document.getElementById('modalNumero')
            .value
            .trim();

    const lote =
        document.getElementById('modalLote')
            .value
            .trim();

    const obs =
        document.getElementById('modalObs')
            .value
            .trim();

    const status =
        document.getElementById('modalStatus')
            .value;

    if (!numero) {

        mostrarToast(
            'Digite o número da matriz'
        );

        return;
    }

    const existe = matrizes.find(
        m => m.numero === numero
    );

    if (existe) {

        mostrarToast(
            'Matriz já cadastrada'
        );

        return;
    }

    const nova = {

        id: Date.now(),

        numero,

        lote,

        obs,

        status,

        criadoEm:
            new Date().toISOString()
    };

    matrizes.unshift(nova);

    salvarStorage();

    atualizarDashboard();

    renderizarMatrizes();

    atualizarFiltroLotes();

    fecharModalCadastro();

    limparModal();

    mostrarToast(
        'Matriz cadastrada'
    );
}

// ======================================================
// LIMPAR MODAL
// ======================================================

function limparModal() {

    document.getElementById(
        'modalNumero'
    ).value = '';

    document.getElementById(
        'modalLote'
    ).value = '';

    document.getElementById(
        'modalObs'
    ).value = '';
}

// ======================================================
// DASHBOARD
// ======================================================

function atualizarDashboard() {

    document.getElementById(
        'totalMatrizes'
    ).innerText = matrizes.length;

    document.getElementById(
        'totalPrenhas'
    ).innerText = matrizes.filter(
        m => m.status === 'Prenha'
    ).length;

    document.getElementById(
        'totalVazias'
    ).innerText = matrizes.filter(
        m => m.status === 'Vazia'
    ).length;
}

// ======================================================
// LISTA
// ======================================================

function renderizarMatrizes(lista = matrizes) {

    const container =
        document.getElementById(
            'listaMatrizes'
        );

    container.innerHTML = '';

    if (lista.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma matriz cadastrada
            </div>
        `;

        return;
    }

    lista.forEach(item => {

        const card =
            document.createElement('div');

        card.className = 'matriz-card';

        const badge =
            item.status === 'Prenha'
                ? 'badge-prenha'
                : 'badge-vazia';

        card.innerHTML = `

            <div class="card-top">

                <div>

                    <div class="matriz-numero">
                        ${item.numero}
                    </div>

                    <div class="matriz-lote">
                        ${item.lote || 'Sem lote'}
                    </div>

                </div>

                <div class="status-badge ${badge}">
                    ${item.status}
                </div>

            </div>

            <div class="card-obs">
                ${item.obs || 'Sem observações'}
            </div>

            <div class="card-actions">

                <button
                    class="btn-prenha"
                    onclick="alterarStatus(${item.id}, 'Prenha')">

                    Prenha

                </button>

                <button
                    class="btn-vazia"
                    onclick="alterarStatus(${item.id}, 'Vazia')">

                    Vazia

                </button>

                <button
                    class="btn-delete"
                    onclick="excluirMatriz(${item.id})">

                    Excluir

                </button>

            </div>
        `;

        container.appendChild(card);
    });
}

// ======================================================
// STATUS
// ======================================================

function alterarStatus(id, status) {

    const matriz =
        matrizes.find(m => m.id === id);

    if (!matriz) return;

    matriz.status = status;

    salvarStorage();

    atualizarDashboard();

    renderizarMatrizes();

    mostrarToast(
        'Status atualizado'
    );
}

// ======================================================
// EXCLUIR
// ======================================================

function excluirMatriz(id) {

    if (!confirm(
        'Deseja excluir esta matriz?'
    )) return;

    matrizes =
        matrizes.filter(m => m.id !== id);

    salvarStorage();

    atualizarDashboard();

    renderizarMatrizes();

    atualizarFiltroLotes();

    mostrarToast(
        'Matriz excluída'
    );
}

// ======================================================
// FILTROS
// ======================================================

function atualizarFiltroLotes() {

    const select =
        document.getElementById(
            'filtroLote'
        );

    const lotes =
        [...new Set(
            matrizes
                .map(m => m.lote)
                .filter(Boolean)
        )];

    select.innerHTML =
        '<option value="">Todos os lotes</option>';

    lotes.forEach(lote => {

        const option =
            document.createElement('option');

        option.value = lote;

        option.textContent = lote;

        select.appendChild(option);
    });
}

function filtrarMatrizes() {

    const busca =
        document
            .getElementById('buscaInput')
            .value
            .toLowerCase();

    const lote =
        document
            .getElementById('filtroLote')
            .value;

    const filtradas =
        matrizes.filter(item => {

            const buscaOk =
                item.numero
                    .toLowerCase()
                    .includes(busca);

            const loteOk =
                !lote || item.lote === lote;

            return buscaOk && loteOk;
        });

    renderizarMatrizes(filtradas);
}

function limparFiltros() {

    document.getElementById(
        'buscaInput'
    ).value = '';

    document.getElementById(
        'filtroLote'
    ).value = '';

    renderizarMatrizes();
}
