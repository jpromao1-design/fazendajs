// ======================================================
// FAZENDA JS v11 - APP FINAL OPERACIONAL
// ======================================================

// ======================================================
// CONFIGURAÇÃO SUPABASE
// ======================================================

const SUPABASE_URL =
'https://rmdxjxlhzeevybriywzf.supabase.co';

const SUPABASE_ANON_KEY =
'sb_publishable_IU6_hF0V4xjTIZ5KlCLW9A_quYu8YA9';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ======================================================
// STORAGE
// ======================================================

const STORAGE_KEY = 'fazendaJS_v11';

let matrizes = [];

// ======================================================
// ELEMENTOS HTML
// ======================================================

const inputBusca =
document.getElementById('inputBusca');

const inputLote =
document.getElementById('inputLote');

const btnCadastrar =
document.getElementById('btnCadastrar');

const listaMatrizes =
document.getElementById('listaMatrizes');

const totalMatrizes =
document.getElementById('totalMatrizes');

const totalPrenhas =
document.getElementById('totalPrenhas');

const totalVazias =
document.getElementById('totalVazias');

const filtroLote =
document.getElementById('filtroLote');

const btnLimpar =
document.getElementById('btnLimpar');

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener('DOMContentLoaded', async () => {

    carregarLocal();

    renderizar();

    await carregarSupabase();

});

// ======================================================
// CARREGAR LOCAL
// ======================================================

function carregarLocal() {

    const dados =
    localStorage.getItem(STORAGE_KEY);

    if (dados) {

        matrizes = JSON.parse(dados);

    }

}

// ======================================================
// SALVAR LOCAL
// ======================================================

function salvarLocal() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(matrizes)
    );

}

// ======================================================
// CARREGAR SUPABASE
// ======================================================

async function carregarSupabase() {

    try {

        const { data, error } =
        await supabaseClient
            .from('matrizes')
            .select('*')
            .order('id', { ascending: false });

        if (error) {

            console.error(error);

            return;

        }

        if (data) {

            matrizes = data;

            salvarLocal();

            renderizar();

        }

    } catch (err) {

        console.error(err);

    }

}

// ======================================================
// CADASTRAR MATRIZ
// ======================================================

btnCadastrar.addEventListener(
    'click',
    cadastrarMatriz
);

async function cadastrarMatriz() {

    const numero =
    inputBusca.value.trim();

    const lote =
    inputLote.value.trim();

    if (!numero) {

        alert('Digite o número da matriz.');

        return;

    }

    const nova = {

        numero: numero,

        lote: lote,

        status: 'Prenha',

        obs: '',

        criado_em:
        new Date().toISOString()

    };

    // ==========================================
    // SALVAR LOCAL
    // ==========================================

    matrizes.unshift(nova);

    salvarLocal();

    renderizar();

    // ==========================================
    // LIMPAR CAMPOS
    // ==========================================

    inputBusca.value = '';

    inputLote.value = '';

    // ==========================================
    // SALVAR SUPABASE
    // ==========================================

    try {

        const { error } =
        await supabaseClient
            .from('matrizes')
            .insert([nova]);

        if (error) {

            console.error(error);

        }

    } catch (err) {

        console.error(err);

    }

}

// ======================================================
// RENDERIZAR
// ======================================================

function renderizar() {

    listaMatrizes.innerHTML = '';

    let lista = [...matrizes];

    const loteSelecionado =
    filtroLote.value;

    if (loteSelecionado) {

        lista = lista.filter(item =>
            item.lote === loteSelecionado
        );

    }

    if (lista.length === 0) {

        listaMatrizes.innerHTML = `

            <div class="nenhuma">

                Nenhuma matriz cadastrada.

            </div>

        `;

    }

    lista.forEach((matriz, index) => {

        const card =
        document.createElement('div');

        card.className = 'matriz';

        card.innerHTML = `

            <div class="topo-matriz">

                <div class="numero">

                    ${matriz.numero}

                </div>

                <div class="status ${matriz.status.toLowerCase()}">

                    ${matriz.status}

                </div>

            </div>

            <div class="info">

                <strong>Lote:</strong>

                ${matriz.lote || '-'}

            </div>

            <div class="botoes">

                <button
                class="btn-status btn-prenha"
                onclick="alterarStatus(${index}, 'Prenha')">

                    Prenha

                </button>

                <button
                class="btn-status btn-vazia"
                onclick="alterarStatus(${index}, 'Vazia')">

                    Vazia

                </button>

                <button
                class="btn-status btn-excluir"
                onclick="excluirMatriz(${index})">

                    Excluir

                </button>

            </div>

        `;

        listaMatrizes.appendChild(card);

    });

    atualizarIndicadores();

    atualizarFiltroLotes();

}

// ======================================================
// INDICADORES
// ======================================================

function atualizarIndicadores() {

    totalMatrizes.textContent =
    matrizes.length;

    totalPrenhas.textContent =
    matrizes.filter(
        m => m.status === 'Prenha'
    ).length;

    totalVazias.textContent =
    matrizes.filter(
        m => m.status === 'Vazia'
    ).length;

}

// ======================================================
// FILTRO LOTES
// ======================================================

function atualizarFiltroLotes() {

    const lotes = [

        ...new Set(

            matrizes
                .map(m => m.lote)
                .filter(Boolean)

        )

    ];

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

// ======================================================
// ALTERAR STATUS
// ======================================================

window.alterarStatus = function(index, status) {

    matrizes[index].status = status;

    salvarLocal();

    renderizar();

};

// ======================================================
// EXCLUIR MATRIZ
// ======================================================

window.excluirMatriz = function(index) {

    const confirmar =
    confirm('Deseja excluir esta matriz?');

    if (!confirmar) return;

    matrizes.splice(index, 1);

    salvarLocal();

    renderizar();

};

// ======================================================
// FILTROS
// ======================================================

filtroLote.addEventListener(
    'change',
    renderizar
);

btnLimpar.addEventListener(
    'click',
    () => {

        filtroLote.value = '';

        renderizar();

    }
);
