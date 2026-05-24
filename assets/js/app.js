// ============================================================
// BLOCO COMPLETO PARA SUBSTITUIR NO HTML ORIGINAL
// LOCALIZE:
//
// const DB = {
//
// E SUBSTITUA TODO O TRECHO ACIMA DELE POR ESTE BLOCO
// ============================================================

// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    'https://rmdxjxlhzeevybriywzf.supabase.co';

const SUPABASE_ANON_KEY =
    'sb_publishable_IU6_hF0V4xjTIZ5KlCLW9A_quYu8YA9';

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

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
