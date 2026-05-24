const STORAGE_KEY = 'fazendajs_matrizes_v14';

let matrizes = [];

let graficoStatus = null;

document.addEventListener(
    'DOMContentLoaded',
    iniciarSistema
);

/* ===================================================== */
/* INIT */
/* ===================================================== */

function iniciarSistema() {

    carregarStorage();

    criarModalFicha();

    atualizarTudo();
}

/* ===================================================== */
/* STORAGE */
/* ===================================================== */

function carregarStorage() {

    try {

        const dados =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

        matrizes =
            Array.isArray(dados)
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
}

/* ===================================================== */
/* TOAST */
/* ===================================================== */

function mostrarToast(texto) {

    const toast =
        document.getElementById('toast');

    if (!toast) return;

    toast.innerText = texto;

    toast.classList.add('show');

    setTimeout(() => {

        toast.classList.remove('show');

    }, 3000);
}

/* ===================================================== */
/* MODAL CADASTRO */
/* ===================================================== */

function abrirModalCadastro() {

    const busca =
        document.getElementById(
            'buscaInput'
        ).value;

    const lote =
        document.getElementById(
            'loteInput'
        ).value;

    document.getElementById(
        'modalNumero'
    ).value = busca.toUpperCase();

    document.getElementById(
        'modalLote'
    ).value = lote;

    document.getElementById(
        'modalCadastro'
    ).classList.remove('hidden');
}

function fecharModalCadastro() {

    document.getElementById(
        'modalCadastro'
    ).classList.add('hidden');
}

function salvarMatrizModal() {

    const numero =
        document.getElementById(
            'modalNumero'
        ).value
            .trim()
            .toUpperCase();

    const lote =
        document.getElementById(
            'modalLote'
        ).value.trim();

    const obs =
        document.getElementById(
            'modalObs'
        ).value.trim();

    const status =
        document.getElementById(
            'modalStatus'
        ).value;

    if (!numero) {

        mostrarToast(
            'Digite o número da matriz'
        );

        return;
    }

    const existe =
        matrizes.find(
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
            new Date().toISOString(),

        historico: [{
            tipo: 'Diagnóstico',
            status,
            obs,
            data:
                new Date().toISOString()
        }],

        partos: []
    };

    matrizes.unshift(nova);

    salvarStorage();

    fecharModalCadastro();

    atualizarTudo();

    limparModalCadastro();

    mostrarToast(
        'Matriz cadastrada'
    );
}

function limparModalCadastro() {

    document.getElementById(
        'modalNumero'
    ).value = '';

    document.getElementById(
        'modalLote'
    ).value = '';

    document.getElementById(
        'modalObs'
    ).value = '';

    document.getElementById(
        'buscaInput'
    ).value = '';

    document.getElementById(
        'loteInput'
    ).value = '';
}

/* ===================================================== */
/* DASHBOARD */
/* ===================================================== */

function atualizarDashboard() {

    const prenhas =
        matrizes.filter(
            m => m.status === 'Prenha'
        ).length;

    const vazias =
        matrizes.filter(
            m => m.status === 'Vazia'
        ).length;

    const partos =
        matrizes.reduce((acc, item) => {

            return acc +
                (
                    Array.isArray(item.partos)
                        ? item.partos.length
                        : 0
                );

        }, 0);

    document.getElementById(
        'totalMatrizes'
    ).innerText = matrizes.length;

    document.getElementById(
        'totalPrenhas'
    ).innerText = prenhas;

    document.getElementById(
        'totalVazias'
    ).innerText = vazias;

    document.getElementById(
        'totalPartos'
    ).innerText = partos;

    renderizarGrafico(
        prenhas,
        vazias
    );
}

/* ===================================================== */
/* GRAFICO */
/* ===================================================== */

function renderizarGrafico(
    prenhas,
    vazias
) {

    const canvas =
        document.getElementById(
            'graficoStatus'
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext('2d');

    if (graficoStatus) {

        graficoStatus.destroy();
    }

    graficoStatus =
        new Chart(ctx, {

            type: 'doughnut',

            data: {

                labels: [
                    'Prenhas',
                    'Vazias'
                ],

                datasets: [{

                    data: [
                        prenhas,
                        vazias
                    ],

                    backgroundColor: [
                        '#22c55e',
                        '#ef4444'
                    ],

                    borderWidth: 0
                }]
            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        labels: {

                            color: '#ffffff',

                            font: {

                                size: 14
                            }
                        }
                    }
                }
            }
        });
}

/* ===================================================== */
/* MATRIZES */
/* ===================================================== */

function renderizarMatrizes(
    lista = matrizes
) {

    const container =
        document.getElementById(
            'listaMatrizes'
        );

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

        const badge =
            item.status === 'Prenha'
                ? 'badge-prenha'
                : 'badge-vazia';

        const card =
            document.createElement('div');

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
                    onclick="abrirModalDiagnostico(${item.id}, 'Prenha')">

                    Prenha

                </button>

                <button
                    class="btn-vazia"
                    onclick="abrirModalDiagnostico(${item.id}, 'Vazia')">

                    Vazia

                </button>

                <button
                    class="btn-info"
                    onclick="abrirFicha(${item.id})">

                    Ficha

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

/* ===================================================== */
/* MODAL DIAGNOSTICO */
/* ===================================================== */

function abrirModalDiagnostico(
    id,
    status = 'Prenha'
) {

    document.getElementById(
        'diagMatrizId'
    ).value = id;

    document.getElementById(
        'diagStatus'
    ).value = status;

    document.getElementById(
        'diagObs'
    ).value = '';

    document.getElementById(
        'modalDiagnostico'
    ).classList.remove('hidden');
}

function fecharModalDiagnostico() {

    document.getElementById(
        'modalDiagnostico'
    ).classList.add('hidden');
}

function salvarDiagnosticoModal() {

    const id = Number(
        document.getElementById(
            'diagMatrizId'
        ).value
    );

    const status =
        document.getElementById(
            'diagStatus'
        ).value;

    const obs =
        document.getElementById(
            'diagObs'
        ).value || '-';

    const matriz =
        matrizes.find(m => m.id === id);

    if (!matriz) return;

    matriz.status = status;

    matriz.historico.unshift({

        tipo: 'Diagnóstico',

        status,

        obs,

        data:
            new Date().toISOString()
    });

    salvarStorage();

    atualizarTudo();

    fecharModalDiagnostico();

    mostrarToast(
        'Diagnóstico salvo'
    );
}

/* ===================================================== */
/* FICHA */
/* ===================================================== */

function criarModalFicha() {

    if (
        document.getElementById(
            'modalFicha'
        )
    ) return;

    const modal =
        document.createElement('div');

    modal.id = 'modalFicha';

    modal.className =
        'modal-overlay hidden';

    modal.innerHTML = `

        <div class="modal-box ficha-box">

            <h2 class="modal-title"
                id="fichaTitulo">

                Ficha

            </h2>

            <div id="fichaConteudo"></div>

            <div class="modal-actions">

                <button
                    class="cancel-btn"
                    onclick="fecharFicha()">

                    Fechar

                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
}

function abrirFicha(id) {

    const matriz =
        matrizes.find(
            m => m.id === id
        );

    if (!matriz) return;

    document.getElementById(
        'modalFicha'
    ).classList.remove('hidden');

    document.getElementById(
        'fichaTitulo'
    ).innerText =
        `Matriz ${matriz.numero}`;

    const historico =
        matriz.historico.map(h => `

            <div class="historico-item">

                <strong>
                    ${h.tipo}
                </strong>

                <br>

                ${h.status}

                <br>

                <small>
                    ${new Date(h.data)
                        .toLocaleString('pt-BR')}
                </small>

            </div>

        `).join('');

    document.getElementById(
        'fichaConteudo'
    ).innerHTML = `

        <div class="ficha-resumo">

            <p>
                <strong>Status:</strong>
                ${matriz.status}
            </p>

            <p>
                <strong>Lote:</strong>
                ${matriz.lote || '-'}
            </p>

        </div>

        <div class="card-actions mt-4">

            <button
                class="btn-info"
                onclick="abrirModalParto(${matriz.id})">

                Registrar Parto

            </button>

        </div>

        <h3 class="subtitulo-ficha">
            Histórico
        </h3>

        ${historico}
    `;
}

function fecharFicha() {

    document.getElementById(
        'modalFicha'
    ).classList.add('hidden');
}

/* ===================================================== */
/* PARTO */
/* ===================================================== */

function abrirModalParto(id) {

    document.getElementById(
        'partoMatrizId'
    ).value = id;

    document.getElementById(
        'partoData'
    ).value =
        new Date()
            .toISOString()
            .slice(0,10);

    document.getElementById(
        'modalParto'
    ).classList.remove('hidden');
}

function fecharModalParto() {

    document.getElementById(
        'modalParto'
    ).classList.add('hidden');
}

function salvarPartoModal() {

    const id = Number(
        document.getElementById(
            'partoMatrizId'
        ).value
    );

    const data =
        document.getElementById(
            'partoData'
        ).value;

    const sexo =
        document.getElementById(
            'partoSexo'
        ).value;

    const obs =
        document.getElementById(
            'partoObs'
        ).value || '-';

    const matriz =
        matrizes.find(
            m => m.id === id
        );

    if (!matriz) return;

    matriz.partos.unshift({

        data,

        sexo,

        obs
    });

    matriz.historico.unshift({

        tipo: 'Parto',

        status:
            `Nascimento - ${sexo}`,

        obs,

        data:
            new Date().toISOString()
    });

    salvarStorage();

    atualizarTudo();

    fecharModalParto();

    mostrarToast(
        'Parto registrado'
    );
}

/* ===================================================== */
/* EXCLUIR */
/* ===================================================== */

function excluirMatriz(id) {

    if (!confirm(
        'Deseja excluir esta matriz?'
    )) return;

    matrizes =
        matrizes.filter(
            m => m.id !== id
        );

    salvarStorage();

    atualizarTudo();

    mostrarToast(
        'Matriz excluída'
    );
}

/* ===================================================== */
/* FILTROS */
/* ===================================================== */

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
            .getElementById(
                'buscaInput'
            )
            .value
            .toLowerCase();

    const lote =
        document
            .getElementById(
                'filtroLote'
            )
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

    renderizarMatrizes(
        filtradas
    );
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

/* ===================================================== */
/* BACKUP */
/* ===================================================== */

function exportarBackup() {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    matrizes,
                    null,
                    2
                )
            ],
            {
                type:
                    'application/json'
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement('a');

    a.href = url;

    a.download =
        'fazendajs-backup.json';

    a.click();

    URL.revokeObjectURL(url);

    mostrarToast(
        'Backup exportado'
    );
}

/* ===================================================== */
/* UPDATE */
/* ===================================================== */

function atualizarTudo() {

    atualizarDashboard();

    renderizarMatrizes();

    atualizarFiltroLotes();
}

/* ===================================================== */
/* EXPORT */
/* ===================================================== */

window.abrirModalCadastro =
    abrirModalCadastro;

window.fecharModalCadastro =
    fecharModalCadastro;

window.salvarMatrizModal =
    salvarMatrizModal;

window.abrirModalDiagnostico =
    abrirModalDiagnostico;

window.fecharModalDiagnostico =
    fecharModalDiagnostico;

window.salvarDiagnosticoModal =
    salvarDiagnosticoModal;

window.abrirFicha =
    abrirFicha;

window.fecharFicha =
    fecharFicha;

window.abrirModalParto =
    abrirModalParto;

window.fecharModalParto =
    fecharModalParto;

window.salvarPartoModal =
    salvarPartoModal;

window.excluirMatriz =
    excluirMatriz;

window.filtrarMatrizes =
    filtrarMatrizes;

window.limparFiltros =
    limparFiltros;

window.exportarBackup =
    exportarBackup;

window.mostrarToast =
    mostrarToast;
