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
  const sh = getSheet(ABA_CONFIG);
  const cfg = {};

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return cfg;

  const vals = sh.getRange(2, 1, lastRow - 1, 2).getValues();
  vals.forEach(r => {
    if (r[0]) cfg[String(r[0]).trim()] = r[1];
  });
  return cfg;
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
  const sh = getSheet(ABA_METAS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const vals = sh.getRange(2, 1, lastRow - 1, 2).getValues();
  return vals.filter(r => r[0]).map(r => ({
    codigo: String(r[0]).trim(),
    descricao: r[1]
  }));
}

/**
 * Lista todas as rubricas cadastradas
 * @returns {Array<Object>} Array de rubricas {codigo, descricao}
 */
function listarRubricas() {
  const sh = getSheet(ABA_RUBRICAS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const vals = sh.getRange(2, 1, lastRow - 1, 2).getValues();
  return vals.filter(r => r[0]).map(r => ({
    codigo: String(r[0]).trim(),
    descricao: r[1]
  }));
}

/**
 * Lista todos os endereços ativos
 * @returns {Array<Object>} Array de endereços
 */
function listarEnderecos() {
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
// CRUD DE REQUISIÇÕES
// ============================================================================

/**
 * Prepara dados do endereço (existente ou novo)
 * @param {number} enderecoId - ID do endereço existente
 * @param {Object} dadosEnderecoNovo - Dados de novo endereço
 * @returns {Object} {enderecoId, endObj}
 */
function prepararDadosEndereco(enderecoId, dadosEnderecoNovo) {
  let enderecoIdFinal = enderecoId;

  if (!enderecoIdFinal && dadosEnderecoNovo) {
    enderecoIdFinal = salvarNovoEndereco(dadosEnderecoNovo);
  }

  const listaEnd = listarEnderecos();
  const endObj = listaEnd.find(e => String(e.id) === String(enderecoIdFinal)) || {};

  return { enderecoId: enderecoIdFinal, endObj };
}

/**
 * Prepara dados da rubrica
 * @param {string} rubricaCodigo - Código da rubrica
 * @returns {Object} Objeto da rubrica
 * @throws {Error} Se a rubrica não for encontrada
 */
function prepararDadosRubrica(rubricaCodigo) {
  const rubricas = listarRubricas();
  const rubObj = rubricas.find(r => r.codigo === rubricaCodigo);

  if (!rubObj) {
    throw new Error(`Rubrica "${rubricaCodigo}" não encontrada.`);
  }

  return rubObj;
}

/**
 * Salva itens de uma requisição
 * @param {Sheet} shItens - Aba de itens
 * @param {string} id - ID da requisição
 * @param {Array} itens - Array de itens
 */
function salvarItensRequisicao(shItens, id, itens) {
  itens.forEach((item, idx) => {
    if (!item.descricaoDetalhada) return;

    const qt = validarNumeroPositivo(item.quantidade, 'Quantidade');
    const vu = validarNumeroPositivo(item.valorUnitario, 'Valor Unitário');
    const vt = qt * vu;

    shItens.appendRow([
      id,
      idx + 1,
      item.descricaoDetalhada,
      item.unidade,
      qt,
      vu,
      vt,
      item.finalidade || '',
      item.justificativaTecnica || ''
    ]);
  });
}

/**
 * Remove todos os itens de uma requisição
 * @param {Sheet} shItens - Aba de itens
 * @param {string} id - ID da requisição
 */
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

  // Deleta de trás para frente para não alterar índices
  for (let i = linhasExcluir.length - 1; i >= 0; i--) {
    shItens.deleteRow(linhasExcluir[i]);
  }
}

/**
 * Cria uma nova requisição
 * @param {Object} dados - Dados da requisição
 * @param {Object} user - Dados do usuário
 * @param {Object} cfg - Configurações do sistema
 * @returns {Object} {id, numero}
 */
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
    id,
    numero,
    dados.tipoRequisicao,
    STATUS.RASCUNHO,
    cfg.PROJETO || '11986-5 - CONTRATO N° 62/2024 - PROJETO TEKO PORÃ',
    agora,
    dados.limiteAtendimento || '',
    dados.meta,
    rubObj.codigo,
    rubObj.descricao,
    enderecoId || '',
    endObj.nome || '',
    endObj.logradouro || '',
    endObj.numero || '',
    endObj.bairro || '',
    endObj.cidade || '',
    endObj.uf || '',
    endObj.cep || '',
    endObj.complemento || '',
    dados.formaAvaliacao || '',
    dados.justificativaForma || '',
    dados.observacoes || '',
    dados.linksAnexos || '',
    user.email,
    user.nome,
    '', // justificativa admin
    '', // cadastrador email
    '', // cadastrador nome
    '', // numero web
    '', // protocolo
    '', // link comprovante
    '', // data envio autorização
    agora // última atualização
  ]);

  salvarItensRequisicao(shItens, id, dados.itens);

  logAcao(user.email, 'SALVAR_NOVA_REQUISICAO', `ID=${id}, Numero=${numero}`);
  return { id: id, numero: numero };
}

/**
 * Atualiza uma requisição existente
 * @param {Object} dados - Dados da requisição
 * @param {Object} user - Dados do usuário
 * @returns {Object} {id, numero}
 */
function atualizarRequisicao(dados, user) {
  validarDadosRequisicao(dados);

  const { row, data, sheet: shReq } = buscarRequisicao(dados.id);
  const shItens = getSheet(ABA_ITENS);

  const statusAtual = data[COL_REQ.STATUS];
  const numero = data[COL_REQ.NUMERO];

  // Verifica permissão para editar
  if (![STATUS.RASCUNHO, STATUS.EM_CORRECAO].includes(statusAtual) && !isPerfil(PERFIL.ADMIN)) {
    throw new Error('Não é possível editar esta requisição neste status.');
  }

  const { enderecoId, endObj } = prepararDadosEndereco(dados.enderecoId, dados.enderecoNovo);
  const rubObj = prepararDadosRubrica(dados.rubricaCodigo);
  const agora = getDataAtualMS();

  // Atualiza campos editáveis
  shReq.getRange(row, 7, 1, 16).setValues([[
    dados.limiteAtendimento || '',
    dados.meta,
    rubObj.codigo,
    rubObj.descricao,
    enderecoId || '',
    endObj.nome || '',
    endObj.logradouro || '',
    endObj.numero || '',
    endObj.bairro || '',
    endObj.cidade || '',
    endObj.uf || '',
    endObj.cep || '',
    endObj.complemento || '',
    dados.formaAvaliacao || '',
    dados.justificativaForma || '',
    dados.observacoes || ''
  ]]);

  // Atualiza links anexos
  shReq.getRange(row, 23).setValue(dados.linksAnexos || '');

  // Atualiza data de modificação
  shReq.getRange(row, 33).setValue(agora);

  // Atualiza itens
  removerItensRequisicao(shItens, dados.id);
  salvarItensRequisicao(shItens, dados.id, dados.itens);

  logAcao(user.email, 'ATUALIZAR_REQUISICAO', `ID=${dados.id}`);
  return { id: dados.id, numero: numero };
}

/**
 * Salva uma requisição (nova ou existente)
 * @param {Object} dados - Dados da requisição
 * @returns {Object} {id, numero}
 */
function salvarRequisicao(dados) {
  const user = validarUsuarioAtivo();
  const cfg = getConfigMap();

  if (!dados.id) {
    return criarNovaRequisicao(dados, user, cfg);
  } else {
    return atualizarRequisicao(dados, user);
  }
}

// ============================================================================
// ENVIO DE REQUISIÇÃO PELO REQUISITANTE
// ============================================================================

/**
 * Envia requisição para aprovação do administrador
 * @param {string} id - ID da requisição
 * @returns {boolean} True se enviado com sucesso
 */
function enviarRequisicao(id) {
  const user = validarUsuarioAtivo();
  const { row, data, sheet: shReq } = buscarRequisicao(id);

  const emailReq = data[COL_REQ.REQUISITANTE_EMAIL];
  const statusAtual = data[COL_REQ.STATUS];
  const numero = data[COL_REQ.NUMERO];
  const tipo = data[COL_REQ.TIPO];

  // Verifica se usuário é o requisitante
  if (normalizeEmail(emailReq) !== normalizeEmail(user.email) && !isPerfil(PERFIL.ADMIN)) {
    throw new Error('Apenas o requisitante pode enviar esta requisição.');
  }

  // Verifica status
  if (![STATUS.RASCUNHO, STATUS.EM_CORRECAO].includes(statusAtual)) {
    throw new Error(`Status "${statusAtual}" não permite envio.`);
  }

  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(STATUS.ENVIADA);
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(getDataAtualMS());

  const cfg = getConfigMap();
  enviarEmailNovaRequisicao(numero, tipo, user, cfg);

  logAcao(user.email, 'ENVIAR_REQUISICAO', `ID=${id}, Numero=${numero}`);
  return true;
}

/**
 * Envia e-mail de nova requisição para o administrador
 * @param {string} numero - Número da requisição
 * @param {string} tipo - Tipo da requisição
 * @param {Object} user - Dados do usuário
 * @param {Object} cfg - Configurações
 */
function enviarEmailNovaRequisicao(numero, tipo, user, cfg) {
  const assunto = `[TEKO PORÃ REQ-${numero}] Nova requisição - ${tipo}`;

  const corpoHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
      .header { background-color: #8D2033; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; font-weight: normal; }
      .content { padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; }
      .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
      .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
      .info-table td:first-child { font-weight: bold; width: 150px; color: #8D2033; }
      .alert-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
      .btn { display: inline-block; padding: 12px 24px; background-color: #8D2033; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📋 Nova Requisição de Compra</h1>
      </div>
      <div class="content">
        <p>Uma nova requisição foi cadastrada no Sistema de Requisições do Programa Teko Porã e aguarda sua análise.</p>

        <table class="info-table">
          <tr>
            <td>Número da Requisição:</td>
            <td><strong>${escapeHtml(numero)}</strong></td>
          </tr>
          <tr>
            <td>Tipo:</td>
            <td>${escapeHtml(tipo)}</td>
          </tr>
          <tr>
            <td>Requisitante:</td>
            <td>${escapeHtml(user.nome)}</td>
          </tr>
          <tr>
            <td>E-mail:</td>
            <td>${escapeHtml(user.email)}</td>
          </tr>
          <tr>
            <td>Data de Envio:</td>
            <td>${Utilities.formatDate(getDataAtualMS(), 'America/Campo_Grande', 'dd/MM/yyyy HH:mm')}</td>
          </tr>
        </table>

        <div class="alert-box">
          <strong>⚠️ Ação Necessária:</strong> Acesse o sistema para analisar e decidir sobre esta requisição.
        </div>

        <p><strong>Próximas ações disponíveis:</strong></p>
        <ul>
          <li>✅ Aprovar e atribuir cadastrador FADEX</li>
          <li>✏️ Solicitar correção ao requisitante</li>
          <li>❌ Rejeitar com justificativa</li>
        </ul>
      </div>
      <div class="footer">
        <p>Sistema de Requisições de Compra - Programa Teko Porã<br>
        IFMS - Instituto Federal de Mato Grosso do Sul</p>
      </div>
    </div>
  </body>
  </html>`;

  MailApp.sendEmail({
    to: cfg.EMAIL_ADMIN || 'teko.pora@ifms.edu.br',
    cc: cfg.EMAIL_CC_ADMIN || 'fernando.alves@ifms.edu.br',
    subject: assunto,
    htmlBody: corpoHtml
  });
}

// ============================================================================
// AVALIAÇÃO DO ADMINISTRADOR
// ============================================================================

/**
 * Lista todas as requisições para o administrador
 * @returns {Array<Object>} Array de requisições
 */
function listarRequisicoesParaAdmin() {
  if (!isPerfil(PERFIL.ADMIN)) {
    throw new Error('Acesso restrito ao administrador.');
  }

  const sh = getSheet(ABA_REQUISICOES);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const vals = sh.getRange(2, 1, lastRow - 1, 33).getValues();
  return vals.map(r => ({
    id: r[COL_REQ.ID],
    numero: r[COL_REQ.NUMERO],
    tipo: r[COL_REQ.TIPO],
    status: r[COL_REQ.STATUS],
    projeto: r[COL_REQ.PROJETO],
    dataCadastro: r[COL_REQ.DATA_CADASTRO],
    meta: r[COL_REQ.META],
    rubrica: `${r[COL_REQ.RUBRICA_CODIGO]} - ${r[COL_REQ.RUBRICA_DESC]}`,
    requisitante: `${r[COL_REQ.REQUISITANTE_NOME]} (${r[COL_REQ.REQUISITANTE_EMAIL]})`
  }));
}

/**
 * Lista cadastradores ativos para o administrador
 * @returns {Array<Object>} Array de cadastradores
 */
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

/**
 * Decide sobre uma requisição (aprovar, rejeitar, solicitar correção)
 * @param {string} id - ID da requisição
 * @param {string} acao - Ação (APROVAR, REJEITAR, CORRIGIR)
 * @param {string} justificativa - Justificativa da decisão
 * @param {string} emailCadastrador - Email do cadastrador (obrigatório para aprovação)
 * @returns {boolean} True se processado com sucesso
 */
function decidirRequisicaoAdmin(id, acao, justificativa, emailCadastrador) {
  if (!isPerfil(PERFIL.ADMIN)) {
    throw new Error('Acesso restrito ao administrador.');
  }

  const { row, data, sheet: shReq } = buscarRequisicao(id);

  const statusAtual = data[COL_REQ.STATUS];
  if (statusAtual !== STATUS.ENVIADA && statusAtual !== STATUS.EM_CORRECAO) {
    throw new Error(`Status "${statusAtual}" não permite decisão administrativa.`);
  }

  const cfg = getConfigMap();
  const numero = data[COL_REQ.NUMERO];
  const tipo = data[COL_REQ.TIPO];
  const reqEmail = data[COL_REQ.REQUISITANTE_EMAIL];
  const reqNome = data[COL_REQ.REQUISITANTE_NOME];

  let novoStatus;
  if (acao === 'REJEITAR') {
    novoStatus = STATUS.REJEITADA;
  } else if (acao === 'CORRIGIR') {
    novoStatus = STATUS.EM_CORRECAO;
  } else if (acao === 'APROVAR') {
    novoStatus = STATUS.APROVADA;
  } else {
    throw new Error(`Ação inválida: ${acao}`);
  }

  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(novoStatus);
  shReq.getRange(row, COL_REQ.JUSTIFICATIVA_ADMIN + 1).setValue(justificativa || '');
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(getDataAtualMS());

  if (acao === 'APROVAR') {
    if (!emailCadastrador) {
      throw new Error('Selecione um cadastrador para processar esta requisição.');
    }

    const cadastradores = listarCadastradoresParaAdmin();
    const cadastrador = cadastradores.find(c => normalizeEmail(c.email) === normalizeEmail(emailCadastrador));

    if (!cadastrador) {
      throw new Error('Cadastrador não encontrado ou inativo.');
    }

    shReq.getRange(row, COL_REQ.CADASTRADOR_EMAIL + 1, 1, 2).setValues([[
      cadastrador.email,
      cadastrador.nome
    ]]);

    enviarEmailParaCadastrador(numero, tipo, cadastrador.email, cadastrador.nome, cfg);
  } else {
    enviarEmailResultadoAdmin(numero, tipo, reqEmail, reqNome, novoStatus, justificativa, cfg);
  }

  logAcao(getUsuarioAtual().email, `DECISAO_ADMIN_${acao}`, `ID=${id}, Numero=${numero}`);
  return true;
}

/**
 * Envia e-mail de resultado da análise do admin para o requisitante
 */
function enviarEmailResultadoAdmin(numero, tipo, emailReq, nomeReq, status, justificativa, cfg) {
  const assunto = `[TEKO PORÃ REQ-${numero}] ${status}`;

  let statusMsg = '';
  let statusColor = '#333';
  let statusIcon = '';

  if (status === STATUS.REJEITADA) {
    statusMsg = 'Requisição Rejeitada';
    statusColor = '#dc3545';
    statusIcon = '❌';
  } else if (status === STATUS.EM_CORRECAO) {
    statusMsg = 'Correção Solicitada';
    statusColor = '#ffc107';
    statusIcon = '✏️';
  }

  const corpoHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
      .header { background-color: ${statusColor}; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; font-weight: normal; }
      .content { padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; }
      .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
      .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
      .info-table td:first-child { font-weight: bold; width: 150px; color: #8D2033; }
      .justificativa-box { background-color: #fff; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${statusIcon} ${statusMsg}</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${escapeHtml(nomeReq)}</strong>,</p>
        <p>O administrador analisou sua requisição de compra.</p>

        <table class="info-table">
          <tr>
            <td>Número da Requisição:</td>
            <td><strong>${escapeHtml(numero)}</strong></td>
          </tr>
          <tr>
            <td>Tipo:</td>
            <td>${escapeHtml(tipo)}</td>
          </tr>
          <tr>
            <td>Status:</td>
            <td><strong style="color: ${statusColor};">${escapeHtml(status)}</strong></td>
          </tr>
          <tr>
            <td>Data da Decisão:</td>
            <td>${Utilities.formatDate(getDataAtualMS(), 'America/Campo_Grande', 'dd/MM/yyyy HH:mm')}</td>
          </tr>
        </table>

        ${justificativa ? `
        <div class="justificativa-box">
          <strong>Justificativa do Administrador:</strong>
          <p>${escapeHtml(justificativa)}</p>
        </div>` : ''}

        ${status === STATUS.EM_CORRECAO ? `
        <p><strong>⚠️ Próximos passos:</strong></p>
        <ul>
          <li>Acesse o sistema</li>
          <li>Edite a requisição conforme solicitado</li>
          <li>Envie novamente para análise</li>
        </ul>` : ''}
      </div>
      <div class="footer">
        <p>Sistema de Requisições de Compra - Programa Teko Porã<br>
        IFMS - Instituto Federal de Mato Grosso do Sul</p>
      </div>
    </div>
  </body>
  </html>`;

  MailApp.sendEmail({
    to: emailReq,
    cc: cfg.EMAIL_ADMIN || '',
    subject: assunto,
    htmlBody: corpoHtml
  });
}

/**
 * Envia e-mail para cadastrador designado
 */
function enviarEmailParaCadastrador(numero, tipo, emailCad, nomeCad, cfg) {
  const assunto = `[TEKO PORÃ REQ-${numero}] Aprovada - Cadastro FADEX`;

  const corpoHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
      .header { background-color: #28a745; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; font-weight: normal; }
      .content { padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; }
      .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
      .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
      .info-table td:first-child { font-weight: bold; width: 150px; color: #8D2033; }
      .alert-box { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✅ Requisição Aprovada</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${escapeHtml(nomeCad)}</strong>,</p>
        <p>Você foi designado(a) para cadastrar a seguinte requisição no portal da FADEX:</p>

        <table class="info-table">
          <tr>
            <td>Número da Requisição:</td>
            <td><strong>${escapeHtml(numero)}</strong></td>
          </tr>
          <tr>
            <td>Tipo:</td>
            <td>${escapeHtml(tipo)}</td>
          </tr>
          <tr>
            <td>Data da Aprovação:</td>
            <td>${Utilities.formatDate(getDataAtualMS(), 'America/Campo_Grande', 'dd/MM/yyyy HH:mm')}</td>
          </tr>
        </table>

        <div class="alert-box">
          <strong>📋 Tarefas a realizar:</strong>
          <ol>
            <li>Acessar o sistema e visualizar os detalhes da requisição</li>
            <li>Cadastrar a requisição no portal da FADEX</li>
            <li>Informar no sistema: Número WEB, Protocolo e Link do comprovante</li>
            <li>Enviar para autorização do coordenador</li>
          </ol>
        </div>
      </div>
      <div class="footer">
        <p>Sistema de Requisições de Compra - Programa Teko Porã<br>
        IFMS - Instituto Federal de Mato Grosso do Sul</p>
      </div>
    </div>
  </body>
  </html>`;

  MailApp.sendEmail({
    to: emailCad,
    cc: cfg.EMAIL_ADMIN || '',
    subject: assunto,
    htmlBody: corpoHtml
  });
}

// ============================================================================
// FUNÇÕES DO CADASTRADOR
// ============================================================================

/**
 * Lista requisições aprovadas atribuídas ao cadastrador atual
 * @returns {Array<Object>} Array de requisições
 */
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
      id: r[COL_REQ.ID],
      numero: r[COL_REQ.NUMERO],
      tipo: r[COL_REQ.TIPO],
      meta: r[COL_REQ.META],
      requisitante: `${r[COL_REQ.REQUISITANTE_NOME]} (${r[COL_REQ.REQUISITANTE_EMAIL]})`
    }));
}

/**
 * Atualiza dados do portal FADEX
 * @param {string} id - ID da requisição
 * @param {string} numeroWeb - Número WEB do portal
 * @param {string} protocolo - Protocolo FADEX
 * @param {string} linkComprovante - Link do comprovante
 * @returns {boolean} True se atualizado com sucesso
 */
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
    numeroWeb,
    protocolo,
    linkComprovante || ''
  ]]);
  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(STATUS.CADASTRADA);
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(getDataAtualMS());

  logAcao(user.email, 'ATUALIZAR_PORTAL', `ID=${id}`);
  return true;
}

/**
 * Envia requisição para autorização do coordenador
 * @param {string} id - ID da requisição
 * @returns {boolean} True se enviado com sucesso
 */
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

  const cfg = getConfigMap();
  const numero = data[COL_REQ.NUMERO];
  const tipo = data[COL_REQ.TIPO];
  const numeroWeb = data[COL_REQ.NUMERO_WEB];
  const protocolo = data[COL_REQ.PROTOCOLO];

  enviarEmailAutorizacaoCoordenador(numero, tipo, numeroWeb, protocolo, user, cfg);

  logAcao(user.email, 'ENVIAR_AUTORIZACAO', `ID=${id}`);
  return true;
}

/**
 * Envia e-mail para coordenador solicitando autorização
 */
function enviarEmailAutorizacaoCoordenador(numero, tipo, numeroWeb, protocolo, cadastrador, cfg) {
  const assunto = `[TEKO PORÃ REQ-${numero}] Cadastrada FADEX - Autorização Necessária`;

  const corpoHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
      .header { background-color: #17a2b8; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; font-weight: normal; }
      .content { padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; }
      .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
      .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
      .info-table td:first-child { font-weight: bold; width: 180px; color: #8D2033; }
      .alert-box { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔐 Requisição Cadastrada no Portal FADEX</h1>
      </div>
      <div class="content">
        <p>A requisição foi cadastrada no portal da FADEX e aguarda sua autorização.</p>

        <table class="info-table">
          <tr>
            <td>Número da Requisição:</td>
            <td><strong>${escapeHtml(numero)}</strong></td>
          </tr>
          <tr>
            <td>Tipo:</td>
            <td>${escapeHtml(tipo)}</td>
          </tr>
          <tr>
            <td>Número WEB (Portal FADEX):</td>
            <td><strong>${escapeHtml(numeroWeb)}</strong></td>
          </tr>
          <tr>
            <td>Protocolo:</td>
            <td><strong>${escapeHtml(protocolo)}</strong></td>
          </tr>
          <tr>
            <td>Cadastrado por:</td>
            <td>${escapeHtml(cadastrador.nome)} (${escapeHtml(cadastrador.email)})</td>
          </tr>
          <tr>
            <td>Data de Envio:</td>
            <td>${Utilities.formatDate(getDataAtualMS(), 'America/Campo_Grande', 'dd/MM/yyyy HH:mm')}</td>
          </tr>
        </table>

        <div class="alert-box">
          <strong>📌 Ação Necessária:</strong>
          <p>Acesse o portal da FADEX e autorize a requisição de número WEB <strong>${escapeHtml(numeroWeb)}</strong></p>
        </div>
      </div>
      <div class="footer">
        <p>Sistema de Requisições de Compra - Programa Teko Porã<br>
        IFMS - Instituto Federal de Mato Grosso do Sul</p>
      </div>
    </div>
  </body>
  </html>`;

  MailApp.sendEmail({
    to: cfg.EMAIL_COORDENADOR || 'teko.pora@ifms.edu.br',
    cc: cfg.EMAIL_ADMIN || '',
    subject: assunto,
    htmlBody: corpoHtml
  });
}

// ============================================================================
// LISTAGENS PARA REQUISITANTE
// ============================================================================

/**
 * Lista todas as requisições do usuário atual
 * @returns {Array<Object>} Array de requisições
 */
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
      id: r[COL_REQ.ID],
      numero: r[COL_REQ.NUMERO],
      tipo: r[COL_REQ.TIPO],
      status: r[COL_REQ.STATUS],
      dataCadastro: r[COL_REQ.DATA_CADASTRO],
      meta: r[COL_REQ.META]
    }));
}

// ============================================================================
// INTERFACE WEB (doGet)
// ============================================================================

/**
 * Função principal que renderiza a interface web
 * @param {Object} e - Parâmetros da requisição
 * @returns {HtmlOutput} Interface HTML
 */
function doGet(e) {
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

  Logger.log('Setup inicial concluído com sucesso!');
}
