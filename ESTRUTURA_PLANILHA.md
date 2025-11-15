# 📋 ESTRUTURA COMPLETA DA PLANILHA - SISTEMA DE REQUISIÇÕES TEKO PORÃ

## 📊 NOME DA PLANILHA
**REQ_Teko_Pora** (Google Sheets)

---

## 🗂️ ABAS NECESSÁRIAS

### 1. ABA: **Config**
Configurações gerais do sistema

| Coluna A (Chave) | Coluna B (Valor) |
|------------------|------------------|
| PROJETO | 11986-5 - CONTRATO N° 62/2024 - PROJETO TEKO PORÃ |
| EMAIL_ADMIN | teko.pora@ifms.edu.br |
| EMAIL_CC_ADMIN | fernando.alves@ifms.edu.br |
| EMAIL_COORDENADOR | teko.pora@ifms.edu.br |
| FUSO_HORARIO | America/Campo_Grande |

**Linha 1 (Cabeçalho):** `Chave` | `Valor`

---

### 2. ABA: **Usuarios**
Cadastro de usuários do sistema

| Email | Nome | Perfil | Ativo |
|-------|------|--------|-------|
| teko.pora@ifms.edu.br | Administrador | ADMIN | TRUE |
| laryssa.brasil.tp@ifms.edu.br | Laryssa Brasil | CADASTRADOR | TRUE |
| sonia.biron.tp@ifms.edu.br | Sonia Aparecida Silva Biron | CADASTRADOR | TRUE |
| angela.schwingel.tp@ifms.edu.br | Angela Schwingel | CADASTRADOR | TRUE |

**Perfis disponíveis:**
- `ADMIN` - Administrador do sistema
- `REQUISITANTE` - Usuário comum (cria requisições)
- `CADASTRADOR` - Cadastrador FADEX

**Linha 1 (Cabeçalho):** `Email` | `Nome` | `Perfil` | `Ativo`

---

### 3. ABA: **Metas**
Metas e etapas do projeto

| Código | Descrição |
|--------|-----------|
| META1 | Meta 1 – Elaboração de Planos de Gestão Territorial e Ambiental (PGTAs) |
| META2 | Meta 2 – Fomento a ações de fortalecimento de mulheres e jovens indígenas |
| META3 | Meta 3 – Implementação do Projeto Tekojoja: Semeando Liberdade |
| META4 | Meta 4 – Desenvolvimento de iniciativas de proteção às casas de reza |
| META5 | Meta 5 – Valorização cultural da Dança Kipaé |
| META6 | Meta 6 – Fomento à soberania alimentar por meio da piscicultura |
| META7 | Meta 7 – Implementação de quintais produtivos |
| META8 | Meta 8 – Publicação do Programa Teko Porã |
| META9 | Meta 9 – Despesas operacionais e administrativas (DOA) |

**Linha 1 (Cabeçalho):** `Codigo` | `Descricao`

---

### 4. ABA: **Rubricas**
Rubricas orçamentárias

| Código | Descrição |
|--------|-----------|
| 33.90.18 | BOLSA |
| 33.90.39 | OUTROS SERVIÇOS DE TERCEIROS PESSOA JURÍDICA |
| 33.90.20 | BOLSAS PESQUISADOR |
| 33.90.14 | DIÁRIAS |
| 44.90.52 | EQUIPAMENTOS E MATERIAL PERMANENTE |
| 33.90.30 | MATERIAL DE CONSUMO |
| 33.90.33 | PASSAGENS E DESPESAS COM LOCOMOÇÃO |
| 33.00.36 | OUTROS SERVIÇOS DE TERCEIROS PESSOA FÍSICA |
| 33.90.47 | OBRIGAÇÕES TRIBUTÁRIAS E CONTRIBUTIVAS |

**Linha 1 (Cabeçalho):** `Codigo` | `Descricao`

**IMPORTANTE:** A rubrica é preenchida automaticamente quando o usuário seleciona a "Descrição da Rubrica". O código da rubrica aparece automaticamente.

---

### 5. ABA: **Enderecos**
Endereços de entrega cadastrados

| ID | Nome | Logradouro | Numero | Bairro | Cidade | UF | CEP | Complemento | Ativo |
|----|------|------------|--------|--------|--------|-----|-----|-------------|-------|
| 1 | Exemplo | Rua exemplo | 123 | Centro | Campo Grande | MS | 79000-000 | Sala 1 | TRUE |

**Linha 1 (Cabeçalho):** `ID` | `Nome` | `Logradouro` | `Numero` | `Bairro` | `Cidade` | `UF` | `CEP` | `Complemento` | `Ativo`

**Observações:**
- ID é auto-incrementado
- Usuário pode selecionar endereço existente ou cadastrar novo
- Nome é usado para identificação rápida na lista suspensa

---

### 6. ABA: **Numeracao**
Controle de numeração das requisições (xxx/ano)

| Tipo | Ano | UltimoNumero |
|------|-----|--------------|
| MATERIAL DE CONSUMO | 2025 | 1 |
| MATERIAL PERMANENTE | 2025 | 1 |
| SERVIÇOS DE PESSOA JURÍDICA | 2025 | 1 |
| COMPRA DE PASSAGENS | 2025 | 1 |
| REEMBOLSO DE COMPRAS | 2025 | 1 |

**Linha 1 (Cabeçalho):** `Tipo` | `Ano` | `UltimoNumero`

**Funcionamento:**
- Gera números no formato `001/2025`, `002/2025`, etc.
- Cada tipo de requisição tem sua própria numeração
- Reinicia a contagem a cada ano

---

### 7. ABA: **Requisicoes**
Armazena todas as requisições cadastradas

**Cabeçalho completo (33 colunas):**

| # | Coluna | Tipo | Descrição |
|---|--------|------|-----------|
| 1 | ID | Texto | ID único da requisição (timestamp_random) |
| 2 | Numero | Texto | Número da requisição (001/2025) |
| 3 | Tipo | Texto | Tipo de requisição (5 opções) |
| 4 | Status | Texto | Status atual (RASCUNHO, ENVIADA, etc.) |
| 5 | Projeto | Texto | Nome do projeto (fixo) |
| 6 | DataCadastro | Data/Hora | Data de criação da requisição |
| 7 | LimiteAtendimento | Data | Data limite (opcional) |
| 8 | Meta | Texto | Meta/Etapa selecionada |
| 9 | RubricaCodigo | Texto | Código da rubrica (ex: 33.90.18) |
| 10 | RubricaDescricao | Texto | Descrição da rubrica |
| 11 | EnderecoID | Número | ID do endereço de entrega |
| 12 | EnderecoNome | Texto | Nome do endereço |
| 13 | EnderecoLogradouro | Texto | Logradouro |
| 14 | EnderecoNumero | Texto | Número |
| 15 | EnderecoBairro | Texto | Bairro |
| 16 | EnderecoCidade | Texto | Cidade |
| 17 | EnderecoUF | Texto | UF |
| 18 | EnderecoCEP | Texto | CEP |
| 19 | EnderecoComplemento | Texto | Complemento |
| 20 | FormaAvaliacao | Texto | Global / Por Item / Não Definida |
| 21 | JustificativaForma | Texto | Justificativa da forma de avaliação |
| 22 | Observacoes | Texto | Observações gerais |
| 23 | LinksAnexos | Texto | Links de documentos (separados por ;) |
| 24 | RequisitanteEmail | Email | Email do criador |
| 25 | RequisitanteNome | Texto | Nome do criador |
| 26 | JustificativaAdmin | Texto | Justificativa do admin (aprovação/rejeição) |
| 27 | CadastradorEmail | Email | Email do cadastrador designado |
| 28 | CadastradorNome | Texto | Nome do cadastrador |
| 29 | NumeroWEB | Texto | Número WEB (portal FADEX) |
| 30 | Protocolo | Texto | Protocolo FADEX |
| 31 | LinkComprovante | Texto | Link do comprovante de cadastro |
| 32 | DataEnvioAutorizacao | Data/Hora | Data de envio para autorização |
| 33 | UltimaAtualizacao | Data/Hora | Data da última modificação |

**Status possíveis:**
- `RASCUNHO` - Requisição salva mas não enviada (pode editar)
- `ENVIADA` - Enviada para análise do admin (não pode editar)
- `EM CORREÇÃO` - Admin solicitou correção (pode editar)
- `REJEITADA` - Admin rejeitou (não pode editar)
- `APROVADA` - Admin aprovou e atribuiu cadastrador
- `CADASTRADA` - Cadastrador preencheu dados do portal FADEX
- `ENVIADA AUTORIZAÇÃO` - Enviada para autorização do coordenador

---

### 8. ABA: **Itens**
Itens das requisições

| RequisicaoID | ItemNum | DescricaoDetalhada | Unidade | Quantidade | ValorUnitario | ValorTotal | Finalidade | JustificativaTecnica |
|--------------|---------|-------------------|---------|------------|---------------|------------|------------|---------------------|
| 1234_5678 | 1 | Notebook Dell XPS 15... | un | 2.00 | 5000.00 | 10000.00 | Uso administrativo | Especificações técnicas... |

**Linha 1 (Cabeçalho):** `RequisicaoID` | `ItemNum` | `DescricaoDetalhada` | `Unidade` | `Quantidade` | `ValorUnitario` | `ValorTotal` | `Finalidade` | `JustificativaTecnica`

**Validações:**
- `DescricaoDetalhada` - OBRIGATÓRIO (dica: sempre iniciar pelo nome do item)
- `Unidade` - OBRIGATÓRIO (ex: un, kg, m, l, cx)
- `Quantidade` - OBRIGATÓRIO, numérico com 2 casas decimais
- `ValorUnitario` - OBRIGATÓRIO, numérico com 2 casas decimais
- `ValorTotal` - CALCULADO AUTOMATICAMENTE (Quantidade × ValorUnitario)
- `Finalidade` - OPCIONAL
- `JustificativaTecnica` - OPCIONAL

---

### 9. ABA: **Logs**
Registro de ações do sistema (auditoria)

| DataHora | Email | Acao | Detalhes |
|----------|-------|------|----------|
| 2025-01-15 10:30:00 | user@ifms.edu.br | SALVAR_NOVA_REQUISICAO | ID=1234_5678, Numero=001/2025 |

**Linha 1 (Cabeçalho):** `DataHora` | `Email` | `Acao` | `Detalhes`

---

## 🎨 TIPOS DE REQUISIÇÃO

As 5 telas de cadastro apresentam estes tipos:

1. **MATERIAL DE CONSUMO**
2. **MATERIAL PERMANENTE**
3. **SERVIÇOS DE PESSOA JURÍDICA**
4. **COMPRA DE PASSAGENS**
5. **REEMBOLSO DE COMPRAS**

Cada tipo possui título específico:
- "Cadastro de Requisições de Compra - MATERIAL DE CONSUMO"
- "Cadastro de Requisições de Compra - MATERIAL PERMANENTE"
- etc.

---

## 📧 NOTIFICAÇÕES POR E-MAIL

### 1. Nova Requisição Enviada
**Quando:** Usuário envia requisição
**Para:** teko.pora@ifms.edu.br
**CC:** fernando.alves@ifms.edu.br
**De:** teko.pora@ifms.edu.br
**Assunto:** `[TEKO PORÃ] Nova requisição de compra {NUMERO} - {TIPO}`

### 2. Requisição Aprovada (para cadastrador)
**Quando:** Admin aprova requisição
**Para:** Email do cadastrador designado
**CC:** teko.pora@ifms.edu.br
**De:** teko.pora@ifms.edu.br
**Assunto:** `[TEKO PORÃ] Requisição {NUMERO} aprovada para cadastro FADEX`

### 3. Requisição Rejeitada/Em Correção (para requisitante)
**Quando:** Admin rejeita ou solicita correção
**Para:** Email do requisitante
**CC:** teko.pora@ifms.edu.br
**De:** teko.pora@ifms.edu.br
**Assunto:** `[TEKO PORÃ] Requisição {NUMERO} - {STATUS}`

### 4. Requisição Cadastrada FADEX (para coordenador)
**Quando:** Cadastrador envia para autorização
**Para:** teko.pora@ifms.edu.br (coordenador)
**CC:** teko.pora@ifms.edu.br
**De:** teko.pora@ifms.edu.br
**Assunto:** `[TEKO PORÃ] Requisição {NUMERO} cadastrada no portal FADEX`

---

## 🔐 PERFIS E PERMISSÕES

### ADMIN (teko.pora@ifms.edu.br)
- ✅ Visualiza todas as requisições
- ✅ Aprovar/Rejeitar/Solicitar correção
- ✅ Atribuir cadastrador
- ✅ Criar requisições (opcional)

### REQUISITANTE (qualquer @ifms.edu.br cadastrado)
- ✅ Criar novas requisições
- ✅ Salvar como rascunho
- ✅ Enviar para aprovação
- ✅ Editar requisições em RASCUNHO ou EM CORREÇÃO
- ❌ Não pode editar após enviar (status ENVIADA)

### CADASTRADOR (3 usuários específicos)
- ✅ Visualiza requisições aprovadas atribuídas a ele
- ✅ Preencher dados do portal FADEX (Número WEB, Protocolo, Comprovante)
- ✅ Enviar para autorização do coordenador

---

## 🚀 SETUP INICIAL

### Passo 1: Criar Google Sheets
1. Criar nova planilha: **REQ_Teko_Pora**
2. Criar 9 abas conforme especificado acima
3. Preencher cabeçalhos de todas as abas

### Passo 2: Criar Apps Script
1. No Google Sheets, ir em **Extensões > Apps Script**
2. Criar arquivo `Code.gs` (código principal)
3. Criar arquivo `Index.html` (interface principal)

### Passo 3: Configurar
1. Preencher aba **Config** com os dados do projeto
2. Preencher aba **Usuarios** com admin e cadastradores
3. Preencher aba **Metas** com as 9 metas
4. Preencher aba **Rubricas** com as rubricas orçamentárias
5. Cadastrar pelo menos 1 endereço padrão na aba **Enderecos**

### Passo 4: Implantar
1. No Apps Script, clicar em **Implantar > Nova implantação**
2. Tipo: **Aplicativo da Web**
3. Executar como: **Eu**
4. Quem tem acesso: **Qualquer pessoa da organização**
5. Copiar URL do aplicativo web

---

## ✅ VALIDAÇÕES IMPORTANTES

### Campos Obrigatórios na Requisição:
- ✅ Tipo de Requisição
- ✅ Meta/Etapa
- ✅ Rubrica (seleção pela descrição, código preenchido automaticamente)
- ✅ Endereço de Entrega
- ✅ Justificativa da Forma de Avaliação (campo de texto longo)
- ✅ Pelo menos 1 item cadastrado

### Campos Obrigatórios por Item:
- ✅ Descrição Detalhada
- ✅ Unidade
- ✅ Quantidade (numérica, mínimo 0.01)
- ✅ Valor Unitário (numérica, mínimo 0.01)

### Regras de Negócio:
- ✅ Número gerado automaticamente no formato `001/2025`
- ✅ Data de cadastro = data atual (fuso MS)
- ✅ Projeto fixo, não editável
- ✅ Valor total calculado automaticamente
- ✅ Não pode editar após enviar (exceto se admin devolver para correção)
- ✅ Apenas admin pode aprovar/rejeitar
- ✅ Apenas cadastrador designado pode preencher dados FADEX

---

**Desenvolvido para o Projeto Teko Porã - IFMS**
**Versão: 1.0**
**Data: Janeiro 2025**
