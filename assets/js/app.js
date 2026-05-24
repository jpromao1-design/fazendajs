// =====================================================
// FAZENDA JS v12
// Integração Supabase + LocalStorage
// =====================================================

// =========================
// SUPABASE
// =========================

const SUPABASE_URL =
  'https://rmdxjxlhzeevybriywzf.supabase.co';

const SUPABASE_ANON_KEY =
  'sb_publishable_IU6_hF0V4xjTIZ5KlCLW9A_quYu8YA9';

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// =========================
// ELEMENTOS
// =========================

const inputNumero = document.getElementById('numeroMatriz');
const inputLote = document.getElementById('loteMatriz');

const listaMatrizes = document.getElementById('listaMatrizes');

const totalBadge = document.getElementById('totalBadge');
const prenhaBadge = document.getElementById('prenhaBadge');
const vaziaBadge = document.getElementById('vaziaBadge');

const filtroLote = document.getElementById('filtroLote');

// =========================
// DADOS
// =========================

let matrizes = [];

// =========================
// INIT
// =========================

window.addEventListener('load', async () => {
  await carregarMatrizes();
});

// =========================
// CARREGAR MATRIZES
// =========================

async function carregarMatrizes() {
  try {
    const { data, error } = await supabaseClient
      .from('matrizes')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error(error);
      carregarLocal();
      return;
    }

    matrizes = data || [];

    localStorage.setItem(
      'fazenda_matrizes',
      JSON.stringify(matrizes)
    );

    renderizarMatrizes();
  } catch (e) {
    console.error(e);
    carregarLocal();
  }
}

// =========================
// LOCAL STORAGE FALLBACK
// =========================

function carregarLocal() {
  matrizes = JSON.parse(
    localStorage.getItem('fazenda_matrizes') || '[]'
  );

  renderizarMatrizes();
}

// =========================
// CADASTRAR MATRIZ
// =========================

async function cadastrarMatriz() {
  const numero = inputNumero.value.trim();
  const lote = inputLote.value.trim();

  if (!numero) {
    alert('Digite o número da matriz');
    return;
  }

  const nova = {
    numero,
    lote,
    status: 'Prenha'
  };

  try {
    const { data, error } = await supabaseClient
      .from('matrizes')
      .insert([nova])
      .select();

    if (error) {
      console.error(error);
      salvarLocal(nova);
      return;
    }

    matrizes.unshift(data[0]);

    atualizarLocal();

    renderizarMatrizes();

    limparCampos();
  } catch (e) {
    console.error(e);

    salvarLocal(nova);
  }
}

// =========================
// SALVAR LOCAL
// =========================

function salvarLocal(nova) {
  nova.id = Date.now();

  matrizes.unshift(nova);

  atualizarLocal();

  renderizarMatrizes();

  limparCampos();
}

// =========================
// LIMPAR
// =========================

function limparCampos() {
  inputNumero.value = '';
  inputLote.value = '';
}

// =========================
// LOCAL STORAGE
// =========================

function atualizarLocal() {
  localStorage.setItem(
    'fazenda_matrizes',
    JSON.stringify(matrizes)
  );
}

// =========================
// RENDER
// =========================

function renderizarMatrizes() {
  listaMatrizes.innerHTML = '';

  let prenhas = 0;
  let vazias = 0;

  const loteFiltro = filtroLote.value;

  let filtradas = matrizes;

  if (loteFiltro !== 'todos') {
    filtradas = matrizes.filter(
      (m) => m.lote === loteFiltro
    );
  }

  if (!filtradas.length) {
    listaMatrizes.innerHTML = `
      <div class="empty-state">
        Nenhuma matriz cadastrada
      </div>
    `;
  }

  filtradas.forEach((matriz) => {
    if (matriz.status === 'Prenha') prenhas++;
    else vazias++;

    const card = document.createElement('div');

    card.className = 'matriz-card';

    card.innerHTML = `
      <div class="matriz-header">
        <div>
          <h3>${matriz.numero}</h3>
          <p>${matriz.lote || 'Sem lote'}</p>
        </div>

        <span class="status ${matriz.status}">
          ${matriz.status}
        </span>
      </div>

      <div class="matriz-actions">
        <button onclick="alterarStatus(${matriz.id}, 'Prenha')">
          Prenha
        </button>

        <button onclick="alterarStatus(${matriz.id}, 'Vazia')">
          Vazia
        </button>

        <button onclick="excluirMatriz(${matriz.id})">
          Excluir
        </button>
      </div>
    `;

    listaMatrizes.appendChild(card);
  });

  totalBadge.textContent = filtradas.length;
  prenhaBadge.textContent = prenhas;
  vaziaBadge.textContent = vazias;

  atualizarFiltroLotes();
}

// =========================
// ALTERAR STATUS
// =========================

async function alterarStatus(id, status) {
  const matriz = matrizes.find((m) => m.id == id);

  if (!matriz) return;

  matriz.status = status;

  atualizarLocal();

  renderizarMatrizes();

  await supabaseClient
    .from('matrizes')
    .update({ status })
    .eq('id', id);
}

// =========================
// EXCLUIR
// =========================

async function excluirMatriz(id) {
  if (!confirm('Deseja excluir?')) return;

  matrizes = matrizes.filter((m) => m.id != id);

  atualizarLocal();

  renderizarMatrizes();

  await supabaseClient
    .from('matrizes')
    .delete()
    .eq('id', id);
}

// =========================
// FILTRO LOTES
// =========================

function atualizarFiltroLotes() {
  const lotes = [...new Set(
    matrizes
      .map((m) => m.lote)
      .filter(Boolean)
  )];

  filtroLote.innerHTML =
    `<option value="todos">Todos os lotes</option>`;

  lotes.forEach((lote) => {
    filtroLote.innerHTML += `
      <option value="${lote}">
        ${lote}
      </option>
    `;
  });
}

// =========================
// EVENTOS
// =========================

document
  .getElementById('btnCadastrar')
  .addEventListener('click', cadastrarMatriz);

filtroLote.addEventListener(
  'change',
  renderizarMatrizes
);
