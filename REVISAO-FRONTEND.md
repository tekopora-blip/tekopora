# Revisão de Frontend - Sistema de Requisições Teko Porã

## 🔴 Problemas Críticos Encontrados

### 1. **Vulnerabilidade XSS - Injeção de HTML**
**Localização:** Múltiplas funções que usam `innerHTML`

**Problema:**
```javascript
tr.innerHTML = `
  <td>${r.numero || ''}</td>
  <td>${r.tipo}</td>
  ...
`;
```

Se `r.numero` ou `r.tipo` contiverem código HTML/JavaScript malicioso:
```javascript
r.numero = '<img src=x onerror="alert(\'XSS\')">';
```

Esse código será **executado** no navegador do usuário!

**Correção:**
```javascript
// Usar textContent em vez de innerHTML
function criarCelulaTexto(texto) {
  const td = document.createElement('td');
  td.textContent = texto || '';  // textContent escapa automaticamente
  return td;
}

// Ou criar função de escape
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
```

---

### 2. **Atributos onclick Inline Vulneráveis**
**Problema:**
```javascript
onclick="editarReq('${r.id}')"  // Se r.id = "'); alert('xss'); ('"
onclick="abrirDecisao('${r.id}','${r.numero}')"
```

**Correção:**
```javascript
// Usar addEventListener em vez de onclick inline
const btnEditar = document.createElement('button');
btnEditar.className = 'btn btn-secondary';
btnEditar.textContent = 'Editar';
btnEditar.addEventListener('click', () => editarReq(r.id));
```

---

### 3. **Regex de Replace Incorreto**
**Problema:**
```javascript
const qtd = parseFloat(tr.children[3].querySelector('input').value.replace(',', '.'));
//                                                                            ^ apenas primeira vírgula
```

Se usuário digitar `1,234,56` → resultado será `1.234,56` (incorreto)

**Correção:**
```javascript
function sanitizeNumber(value) {
  return parseFloat(String(value).replace(/,/g, '.')) || 0;
  //                                            ^^^ global flag
}
```

---

### 4. **Classes CSS com Espaços**
**Problema:**
```javascript
class="tag status-${r.status}"  // r.status = "EM CORREÇÃO"
// Resultado: class="tag status-EM CORREÇÃO"  ❌ QUEBRADO!
```

Classes CSS não podem ter espaços. O navegador interpretará como duas classes: `status-EM` e `CORREÇÃO`.

**Correção:**
```javascript
function statusParaClasse(status) {
  return String(status).replace(/\s+/g, '-');
}

// Uso:
class="tag status-${statusParaClasse(r.status)}"
// Resultado: class="tag status-EM-CORRECAO" ✅
```

**CSS correspondente:**
```css
.status-EM-CORRECAO {  /* hífen em vez de espaço */
  background: #fff3cd;
}
```

---

### 5. **Sintaxe JavaScript Incorreta**
**Problema:**
```javascript
google.script.run
  .withSuccessHandler(function(lista){
    // ...
  }).listarCadastradoresParaAdmin = function(){}; // ❌ WTF?
```

Isso não faz sentido! Está tentando atribuir uma função vazia a uma propriedade.

**Correção:**
```javascript
google.script.run
  .withSuccessHandler(function(lista){
    // ...
  })
  .listarCadastradoresParaAdmin(); // ✅ Chamada correta
```

---

## ⚠️ Bugs Funcionais

### 6. **Edição Não Carrega Dados**
**Problema:**
```javascript
function editarReq(id) {
  document.getElementById('areaForm').style.display = 'block';
  document.getElementById('reqId').value = id;
  document.getElementById('msgForm').textContent = 'Edição de requisição existente...';
}
```

Apenas seta o ID mas **não carrega nenhum dado** da requisição!

O usuário vê um formulário vazio ao tentar editar.

**Solução:** Criar função server-side `obterRequisicaoPorId(id)` e preencher todos os campos.

---

### 7. **Itens Não São Reindexados Após Remoção**
**Problema:**
```javascript
function removerItem(btn) {
  const tr = btn.parentNode.parentNode;
  tr.parentNode.removeChild(tr);
  // Números ficam: 1, 2, 4, 5 (falta o 3)
}
```

**Correção:**
```javascript
function removerItem(tr) {
  if (confirm('Remover este item?')) {
    tr.remove();
    reindexarItens();  // ✅
  }
}

function reindexarItens() {
  const tbody = document.querySelector('#tabelaItens tbody');
  Array.from(tbody.children).forEach((tr, idx) => {
    tr.children[0].textContent = idx + 1;
  });
}
```

---

### 8. **Validação Insuficiente no Cliente**
**Problema:** Não valida campos obrigatórios antes de enviar ao servidor.

**Correção:**
```javascript
function validarCamposObrigatorios() {
  const erros = [];

  if (!getElementValue('tipoRequisicao')) {
    erros.push('Tipo de Requisição é obrigatório');
  }

  if (!getElementValue('meta')) {
    erros.push('Meta/Etapa é obrigatória');
  }

  // ... mais validações

  const tbody = document.querySelector('#tabelaItens tbody');
  if (!tbody || tbody.children.length === 0) {
    erros.push('Adicione pelo menos um item à requisição');
  }

  return erros;
}
```

---

### 9. **Conversão de Data Frágil**
**Problema:**
```javascript
new Date(r.dataCadastro).toLocaleString()
// Assume formato ISO, mas pode quebrar com outros formatos
```

**Correção:**
```javascript
function formatarData(data) {
  if (!data) return '';
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch (e) {
    return '';
  }
}
```

---

## 🎨 Problemas de UX/UI

### 10. **Não Responsivo**
**Problema:** Tabelas muito largas em mobile.

**Correção:**
```css
table {
  overflow-x: auto;
  display: block;
}

@media (min-width: 768px) {
  table {
    display: table;
  }
}
```

---

### 11. **Falta Feedback Visual**
**Problema:** Botões ficam clicáveis durante operações assíncronas.

**Correção:**
```javascript
function setLoading(isLoading) {
  AppState.loading = isLoading;
  document.body.classList.toggle('loading', isLoading);
}

// CSS
.loading {
  opacity: 0.6;
  pointer-events: none;
}
```

---

### 12. **Falta Meta Viewport**
**Problema:** Não funciona bem em mobile.

**Correção:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

### 13. **Cores Hardcoded**
**Problema:** `#8D2033` repetido 5+ vezes.

**Correção:**
```css
:root {
  --cor-primaria: #8D2033;
  --cor-borda: #ddd;
  --cor-fundo-claro: #f3f3f3;
}

.btn-primary {
  background: var(--cor-primaria);
}
```

---

## ♿ Problemas de Acessibilidade

### 14. **Falta Associação Label/Input**
**Problema:**
```html
<label>Meta</label>
<select id="meta"></select>
```

**Correção:**
```html
<label for="meta">Meta</label>
<select id="meta"></select>
```

---

### 15. **Falta aria-label em Inputs de Tabela**
**Problema:** Leitores de tela não identificam campos.

**Correção:**
```javascript
const inpQt = document.createElement('input');
inpQt.setAttribute('aria-label', 'Quantidade do item');
```

---

### 16. **Lang Ausente**
**Problema:**
```html
<html>
```

**Correção:**
```html
<html lang="pt-BR">
```

---

## 🔧 Melhorias de Manutenibilidade

### 17. **Índices Hardcoded (Números Mágicos)**
**Problema:**
```javascript
tr.children[3].querySelector('input').value  // Qual campo é esse?
tr.children[7].querySelector('textarea').value  // E esse?
```

**Correção:**
```javascript
const ITEM_COLS = {
  NUM: 0,
  DESCRICAO: 1,
  UNIDADE: 2,
  QUANTIDADE: 3,
  VALOR_UNIT: 4,
  VALOR_TOTAL: 5,
  FINALIDADE: 6,
  JUSTIFICATIVA: 7,
  ACOES: 8
};

const qtd = tr.children[ITEM_COLS.QUANTIDADE].querySelector('input').value;
```

---

### 18. **Funções Monolíticas**
**Problema:** Função `init()` faz muitas coisas.

**Correção:** Dividir em funções menores:
```javascript
function init() {
  exibirDadosUsuario();
  preencherSelects();
  configurarAreasDeAcesso();
}
```

---

### 19. **Sem Namespace Global**
**Problema:** Variáveis e funções poluem escopo global.

**Correção:**
```javascript
const App = {
  state: {},
  init() { ... },
  utils: { ... },
  ui: { ... }
};

window.addEventListener('DOMContentLoaded', () => App.init());
```

---

### 20. **Repetição de Código**
**Problema:** Padrão de criação de células repetido 20+ vezes.

**Correção:** Funções utilitárias:
```javascript
function criarCelulaTexto(texto) { ... }
function criarBotao(texto, onClick, classe) { ... }
function criarTagStatus(status) { ... }
```

---

## 📊 Comparação Antes/Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Vulnerabilidade XSS | 8+ ocorrências | 0 ✅ |
| Onclick inline | 12+ ocorrências | 0 (addEventListener) ✅ |
| Classes CSS inválidas | Status com espaços | Normalizadas ✅ |
| Validação client-side | Nenhuma | Completa ✅ |
| Responsividade | Não | Sim ✅ |
| Acessibilidade | Mínima | Melhorada ✅ |
| Código duplicado | Alto | Reduzido ✅ |
| Feedback visual | Nenhum | Loading states ✅ |
| Manutenibilidade | Baixa | Melhor organização ✅ |

---

## 🎯 Correções Implementadas

### Segurança
✅ Função `escapeHtml()` para prevenir XSS
✅ Remoção de onclick inline (uso de addEventListener)
✅ Criação segura de elementos DOM

### Bugs Corrigidos
✅ Regex `/,/g` para substituir todas as vírgulas
✅ Normalização de status para classes CSS válidas
✅ Sintaxe correta de chamadas Google Apps Script
✅ Reindexação de itens após remoção

### Validações
✅ Validação completa de campos obrigatórios
✅ Validação de números (não negativos)
✅ Validação antes de enviar ao servidor

### UX/UI
✅ Loading states durante operações
✅ Mensagens de erro/sucesso claras
✅ Responsividade básica
✅ Meta viewport para mobile
✅ CSS variables para cores

### Acessibilidade
✅ Lang no HTML
✅ Labels com atributo `for`
✅ Aria-labels em inputs de tabela
✅ Semântica HTML melhorada

### Manutenibilidade
✅ Funções utilitárias reutilizáveis
✅ Constantes para índices de colunas
✅ Estado da aplicação centralizado
✅ Separação de responsabilidades

---

## 🚀 Melhorias Futuras Sugeridas

### Curto Prazo
1. **Implementar carregamento de dados na edição**
   - Criar função `obterRequisicaoPorId(id)` no backend
   - Preencher todos os campos do formulário

2. **Adicionar debounce em cálculos**
   - Evitar recalcular a cada keystroke

3. **Melhorar mensagens de erro**
   - Destacar campos com erro
   - Scroll automático para primeiro erro

### Médio Prazo
4. **Implementar paginação em tabelas**
   - Tabelas com muitos registros ficam lentas

5. **Adicionar busca/filtros**
   - Filtrar requisições por status, tipo, data

6. **Implementar autocomplete**
   - Descrições de itens comuns
   - Endereços frequentes

### Longo Prazo
7. **Progressive Web App (PWA)**
   - Funcionar offline
   - Salvar rascunhos localmente

8. **Testes automatizados**
   - Jest para testes unitários
   - Cypress para testes E2E

9. **Internacionalização (i18n)**
   - Suporte a múltiplos idiomas
   - Mensagens externalizadas

10. **Componetização**
    - Usar framework como Vue/React
    - Componentes reutilizáveis

---

## 📋 Checklist de Testes

Após implementar o código refatorado, teste:

### Segurança
- [ ] Inserir `<script>alert('xss')</script>` em campos de texto
- [ ] Verificar que não executa no navegador
- [ ] Testar com aspas simples/duplas em IDs

### Funcionalidade
- [ ] Criar nova requisição completa
- [ ] Adicionar/remover itens (verificar reindexação)
- [ ] Salvar e enviar requisição
- [ ] Editar requisição existente (quando implementado)
- [ ] Validar campos obrigatórios
- [ ] Validar números negativos

### UX/UI
- [ ] Testar em Chrome, Firefox, Safari
- [ ] Testar em mobile (iOS e Android)
- [ ] Verificar responsividade em telas pequenas
- [ ] Testar loading states (conexão lenta)
- [ ] Verificar acessibilidade com leitor de tela

### Performance
- [ ] Carregar tabela com 100+ registros
- [ ] Adicionar 50+ itens a uma requisição
- [ ] Verificar tempo de resposta

---

## 🔄 Migração

### Passos para Aplicar
1. **Backup do HTML atual**
2. **Testar em ambiente de desenvolvimento**
3. **Executar checklist de testes acima**
4. **Deploy em produção**
5. **Monitorar erros no console**

### Compatibilidade
- ✅ Google Apps Script HTML Service
- ✅ Browsers modernos (Chrome 90+, Firefox 88+, Safari 14+)
- ⚠️ IE11 não suportado (usar polyfills se necessário)

---

## 📖 Recursos de Aprendizado

- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Google Apps Script Best Practices](https://developers.google.com/apps-script/guides/html/best-practices)

---

**Última atualização:** 2025-11-15
**Responsável:** Claude Code Review System
