// ================================================
// GOOGLE APPS SCRIPT — Form Onboarding Caixa Livre
// ================================================
// PASSO A PASSO PARA CONFIGURAR:
//
// 1. Abre a planilha de onboarding:
//    https://docs.google.com/spreadsheets/d/13xft3MA_DqD61h1lMGIpnofi7W0zbYYUJqi4xMR2kpw/
//
// 2. Menu: Extensões → Apps Script
//
// 3. Apaga o código existente e cola TODO esse arquivo
//
// 4. Salva (ícone do disquete ou Cmd+S)
//
// 5. Clica em "Implantar" → "Nova implantação"
//    - Tipo: App da Web
//    - Executar como: Eu (sua conta)
//    - Quem pode acessar: Qualquer pessoa
//    - Clica "Implantar"
//
// 6. Autoriza (vai pedir permissão pra Google Sheets + UrlFetch)
//
// 7. Copia a URL da Web App e cola no index.html
//    Na constante APPS_SCRIPT_URL no topo do <script>
//
// 8. Pra testar: seleciona a função "testar" no menu superior
//    e clica em Executar. Verifica se uma linha foi adicionada na planilha.
//
// IMPORTANTE: se você editar este script depois, precisa fazer
// uma NOVA implantação (não editar a existente) pra mudanças valerem.
// ================================================

const SPREADSHEET_ID = '13xft3MA_DqD61h1lMGIpnofi7W0zbYYUJqi4xMR2kpw';
const SHEET_NAME = 'Onboarding CXL';
const WEBHOOK_URL = 'https://n8nwebhook.leticiakratka.shop/webhook/cxl-form-onboarding';

// Liga/desliga a chamada do webhook do n8n.
// Mantém em `false` enquanto o workflow do n8n ainda não estiver publicado.
// Quando o webhook estiver pronto, troca pra `true` e cria uma NOVA implantação.
// Se ficar `true` apontando pra URL inexistente, cada submissão trava ~30s no timeout.
const WEBHOOK_ENABLED = false;

function doGet(e) {
  try {
    const p = e.parameter;

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const header = [
        // Bloco principal (ordem definida pela Letícia)
        'Data',
        'Nome',
        'Email',
        'Telefone',
        'Especifique sua profissão e forma de atuação',
        'Na sua vida financeira, qual é a sua maior dor hoje?',
        'Situação representa:',
        'Faixa de Renda Mensal Liquida',
        'Qual o objetivo que você precisa alcançar na sua vida financeira ao final de 12 meses para que você saiba que valeu a pena a nossa jornada juntos?',
        'UTM_SOURCE',
        'UTM_MEDIUM',
        // Bloco complementar (dados extras)
        'Interesse no Método',
        'Persona Detectada',
        'Renda (código)',
        'UTM_CAMPAIGN',
        'UTM_CONTENT',
        'UTM_TERM',
        'fbclid',
        'gclid'
      ];
      sheet.appendRow(header);
      const headerRange = sheet.getRange(1, 1, 1, header.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#8c7a52');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    const linha = [
      // Bloco principal
      p.data         || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      p.nome         || '',
      p.email        || '',
      p.telefone     || '',
      p.profissao    || '',
      p.dor          || '',
      p.situacao     || '',
      p.renda        || '',
      p.objetivo12m  || '',
      p.utm_source   || '',
      p.utm_medium   || '',
      // Bloco complementar
      p.interesse    || '',
      p.persona      || '',
      p.renda_codigo || '',
      p.utm_campaign || '',
      p.utm_content  || '',
      p.utm_term     || '',
      p.fbclid       || '',
      p.gclid        || ''
    ];

    sheet.appendRow(linha);

    // Payload pro webhook do n8n (mantém todos os campos nomeados)
    const dados = {
      data:         p.data         || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome:         p.nome         || '',
      email:        p.email        || '',
      telefone:     p.telefone     || '',
      profissao:    p.profissao    || '',
      dor:          p.dor          || '',
      situacao:     p.situacao     || '',
      persona:      p.persona      || '',
      renda:        p.renda        || '',
      renda_codigo: p.renda_codigo || '',
      objetivo12m:  p.objetivo12m  || '',
      interesse:    p.interesse    || '',
      utm_source:   p.utm_source   || '',
      utm_medium:   p.utm_medium   || '',
      utm_campaign: p.utm_campaign || '',
      utm_content:  p.utm_content  || '',
      utm_term:     p.utm_term     || '',
      fbclid:       p.fbclid       || '',
      gclid:        p.gclid        || ''
    };

    // Dispara webhook pro n8n só se a flag estiver ligada (evita travar 30s quando URL não existe)
    if (WEBHOOK_ENABLED) {
      dispararWebhook(dados);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function dispararWebhook(dados) {
  try {
    Logger.log('Disparando webhook pra: ' + WEBHOOK_URL);

    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(dados),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    Logger.log('Webhook respondeu ' + code + ': ' + response.getContentText());

    if (code < 200 || code >= 300) {
      Logger.log('⚠️ Webhook retornou status NÃO-OK: ' + code);
    }
  } catch (err) {
    Logger.log('❌ Erro ao chamar webhook: ' + err.toString());
  }
}

// ================================================
// Teste manual: seleciona "testar" no menu superior e clica Executar.
// Verifica se uma linha foi adicionada na aba "Onboarding CXL".
// ================================================
function testar() {
  const fakeEvent = {
    parameter: {
      data:         '13/05/2026 16:00:00',
      nome:         'Maria Teste',
      email:        'maria@teste.com',
      telefone:     '(61) 99999-9999',
      profissao:    'Médica autônoma',
      dor:          'Ganho bem mas não sobra nada todo mês',
      situacao:     'gasta-tudo',
      persona:      'milena',
      renda:        'De R$ 7.000 a R$ 12.000',
      renda_codigo: '7k-12k',
      objetivo12m:  'Ter 20k guardados e zero dívidas no cartão',
      interesse:    'sim',
      utm_source:   'whatsapp',
      utm_medium:   'broadcast',
      utm_campaign: 'cxl-onboarding-d5',
      utm_content:  '',
      utm_term:     '',
      fbclid:       '',
      gclid:        ''
    }
  };
  const resultado = doGet(fakeEvent);
  Logger.log(resultado.getContent());
}
