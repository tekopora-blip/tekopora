/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE REQUISIÇÕES DE COMPRA - PROJETO TEKO PORÃ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sistema completo de gerenciamento de requisições de compras para o
 * Programa Teko Porã - IFMS
 *
 * Desenvolvido para Google Apps Script
 * Versão: 2.0
 * Data: Janeiro 2025
 *
 * @author Sistema Teko Porã
 * @license MIT
 */

// ============================================================================
// CONSTANTES DO SISTEMA
// ============================================================================

const NOME_PLANILHA = 'REQ_Teko_Pora';

// Nomes das abas
const ABA_CONFIG = 'Config';
const ABA_USUARIOS = 'Usuarios';
const ABA_METAS = 'Metas';
const ABA_RUBRICAS = 'Rubricas';
const ABA_ENDERECOS = 'Enderecos';
const ABA_NUMERACAO = 'Numeracao';
const ABA_REQUISICOES = 'Requisicoes';
const ABA_ITENS = 'Itens';
const ABA_LOGS = 'Logs';

// Status das requisições
const STATUS = {
  RASCUNHO: 'RASCUNHO',
  ENVIADA: 'ENVIADA',
  EM_CORRECAO: 'EM CORREÇÃO',
  REJEITADA: 'REJEITADA',
  APROVADA: 'APROVADA',
  CADASTRADA: 'CADASTRADA',
  ENVIADA_AUTORIZACAO: 'ENVIADA AUTORIZAÇÃO'
};

// Tipos de requisição
const TIPOS_REQ = [
  'MATERIAL DE CONSUMO',
  'MATERIAL PERMANENTE',
  'SERVIÇOS DE PESSOA JURÍDICA',
  'COMPRA DE PASSAGENS',
  'REEMBOLSO DE COMPRAS'
];

// Perfis de usuário
const PERFIL = {
  ADMIN: 'ADMIN',
  REQUISITANTE: 'REQUISITANTE',
  CADASTRADOR: 'CADASTRADOR'
};

// Índices das colunas da aba Requisicoes (base 0 para arrays)
const COL_REQ = {
  ID: 0,
  NUMERO: 1,
  TIPO: 2,
  STATUS: 3,
  PROJETO: 4,
  DATA_CADASTRO: 5,
  LIMITE_ATENDIMENTO: 6,
  META: 7,
  RUBRICA_CODIGO: 8,
  RUBRICA_DESC: 9,
  ENDERECO_ID: 10,
  ENDERECO_NOME: 11,
  ENDERECO_LOGRADOURO: 12,
  ENDERECO_NUMERO: 13,
  ENDERECO_BAIRRO: 14,
  ENDERECO_CIDADE: 15,
  ENDERECO_UF: 16,
  ENDERECO_CEP: 17,
  ENDERECO_COMPLEMENTO: 18,
  FORMA_AVALIACAO: 19,
  JUSTIFICATIVA_FORMA: 20,
  OBSERVACOES: 21,
  LINKS_ANEXOS: 22,
  REQUISITANTE_EMAIL: 23,
  REQUISITANTE_NOME: 24,
  JUSTIFICATIVA_ADMIN: 25,
  CADASTRADOR_EMAIL: 26,
  CADASTRADOR_NOME: 27,
  NUMERO_WEB: 28,
  PROTOCOLO: 29,
  LINK_COMPROVANTE: 30,
  DATA_ENVIO_AUTORIZACAO: 31,
  ULTIMA_ATUALIZACAO: 32
};

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Obtém a planilha ativa
 * @returns {Spreadsheet} Planilha ativa
 */
function getSS() {
  return SpreadsheetApp.getActive();
}

/**
 * Obtém uma aba específica da planilha
 * @param {string} nome - Nome da aba
 * @returns {Sheet} Aba da planilha
 * @throws {Error} Se a aba não for encontrada
 */
function getSheet(nome) {
  const sheet = getSS().getSheetByName(nome);
  if (!sheet) {
    throw new Error(`Aba "${nome}" não encontrada na planilha.`);
  }
  return sheet;
}

/**
 * Verifica se uma aba existe
 * @param {string} nome - Nome da aba
 * @returns {boolean} True se existe
 */
function sheetExists(nome) {
  return getSS().getSheetByName(nome) !== null;
}

/**
 * Verifica se o sistema está configurado
 * @returns {boolean} True se todas as abas existem
 */
function sistemaConfigurado() {
  const abas = [ABA_CONFIG, ABA_USUARIOS, ABA_METAS, ABA_RUBRICAS, ABA_ENDERECOS,
                ABA_NUMERACAO, ABA_REQUISICOES, ABA_ITENS, ABA_LOGS];

  for (let aba of abas) {
    if (!sheetExists(aba)) {
      return false;
    }
  }
  return true;
}

/**
 * Escapa HTML para prevenir XSS em emails
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normaliza email para comparação case-insensitive
 * @param {string} email - Email a ser normalizado
 * @returns {string} Email normalizado
 */
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Valida se um valor numérico é válido e não negativo
 * @param {*} valor - Valor a ser validado
 * @param {string} campo - Nome do campo (para mensagem de erro)
 * @returns {number} Número validado
 * @throws {Error} Se o valor não for válido
 */
function validarNumeroPositivo(valor, campo) {
  const num = Number(valor);
  if (isNaN(num) || num < 0) {
    throw new Error(`${campo} deve ser um número válido não negativo.`);
  }
  return num;
}

/**
 * Gera ID único para requisição usando timestamp e número aleatório
 * @returns {string} ID único
 */
function gerarIdRequisicao() {
  return new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
}

/**
 * Obtém data atual no fuso horário de Mato Grosso do Sul
 * @returns {Date} Data atual
 */
function getDataAtualMS() {
  const cfg = getConfigMap();
  const timezone = cfg.FUSO_HORARIO || 'America/Campo_Grande';
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * Obtém configurações do sistema
 * @returns {Object} Mapa de configurações
 */
function getConfigMap() {
  try {
    const sh = getSheet(ABA_CONFIG);
    const cfg = {};

    const lastRow = sh.getLastRow();
    if (lastRow < 2) return cfg;

    const vals = sh.getRange(2, 1, lastRow - 1, 2).getValues();
    vals.forEach(r => {
      if (r[0]) cfg[String(r[0]).trim()] = r[1];
    });
    return cfg;
  } catch (e) {
    return {};
  }
}

/**
 * Registra ação no log do sistema
 * @param {string} email - Email do usuário
 * @param {string} acao - Ação realizada
 * @param {string} detalhes - Detalhes da ação
 */
function logAcao(email, acao, detalhes) {
  try {
    const sh = getSheet(ABA_LOGS);
    const now = getDataAtualMS();
    sh.appendRow([now, email, acao, detalhes]);
  } catch (e) {
    console.error('Erro ao registrar log:', e);
    // Não propaga erro de log para não interromper operação principal
  }
}

// ============================================================================
// GERENCIAMENTO DE USUÁRIOS
// ============================================================================

/**
 * Obtém informações do usuário atual
 * @returns {Object} Dados do usuário {email, nome, perfil, ativo}
 */
function getUsuarioAtual() {
  const email = Session.getActiveUser().getEmail();

  let sh;
  try {
    sh = getSheet(ABA_USUARIOS);
  } catch (e) {
    return { email: email, nome: email, perfil: 'NAO_CADASTRADO', ativo: false };
  }

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    return { email: email, nome: email, perfil: 'NAO_CADASTRADO', ativo: false };
  }

  const vals = sh.getRange(2, 1, lastRow - 1, 4).getValues();
  const emailNorm = normalizeEmail(email);

  for (let i = 0; i < vals.length; i++) {
    if (normalizeEmail(vals[i][0]) === emailNorm && vals[i][3] !== false) {
      return {
        email: vals[i][0],
        nome: vals[i][1],
        perfil: vals[i][2],
        ativo: vals[i][3]
      };
    }
  }
  return { email: email, nome: email, perfil: 'NAO_CADASTRADO', ativo: false };
}

/**
 * Verifica se o usuário atual possui um perfil específico
 * @param {string} perfil - Perfil a verificar
 * @returns {boolean} True se o usuário possui o perfil
 */
function isPerfil(perfil) {
  const u = getUsuarioAtual();
  return u.perfil === perfil;
}

/**
 * Valida se o usuário está ativo no sistema
 * @returns {Object} Dados do usuário
 * @throws {Error} Se o usuário não estiver autorizado
 */
function validarUsuarioAtivo() {
  const user = getUsuarioAtual();
  if (!user.ativo) {
    throw new Error('Usuário não autorizado ou inativo.');
  }
  return user;
}

// ============================================================================
// LISTAGENS (METAS, RUBRICAS, ENDEREÇOS)
// ============================================================================

/**
 * Lista todas as metas cadastradas
 * @returns {Array<Object>} Array de metas {codigo, descricao}
 */
function listarMetas() {
  try {
    const sh = getSheet(ABA_METAS);
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return [];

    const vals = sh.getRange(2, 1, lastRow - 1, 2).getValues();
    return vals.filter(r => r[0]).map(r => ({
      codigo: String(r[0]).trim(),
      descricao: r[1]
    }));
  } catch (e) {
    console.error('Erro ao listar metas:', e);
    return [];
  }
}

/**
 * Lista todas as rubricas cadastradas
 * @returns {Array<Object>} Array de rubricas {codigo, descricao}
 */
function listarRubricas() {
  try {
    const sh = getSheet(ABA_RUBRICAS);
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return [];

    const vals = sh.getRange(2, 1, lastRow - 1, 2).getValues();
    return vals.filter(r => r[0]).map(r => ({
      codigo: String(r[0]).trim(),
      descricao: r[1]
    }));
  } catch (e) {
    console.error('Erro ao listar rubricas:', e);
    return [];
  }
}

/**
 * Lista todos os endereços ativos
 * @returns {Array<Object>} Array de endereços
 */
function listarEnderecos() {
  try {
    const sh = getSheet(ABA_ENDERECOS);
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return [];

    const vals = sh.getRange(2, 1, lastRow - 1, 10).getValues();
    return vals
      .filter(r => r[0] && r[9] !== false)
      .map(r => ({
        id: r[0],
        nome: r[1],
        logradouro: r[2],
        numero: r[3],
        bairro: r[4],
        cidade: r[5],
        uf: r[6],
        cep: r[7],
        complemento: r[8]
      }));
  } catch (e) {
    console.error('Erro ao listar endereços:', e);
    return [];
  }
}

/**
 * Valida dados de um endereço
 * @param {Object} endereco - Dados do endereço
 * @throws {Error} Se dados obrigatórios estiverem faltando
 */
function validarEndereco(endereco) {
  if (!endereco.logradouro) {
    throw new Error('Logradouro é obrigatório.');
  }
  if (!endereco.cidade) {
    throw new Error('Cidade é obrigatória.');
  }
  if (!endereco.uf) {
    throw new Error('UF é obrigatório.');
  }
  if (!endereco.cep) {
    throw new Error('CEP é obrigatório.');
  }
}

/**
 * Salva um novo endereço
 * @param {Object} endereco - Dados do endereço
 * @returns {number} ID do novo endereço
 */
function salvarNovoEndereco(endereco) {
  validarEndereco(endereco);

  const sh = getSheet(ABA_ENDERECOS);
  const lastRow = sh.getLastRow();
  const novoId = lastRow <= 1 ? 1 : (sh.getRange(lastRow, 1).getValue() + 1);

  sh.appendRow([
    novoId,
    endereco.nome || endereco.logradouro,
    endereco.logradouro,
    endereco.numero || '',
    endereco.bairro || '',
    endereco.cidade,
    endereco.uf,
    endereco.cep,
    endereco.complemento || '',
    true
  ]);
  return novoId;
}

// ============================================================================
// NUMERAÇÃO DE REQUISIÇÕES
// ============================================================================

/**
 * Gera próximo número de requisição no formato xxx/ano
 * @param {string} tipo - Tipo da requisição
 * @returns {string} Número gerado (ex: 001/2025)
 */
function gerarNumeroRequisicao(tipo) {
  const ano = getDataAtualMS().getFullYear();
  const sh = getSheet(ABA_NUMERACAO);

  const lock = LockService.getScriptLock();
  lock.waitLock(5000); // Aguarda até 5 segundos para evitar condição de corrida

  try {
    const lastRow = sh.getLastRow();
    let vals = [];
    if (lastRow >= 2) {
      vals = sh.getRange(2, 1, lastRow - 1, 3).getValues();
    }

    let linha = null;
    let idx = -1;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i][0] === tipo && vals[i][1] === ano) {
        linha = vals[i];
        idx = i + 2;
        break;
      }
    }

    let seq;
    if (!linha) {
      seq = 1;
      sh.appendRow([tipo, ano, seq]);
    } else {
      seq = (linha[2] || 0) + 1;
      sh.getRange(idx, 3).setValue(seq);
    }

    const seqStr = ('000' + seq).slice(-3);
    return seqStr + '/' + ano;
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// BUSCA DE REQUISIÇÃO
// ============================================================================

/**
 * Busca uma requisição por ID e retorna linha e dados
 * @param {string} id - ID da requisição
 * @returns {Object} {row, data, sheet}
 * @throws {Error} Se a requisição não for encontrada
 */
function buscarRequisicao(id) {
  const shReq = getSheet(ABA_REQUISICOES);
  const lastRow = shReq.getLastRow();

  if (lastRow < 2) {
    throw new Error('Nenhuma requisição cadastrada.');
  }

  const vals = shReq.getRange(2, 1, lastRow - 1, 33).getValues();

  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][COL_REQ.ID]) === String(id)) {
      return {
        row: i + 2,
        data: vals[i],
        sheet: shReq
      };
    }
  }

  throw new Error(`Requisição ID ${id} não encontrada.`);
}

// ============================================================================
// VALIDAÇÕES DE REQUISIÇÃO
// ============================================================================

/**
 * Valida dados completos de uma requisição
 * @param {Object} dados - Dados da requisição
 * @throws {Error} Se houver erro de validação
 */
function validarDadosRequisicao(dados) {
  // Valida tipo
  if (!dados.tipoRequisicao || !TIPOS_REQ.includes(dados.tipoRequisicao)) {
    throw new Error('Tipo de requisição inválido.');
  }

  // Valida meta
  if (!dados.meta) {
    throw new Error('Meta/Etapa é obrigatória.');
  }

  // Valida rubrica
  if (!dados.rubricaCodigo) {
    throw new Error('Rubrica é obrigatória.');
  }

  // Valida endereço
  if (!dados.enderecoId && !dados.enderecoNovo) {
    throw new Error('Endereço de entrega é obrigatório.');
  }

  // Valida justificativa da forma de avaliação (OBRIGATÓRIO)
  if (!dados.justificativaForma || !dados.justificativaForma.trim()) {
    throw new Error('Justificativa/Finalidade da Forma de Avaliação é obrigatória.');
  }

  // Valida itens
  if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
    throw new Error('É necessário incluir pelo menos um item na requisição.');
  }

  // Valida cada item
  dados.itens.forEach((item, idx) => {
    if (!item.descricaoDetalhada || !item.descricaoDetalhada.trim()) {
      throw new Error(`Item ${idx + 1}: Descrição detalhada é obrigatória.`);
    }
    if (!item.unidade || !item.unidade.trim()) {
      throw new Error(`Item ${idx + 1}: Unidade é obrigatória.`);
    }
    validarNumeroPositivo(item.quantidade, `Item ${idx + 1} - Quantidade`);
    validarNumeroPositivo(item.valorUnitario, `Item ${idx + 1} - Valor Unitário`);
  });
}

// ... [resto do código continua igual]
// (Por questão de espaço, vou manter apenas as partes essenciais modificadas)

// ============================================================================
// INTERFACE WEB (doGet) - VERSÃO CORRIGIDA
// ============================================================================

/**
 * Função principal que renderiza a interface web
 * @param {Object} e - Parâmetros da requisição
 * @returns {HtmlOutput} Interface HTML
 */
function doGet(e) {
  try {
    // Verifica se o sistema está configurado
    if (!sistemaConfigurado()) {
      return mostrarTelaSetup();
    }

    const template = HtmlService.createTemplateFromFile('Index');
    const user = getUsuarioAtual();

    template.dadosIniciais = {
      usuario: user,
      metas: listarMetas(),
      rubricas: listarRubricas(),
      enderecos: listarEnderecos(),
      tipos: TIPOS_REQ
    };

    return template.evaluate()
      .setTitle('Requisições de Compra - Teko Porã')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return mostrarTelaErro(error);
  }
}

/**
 * Mostra tela de setup quando sistema não está configurado
 */
function mostrarTelaSetup() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup - Teko Porã</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f0f0f0;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #8D2033; }
    .alert {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .steps {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .steps ol {
      margin-left: 20px;
    }
    .steps li {
      margin: 10px 0;
    }
    code {
      background: #e0e0e0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌿 Sistema Teko Porã - Configuração Inicial</h1>

    <div class="alert">
      <strong>⚠️ Sistema não configurado</strong><br>
      O sistema detectou que a planilha ainda não foi configurada.
    </div>

    <h2>Siga os passos abaixo:</h2>

    <div class="steps">
      <ol>
        <li>
          <strong>Abra o Editor de Scripts:</strong><br>
          Na planilha, vá em <code>Extensões → Apps Script</code>
        </li>
        <li>
          <strong>Execute a função de setup:</strong><br>
          No editor, selecione a função <code>setupInicial</code> no dropdown
        </li>
        <li>
          <strong>Clique em Executar (▶️):</strong><br>
          Autorize as permissões quando solicitado
        </li>
        <li>
          <strong>Aguarde a conclusão:</strong><br>
          O setup criará automaticamente todas as abas e dados iniciais
        </li>
        <li>
          <strong>Recarregue esta página:</strong><br>
          Após o setup, atualize esta página (F5)
        </li>
      </ol>
    </div>

    <h3>Precisa de ajuda?</h3>
    <p>Consulte o arquivo <strong>GUIA_INSTALACAO.md</strong> no repositório para instruções detalhadas.</p>

    <p><strong>Email de suporte:</strong> teko.pora@ifms.edu.br</p>
  </div>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Setup - Teko Porã')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Mostra tela de erro
 */
function mostrarTelaErro(error) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erro - Teko Porã</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f0f0f0;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #dc3545; }
    .error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Erro ao Carregar Sistema</h1>

    <div class="error">${escapeHtml(error.message || String(error))}</div>

    <h3>Soluções possíveis:</h3>
    <ul>
      <li>Execute a função <code>setupInicial()</code> no Apps Script</li>
      <li>Verifique se todas as 9 abas foram criadas na planilha</li>
      <li>Recarregue a página após o setup</li>
    </ul>

    <p><strong>Email de suporte:</strong> teko.pora@ifms.edu.br</p>
  </div>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Erro - Teko Porã')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Inclui arquivos HTML (para modularização)
 * @param {string} filename - Nome do arquivo
 * @returns {string} Conteúdo do arquivo
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================================
// FUNÇÃO DE SETUP INICIAL (executar apenas uma vez)
// ============================================================================

/**
 * Cria estrutura inicial da planilha
 * EXECUTAR APENAS UMA VEZ após criar a planilha
 */
function setupInicial() {
  const ss = getSS();

  // Criar abas se não existirem
  const abas = [ABA_CONFIG, ABA_USUARIOS, ABA_METAS, ABA_RUBRICAS, ABA_ENDERECOS,
                ABA_NUMERACAO, ABA_REQUISICOES, ABA_ITENS, ABA_LOGS];

  abas.forEach(nomeAba => {
    if (!ss.getSheetByName(nomeAba)) {
      ss.insertSheet(nomeAba);
    }
  });

  // Configurar cabeçalhos Config
  const shConfig = getSheet(ABA_CONFIG);
  shConfig.clear();
  shConfig.appendRow(['Chave', 'Valor']);
  shConfig.appendRow(['PROJETO', '11986-5 - CONTRATO N° 62/2024 - PROJETO TEKO PORÃ']);
  shConfig.appendRow(['EMAIL_ADMIN', 'teko.pora@ifms.edu.br']);
  shConfig.appendRow(['EMAIL_CC_ADMIN', 'fernando.alves@ifms.edu.br']);
  shConfig.appendRow(['EMAIL_COORDENADOR', 'teko.pora@ifms.edu.br']);
  shConfig.appendRow(['FUSO_HORARIO', 'America/Campo_Grande']);

  // Configurar cabeçalhos Usuarios
  const shUsuarios = getSheet(ABA_USUARIOS);
  shUsuarios.clear();
  shUsuarios.appendRow(['Email', 'Nome', 'Perfil', 'Ativo']);
  shUsuarios.appendRow(['teko.pora@ifms.edu.br', 'Administrador', 'ADMIN', true]);
  shUsuarios.appendRow(['laryssa.brasil.tp@ifms.edu.br', 'Laryssa Brasil', 'CADASTRADOR', true]);
  shUsuarios.appendRow(['sonia.biron.tp@ifms.edu.br', 'Sonia Aparecida Silva Biron', 'CADASTRADOR', true]);
  shUsuarios.appendRow(['angela.schwingel.tp@ifms.edu.br', 'Angela Schwingel', 'CADASTRADOR', true]);

  // Configurar Metas
  const shMetas = getSheet(ABA_METAS);
  shMetas.clear();
  shMetas.appendRow(['Codigo', 'Descricao']);
  const metas = [
    ['META1', 'Meta 1 – Elaboração de Planos de Gestão Territorial e Ambiental (PGTAs)'],
    ['META2', 'Meta 2 – Fomento a ações de fortalecimento de mulheres e jovens indígenas'],
    ['META3', 'Meta 3 – Implementação do Projeto Tekojoja: Semeando Liberdade'],
    ['META4', 'Meta 4 – Desenvolvimento de iniciativas de proteção às casas de reza'],
    ['META5', 'Meta 5 – Valorização cultural da Dança Kipaé'],
    ['META6', 'Meta 6 – Fomento à soberania alimentar por meio da piscicultura'],
    ['META7', 'Meta 7 – Implementação de quintais produtivos'],
    ['META8', 'Meta 8 – Publicação do Programa Teko Porã'],
    ['META9', 'Meta 9 – Despesas operacionais e administrativas (DOA)']
  ];
  metas.forEach(m => shMetas.appendRow(m));

  // Configurar Rubricas
  const shRubricas = getSheet(ABA_RUBRICAS);
  shRubricas.clear();
  shRubricas.appendRow(['Codigo', 'Descricao']);
  const rubricas = [
    ['33.90.18', 'BOLSA'],
    ['33.90.39', 'OUTROS SERVIÇOS DE TERCEIROS PESSOA JURÍDICA'],
    ['33.90.20', 'BOLSAS PESQUISADOR'],
    ['33.90.14', 'DIÁRIAS'],
    ['44.90.52', 'EQUIPAMENTOS E MATERIAL PERMANENTE'],
    ['33.90.30', 'MATERIAL DE CONSUMO'],
    ['33.90.33', 'PASSAGENS E DESPESAS COM LOCOMOÇÃO'],
    ['33.00.36', 'OUTROS SERVIÇOS DE TERCEIROS PESSOA FÍSICA'],
    ['33.90.47', 'OBRIGAÇÕES TRIBUTÁRIAS E CONTRIBUTIVAS']
  ];
  rubricas.forEach(r => shRubricas.appendRow(r));

  // Configurar cabeçalhos demais abas
  const shEnderecos = getSheet(ABA_ENDERECOS);
  shEnderecos.clear();
  shEnderecos.appendRow(['ID', 'Nome', 'Logradouro', 'Numero', 'Bairro', 'Cidade', 'UF', 'CEP', 'Complemento', 'Ativo']);

  const shNumeracao = getSheet(ABA_NUMERACAO);
  shNumeracao.clear();
  shNumeracao.appendRow(['Tipo', 'Ano', 'UltimoNumero']);

  const shRequisicoes = getSheet(ABA_REQUISICOES);
  shRequisicoes.clear();
  shRequisicoes.appendRow(['ID', 'Numero', 'Tipo', 'Status', 'Projeto', 'DataCadastro', 'LimiteAtendimento',
    'Meta', 'RubricaCodigo', 'RubricaDescricao', 'EnderecoID', 'EnderecoNome', 'EnderecoLogradouro',
    'EnderecoNumero', 'EnderecoBairro', 'EnderecoCidade', 'EnderecoUF', 'EnderecoCEP', 'EnderecoComplemento',
    'FormaAvaliacao', 'JustificativaForma', 'Observacoes', 'LinksAnexos', 'RequisitanteEmail',
    'RequisitanteNome', 'JustificativaAdmin', 'CadastradorEmail', 'CadastradorNome', 'NumeroWEB',
    'Protocolo', 'LinkComprovante', 'DataEnvioAutorizacao', 'UltimaAtualizacao']);

  const shItens = getSheet(ABA_ITENS);
  shItens.clear();
  shItens.appendRow(['RequisicaoID', 'ItemNum', 'DescricaoDetalhada', 'Unidade', 'Quantidade',
    'ValorUnitario', 'ValorTotal', 'Finalidade', 'JustificativaTecnica']);

  const shLogs = getSheet(ABA_LOGS);
  shLogs.clear();
  shLogs.appendRow(['DataHora', 'Email', 'Acao', 'Detalhes']);

  Logger.log('✅ Setup inicial concluído com sucesso!');
  SpreadsheetApp.getUi().alert('✅ Setup concluído!\n\nTodas as abas foram criadas e configuradas.\n\nVocê já pode acessar o sistema.');
}
