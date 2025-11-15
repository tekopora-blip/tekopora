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
const ID_PLANILHA = '1b7IoKAIhnmxKWb5DfGqQBc7pyA89_C4Xbunyy4Ipyls';

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
 * Obtém a planilha do sistema pelo ID
 * @returns {Spreadsheet} Planilha do sistema
 */
function getSS() {
  return SpreadsheetApp.openById(ID_PLANILHA);
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
  try {
    // Tenta obter email do usuário
    const email = Session.getActiveUser().getEmail();

    // Log para debug
    console.log('getUsuarioAtual() - Email detectado:', email);

    // Verifica se email foi detectado
    if (!email || email.trim() === '') {
      console.error('Session.getActiveUser().getEmail() retornou vazio');
      return {
        email: '',
        nome: 'Usuário não identificado',
        perfil: 'NAO_CADASTRADO',
        ativo: false,
        erro: 'Email não detectado pelo Google Apps Script. Verifique as permissões de autenticação.'
      };
    }

    let sh;
    try {
      sh = getSheet(ABA_USUARIOS);
    } catch (e) {
      console.error('Erro ao acessar aba Usuarios:', e);
      return {
        email: email,
        nome: email,
        perfil: 'NAO_CADASTRADO',
        ativo: false,
        erro: 'Aba Usuarios não encontrada. Execute setupInicial() primeiro.'
      };
    }

    const lastRow = sh.getLastRow();
    if (lastRow < 2) {
      console.log('Nenhum usuário cadastrado ainda');

      // Se é do IFMS, tenta auto-cadastrar
      if (email.toLowerCase().endsWith('@ifms.edu.br')) {
        try {
          console.log('Email do IFMS detectado - Auto-cadastrando como REQUISITANTE');

          const nomeExtraido = email.split('@')[0].split('.').map(
            parte => parte.charAt(0).toUpperCase() + parte.slice(1)
          ).join(' ');

          sh.appendRow([email, nomeExtraido, PERFIL.REQUISITANTE, true]);
          registrarLog(email, 'AUTO_CADASTRO', `Usuário auto-cadastrado como REQUISITANTE`);

          return {
            email: email,
            nome: nomeExtraido,
            perfil: PERFIL.REQUISITANTE,
            ativo: true
          };
        } catch (e) {
          console.error('Erro ao auto-cadastrar:', e);
          return {
            email: email,
            nome: email,
            perfil: 'NAO_CADASTRADO',
            ativo: false,
            erro: 'Erro ao auto-cadastrar: ' + e.message
          };
        }
      }

      return {
        email: email,
        nome: email,
        perfil: 'NAO_CADASTRADO',
        ativo: false
      };
    }

    const vals = sh.getRange(2, 1, lastRow - 1, 4).getValues();
    const emailNorm = normalizeEmail(email);

    // Busca o usuário na lista
    for (let i = 0; i < vals.length; i++) {
      if (normalizeEmail(vals[i][0]) === emailNorm && vals[i][3] !== false) {
        console.log('Usuário encontrado:', vals[i][1], 'Perfil:', vals[i][2]);
        return {
          email: vals[i][0],
          nome: vals[i][1],
          perfil: vals[i][2],
          ativo: vals[i][3]
        };
      }
    }

    // Se não encontrou, verifica se é email do IFMS
    if (email.toLowerCase().endsWith('@ifms.edu.br')) {
      try {
        console.log('Email do IFMS detectado - Auto-cadastrando como REQUISITANTE');

        // Extrai nome do email (parte antes do @)
        const nomeExtraido = email.split('@')[0].split('.').map(
          parte => parte.charAt(0).toUpperCase() + parte.slice(1)
        ).join(' ');

        // Adiciona usuário na planilha como REQUISITANTE ativo
        sh.appendRow([email, nomeExtraido, PERFIL.REQUISITANTE, true]);

        // Registra no log
        registrarLog(email, 'AUTO_CADASTRO', `Usuário auto-cadastrado como REQUISITANTE`);

        return {
          email: email,
          nome: nomeExtraido,
          perfil: PERFIL.REQUISITANTE,
          ativo: true
        };
      } catch (e) {
        console.error('Erro ao auto-cadastrar:', e);
        return {
          email: email,
          nome: email,
          perfil: 'NAO_CADASTRADO',
          ativo: false,
          erro: 'Erro ao auto-cadastrar: ' + e.message
        };
      }
    }

    console.log('Usuário não cadastrado e não é do IFMS');
    return { email: email, nome: email, perfil: 'NAO_CADASTRADO', ativo: false };

  } catch (error) {
    console.error('Erro crítico em getUsuarioAtual():', error);
    return {
      email: '',
      nome: 'Erro ao carregar usuário',
      perfil: 'NAO_CADASTRADO',
      ativo: false,
      erro: 'Erro crítico: ' + error.message + ' | Stack: ' + error.stack
    };
  }
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

// ============================================================================
// CRUD DE REQUISIÇÕES - FUNÇÕES AUXILIARES
// ============================================================================

function prepararDadosEndereco(enderecoId, dadosEnderecoNovo) {
  let enderecoIdFinal = enderecoId;
  if (!enderecoIdFinal && dadosEnderecoNovo) {
    enderecoIdFinal = salvarNovoEndereco(dadosEnderecoNovo);
  }
  const listaEnd = listarEnderecos();
  const endObj = listaEnd.find(e => String(e.id) === String(enderecoIdFinal)) || {};
  return { enderecoId: enderecoIdFinal, endObj };
}

function prepararDadosRubrica(rubricaCodigo) {
  const rubricas = listarRubricas();
  const rubObj = rubricas.find(r => r.codigo === rubricaCodigo);
  if (!rubObj) {
    throw new Error(`Rubrica "${rubricaCodigo}" não encontrada.`);
  }
  return rubObj;
}

function salvarItensRequisicao(shItens, id, itens) {
  itens.forEach((item, idx) => {
    if (!item.descricaoDetalhada) return;
    const qt = validarNumeroPositivo(item.quantidade, 'Quantidade');
    const vu = validarNumeroPositivo(item.valorUnitario, 'Valor Unitário');
    const vt = qt * vu;
    shItens.appendRow([
      id, idx + 1, item.descricaoDetalhada, item.unidade, qt, vu, vt,
      item.finalidade || '', item.justificativaTecnica || ''
    ]);
  });
}

function removerItensRequisicao(shItens, id) {
  const lastRow = shItens.getLastRow();
  if (lastRow < 2) return;
  const vals = shItens.getRange(2, 1, lastRow - 1, 9).getValues();
  const linhasExcluir = [];
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) {
      linhasExcluir.push(i + 2);
    }
  }
  for (let i = linhasExcluir.length - 1; i >= 0; i--) {
    shItens.deleteRow(linhasExcluir[i]);
  }
}

function criarNovaRequisicao(dados, user, cfg) {
  validarDadosRequisicao(dados);
  const shReq = getSheet(ABA_REQUISICOES);
  const shItens = getSheet(ABA_ITENS);
  const id = gerarIdRequisicao();
  const numero = gerarNumeroRequisicao(dados.tipoRequisicao);
  const agora = getDataAtualMS();
  const { enderecoId, endObj } = prepararDadosEndereco(dados.enderecoId, dados.enderecoNovo);
  const rubObj = prepararDadosRubrica(dados.rubricaCodigo);

  shReq.appendRow([
    id, numero, dados.tipoRequisicao, STATUS.RASCUNHO,
    cfg.PROJETO || '11986-5 - CONTRATO N° 62/2024 - PROJETO TEKO PORÃ',
    agora, dados.limiteAtendimento || '', dados.meta, rubObj.codigo, rubObj.descricao,
    enderecoId || '', endObj.nome || '', endObj.logradouro || '', endObj.numero || '',
    endObj.bairro || '', endObj.cidade || '', endObj.uf || '', endObj.cep || '',
    endObj.complemento || '', dados.formaAvaliacao || '', dados.justificativaForma || '',
    dados.observacoes || '', dados.linksAnexos || '', user.email, user.nome,
    '', '', '', '', '', '', '', agora
  ]);

  salvarItensRequisicao(shItens, id, dados.itens);
  logAcao(user.email, 'SALVAR_NOVA_REQUISICAO', `ID=${id}, Numero=${numero}`);
  return { id: id, numero: numero };
}

function atualizarRequisicao(dados, user) {
  validarDadosRequisicao(dados);
  const { row, data, sheet: shReq } = buscarRequisicao(dados.id);
  const shItens = getSheet(ABA_ITENS);
  const statusAtual = data[COL_REQ.STATUS];
  const numero = data[COL_REQ.NUMERO];

  if (![STATUS.RASCUNHO, STATUS.EM_CORRECAO].includes(statusAtual) && !isPerfil(PERFIL.ADMIN)) {
    throw new Error('Não é possível editar esta requisição neste status.');
  }

  const { enderecoId, endObj } = prepararDadosEndereco(dados.enderecoId, dados.enderecoNovo);
  const rubObj = prepararDadosRubrica(dados.rubricaCodigo);
  const agora = getDataAtualMS();

  shReq.getRange(row, 7, 1, 16).setValues([[
    dados.limiteAtendimento || '', dados.meta, rubObj.codigo, rubObj.descricao,
    enderecoId || '', endObj.nome || '', endObj.logradouro || '', endObj.numero || '',
    endObj.bairro || '', endObj.cidade || '', endObj.uf || '', endObj.cep || '',
    endObj.complemento || '', dados.formaAvaliacao || '', dados.justificativaForma || '',
    dados.observacoes || ''
  ]]);

  shReq.getRange(row, 23).setValue(dados.linksAnexos || '');
  shReq.getRange(row, 33).setValue(agora);
  removerItensRequisicao(shItens, dados.id);
  salvarItensRequisicao(shItens, dados.id, dados.itens);
  logAcao(user.email, 'ATUALIZAR_REQUISICAO', `ID=${dados.id}`);
  return { id: dados.id, numero: numero };
}

function salvarRequisicao(dados) {
  const user = validarUsuarioAtivo();
  const cfg = getConfigMap();
  if (!dados.id) {
    return criarNovaRequisicao(dados, user, cfg);
  } else {
    return atualizarRequisicao(dados, user);
  }
}

function enviarRequisicao(id) {
  const user = validarUsuarioAtivo();
  const { row, data, sheet: shReq } = buscarRequisicao(id);
  const emailReq = data[COL_REQ.REQUISITANTE_EMAIL];
  const statusAtual = data[COL_REQ.STATUS];
  const numero = data[COL_REQ.NUMERO];
  const tipo = data[COL_REQ.TIPO];

  if (normalizeEmail(emailReq) !== normalizeEmail(user.email) && !isPerfil(PERFIL.ADMIN)) {
    throw new Error('Apenas o requisitante pode enviar esta requisição.');
  }

  if (![STATUS.RASCUNHO, STATUS.EM_CORRECAO].includes(statusAtual)) {
    throw new Error(`Status "${statusAtual}" não permite envio.`);
  }

  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(STATUS.ENVIADA);
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(getDataAtualMS());

  const cfg = getConfigMap();
  try {
    const assunto = `[TEKO PORÃ REQ-${numero}] Nova requisição - ${tipo}`;
    const corpo = `Nova requisição ${numero} cadastrada por ${user.nome} (${user.email})`;
    MailApp.sendEmail(cfg.EMAIL_ADMIN || 'teko.pora@ifms.edu.br', assunto, corpo);
  } catch (e) {
    console.error('Erro ao enviar email:', e);
  }

  logAcao(user.email, 'ENVIAR_REQUISICAO', `ID=${id}, Numero=${numero}`);
  return true;
}

function listarRequisicoesParaAdmin() {
  if (!isPerfil(PERFIL.ADMIN)) {
    throw new Error('Acesso restrito ao administrador.');
  }
  const sh = getSheet(ABA_REQUISICOES);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const vals = sh.getRange(2, 1, lastRow - 1, 33).getValues();
  return vals.map(r => ({
    id: r[COL_REQ.ID], numero: r[COL_REQ.NUMERO], tipo: r[COL_REQ.TIPO],
    status: r[COL_REQ.STATUS], projeto: r[COL_REQ.PROJETO],
    dataCadastro: r[COL_REQ.DATA_CADASTRO], meta: r[COL_REQ.META],
    rubrica: `${r[COL_REQ.RUBRICA_CODIGO]} - ${r[COL_REQ.RUBRICA_DESC]}`,
    requisitante: `${r[COL_REQ.REQUISITANTE_NOME]} (${r[COL_REQ.REQUISITANTE_EMAIL]})`
  }));
}

function listarCadastradoresParaAdmin() {
  if (!isPerfil(PERFIL.ADMIN)) {
    throw new Error('Acesso restrito ao administrador.');
  }
  const sh = getSheet(ABA_USUARIOS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const vals = sh.getRange(2, 1, lastRow - 1, 4).getValues();
  return vals
    .filter(r => r[2] === PERFIL.CADASTRADOR && r[3] !== false)
    .map(r => ({ email: r[0], nome: r[1] }));
}

function decidirRequisicaoAdmin(id, acao, justificativa, emailCadastrador) {
  if (!isPerfil(PERFIL.ADMIN)) {
    throw new Error('Acesso restrito ao administrador.');
  }
  const { row, data, sheet: shReq } = buscarRequisicao(id);
  const statusAtual = data[COL_REQ.STATUS];
  if (statusAtual !== STATUS.ENVIADA && statusAtual !== STATUS.EM_CORRECAO) {
    throw new Error(`Status "${statusAtual}" não permite decisão administrativa.`);
  }

  let novoStatus;
  if (acao === 'REJEITAR') novoStatus = STATUS.REJEITADA;
  else if (acao === 'CORRIGIR') novoStatus = STATUS.EM_CORRECAO;
  else if (acao === 'APROVAR') novoStatus = STATUS.APROVADA;
  else throw new Error(`Ação inválida: ${acao}`);

  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(novoStatus);
  shReq.getRange(row, COL_REQ.JUSTIFICATIVA_ADMIN + 1).setValue(justificativa || '');
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(getDataAtualMS());

  if (acao === 'APROVAR' && emailCadastrador) {
    const cadastradores = listarCadastradoresParaAdmin();
    const cadastrador = cadastradores.find(c => normalizeEmail(c.email) === normalizeEmail(emailCadastrador));
    if (cadastrador) {
      shReq.getRange(row, COL_REQ.CADASTRADOR_EMAIL + 1, 1, 2).setValues([[
        cadastrador.email, cadastrador.nome
      ]]);
    }
  }

  logAcao(getUsuarioAtual().email, `DECISAO_ADMIN_${acao}`, `ID=${id}`);
  return true;
}

function listarRequisicoesCadastrador() {
  const user = getUsuarioAtual();
  if (user.perfil !== PERFIL.CADASTRADOR) {
    throw new Error('Acesso restrito a cadastradores.');
  }
  const sh = getSheet(ABA_REQUISICOES);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const vals = sh.getRange(2, 1, lastRow - 1, 33).getValues();
  const userEmailNorm = normalizeEmail(user.email);
  return vals
    .filter(r =>
      r[COL_REQ.STATUS] === STATUS.APROVADA &&
      normalizeEmail(r[COL_REQ.CADASTRADOR_EMAIL]) === userEmailNorm
    )
    .map(r => ({
      id: r[COL_REQ.ID], numero: r[COL_REQ.NUMERO], tipo: r[COL_REQ.TIPO],
      meta: r[COL_REQ.META],
      requisitante: `${r[COL_REQ.REQUISITANTE_NOME]} (${r[COL_REQ.REQUISITANTE_EMAIL]})`
    }));
}

function atualizarDadosPortal(id, numeroWeb, protocolo, linkComprovante) {
  const user = getUsuarioAtual();
  if (user.perfil !== PERFIL.CADASTRADOR) {
    throw new Error('Acesso restrito a cadastradores.');
  }
  if (!numeroWeb || !protocolo) {
    throw new Error('Número WEB e Protocolo são obrigatórios.');
  }
  const { row, data, sheet: shReq } = buscarRequisicao(id);
  if (data[COL_REQ.STATUS] !== STATUS.APROVADA) {
    throw new Error('Status não permite atualização de portal.');
  }
  shReq.getRange(row, COL_REQ.NUMERO_WEB + 1, 1, 3).setValues([[
    numeroWeb, protocolo, linkComprovante || ''
  ]]);
  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(STATUS.CADASTRADA);
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(getDataAtualMS());
  logAcao(user.email, 'ATUALIZAR_PORTAL', `ID=${id}`);
  return true;
}

function enviarParaAutorizacao(id) {
  const user = getUsuarioAtual();
  if (user.perfil !== PERFIL.CADASTRADOR) {
    throw new Error('Acesso restrito a cadastradores.');
  }
  const { row, data, sheet: shReq } = buscarRequisicao(id);
  if (data[COL_REQ.STATUS] !== STATUS.CADASTRADA) {
    throw new Error('Status não permite envio para autorização.');
  }
  const agora = getDataAtualMS();
  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(STATUS.ENVIADA_AUTORIZACAO);
  shReq.getRange(row, COL_REQ.DATA_ENVIO_AUTORIZACAO + 1).setValue(agora);
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(agora);
  logAcao(user.email, 'ENVIAR_AUTORIZACAO', `ID=${id}`);
  return true;
}

function listarMinhasRequisicoes() {
  const user = validarUsuarioAtivo();
  const sh = getSheet(ABA_REQUISICOES);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const vals = sh.getRange(2, 1, lastRow - 1, 33).getValues();
  const userEmailNorm = normalizeEmail(user.email);
  return vals
    .filter(r => normalizeEmail(r[COL_REQ.REQUISITANTE_EMAIL]) === userEmailNorm)
    .map(r => ({
      id: r[COL_REQ.ID], numero: r[COL_REQ.NUMERO], tipo: r[COL_REQ.TIPO],
      status: r[COL_REQ.STATUS], dataCadastro: r[COL_REQ.DATA_CADASTRO],
      meta: r[COL_REQ.META]
    }));
}


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

    const user = getUsuarioAtual();

    // Se não tem o parâmetro page=main, mostra tela de login
    if (!e || !e.parameter || e.parameter.page !== 'main') {
      return mostrarTelaLogin(user);
    }

    // Verifica se usuário está autorizado
    if (!user.ativo || user.perfil === 'NAO_CADASTRADO') {
      return mostrarTelaAcessoNegado(user);
    }

    // Mostra a tela principal
    const template = HtmlService.createTemplateFromFile('Index');

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
 * Mostra tela de login
 */
function mostrarTelaLogin(user) {
  try {
    const template = HtmlService.createTemplateFromFile('Login');

    // Garante que user é um objeto válido
    const usuarioSeguro = user || {
      email: '',
      nome: 'Erro ao detectar usuário',
      perfil: 'NAO_CADASTRADO',
      ativo: false,
      erro: 'Objeto user está undefined ou null'
    };

    // Log para debug
    console.log('mostrarTelaLogin() - Usuario:', JSON.stringify(usuarioSeguro));

    template.dadosIniciais = {
      usuario: usuarioSeguro
    };

    return template.evaluate()
      .setTitle('Login - Teko Porã')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    console.error('Erro em mostrarTelaLogin():', error);

    // Retorna HTML de erro direto
    const htmlErro = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Erro - Teko Porã</title>
  <style>
    body { font-family: Arial; padding: 40px; background: #f5f5f5; }
    .erro { background: #fff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
    h1 { color: #dc3545; }
    code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="erro">
    <h1>❌ Erro ao Carregar Tela de Login</h1>
    <p><strong>Mensagem:</strong> ${escapeHtml(error.message)}</p>
    <p><strong>Stack:</strong> <code>${escapeHtml(error.stack || 'N/A')}</code></p>
    <hr>
    <h3>Passos para resolver:</h3>
    <ol>
      <li>Verifique se executou <code>setupInicial()</code> no Apps Script</li>
      <li>Confirme que o ID da planilha está correto</li>
      <li>Reimplante o aplicativo web</li>
      <li>Limpe o cache e tente novamente</li>
    </ol>
    <p>Se o erro persistir, contate: <strong>teko.pora@ifms.edu.br</strong></p>
  </div>
</body>
</html>`;

    return HtmlService.createHtmlOutput(htmlErro)
      .setTitle('Erro - Teko Porã')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Mostra tela de acesso negado
 */
function mostrarTelaAcessoNegado(user) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso Negado - Teko Porã</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f0f0f0;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 {
      color: #dc3545;
      font-size: 48px;
      margin: 0;
    }
    h2 {
      color: #333;
      margin-top: 20px;
    }
    .user-info {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .info {
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      color: #0c5460;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚫</h1>
    <h2>Acesso Negado</h2>

    <div class="user-info">
      <strong>Usuário:</strong> ${escapeHtml(user.email)}<br>
      <strong>Status:</strong> Não cadastrado no sistema
    </div>

    <div class="info">
      <strong>Como obter acesso?</strong><br><br>
      1. Entre em contato com o administrador do sistema<br>
      2. E-mail: <strong>teko.pora@ifms.edu.br</strong><br>
      3. Solicite cadastro informando seu nome e e-mail @ifms.edu.br
    </div>

    <p><button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
      🔄 Recarregar Página
    </button></p>
  </div>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Acesso Negado - Teko Porã')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
