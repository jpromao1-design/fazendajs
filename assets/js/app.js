// ======================================================
// BANCO LOCAL
// ======================================================

const STORAGE_KEY = 'fazendajs_matrizes_v12';

let matrizes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ======================================================
// SALVAR
// ======================================================

function salvarStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrizes));
}

// ======================================================
// TOAST
// ======================================================

function mostrarToast(texto) {

    const toast = document.getElementById('toast');

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
    document.getElementById('modalCadastro').classList.remove('hidden');
}

function fecharModalCadastro() {
    document.getElementById('modalCadastro').classList.add('hidden');
}

// ======================================================
// CADASTRAR MATRIZ
// ======================================================

function salvarMatrizModal() {

    const numero = document.getElementById('modalNumero').value.trim();
    const lote = document.getElementById('modalLote').value.trim();
    const obs = document.getElementById('modalObs').value.trim();
    const status = document.getElementById('modalStatus').value;

    if (!numero) {
        mostrarToast('Digite o número da matriz');
        return;
    }

    const nova = {
        id: Date.now(),
        numero,
        lote,
        obs,
        status
    };

    matrizes.unshift(nova);

    salvarStorage();

    atualizarDashboard();
    renderizarMatrizes();
    atualizarFiltroLotes();

    fecharModalCadastro();

    document.getElementById('modalNumero').value = '';
    document.getElementById('modalLote').value = '';
    document.getElementById('modalObs').value = '';

    mostrarToast('Matriz cadastrada com sucesso');
}

// ======================================================
// RENDER
// ======================================================

function renderizarMatrizes(lista = matrizes) {

    const container = document.getElementById('listaMatrizes');

    container.innerHTML = '';

    if (lista.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma matriz encontrada.
            </div>
        `;

        return;
    }

    lista.forEach(item => {

        const statusClass =
            item.status === 'Prenha'
                ? 'badge-prenha'
                : 'badge-vazia';

        const card = document.createElement('div');

        card.className = 'matriz-card';

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

                <div class="status-badge ${statusClass}">
                    ${item.status}
                </div>

            </div>

            <div class="card-obs">
                ${item.obs || 'Sem observações'}
            </div>

            <div class="card-actions">

                <button
                    class="btn-prenha"
                    onclick="alterarStatus(${item.id}, 'Prenha')"
                >
                    Prenha
                </button>

                <button
                    class="btn-vazia"
                    onclick="alterarStatus(${item.id}, 'Vazia')"
                >
                    Vazia
                </button>

                <button
                    class="btn-delete"
                    onclick="excluirMatriz(${item.id})"
                >
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

    const item = matrizes.find(m => m.id === id);

    if (!item) return;

    item.status = status;

    salvarStorage();

    atualizarDashboard();
    renderizarMatrizes();

    mostrarToast('Status atualizado');
}

// ======================================================
// EXCLUIR
// ======================================================

function excluirMatriz(id) {

    if (!confirm('Deseja excluir esta matriz?')) {
        return;
    }

    matrizes = matrizes.filter(m => m.id !== id);

    salvarStorage();

    atualizarDashboard();
    renderizarMatrizes();
    atualizarFiltroLotes();

    mostrarToast('Matriz excluída');
}

// ======================================================
// DASHBOARD
// ======================================================

function atualizarDashboard() {

    document.getElementById('totalMatrizes').textContent =
        matrizes.length;

    document.getElementById('totalPrenhas').textContent =
        matrizes.filter(m => m.status === 'Prenha').length;

    document.getElementById('totalVazias').textContent =
        matrizes.filter(m => m.status === 'Vazia').length;
}

// ======================================================
// FILTRO
// ======================================================

function atualizarFiltroLotes() {

    const select = document.getElementById('filtroLote');

    const lotes = [...new Set(
        matrizes
            .map(m => m.lote)
            .filter(Boolean)
    )];

    select.innerHTML =
        '<option value="">Todos os lotes</option>';

    lotes.forEach(lote => {

        const option = document.createElement('option');

        option.value = lote;
        option.textContent = lote;

        select.appendChild(option);
    });
}

function filtrarMatrizes() {

    const busca =
        document.getElementById('buscaInput')
            .value
            .toLowerCase();

    const lote =
        document.getElementById('filtroLote').value;

    const filtradas = matrizes.filter(item => {

        const matchBusca =
            item.numero.toLowerCase().includes(busca);

        const matchLote =
            !lote || item.lote === lote;

        return matchBusca && matchLote;
    });

    renderizarMatrizes(filtradas);
}

function limparFiltros() {

    document.getElementById('buscaInput').value = '';
    document.getElementById('filtroLote').value = '';

    renderizarMatrizes();
}

// ======================================================
// INIT
// ======================================================

atualizarDashboard();
renderizarMatrizes();
atualizarFiltroLotes();
