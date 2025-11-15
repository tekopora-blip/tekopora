# 🔴 BUGS CRÍTICOS - CORREÇÃO URGENTE NECESSÁRIA

## ⚠️ RESUMO EXECUTIVO

O código atual do sistema de requisições possui **3 bugs críticos** que podem causar:
- ❌ Falhas de execução (crashes)
- ❌ Perda de dados
- ❌ Vulnerabilidades de segurança

---

## BUG #1: ERRO DE EXECUÇÃO NA ATUALIZAÇÃO DE REQUISIÇÃO

### 🔍 Localização
Função `salvarRequisicao`, aproximadamente linha 195

### ❌ Código Problemático
```javascript
shReq.getRange(row, 7, 1, 17).setValues([[
  dados.limiteAtendimento || '',
  dados.meta,
  rubObj.codigo || '',
  rubObj.descricao || '',
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
```

### 🐛 Problema
- `getRange(row, 7, 1, 17)` solicita **17 colunas**
- Array fornecido tem apenas **16 valores**
- Google Apps Script lançará erro: `The number of columns in the data does not match the number of columns in the range`

### ✅ Correção
```javascript
// OPÇÃO 1: Ajustar o range para 16 colunas
shReq.getRange(row, 7, 1, 16).setValues([[
  // ... mesmo array de 16 valores
]]);

// OPÇÃO 2: Adicionar o 17º valor (se houver campo faltando)
```

### 📊 Impacto
- **Severidade:** CRÍTICA
- **Frequência:** Toda vez que tentar atualizar uma requisição existente
- **Afetados:** Todos os usuários
- **Ação:** CORRIGIR IMEDIATAMENTE

---

## BUG #2: COLISÃO DE IDs DE REQUISIÇÃO

### 🔍 Localização
Função `salvarRequisicao`, linha onde cria nova requisição

### ❌ Código Problemático
```javascript
id = new Date().getTime(); // ID simples baseado em timestamp
```

### 🐛 Problema
- Se dois usuários salvarem uma requisição no **mesmo milissegundo**, terão o **mesmo ID**
- Em ambientes com múltiplos usuários simultâneos, a probabilidade é significativa
- IDs duplicados causam:
  - Requisições sobrescritas
  - Dados perdidos
  - Confusão na busca por ID

### ✅ Correção
```javascript
function gerarIdRequisicao() {
  // Timestamp + número aleatório reduz drasticamente chance de colisão
  return new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
}

// Uso:
id = gerarIdRequisicao();
```

### 📊 Impacto
- **Severidade:** ALTA
- **Frequência:** Rara em uso leve, frequente em uso intenso
- **Afetados:** Múltiplos usuários simultâneos
- **Ação:** CORRIGIR ANTES DO USO EM PRODUÇÃO

---

## BUG #3: VULNERABILIDADE XSS EM EMAILS

### 🔍 Localização
Funções de envio de email (`enviarEmailNovaRequisicao`, `enviarEmailResultadoAdmin`, etc.)

### ❌ Código Problemático
```javascript
const corpoHtml = `
  <h2>Nova requisição de compra</h2>
  <tr><td>${numero}</td></tr>
  <tr><td>${user.nome} (${user.email})</td></tr>
`;
```

### 🐛 Problema
- Dados do usuário inseridos **diretamente** no HTML sem escape
- Se usuário tiver nome como: `<script>alert('hack')</script>`
- Script será executado no email do destinatário
- Possibilita ataques de phishing e roubo de credenciais

### ✅ Correção
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

// Uso em emails:
const corpoHtml = `
  <h2>Nova requisição de compra</h2>
  <tr><td>${escapeHtml(numero)}</td></tr>
  <tr><td>${escapeHtml(user.nome)} (${escapeHtml(user.email)})</td></tr>
`;
```

### 📊 Impacto
- **Severidade:** ALTA (Segurança)
- **Frequência:** Toda vez que envia email com dados de usuário
- **Afetados:** Destinatários dos emails
- **Ação:** CORRIGIR IMEDIATAMENTE

---

## 🚨 OUTROS PROBLEMAS IMPORTANTES

### 4. Condição de Corrida na Numeração
**Problema:** Dois usuários podem gerar o mesmo número de requisição (001/2025)

**Correção Rápida:**
```javascript
function gerarNumeroRequisicao(tipo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    // ... código de geração ...
  } finally {
    lock.releaseLock();
  }
}
```

---

### 5. Falta de Validação de Dados
**Problema:** Sistema aceita:
- Requisições sem itens
- Valores negativos
- Rubricas inexistentes

**Correção:** Adicionar validações antes de salvar (veja arquivo Code-Refatorado.gs)

---

## 📋 CHECKLIST DE CORREÇÃO IMEDIATA

### Prioridade CRÍTICA (fazer hoje):
- [ ] Corrigir Bug #1 (getRange 17 vs 16)
- [ ] Corrigir Bug #3 (escape HTML em emails)

### Prioridade ALTA (fazer esta semana):
- [ ] Corrigir Bug #2 (IDs únicos)
- [ ] Adicionar lock em numeração
- [ ] Adicionar validação de dados básica

### Prioridade MÉDIA (fazer este mês):
- [ ] Implementar todas as melhorias do Code-Refatorado.gs
- [ ] Adicionar testes
- [ ] Melhorar tratamento de erros

---

## 🔧 COMO APLICAR AS CORREÇÕES

### Método 1: Correções Mínimas (30 minutos)
Aplicar apenas as correções dos 3 bugs críticos no código atual:

1. Mudar `getRange(row, 7, 1, 17)` para `getRange(row, 7, 1, 16)`
2. Substituir `id = new Date().getTime()` por geração com aleatório
3. Adicionar função `escapeHtml()` e usá-la em todos os emails

### Método 2: Refatoração Completa (2-4 horas)
Substituir todo o código pelo `Code-Refatorado.gs`:

1. Backup do código atual
2. Copiar conteúdo de `Code-Refatorado.gs`
3. Testar em ambiente de desenvolvimento
4. Deploy em produção

---

## 📞 SUPORTE

Se precisar de ajuda para aplicar as correções:
1. Revise o arquivo `REVISAO-CODIGO.md` para entender todas as mudanças
2. Use o arquivo `Code-Refatorado.gs` como referência
3. Teste cada correção individualmente antes de aplicar em produção

---

**IMPORTANTE:** Não ignore estes bugs. Eles **VÃO** causar problemas em produção.

**Última atualização:** 2025-11-15
