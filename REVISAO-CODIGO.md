# Revisão de Código - Sistema de Requisições Teko Porã

## 🔴 Problemas Críticos Corrigidos

### 1. **Bug Critical - Incompatibilidade de Range**
**Localização:** Função `salvarRequisicao` (linha ~195 do código original)

**Problema:**
```javascript
shReq.getRange(row, 7, 1, 17).setValues([[...]])  // Range espera 17 colunas
// Mas array tem apenas 16 valores
```

**Correção:**
```javascript
shReq.getRange(row, 7, 1, 16).setValues([[...]])  // Corrigido para 16 colunas
```

**Impacto:** Este bug causaria erro de execução ao tentar atualizar uma requisição.

---

### 2. **Colisão de IDs**
**Problema:**
```javascript
id = new Date().getTime(); // Pode colidir se 2 usuários salvarem no mesmo milissegundo
```

**Correção:**
```javascript
function gerarIdRequisicao() {
  return new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
}
```

**Impacto:** Reduz drasticamente chance de colisão de IDs.

---

### 3. **Condição de Corrida na Numeração**
**Problema:** Múltiplos usuários podem gerar o mesmo número de requisição simultaneamente.

**Correção:**
```javascript
function gerarNumeroRequisicao(tipo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000); // Previne condição de corrida
  try {
    // ... código de geração ...
  } finally {
    lock.releaseLock();
  }
}
```

---

### 4. **Vulnerabilidade XSS em Emails**
**Problema:** Dados do usuário inseridos diretamente no HTML dos emails.

**Correção:**
```javascript
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Uso:
const corpoHtml = `<td>${escapeHtml(user.nome)}</td>`;
```

---

## ⚠️ Validações Adicionadas

### 5. **Validação de Dados de Requisição**
**Adicionado:**
```javascript
function validarDadosRequisicao(dados) {
  // Valida tipo
  if (!dados.tipoRequisicao || !TIPOS_REQ.includes(dados.tipoRequisicao)) {
    throw new Error('Tipo de requisição inválido.');
  }

  // Valida campos obrigatórios
  if (!dados.meta) throw new Error('Meta é obrigatória.');
  if (!dados.rubricaCodigo) throw new Error('Rubrica é obrigatória.');

  // Valida que tem itens
  if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
    throw new Error('É necessário incluir pelo menos um item na requisição.');
  }

  // Valida cada item
  dados.itens.forEach((item, idx) => {
    if (!item.descricaoDetalhada) {
      throw new Error(`Item ${idx + 1}: Descrição é obrigatória.`);
    }
    validarNumeroPositivo(item.quantidade, `Item ${idx + 1} - Quantidade`);
    validarNumeroPositivo(item.valorUnitario, `Item ${idx + 1} - Valor Unitário`);
  });
}
```

### 6. **Validação de Números**
**Adicionado:**
```javascript
function validarNumeroPositivo(valor, campo) {
  const num = Number(valor);
  if (isNaN(num) || num < 0) {
    throw new Error(`${campo} deve ser um número válido não negativo.`);
  }
  return num;
}
```

### 7. **Validação de Endereço**
**Adicionado:**
```javascript
function validarEndereco(endereco) {
  if (!endereco.logradouro) throw new Error('Logradouro é obrigatório.');
  if (!endereco.cidade) throw new Error('Cidade é obrigatória.');
  if (!endereco.uf) throw new Error('UF é obrigatório.');
  if (!endereco.cep) throw new Error('CEP é obrigatório.');
}
```

---

## 🎯 Melhorias de Manutenibilidade

### 8. **Constantes para Índices de Colunas**
**Problema:** Números mágicos espalhados pelo código (`vals[i][24]`, `vals[i][3]`).

**Correção:**
```javascript
const COL_REQ = {
  ID: 0,
  NUMERO: 1,
  TIPO: 2,
  STATUS: 3,
  // ... todas as colunas mapeadas
  REQUISITANTE_EMAIL: 23,
  REQUISITANTE_NOME: 24,
  ULTIMA_ATUALIZACAO: 32
};

// Uso:
const email = vals[i][COL_REQ.REQUISITANTE_EMAIL];
const status = vals[i][COL_REQ.STATUS];
```

**Benefício:** Código muito mais legível e fácil de manter.

---

### 9. **DRY - Don't Repeat Yourself**
**Problema:** Busca de requisição por ID repetida em 5+ funções.

**Correção:**
```javascript
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

// Uso em outras funções:
const { row, data, sheet } = buscarRequisicao(id);
```

---

### 10. **Refatoração da Função `salvarRequisicao`**
**Problema:** Função com 150+ linhas, difícil de entender e manter.

**Correção:** Quebrada em funções menores e focadas:
```javascript
// Função principal delegando responsabilidades
function salvarRequisicao(dados) {
  const user = validarUsuarioAtivo();
  const cfg = getConfigMap();

  if (!dados.id) {
    return criarNovaRequisicao(dados, user, cfg);
  } else {
    return atualizarRequisicao(dados, user);
  }
}

// Funções auxiliares especializadas
function criarNovaRequisicao(dados, user, cfg) { ... }
function atualizarRequisicao(dados, user) { ... }
function prepararDadosEndereco(enderecoId, dadosEnderecoNovo) { ... }
function prepararDadosRubrica(rubricaCodigo) { ... }
function salvarItensRequisicao(shItens, id, itens) { ... }
function removerItensRequisicao(shItens, id) { ... }
```

---

## 🔒 Melhorias de Segurança

### 11. **Normalização de Emails**
**Problema:** Comparações inconsistentes (case-sensitive em alguns lugares).

**Correção:**
```javascript
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Uso consistente:
if (normalizeEmail(emailReq) !== normalizeEmail(user.email)) {
  throw new Error('Acesso negado.');
}
```

---

### 12. **Validação de Usuário Ativo**
**Adicionado:**
```javascript
function validarUsuarioAtivo() {
  const user = getUsuarioAtual();
  if (!user.ativo) {
    throw new Error('Usuário não autorizado ou inativo.');
  }
  return user;
}
```

---

### 13. **Validação de Existência de Rubrica/Meta**
**Adicionado:**
```javascript
function prepararDadosRubrica(rubricaCodigo) {
  const rubricas = listarRubricas();
  const rubObj = rubricas.find(r => r.codigo === rubricaCodigo);

  if (!rubObj) {
    throw new Error(`Rubrica "${rubricaCodigo}" não encontrada.`);
  }

  return rubObj;
}
```

---

## 🛡️ Tratamento de Erros

### 14. **Mensagens de Erro Mais Claras**
**Antes:**
```javascript
throw new Error('Erro.');
```

**Depois:**
```javascript
throw new Error(`Status "${statusAtual}" não permite decisão administrativa.`);
throw new Error(`Rubrica "${rubricaCodigo}" não encontrada.`);
throw new Error(`Item ${idx + 1}: Quantidade deve ser um número válido.`);
```

---

### 15. **Try-Catch em Logs**
**Adicionado:**
```javascript
function logAcao(email, acao, detalhes) {
  try {
    const sh = getSheet(ABA_LOGS);
    const now = new Date();
    sh.appendRow([now, email, acao, detalhes]);
  } catch (e) {
    console.error('Erro ao registrar log:', e);
    // Não propaga erro para não interromper operação principal
  }
}
```

---

### 16. **Validação de Abas**
**Antes:**
```javascript
function getSheet(nome) {
  return getSS().getSheetByName(nome);
  // Retorna null se não existir
}
```

**Depois:**
```javascript
function getSheet(nome) {
  const sheet = getSS().getSheetByName(nome);
  if (!sheet) {
    throw new Error(`Aba "${nome}" não encontrada na planilha.`);
  }
  return sheet;
}
```

---

## 📊 Melhorias de Performance

### 17. **Trim em Códigos**
**Adicionado:** Remoção de espaços em branco ao carregar metas e rubricas:
```javascript
function listarRubricas() {
  // ...
  return vals.filter(r => r[0]).map(r => ({
    codigo: String(r[0]).trim(),  // <- Trim adicionado
    descricao: r[1]
  }));
}
```

---

## 📝 Documentação

### 18. **JSDoc e Comentários**
**Adicionado:**
```javascript
/**
 * Escapa HTML para prevenir XSS em emails
 */
function escapeHtml(text) { ... }

/**
 * Busca uma requisição por ID e retorna linha e dados
 */
function buscarRequisicao(id) { ... }
```

---

## 🔍 Checklist de Testes Recomendados

Após implementar o código refatorado, teste:

- [ ] Criar nova requisição sem itens (deve dar erro)
- [ ] Criar requisição com valores negativos (deve dar erro)
- [ ] Criar 2 requisições simultaneamente (verificar IDs únicos)
- [ ] Atualizar requisição em status ENVIADA como requisitante (deve dar erro)
- [ ] Enviar email com caracteres especiais `<script>alert('xss')</script>` (deve escapar)
- [ ] Testar com usuário inativo (deve dar erro)
- [ ] Testar com email em maiúsculas/minúsculas (deve funcionar)
- [ ] Aprovar requisição sem selecionar cadastrador (deve dar erro)
- [ ] Cadastrar dados de portal sem número WEB (deve dar erro)

---

## 📦 Arquivo de Migração

O arquivo `Code-Refatorado.gs` pode substituir completamente o código original.

**Passos para migração:**
1. Fazer backup do código atual
2. Testar código refatorado em ambiente de desenvolvimento
3. Executar testes do checklist acima
4. Substituir código em produção
5. Monitorar logs por 24-48h

---

## 🎓 Boas Práticas Aplicadas

✅ **Single Responsibility Principle** - Cada função tem uma responsabilidade única
✅ **DRY** - Código duplicado eliminado
✅ **Validação de entrada** - Todos os dados validados antes de processar
✅ **Segurança** - XSS prevention, validação de permissões
✅ **Tratamento de erros** - Mensagens claras e específicas
✅ **Legibilidade** - Constantes nomeadas, funções pequenas
✅ **Manutenibilidade** - Código organizado e documentado

---

## 📞 Próximos Passos Sugeridos

1. **Implementar cache** para `listarMetas()`, `listarRubricas()` (reduzir leituras)
2. **Adicionar validação de CPF/CNPJ** se aplicável
3. **Implementar soft delete** em vez de `deleteRow` (melhor auditoria)
4. **Adicionar testes unitários** usando Google Apps Script testing framework
5. **Criar índice** na planilha para busca mais rápida por ID
6. **Implementar rate limiting** para emails (evitar spam)
7. **Adicionar webhooks** para notificações em tempo real
8. **Criar dashboard** de métricas (requisições por status, tempo médio, etc.)

---

**Última atualização:** 2025-11-15
**Responsável:** Claude Code Review System
