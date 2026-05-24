// =====================================================
// FAZENDA JS v11 - FINAL OPERACIONAL
// =====================================================

// =====================================================
// CONFIGURAÇÃO SUPABASE
// =====================================================

const SUPABASE_URL = 'https://rmdxjxlhzeevybriywzf.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_IU6_hF0V4xjTIZ5KlCLW9A_quYu8YA9';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// =====================================================
// BANCO LOCAL
// =====================================================

const STORAGE_KEY = 'fazendaJS_v11';

let matrizes = [];

// =====================================================
// ELEMENTOS
// =====================================================

const inputBusca = document.getElementById('inputBusca');
const inputLote = document.getElementById('inputLote');

const btnCadastrar = document.getElementById('btnCadastrar');

const listaMatrizes = document.getElementById('listaMatrizes');

const totalEl = document.getElementById('totalMatrizes');
const prenhasEl = document.getElementById('totalPrenhas');
const vaziasEl = document.getElementById('totalVazias');

const filtroLote = document.getElementById('filtroLote');
const btnLimpar = document.getElementById('btnLimpar');

// =====================================================
// INICIAR
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {

    carregarLocal();

    renderizar();

    await carregarSupabase();

});

// =====================================================
// CARREGAR LOCAL
// =====================================================

function carregarLocal() {

    const dados = localStorage.getItem(STORAGE_KEY);

    if (dados) {

        matrizes = JSON.parse(dados);

    }

}

// =====================================================
// SALVAR LOCAL
// =====================================================

function salvarLocal() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(matrizes)
    );

}

// =====================================================
// CARREGAR SUPABASE
// =====================================================

async function carregarSupabase() {

    try {

        const { data, error } = await supabaseClient
            .from('matrizes')
            .select('*')
            .order('id', { ascending: false });

        if (error) {

            console.error(error);
            return;

        }

        if (data && data.length > 0) {

            matrizes = data;

            salvarLocal();

            renderizar();

        }

    } catch (err) {

        console.error(err);

    }

}

// =====================================================
// CADASTRAR
// =====================================================

btnCadastrar.addEventListener('click', cadastrarMatriz);

async function cadastrarMatriz() {

    const numero = inputBusca.value.trim();

    const lote = inputLote.value.trim();

    if (!numero) {

        alert('Digite o número da matriz.');

        return;

    }

    const nova = {

        numero,
        lote,
        status: 'Prenha',
        obs: '',
        criado_em: new Date().toISOString()

    };

    // salva local

    matrizes.unshift(nova);

    salvarLocal();

    renderizar();

    // limpa campos

    inputBusca.value = '';
    inputLote.value = '';

    // salva supabase

    try {

        const { error } = await supabaseClient
            .from('matrizes')
            .insert([nova]);

        if (error) {

            console.error(error);

        }

    } catch (err) {

        console.error(err);

    }

}

// =====================================================
// RENDERIZAR
// =====================================================

function renderizar() {

    listaMatrizes.innerHTML = '';

    let filtradas = [...matrizes];

    const loteSelecionado = filtroLote.value;

    if (loteSelecionado) {

        filtradas = filtradas.filter(
            item => item.lote === loteSelecionado
        );

    }

    if (filtradas.length === 0) {

        listaMatrizes.innerHTML = `
            <div class="nenhuma-matriz">
                Nenhuma matriz cadastrada.
            </div>
        `;

    }

    filtradas.forEach((matriz, index) => {

        const card = document.createElement('div');

        card.className = 'card-matriz';

        card.innerHTML = `

            <div class="card-topo">

                <div class="numero-matriz">
                    ${matriz.numero}
                </div>

                <div class="status ${matriz.status.toLowerCase()}">
                    ${matriz.status}
                </div>

            </div>

            <div class="card-info">

                <div>
                    <strong>Lote:</strong>
                    ${matriz.lote || '-'}
                </div>

            </div>

            <div class="card-botoes">

                <button onclick="alterarStatus(${index}, 'Prenha')">
                    Prenha
                </button>

                <button onclick="alterarStatus(${index}, 'Vazia')">
                    Vazia
                </button>

                <button onclick="excluirMatriz(${index})">
                    Excluir
                </button>

            </div>

        `;

        listaMatrizes.appendChild(card);

    });

    atualizarIndicadores();

    atualizarFiltroLotes();

}

// =====================================================
// INDICADORES
// =====================================================

function atualizarIndicadores() {

    totalEl.textContent = matrizes.length;

    prenhasEl.textContent = matrizes.filter(
        m => m.status === 'Prenha'
    ).length;

    vaziasEl.textContent = matrizes.filter(
        m => m.status === 'Vazia'
    ).length;

}

// =====================================================
// FILTRO LOTES
// =====================================================

function atualizarFiltroLotes() {

    const lotes = [...new Set(
        matrizes
            .map(m => m.lote)
            .filter(Boolean)
    )];

    filtroLote.innerHTML = `
        <option value="">
            Todos os lotes
        </option>
    `;

    lotes.forEach(lote => {

        filtroLote.innerHTML += `
            <option value="${lote}">
                ${lote}
            </option>
        `;

    });

}

// =====================================================
// ALTERAR STATUS
// =====================================================

window.alterarStatus = function(index, status) {

    matrizes[index].status = status;

    salvarLocal();

    renderizar();

};

// =====================================================
// EXCLUIR
// =====================================================

window.excluirMatriz = function(index) {

    if (!confirm('Deseja excluir esta matriz?')) {

        return;

    }

    matrizes.splice(index, 1);

    salvarLocal();

    renderizar();

};

// =====================================================
// FILTRO
// =====================================================

filtroLote.addEventListener('change', renderizar);

btnLimpar.addEventListener('click', () => {

    filtroLote.value = '';

    renderizar();

});
