// ============================================================
        // CONFIGURAÇÃO E ESTADO
        // ============================================================
        const DB = {
            plantel: 'fazendaJsPlantelV11',
            plantelV10: 'fazendaJsPlantelV10',
            plantelV9: 'fazendaJsPlantelV9',
            plantelV8: 'fazendaJsPlantelV8',
            logs: 'fazendaJsLogsV11',
            tema: 'fazendaJsTemaV11',
            backupAuto: 'fazendaJsBackupAutoV11'
        };

        const LIMITES = {
            brinco: 30,
            lote: 40,
            observacao: 120,
            registrosLog: 300
        };

        let plantel = [];

        // ============================================================
        // UTILITÁRIOS DE SEGURANÇA E VALIDAÇÃO
        // ============================================================
        function textoSeguro(valor) {
            return String(valor ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function normalizarTexto(valor, limite = 120) {
            return String(valor ?? '')
                .trim()
                .replace(/\s+/g, ' ')
                .slice(0, limite);
        }

        function normalizarBrinco(valor) {
            return normalizarTexto(valor, LIMITES.brinco).toUpperCase();
        }

        function normalizarLote(valor) {
            const lote = normalizarTexto(valor, LIMITES.lote);
            return lote || '-';
        }

        function normalizarObs(valor) {
            const obs = normalizarTexto(valor, LIMITES.observacao);
            return obs || '-';
        }

        function encontrarMatriz(brinco) {
            const alvo = String(brinco ?? '').toUpperCase();
            return plantel.find(m => String(m.brinco ?? '').toUpperCase() === alvo);
        }

        function validarBrinco(brinco) {
            if (!brinco) return 'Digite a identificação da matriz.';
            if (brinco.length > LIMITES.brinco) return `A identificação deve ter no máximo ${LIMITES.brinco} caracteres.`;
            return '';
        }

        function validarAno(ano) {
            const anoAtual = new Date().getFullYear();
            const anoNumero = Number(ano);

            if (!Number.isInteger(anoNumero)) return 'Preencha o ano corretamente.';
            if (anoNumero < 2000) return 'O ano não pode ser inferior a 2000.';
            if (anoNumero > anoAtual + 1) return `O ano não pode ser superior a ${anoAtual + 1}.`;

            return '';
        }

        function dataAtualISO() {
            return new Date().toISOString();
        }

        function formatarData(dataISO) {
            if (!dataISO) return '-';

            const partes = String(dataISO).split('-');
            if (partes.length < 3) return textoSeguro(dataISO);

            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        function formatarDataHoraBR(iso) {
            try {
                return new Date(iso).toLocaleString('pt-BR');
            } catch {
                return '-';
            }
        }

        function mostrarToast(msg, tipo = 'sucesso') {
            const toast = document.getElementById('toast');
            toast.textContent = msg;

            if (tipo === 'sucesso') toast.style.backgroundColor = '#15803d';
            else if (tipo === 'erro') toast.style.backgroundColor = '#dc2626';
            else toast.style.backgroundColor = '#f59e0b';

            toast.classList.add('visivel');
            setTimeout(() => toast.classList.remove('visivel'), 3000);
        }

        function criarElemento(tag, classes = '', texto = '') {
            const el = document.createElement(tag);
            if (classes) el.className = classes;
            if (texto !== '') el.textContent = texto;
            return el;
        }

        // ============================================================
        // LOG LOCAL E BACKUP AUTOMÁTICO
        // ============================================================
        function carregarLogs() {
            try {
                const logs = JSON.parse(localStorage.getItem(DB.logs));
                return Array.isArray(logs) ? logs : [];
            } catch {
                return [];
            }
        }

        function registrarLog(acao, detalhes = {}) {
            const logs = carregarLogs();

            logs.unshift({
                data: dataAtualISO(),
                acao: String(acao ?? 'Ação'),
                detalhes
            });

            localStorage.setItem(DB.logs, JSON.stringify(logs.slice(0, LIMITES.registrosLog)));
        }

        function fazerBackupAutomatico(motivo = 'Backup automático') {
            try {
                const payload = {
                    versao: 'v11',
                    geradoEm: dataAtualISO(),
                    motivo,
                    plantel
                };
                localStorage.setItem(DB.backupAuto, JSON.stringify(payload));
            } catch {
                console.warn('Não foi possível gerar backup automático.');
            }
        }

        function renderizarLogs() {
            const div = document.getElementById('listaLogs');
            div.innerHTML = '';

            const brinco = document.getElementById('perfilBrincoAtual').value;
            const logs = carregarLogs()
                .filter(log => !brinco || String(log?.detalhes?.brinco ?? '').toUpperCase() === String(brinco).toUpperCase())
                .slice(0, 30);

            if (logs.length === 0) {
                div.textContent = 'Nenhum log local para esta matriz.';
                return;
            }

            logs.forEach(log => {
                const item = criarElemento('div', 'border rounded p-2 bg-gray-50 dark:bg-gray-800');
                item.textContent = `${formatarDataHoraBR(log.data)} — ${log.acao}`;
                div.appendChild(item);
            });
        }

        function toggleLogs() {
            const painel = document.getElementById('painelLogs');
            const icone = document.getElementById('iconeSetaLogs');

            painel.classList.toggle('escondido');
            icone.className = painel.classList.contains('escondido')
                ? 'fa-solid fa-chevron-down text-gray-400'
                : 'fa-solid fa-chevron-up text-jsgreen-700';

            renderizarLogs();
        }

        function limparLogs() {
            if (!confirm('Deseja limpar os logs locais? Esta ação não altera os dados do plantel.')) return;

            localStorage.removeItem(DB.logs);
            renderizarLogs();
            mostrarToast('Logs locais apagados.', 'aviso');
        }

        // ============================================================
        // TEMA
        // ============================================================
        function aplicarTemaSalvo() {
            const tema = localStorage.getItem(DB.tema) || 'claro';
            const html = document.documentElement;
            const icone = document.getElementById('iconeTema');

            if (tema === 'escuro') {
                html.classList.add('dark');
                if (icone) icone.className = 'fa-solid fa-sun';
            } else {
                html.classList.remove('dark');
                if (icone) icone.className = 'fa-solid fa-moon';
            }
        }

        function alternarTema() {
            const atual = localStorage.getItem(DB.tema) || 'claro';
            localStorage.setItem(DB.tema, atual === 'escuro' ? 'claro' : 'escuro');
            aplicarTemaSalvo();
        }

        // ============================================================
        // PERSISTÊNCIA LOCAL E MIGRAÇÃO
        // ============================================================
        function normalizarPlantel(dados) {
            if (!Array.isArray(dados)) return [];

            return dados
                .filter(item => item && typeof item === 'object')
                .map(item => {
                    const brinco = normalizarBrinco(item.brinco);
                    if (!brinco) return null;

                    const historico = Array.isArray(item.historico)
                        ? item.historico.map(h => ({
                            ano: String(h?.ano ?? '').slice(0, 4),
                            situacao: h?.situacao === 'Vazia' ? 'Vazia' : 'Prenha',
                            obs: normalizarObs(h?.obs)
                        })).filter(h => h.ano)
                        : [];

                    const partos = Array.isArray(item.partos)
                        ? item.partos.map(p => ({
                            data: String(p?.data ?? ''),
                            sexo: p?.sexo === 'Fêmea' ? 'Fêmea' : 'Macho',
                            obs: normalizarObs(p?.obs)
                        })).filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.data))
                        : [];

                    historico.sort((a, b) => Number(b.ano) - Number(a.ano));
                    partos.sort((a, b) => new Date(b.data) - new Date(a.data));

                    return {
                        brinco,
                        lote: normalizarLote(item.lote),
                        historico,
                        partos
                    };
                })
                .filter(Boolean);
        }

        function carregarDados() {
            const chaves = [DB.plantel, DB.plantelV10, DB.plantelV9, DB.plantelV8];

            for (const chave of chaves) {
                try {
                    const dados = JSON.parse(localStorage.getItem(chave));
                    const normalizados = normalizarPlantel(dados);

                    if (normalizados.length > 0) {
                        plantel = normalizados;
                        if (chave !== DB.plantel) {
                            salvarDados(false);
                            registrarLog('Migração de dados concluída', { origem: chave });
                        }
                        return;
                    }
                } catch {
                    // continua tentando versões antigas
                }
            }

            plantel = [];
        }

        function salvarDados(comLogBackup = true) {
            try {
                localStorage.setItem(DB.plantel, JSON.stringify(plantel));

                if (comLogBackup) {
                    fazerBackupAutomatico('Salvamento local');
                }

                atualizarDatalistLotes();
                atualizarFiltroLotes();
            } catch (e) {
                mostrarToast('Erro ao salvar no LocalStorage. Verifique o espaço do navegador.', 'erro');
            }
        }

        // ============================================================
        // INICIALIZAÇÃO
        // ============================================================
        document.addEventListener('DOMContentLoaded', () => {
            aplicarTemaSalvo();
            carregarDados();
            renderizarLista();
            atualizarDatalistLotes();
            atualizarFiltroLotes();
        });

        // ============================================================
        // LOTES DINÂMICOS
        // ============================================================
        function obterLotesUnicos() {
            return [...new Set(plantel.map(m => m.lote))]
                .filter(l => l && l !== '-')
                .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' }));
        }

        function atualizarDatalistLotes() {
            const datalist = document.getElementById('opcoesLotes');
            datalist.innerHTML = '';

            obterLotesUnicos().forEach(lote => {
                const option = document.createElement('option');
                option.value = lote;
                datalist.appendChild(option);
            });
        }

        function atualizarFiltroLotes() {
            const select = document.getElementById('filtroLote');
            if (!select) return;

            const valorAtual = select.value;
            select.innerHTML = '';

            const todos = document.createElement('option');
            todos.value = '';
            todos.textContent = 'Todos os lotes';
            select.appendChild(todos);

            obterLotesUnicos().forEach(lote => {
                const option = document.createElement('option');
                option.value = lote;
                option.textContent = lote;
                select.appendChild(option);
            });

            select.value = valorAtual;
        }

        function limparFiltros() {
            document.getElementById('buscaBrinco').value = '';
            document.getElementById('filtroLote').value = '';
            filtrarMatrizes();
        }

        // ============================================================
        // BACKUP E RESTAURAÇÃO
        // ============================================================
        function exportarBackup() {
            if (plantel.length === 0) {
                mostrarToast('Não há dados para exportar!', 'aviso');
                return;
            }

            const pacote = {
                sistema: 'Fazenda JS',
                versao: 'v11',
                geradoEm: dataAtualISO(),
                totalMatrizes: plantel.length,
                plantel
            };

            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pacote, null, 2));
            const downloadAnchorNode = document.createElement('a');

            downloadAnchorNode.setAttribute('href', dataStr);
            downloadAnchorNode.setAttribute('download', `FazendaJS_Backup_${new Date().toISOString().slice(0, 10)}.json`);

            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            registrarLog('Backup exportado', { totalMatrizes: plantel.length });
            mostrarToast('Backup baixado com sucesso!');
        }

        function importarDados(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (!file.name.toLowerCase().endsWith('.json')) {
                mostrarToast('Selecione um arquivo JSON válido.', 'erro');
                event.target.value = '';
                return;
            }

            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    const conteudo = JSON.parse(e.target.result);
                    const dadosImportados = Array.isArray(conteudo) ? conteudo : conteudo?.plantel;
                    const normalizados = normalizarPlantel(dadosImportados);

                    if (!normalizados.length) {
                        mostrarToast('Arquivo sem matrizes válidas para importar.', 'erro');
                        return;
                    }

                    if (!confirm(`Importar ${normalizados.length} matriz(es)? Os dados locais atuais serão substituídos.`)) {
                        return;
                    }

                    fazerBackupAutomatico('Antes da importação de backup');
                    plantel = normalizados;
                    salvarDados();

                    registrarLog('Backup importado', { totalMatrizes: plantel.length });
                    renderizarLista();
                    mostrarToast('Dados restaurados com sucesso!');
                } catch {
                    mostrarToast('Erro ao ler o arquivo de backup.', 'erro');
                } finally {
                    event.target.value = '';
                }
            };

            reader.readAsText(file);
        }

        // ============================================================
        // BUSCA E CADASTRO
        // ============================================================
        let _buscaTimer = null;

        function onBuscaInput() {
            if (_buscaTimer) clearTimeout(_buscaTimer);
            _buscaTimer = setTimeout(filtrarMatrizes, 250);
        }

        function filtrarMatrizes() {
            const busca = normalizarBrinco(document.getElementById('buscaBrinco').value);
            const loteSelecionado = document.getElementById('filtroLote')?.value || '';

            const btnNovo = document.getElementById('btnCadastrarNovo');
            const spanNovo = document.getElementById('numNovoBrinco');
            const painelLote = document.getElementById('painelLote');

            renderizarLista(busca, loteSelecionado);

            if (busca === '') {
                btnNovo.classList.remove('escondido');
                btnNovo.classList.add('opacity-60');
                spanNovo.textContent = '';
                painelLote.classList.add('escondido');
                return;
            }

            const existe = encontrarMatriz(busca);

            if (existe) {
                btnNovo.classList.add('escondido');
                painelLote.classList.add('escondido');
            } else {
                btnNovo.classList.remove('escondido');
                btnNovo.classList.remove('opacity-60');
                spanNovo.textContent = busca;
                painelLote.classList.remove('escondido');
            }
        }

        function cadastrarMatrizRapido() {
            const busca = normalizarBrinco(document.getElementById('buscaBrinco').value);
            const erro = validarBrinco(busca);

            if (erro) {
                mostrarToast(erro, 'aviso');
                document.getElementById('buscaBrinco').focus();
                return;
            }

            if (encontrarMatriz(busca)) {
                mostrarToast('Matriz já cadastrada!', 'erro');
                return;
            }

            const lote = normalizarLote(document.getElementById('novoLote').value);

            const novaMatriz = {
                brinco: busca,
                lote,
                historico: [],
                partos: []
            };

            plantel.push(novaMatriz);
            salvarDados();

            registrarLog('Matriz cadastrada', { brinco: busca, lote });

            document.getElementById('novoLote').value = '';
            abrirPerfil(busca);
            mostrarToast('Matriz cadastrada com sucesso!');
        }

        // ============================================================
        // LISTA E RESUMO
        // ============================================================
        function obterListaFiltrada(filtro = '', lote = '') {
            let lista = [...plantel];

            if (filtro) {
                lista = lista.filter(m => String(m.brinco ?? '').toUpperCase().includes(filtro));
            }

            if (lote) {
                lista = lista.filter(m => String(m.lote ?? '') === lote);
            }

            return lista.sort((a, b) =>
                String(a.brinco).localeCompare(String(b.brinco), undefined, {
                    numeric: true,
                    sensitivity: 'base'
                })
            );
        }

        function renderizarResumo(listaFiltrada) {
            const total = listaFiltrada.length;
            let prenhas = 0;
            let vazias = 0;

            listaFiltrada.forEach(m => {
                if (m.historico && m.historico.length > 0) {
                    if (m.historico[0].situacao === 'Prenha') prenhas++;
                    if (m.historico[0].situacao === 'Vazia') vazias++;
                }
            });

            const resumo = document.getElementById('resumoPlantel');
            resumo.innerHTML = '';

            const cards = [
                { numero: total, rotulo: 'Total', classe: 'text-gray-800 dark:text-white', borda: '' },
                { numero: prenhas, rotulo: 'Prenhas', classe: 'text-green-700', borda: 'border-green-200' },
                { numero: vazias, rotulo: 'Vazias', classe: 'text-red-600', borda: 'border-red-200' }
            ];

            cards.forEach(card => {
                const div = criarElemento('div', `card-base bg-white rounded-xl p-3 text-center shadow-sm border ${card.borda}`);
                const pNumero = criarElemento('p', `text-2xl font-black ${card.classe}`, card.numero);
                const pRotulo = criarElemento('p', 'text-xs text-gray-500 dark:text-gray-300 font-bold uppercase', card.rotulo);

                div.appendChild(pNumero);
                div.appendChild(pRotulo);
                resumo.appendChild(div);
            });
        }

        function renderizarLista(filtro = '', lote = '') {
            const lista = obterListaFiltrada(filtro, lote);
            renderizarResumo(lista);

            const ul = document.getElementById('listaContatos');
            ul.innerHTML = '';

            if (lista.length === 0 && !filtro && !lote) {
                const li = criarElemento('li', 'text-center text-gray-400 mt-6 italic', 'Nenhuma matriz cadastrada. Digite o número acima para começar.');
                ul.appendChild(li);
                return;
            }

            if (lista.length === 0) {
                const li = criarElemento('li', 'text-center text-gray-400 mt-6 italic', 'Nenhuma matriz encontrada com os filtros informados.');
                ul.appendChild(li);
                return;
            }

            const fragmento = document.createDocumentFragment();

            lista.forEach(m => {
                const ultDiag = (m.historico && m.historico.length > 0) ? m.historico[0].situacao : 'Sem Diag.';

                let corStatus = 'bg-gray-200 text-gray-700';
                if (ultDiag === 'Prenha') corStatus = 'bg-green-100 text-green-800';
                if (ultDiag === 'Vazia') corStatus = 'bg-red-100 text-red-800';

                const li = criarElemento(
                    'li',
                    'card-base bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-green-50 dark:hover:bg-gray-800 transition-colors'
                );

                li.onclick = () => abrirPerfil(m.brinco);

                const left = criarElemento('div', 'flex items-center min-w-0');

                const avatar = criarElemento(
                    'div',
                    'bg-jsgreen-900 text-white rounded-full min-w-[3rem] h-12 px-2 flex items-center justify-center font-bold text-lg shadow overflow-hidden'
                );

                const spanAvatar = criarElemento('span', 'truncate', m.brinco);
                avatar.appendChild(spanAvatar);

                const info = criarElemento('div', 'ml-4 truncate max-w-[170px] sm:max-w-[280px]');
                const tituloLinha = criarElemento('div', 'flex items-center min-w-0');
                const h3 = criarElemento('h3', 'font-bold text-gray-900 dark:text-white text-lg truncate', m.brinco);

                tituloLinha.appendChild(h3);

                if (m.lote && m.lote !== '-') {
                    const loteBadge = criarElemento('span', 'ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold truncate max-w-[100px]', m.lote);
                    tituloLinha.appendChild(loteBadge);
                }

                const status = criarElemento('span', `text-xs px-2 py-0.5 rounded font-bold ${corStatus} uppercase`, ultDiag);

                info.appendChild(tituloLinha);
                info.appendChild(status);

                left.appendChild(avatar);
                left.appendChild(info);

                const icon = criarElemento('i', 'fa-solid fa-chevron-right text-gray-400');

                li.appendChild(left);
                li.appendChild(icon);
                fragmento.appendChild(li);
            });

            ul.appendChild(fragmento);
        }

        // ============================================================
        // TELAS E PERFIL
        // ============================================================
        function mostrarTela(tela) {
            if (tela === 'lista') {
                document.getElementById('tela-lista').classList.remove('escondido');
                document.getElementById('tela-perfil').classList.add('escondido');
                document.getElementById('btnVoltar').classList.add('escondido');
                document.getElementById('acoesHeader').classList.remove('escondido');

                document.getElementById('tituloHeader').innerHTML = '<i class="fa-solid fa-cow mr-2"></i>Fazenda JS <span class="text-xs font-normal text-gray-300 ml-1">v11</span>';

                document.getElementById('buscaBrinco').value = '';
                filtrarMatrizes();
                return;
            }

            if (tela === 'perfil') {
                document.getElementById('tela-lista').classList.add('escondido');
                document.getElementById('tela-perfil').classList.remove('escondido');
                document.getElementById('btnVoltar').classList.remove('escondido');
                document.getElementById('acoesHeader').classList.add('escondido');

                document.getElementById('tituloHeader').textContent = 'Ficha do Animal';
                document.getElementById('partoData').value = '';
                document.getElementById('partoObs').value = '';
                document.getElementById('diagAno').value = new Date().getFullYear();
                document.getElementById('diagObs').value = '';
                document.getElementById('formDiagnostico').classList.add('escondido');
                document.getElementById('iconeSetaDiag').className = 'fa-solid fa-chevron-down text-gray-400';
                document.getElementById('painelLogs').classList.add('escondido');
                document.getElementById('iconeSetaLogs').className = 'fa-solid fa-chevron-down text-gray-400';
            }
        }

        function abrirPerfil(brinco) {
            const matriz = encontrarMatriz(brinco);

            if (!matriz) {
                mostrarToast('Matriz não localizada.', 'erro');
                mostrarTela('lista');
                return;
            }

            document.getElementById('perfilBrincoAtual').value = matriz.brinco;
            document.getElementById('perfilNome').textContent = matriz.brinco;
            document.getElementById('perfilLote').value = (matriz.lote && matriz.lote !== '-') ? matriz.lote : '';

            const badge = document.getElementById('perfilLoteBadge');

            if (matriz.lote && matriz.lote !== '-') {
                badge.textContent = '🏷️ ' + matriz.lote;
                badge.classList.remove('escondido');
            } else {
                badge.textContent = '';
                badge.classList.add('escondido');
            }

            const ultDiag = (matriz.historico && matriz.historico.length > 0) ? matriz.historico[0].situacao : 'Sem Diagnóstico';
            const statusDiv = document.getElementById('perfilUltimoStatus');

            statusDiv.textContent = ultDiag;
            statusDiv.className = `inline-block px-4 py-1 rounded-full text-sm font-bold mt-1 ${
                ultDiag === 'Prenha'
                    ? 'bg-green-200 text-green-900'
                    : ultDiag === 'Vazia'
                        ? 'bg-red-200 text-red-900'
                        : 'bg-gray-200 text-gray-700'
            }`;

            atualizarHistoricoPerfil(matriz);
            mostrarTela('perfil');
        }

        function atualizarHistoricoPerfil(matriz) {
            const div = document.getElementById('perfilHistorico');
            div.innerHTML = '';

            if ((!matriz.historico || matriz.historico.length === 0) && (!matriz.partos || matriz.partos.length === 0)) {
                const vazio = criarElemento('p', 'italic text-gray-400', 'Nenhum registro ainda.');
                div.appendChild(vazio);
                return;
            }

            if (matriz.partos && matriz.partos.length > 0) {
                const titulo = criarElemento('p', 'font-bold text-gray-800 dark:text-gray-100 mt-2', 'Partos Registrados:');
                div.appendChild(titulo);

                matriz.partos.forEach(p => {
                    const item = criarElemento('div', 'bg-gray-50 dark:bg-gray-800 border p-2 rounded mb-1 border-l-4 border-l-jsgreen-500');
                    const linha = criarElemento('div', '', `Nasceu ${p.sexo} em ${formatarData(p.data)}`);
                    item.appendChild(linha);

                    if (p.obs && p.obs !== '-') {
                        const obs = criarElemento('span', 'text-xs text-gray-500 dark:text-gray-300 italic', `Obs: ${p.obs}`);
                        item.appendChild(obs);
                    }

                    div.appendChild(item);
                });
            }

            if (matriz.historico && matriz.historico.length > 0) {
                const titulo = criarElemento('p', 'font-bold text-gray-800 dark:text-gray-100 mt-4', 'Diagnósticos:');
                div.appendChild(titulo);

                matriz.historico.forEach(h => {
                    const cor = h.situacao === 'Prenha' ? 'border-l-green-500' : 'border-l-red-500';
                    const item = criarElemento('div', `bg-gray-50 dark:bg-gray-800 border p-2 rounded mb-1 border-l-4 ${cor}`);
                    const linha = criarElemento('div', '', `Ano ${h.ano}: ${h.situacao}`);
                    item.appendChild(linha);

                    if (h.obs && h.obs !== '-') {
                        const obs = criarElemento('span', 'text-xs text-gray-500 dark:text-gray-300 italic', `Obs: ${h.obs}`);
                        item.appendChild(obs);
                    }

                    div.appendChild(item);
                });
            }
        }

        // ============================================================
        // LOTE, PARTO E DIAGNÓSTICO
        // ============================================================
        function salvarLote() {
            const brinco = document.getElementById('perfilBrincoAtual').value;
            const lote = normalizarLote(document.getElementById('perfilLote').value);
            const matriz = encontrarMatriz(brinco);

            if (!matriz) {
                mostrarToast('Matriz não localizada.', 'erro');
                return;
            }

            matriz.lote = lote;
            salvarDados();

            registrarLog('Lote atualizado', { brinco, lote });
            abrirPerfil(brinco);
            mostrarToast('Lote atualizado com sucesso!');
        }

        function salvarParto() {
            const brinco = document.getElementById('perfilBrincoAtual').value;
            const data = document.getElementById('partoData').value;
            const sexo = document.getElementById('partoSexo').value;
            const obs = normalizarObs(document.getElementById('partoObs').value);

            if (!data) {
                mostrarToast('Selecione a data do parto!', 'aviso');
                return;
            }

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const dataEscolhida = new Date(data + 'T00:00:00');

            if (Number.isNaN(dataEscolhida.getTime())) {
                mostrarToast('Data inválida.', 'erro');
                return;
            }

            if (dataEscolhida > hoje) {
                mostrarToast('A data não pode estar no futuro!', 'erro');
                return;
            }

            const matriz = encontrarMatriz(brinco);

            if (!matriz) {
                mostrarToast('Matriz não localizada.', 'erro');
                return;
            }

            if (!Array.isArray(matriz.partos)) matriz.partos = [];

            matriz.partos.push({ data, sexo, obs });
            matriz.partos.sort((a, b) => new Date(b.data) - new Date(a.data));

            salvarDados();
            registrarLog('Nascimento registrado', { brinco, data, sexo });

            document.getElementById('partoData').value = '';
            document.getElementById('partoObs').value = '';

            atualizarHistoricoPerfil(matriz);
            abrirPerfil(brinco);
            mostrarToast('Nascimento salvo!');
        }

        function toggleDiagnostico() {
            const form = document.getElementById('formDiagnostico');
            const icone = document.getElementById('iconeSetaDiag');

            form.classList.toggle('escondido');
            icone.className = form.classList.contains('escondido')
                ? 'fa-solid fa-chevron-down text-gray-400'
                : 'fa-solid fa-chevron-up text-blue-600';
        }

        function salvarDiagnostico() {
            const brinco = document.getElementById('perfilBrincoAtual').value;
            const ano = String(document.getElementById('diagAno').value || '').trim();
            const situacao = document.getElementById('diagSituacao').value;
            const obs = normalizarObs(document.getElementById('diagObs').value);

            const erroAno = validarAno(ano);
            if (erroAno) {
                mostrarToast(erroAno, 'aviso');
                return;
            }

            const matriz = encontrarMatriz(brinco);

            if (!matriz) {
                mostrarToast('Matriz não localizada.', 'erro');
                return;
            }

            if (!Array.isArray(matriz.historico)) matriz.historico = [];

            matriz.historico = matriz.historico.filter(h => String(h.ano) !== String(ano));
            matriz.historico.push({ ano, situacao, obs });
            matriz.historico.sort((a, b) => Number(b.ano) - Number(a.ano));

            salvarDados();
            registrarLog('Diagnóstico registrado', { brinco, ano, situacao });

            toggleDiagnostico();
            abrirPerfil(brinco);
            mostrarToast('Diagnóstico salvo!');
        }

        function excluirMatriz() {
            const brinco = document.getElementById('perfilBrincoAtual').value;
            const matriz = encontrarMatriz(brinco);

            if (!matriz) {
                mostrarToast('Matriz não localizada.', 'erro');
                mostrarTela('lista');
                return;
            }

            if (confirm(`Apagar Animal ${brinco}? Esta ação não pode ser desfeita.`)) {
                fazerBackupAutomatico('Antes da exclusão de matriz');

                plantel = plantel.filter(m => String(m.brinco).toUpperCase() !== String(brinco).toUpperCase());

                salvarDados();
                registrarLog('Matriz excluída', { brinco });

                mostrarTela('lista');
                mostrarToast('Animal excluído.', 'aviso');
            }
        }

        // ============================================================
        // WHATSAPP E PDF
        // ============================================================
        function enviarWhatsAppPerfil() {
            const brinco = document.getElementById('perfilBrincoAtual').value;
            const m = encontrarMatriz(brinco);

            if (!m) {
                mostrarToast('Matriz não localizada.', 'erro');
                return;
            }

            const ultParto = (m.partos && m.partos.length > 0) ? formatarData(m.partos[0].data) : 'Sem registro.';
            const loteInfo = (m.lote && m.lote !== '-') ? `🏷️ *Lote:* ${m.lote}\n` : '';

            let partosTxt = 'Sem registros.';
            if (m.partos && m.partos.length > 0) {
                partosTxt = m.partos.map(p => {
                    let txt = `🍼 ${formatarData(p.data)} - ${p.sexo === 'Macho' ? '🐂' : '🐄'} ${p.sexo}`;
                    if (p.obs && p.obs !== '-') txt += ` _(Obs: ${p.obs})_`;
                    return txt;
                }).join('\n');
            }

            let histTxt = 'Sem registros.';
            if (m.historico && m.historico.length > 0) {
                histTxt = m.historico.map(h => {
                    let txt = `${h.situacao === 'Prenha' ? '✅' : '❌'} *${h.ano}:* ${h.situacao}`;
                    if (h.obs && h.obs !== '-') txt += ` _(Obs: ${h.obs})_`;
                    return txt;
                }).join('\n');
            }

            const msg =
                `📄 *FICHA DE MATRIZ - FAZENDA JS*\n\n` +
                `🐄 *Identificação:* ${m.brinco}\n` +
                `${loteInfo}` +
                `⏳ *Último Parto:* ${ultParto}\n\n` +
                `📋 *Registro de Partos:*\n${partosTxt}\n\n` +
                `📊 *Diagnósticos de Gestação:*\n${histTxt}`;

            registrarLog('Ficha enviada via WhatsApp', { brinco: m.brinco });
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        }

        function gerarPDFGeral() {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                mostrarToast('Biblioteca jsPDF não carregada.', 'erro');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.setTextColor(20, 83, 45);
            doc.text('Fazenda JS - Plantel Geral', 14, 15);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

            const rows = plantel.map(m => [
                String(m.brinco ?? '-'),
                (m.lote && m.lote !== '-') ? String(m.lote) : '-',
                (m.partos && m.partos.length) ? m.partos.length : 0,
                (m.partos && m.partos.length > 0) ? formatarData(m.partos[0].data) : '-',
                (m.historico && m.historico.length > 0) ? m.historico[0].situacao : 'Sem Diag.'
            ]);

            doc.autoTable({
                head: [['Identificação', 'Lote', 'Qtd. Partos', 'Último Parto', 'Status Atual']],
                body: rows,
                startY: 28,
                headStyles: { fillColor: [20, 83, 45] },
                styles: { fontSize: 9, cellPadding: 3 },
                margin: { top: 15, left: 10, right: 10 }
            });

            registrarLog('PDF geral gerado', { totalMatrizes: plantel.length });
            doc.save(`FazendaJS_Geral_${new Date().toISOString().slice(0, 10)}.pdf`);
        }

        function gerarPDFIndividual() {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                mostrarToast('Biblioteca jsPDF não carregada.', 'erro');
                return;
            }

            const brinco = document.getElementById('perfilBrincoAtual').value;
            const m = encontrarMatriz(brinco);

            if (!m) {
                mostrarToast('Matriz não localizada.', 'erro');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.setTextColor(20, 83, 45);
            doc.text(`Ficha da Matriz: ${m.brinco}`, 14, 18);

            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.text(`Lote: ${(m.lote && m.lote !== '-') ? m.lote : 'Não informado'}`, 14, 27);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);

            let yPos = 44;

            doc.setFontSize(13);
            doc.setTextColor(20, 83, 45);
            doc.text('Partos Registrados', 14, yPos);
            yPos += 4;

            if (m.partos && m.partos.length > 0) {
                doc.autoTable({
                    head: [['Data', 'Sexo', 'Observação']],
                    body: m.partos.map(p => [formatarData(p.data), p.sexo, p.obs !== '-' ? p.obs : '']),
                    startY: yPos,
                    headStyles: { fillColor: [20, 83, 45] },
                    styles: { fontSize: 9, cellPadding: 3 },
                    margin: { top: 15, left: 10, right: 10 }
                });
                yPos = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('Sem registros de parto.', 14, yPos + 6);
                yPos += 16;
            }

            doc.setFontSize(13);
            doc.setTextColor(20, 83, 45);
            doc.text('Diagnósticos de Gestação', 14, yPos);
            yPos += 4;

            if (m.historico && m.historico.length > 0) {
                doc.autoTable({
                    head: [['Ano', 'Resultado', 'Observação']],
                    body: m.historico.map(h => [h.ano, h.situacao, h.obs !== '-' ? h.obs : '']),
                    startY: yPos,
                    headStyles: { fillColor: [37, 99, 235] },
                    styles: { fontSize: 9, cellPadding: 3 },
                    margin: { top: 15, left: 10, right: 10 }
                });
            } else {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('Sem diagnósticos registrados.', 14, yPos + 6);
            }

            registrarLog('PDF individual gerado', { brinco: m.brinco });
            doc.save(`FazendaJS_${m.brinco}_${new Date().toISOString().slice(0, 10)}.pdf`);
        }

// ============================================================
// PWA, LAYOUT APP E ATALHOS VISUAIS
// ============================================================
function focarCadastroRapido() {
    mostrarTela('lista');
    setTimeout(() => {
        const campo = document.getElementById('buscaBrinco');
        if (campo) campo.focus();
    }, 80);
}

function atualizarStatusConexao() {
    const badge = document.getElementById('syncBadge');
    if (!badge) return;

    if (navigator.onLine) {
        badge.innerHTML = '<i class="fa-solid fa-database"></i> LocalStorage ativo';
        badge.style.background = 'rgba(20, 83, 45, .92)';
        badge.style.color = '#bbf7d0';
    } else {
        badge.innerHTML = '<i class="fa-solid fa-wifi"></i> Offline';
        badge.style.background = 'rgba(127, 29, 29, .92)';
        badge.style.color = '#fecaca';
    }
}

let promptInstalacaoFazendaJS = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    promptInstalacaoFazendaJS = event;

    const banner = document.getElementById('installBanner');
    if (banner) banner.classList.remove('escondido');
});

document.addEventListener('click', async (event) => {
    if (event.target && event.target.id === 'btnInstalarApp') {
        if (!promptInstalacaoFazendaJS) return;

        promptInstalacaoFazendaJS.prompt();
        await promptInstalacaoFazendaJS.userChoice;
        promptInstalacaoFazendaJS = null;

        const banner = document.getElementById('installBanner');
        if (banner) banner.classList.add('escondido');
    }
});

window.addEventListener('online', atualizarStatusConexao);
window.addEventListener('offline', atualizarStatusConexao);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
            console.warn('Service Worker não registrado.');
        });
        atualizarStatusConexao();
    });
}
