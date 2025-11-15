/**
 * SISTEMA DE REQUISIÇÕES DE COMPRA - TEKO PORÃ
 * Versão Refatorada com correções de bugs e melhorias
 */

/***** CONSTANTES BÁSICAS *****/
const NOME_PLANILHA = 'REQ_Teko_Pora';
const ABA_CONFIG = 'Config';
const ABA_USUARIOS = 'Usuarios';
const ABA_METAS = 'Metas';
const ABA_RUBRICAS = 'Rubricas';
const ABA_ENDERECOS = 'Enderecos';
const ABA_NUMERACAO = 'Numeracao';
const ABA_REQUISICOES = 'Requisicoes';
const ABA_ITENS = 'Itens';
const ABA_LOGS = 'Logs';

const STATUS = {
  RASCUNHO: 'RASCUNHO',
  ENVIADA: 'ENVIADA',
  EM_CORRECAO: 'EM CORREÇÃO',
  REJEITADA: 'REJEITADA',
  APROVADA: 'APROVADA',
  CADASTRADA: 'CADASTRADA',
  ENVIADA_AUTORIZACAO: 'ENVIADA AUTORIZAÇÃO'
};

const TIPOS_REQ = [
  'MATERIAL DE CONSUMO',
  'MATERIAL PERMANENTE',
  'SERVIÇOS DE PESSOA JURÍDICA',
  'COMPRA DE PASSAGENS',
  'REEMBOLSO DE COMPRAS'
];

// ÍNDICES DAS COLUNAS DA ABA REQUISICOES (base 0 para arrays, base 1 para sheets)
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

/***** FUNÇÕES UTILITÁRIAS *****/

function getSS() {
  return SpreadsheetApp.getActive();
}

function getSheet(nome) {
  const sheet = getSS().getSheetByName(nome);
  if (!sheet) {
    throw new Error(`Aba "${nome}" não encontrada na planilha.`);
  }
  return sheet;
}

/**
 * Escapa HTML para prevenir XSS em emails
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
 */
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Valida se um valor numérico é válido e não negativo
 */
function validarNumeroPositivo(valor, campo) {
  const num = Number(valor);
  if (isNaN(num) || num < 0) {
    throw new Error(`${campo} deve ser um número válido não negativo.`);
  }
  return num;
}

/**
 * Gera ID único para requisição
 */
function gerarIdRequisicao() {
  // Usa timestamp + número aleatório para reduzir chance de colisão
  return new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
}

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

function logAcao(email, acao, detalhes) {
  try {
    const sh = getSheet(ABA_LOGS);
    const now = new Date();
    sh.appendRow([now, email, acao, detalhes]);
  } catch (e) {
    console.error('Erro ao registrar log:', e);
    // Não propaga erro de log para não interromper operação principal
  }
}

/***** USUÁRIOS E PERFIS *****/

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

function isPerfil(perfil) {
  const u = getUsuarioAtual();
  return u.perfil === perfil;
}

function validarUsuarioAtivo() {
  const user = getUsuarioAtual();
  if (!user.ativo) {
    throw new Error('Usuário não autorizado ou inativo.');
  }
  return user;
}

/***** METAS, RUBRICAS, ENDEREÇOS *****/

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

/***** NUMERAÇÃO xxx/ano *****/

function gerarNumeroRequisicao(tipo) {
  const ano = new Date().getFullYear();
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

/***** BUSCA DE REQUISIÇÃO (DRY) *****/

/**
 * Busca uma requisição por ID e retorna linha e dados
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

/***** VALIDAÇÕES DE REQUISIÇÃO *****/

function validarDadosRequisicao(dados) {
  // Valida tipo
  if (!dados.tipoRequisicao || !TIPOS_REQ.includes(dados.tipoRequisicao)) {
    throw new Error('Tipo de requisição inválido.');
  }

  // Valida meta
  if (!dados.meta) {
    throw new Error('Meta é obrigatória.');
  }

  // Valida rubrica
  if (!dados.rubricaCodigo) {
    throw new Error('Rubrica é obrigatória.');
  }

  // Valida endereço
  if (!dados.enderecoId && !dados.enderecoNovo) {
    throw new Error('Endereço é obrigatório.');
  }

  // Valida itens
  if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
    throw new Error('É necessário incluir pelo menos um item na requisição.');
  }

  // Valida cada item
  dados.itens.forEach((item, idx) => {
    if (!item.descricaoDetalhada) {
      throw new Error(`Item ${idx + 1}: Descrição é obrigatória.`);
    }
    if (!item.unidade) {
      throw new Error(`Item ${idx + 1}: Unidade é obrigatória.`);
    }
    validarNumeroPositivo(item.quantidade, `Item ${idx + 1} - Quantidade`);
    validarNumeroPositivo(item.valorUnitario, `Item ${idx + 1} - Valor Unitário`);
  });
}

/***** CRUD DE REQUISIÇÕES *****/

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

function criarNovaRequisicao(dados, user, cfg) {
  validarDadosRequisicao(dados);

  const shReq = getSheet(ABA_REQUISICOES);
  const shItens = getSheet(ABA_ITENS);

  const id = gerarIdRequisicao();
  const numero = gerarNumeroRequisicao(dados.tipoRequisicao);
  const agora = new Date();

  const { enderecoId, endObj } = prepararDadosEndereco(dados.enderecoId, dados.enderecoNovo);
  const rubObj = prepararDadosRubrica(dados.rubricaCodigo);

  shReq.appendRow([
    id,
    numero,
    dados.tipoRequisicao,
    STATUS.RASCUNHO,
    cfg.PROJETO || '',
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

function atualizarRequisicao(dados, user) {
  validarDadosRequisicao(dados);

  const { row, data, sheet: shReq } = buscarRequisicao(dados.id);
  const shItens = getSheet(ABA_ITENS);

  const statusAtual = data[COL_REQ.STATUS];
  const numero = data[COL_REQ.NUMERO];

  // Verifica permissão para editar
  if (![STATUS.RASCUNHO, STATUS.EM_CORRECAO].includes(statusAtual) && !isPerfil('ADMIN')) {
    throw new Error('Não é possível editar esta requisição neste status.');
  }

  const { enderecoId, endObj } = prepararDadosEndereco(dados.enderecoId, dados.enderecoNovo);
  const rubObj = prepararDadosRubrica(dados.rubricaCodigo);
  const agora = new Date();

  // Atualiza campos editáveis (colunas 7-22 = índices de planilha, começando em 1)
  // CORREÇÃO: Array com 16 valores para 16 colunas
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

  // Atualiza links anexos (coluna 23)
  shReq.getRange(row, 23).setValue(dados.linksAnexos || '');

  // Atualiza data de modificação (coluna 33)
  shReq.getRange(row, 33).setValue(agora);

  // Atualiza itens
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

/***** ENVIO DA REQUISIÇÃO PELO REQUISITANTE *****/

function enviarRequisicao(id) {
  const user = validarUsuarioAtivo();
  const { row, data, sheet: shReq } = buscarRequisicao(id);

  const emailReq = data[COL_REQ.REQUISITANTE_EMAIL];
  const statusAtual = data[COL_REQ.STATUS];
  const numero = data[COL_REQ.NUMERO];
  const tipo = data[COL_REQ.TIPO];

  // Verifica se usuário é o requisitante
  if (normalizeEmail(emailReq) !== normalizeEmail(user.email) && !isPerfil('ADMIN')) {
    throw new Error('Apenas o requisitante pode enviar esta requisição.');
  }

  // Verifica status
  if (![STATUS.RASCUNHO, STATUS.EM_CORRECAO].includes(statusAtual)) {
    throw new Error(`Status "${statusAtual}" não permite envio.`);
  }

  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(STATUS.ENVIADA);
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(new Date());

  const cfg = getConfigMap();
  enviarEmailNovaRequisicao(numero, tipo, user, cfg);

  logAcao(user.email, 'ENVIAR_REQUISICAO', `ID=${id}, Numero=${numero}`);
  return true;
}

function enviarEmailNovaRequisicao(numero, tipo, user, cfg) {
  const assunto = `[TEKO PORÃ] Nova requisição de compra ${escapeHtml(numero)} - ${escapeHtml(tipo)}`;
  const corpoHtml = `
  <div style="font-family: Arial, sans-serif; font-size: 13px; color: #333;">
    <h2 style="color:#8D2033;">Nova requisição de compra</h2>
    <p>Uma nova requisição foi cadastrada no sistema do Programa Teko Porã.</p>
    <table style="border-collapse: collapse; margin-top:10px;">
      <tr><td style="padding:4px 8px;"><b>Número:</b></td><td>${escapeHtml(numero)}</td></tr>
      <tr><td style="padding:4px 8px;"><b>Tipo:</b></td><td>${escapeHtml(tipo)}</td></tr>
      <tr><td style="padding:4px 8px;"><b>Requisitante:</b></td><td>${escapeHtml(user.nome)} (${escapeHtml(user.email)})</td></tr>
    </table>
    <p style="margin-top:12px;">Solicita-se a análise da requisição na interface administrativa do sistema.</p>
  </div>`;

  MailApp.sendEmail({
    to: cfg.EMAIL_ADMIN,
    cc: cfg.EMAIL_CC_ADMIN || '',
    subject: assunto,
    htmlBody: corpoHtml
  });
}

/***** AVALIAÇÃO DO ADMIN *****/

function listarRequisicoesParaAdmin() {
  if (!isPerfil('ADMIN')) {
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

function decidirRequisicaoAdmin(id, acao, justificativa, emailCadastrador) {
  if (!isPerfil('ADMIN')) {
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
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(new Date());

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

function enviarEmailResultadoAdmin(numero, tipo, emailReq, nomeReq, status, justificativa, cfg) {
  const assunto = `[TEKO PORÃ] Requisição ${escapeHtml(numero)} - ${escapeHtml(status)}`;
  const corpoHtml = `
  <div style="font-family: Arial, sans-serif; font-size: 13px; color: #333;">
    <h2 style="color:#8D2033;">Requisição ${escapeHtml(numero)}</h2>
    <p>O administrador analisou sua requisição de compra.</p>
    <table style="border-collapse: collapse;">
      <tr><td style="padding:4px 8px;"><b>Tipo:</b></td><td>${escapeHtml(tipo)}</td></tr>
      <tr><td style="padding:4px 8px;"><b>Status:</b></td><td>${escapeHtml(status)}</td></tr>
    </table>
    ${justificativa ? `<p><b>Justificativa:</b><br>${escapeHtml(justificativa)}</p>` : ''}
  </div>`;

  MailApp.sendEmail({
    to: emailReq,
    cc: cfg.EMAIL_ADMIN || '',
    subject: assunto,
    htmlBody: corpoHtml
  });
}

function enviarEmailParaCadastrador(numero, tipo, emailCad, nomeCad, cfg) {
  const assunto = `[TEKO PORÃ] Requisição ${escapeHtml(numero)} aprovada para cadastro FADEX`;
  const corpoHtml = `
  <div style="font-family: Arial, sans-serif; font-size: 13px; color: #333;">
    <h2 style="color:#8D2033;">Requisição aprovada</h2>
    <p>Você foi designado(a) para cadastrar a seguinte requisição no portal da FADEX:</p>
    <table style="border-collapse: collapse;">
      <tr><td style="padding:4px 8px;"><b>Número:</b></td><td>${escapeHtml(numero)}</td></tr>
      <tr><td style="padding:4px 8px;"><b>Tipo:</b></td><td>${escapeHtml(tipo)}</td></tr>
    </table>
  </div>`;

  MailApp.sendEmail({
    to: emailCad,
    cc: cfg.EMAIL_ADMIN || '',
    subject: assunto,
    htmlBody: corpoHtml
  });
}

/***** TAREFAS DO CADASTRADOR *****/

function listarRequisicoesCadastrador() {
  const user = getUsuarioAtual();
  if (user.perfil !== 'CADASTRADOR') {
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

function atualizarDadosPortal(id, numeroWeb, protocolo, linkComprovante) {
  const user = getUsuarioAtual();
  if (user.perfil !== 'CADASTRADOR') {
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
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(new Date());

  logAcao(user.email, 'ATUALIZAR_PORTAL', `ID=${id}`);
  return true;
}

function enviarParaAutorizacao(id) {
  const user = getUsuarioAtual();
  if (user.perfil !== 'CADASTRADOR') {
    throw new Error('Acesso restrito a cadastradores.');
  }

  const { row, data, sheet: shReq } = buscarRequisicao(id);

  if (data[COL_REQ.STATUS] !== STATUS.CADASTRADA) {
    throw new Error('Status não permite envio para autorização.');
  }

  const agora = new Date();
  shReq.getRange(row, COL_REQ.STATUS + 1).setValue(STATUS.ENVIADA_AUTORIZACAO);
  shReq.getRange(row, COL_REQ.DATA_ENVIO_AUTORIZACAO + 1).setValue(agora);
  shReq.getRange(row, COL_REQ.ULTIMA_ATUALIZACAO + 1).setValue(agora);

  const cfg = getConfigMap();
  const numero = data[COL_REQ.NUMERO];
  const tipo = data[COL_REQ.TIPO];
  const numeroWeb = data[COL_REQ.NUMERO_WEB];
  const protocolo = data[COL_REQ.PROTOCOLO];

  const assunto = `[TEKO PORÃ] Requisição ${escapeHtml(numero)} cadastrada no portal FADEX`;
  const corpoHtml = `
  <div style="font-family: Arial, sans-serif; font-size: 13px; color: #333;">
    <h2 style="color:#8D2033;">Requisição cadastrada no portal FADEX</h2>
    <table style="border-collapse: collapse;">
      <tr><td style="padding:4px 8px;"><b>Número:</b></td><td>${escapeHtml(numero)}</td></tr>
      <tr><td style="padding:4px 8px;"><b>Tipo:</b></td><td>${escapeHtml(tipo)}</td></tr>
      <tr><td style="padding:4px 8px;"><b>Número WEB:</b></td><td>${escapeHtml(numeroWeb)}</td></tr>
      <tr><td style="padding:4px 8px;"><b>Protocolo:</b></td><td>${escapeHtml(protocolo)}</td></tr>
    </table>
    <p>Solicita-se a autorização da requisição no portal da FADEX.</p>
  </div>`;

  MailApp.sendEmail({
    to: cfg.EMAIL_COORDENADOR,
    cc: cfg.EMAIL_ADMIN || '',
    subject: assunto,
    htmlBody: corpoHtml
  });

  logAcao(user.email, 'ENVIAR_AUTORIZACAO', `ID=${id}`);
  return true;
}

/***** LISTAGENS PARA O REQUISITANTE *****/

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

/***** LISTA DE CADASTRADORES PARA O ADMIN *****/

function listarCadastradoresParaAdmin() {
  if (!isPerfil('ADMIN')) {
    throw new Error('Acesso restrito ao administrador.');
  }

  const sh = getSheet(ABA_USUARIOS);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const vals = sh.getRange(2, 1, lastRow - 1, 4).getValues();
  return vals
    .filter(r => r[2] === 'CADASTRADOR' && r[3] !== false)
    .map(r => ({ email: r[0], nome: r[1] }));
}

/***** FRONTEND (doGet) *****/

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

/***** INCLUDE PARA HTML *****/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
