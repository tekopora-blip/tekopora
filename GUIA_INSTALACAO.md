# 🚀 GUIA DE INSTALAÇÃO COMPLETO
## Sistema de Requisições de Compra - Projeto Teko Porã

---

## 📋 PRÉ-REQUISITOS

- Conta Google (@ifms.edu.br ou domínio institucional)
- Acesso ao Google Drive
- Permissões para criar Google Sheets e Apps Script

---

## 🎯 PASSO 1: CRIAR PLANILHA NO GOOGLE SHEETS

### 1.1. Criar Nova Planilha

1. Acesse https://sheets.google.com
2. Clique em **+ Criar novo** → **Planilha em branco**
3. Nomeie a planilha como: **REQ_Teko_Pora**

### 1.2. Criar Abas

Crie 9 abas na planilha com os seguintes nomes exatos:

1. **Config**
2. **Usuarios**
3. **Metas**
4. **Rubricas**
5. **Enderecos**
6. **Numeracao**
7. **Requisicoes**
8. **Itens**
9. **Logs**

**Como criar abas:**
- No rodapé da planilha, clique no **+** para adicionar nova aba
- Renomeie cada aba clicando com botão direito → **Renomear**

---

## 🎯 PASSO 2: CRIAR APPS SCRIPT

### 2.1. Acessar Editor de Scripts

1. Na planilha **REQ_Teko_Pora**, vá em **Extensões** → **Apps Script**
2. Uma nova aba abrirá com o editor de código

### 2.2. Criar Arquivo Code.gs

1. No editor, você verá um arquivo **Code.gs** padrão
2. **Apague todo o conteúdo** do arquivo padrão
3. Copie **TODO o conteúdo** do arquivo `Code.gs` deste repositório
4. Cole no editor
5. Clique em **Salvar** (ícone de disquete) ou `Ctrl+S`

### 2.3. Criar Arquivo Index.html

1. No editor de Apps Script, clique em **+** ao lado de "Arquivos"
2. Selecione **HTML**
3. Nomeie como: **Index**
4. Copie **TODO o conteúdo** do arquivo `Index.html` deste repositório
5. Cole no editor
6. Clique em **Salvar**

### 2.4. Renomear Projeto

1. No topo do editor, clique em "Projeto sem título"
2. Renomeie para: **Sistema Requisições Teko Porã**
3. Clique em **OK**

---

## 🎯 PASSO 3: EXECUTAR SETUP INICIAL

### 3.1. Executar Função setupInicial()

1. No editor de Apps Script, certifique-se que o arquivo **Code.gs** está aberto
2. Na barra superior, encontre o dropdown de funções
3. Selecione a função: **setupInicial**
4. Clique no botão **Executar** (▶️ Play)

### 3.2. Autorizar Execução

**IMPORTANTE:** Na primeira execução, o Google solicitará autorização:

1. Aparecerá: "Autorização necessária"
2. Clique em **Analisar permissões**
3. Selecione sua conta do Google
4. Aparecerá um aviso: "Google não verificou este app"
5. Clique em **Avançado**
6. Clique em **Ir para Sistema Requisições Teko Porã (não seguro)**
7. Clique em **Permitir**

### 3.3. Verificar Execução

1. Aguarde a execução (pode levar alguns segundos)
2. No rodapé do editor, aparecerá: "Execução concluída"
3. Vá até a **aba Logs** (menu **Visualizar** → **Logs**)
4. Deve aparecer: "Setup inicial concluído com sucesso!"

### 3.4. Verificar Planilha

Volte para a planilha e verifique se:

- ✅ Aba **Config** possui 5 linhas de configuração
- ✅ Aba **Usuarios** possui cabeçalho + 4 usuários
- ✅ Aba **Metas** possui cabeçalho + 9 metas
- ✅ Aba **Rubricas** possui cabeçalho + 9 rubricas
- ✅ Demais abas possuem cabeçalhos criados

---

## 🎯 PASSO 4: IMPLANTAR APLICATIVO WEB

### 4.1. Criar Nova Implantação

1. No editor de Apps Script, clique em **Implantar** (canto superior direito)
2. Selecione **Nova implantação**

### 4.2. Configurar Implantação

1. Clique no ícone de **engrenagem** ⚙️ ao lado de "Selecionar tipo"
2. Selecione **Aplicativo da Web**

3. Preencha as configurações:
   - **Descrição:** Sistema de Requisições Teko Porã v1.0
   - **Executar como:** **Eu (seu-email@ifms.edu.br)**
   - **Quem tem acesso:**
     - **Opção 1 (Recomendado):** "Qualquer pessoa da organização" (apenas domínio @ifms.edu.br)
     - **Opção 2:** "Qualquer pessoa" (se precisar acesso externo)

4. Clique em **Implantar**

### 4.3. Autorizar Novamente

1. Se solicitado, clique em **Autorizar acesso**
2. Selecione sua conta
3. Clique em **Permitir**

### 4.4. Copiar URL do Aplicativo

1. Aparecerá a mensagem: "Nova implantação criada com sucesso"
2. **COPIE O URL** que aparece (algo como: https://script.google.com/macros/s/XXXXXXXX/exec)
3. **GUARDE ESTE URL** - é o endereço do seu sistema!
4. Clique em **Concluído**

---

## 🎯 PASSO 5: CONFIGURAR DADOS INICIAIS

### 5.1. Configurar Aba Config

Abra a aba **Config** da planilha e **verifique/ajuste** os valores:

| Chave | Valor | Descrição |
|-------|-------|-----------|
| PROJETO | 11986-5 - CONTRATO N° 62/2024 - PROJETO TEKO PORÃ | Nome do projeto (fixo) |
| EMAIL_ADMIN | teko.pora@ifms.edu.br | Email do administrador |
| EMAIL_CC_ADMIN | fernando.alves@ifms.edu.br | Email com cópia |
| EMAIL_COORDENADOR | teko.pora@ifms.edu.br | Email do coordenador |
| FUSO_HORARIO | America/Campo_Grande | Fuso horário de MS |

### 5.2. Configurar Aba Usuarios

A aba **Usuarios** já vem pré-configurada com:

- **Admin:** teko.pora@ifms.edu.br
- **Cadastradores:**
  - laryssa.brasil.tp@ifms.edu.br
  - sonia.biron.tp@ifms.edu.br
  - angela.schwingel.tp@ifms.edu.br

**Para adicionar novos usuários:**

1. Adicione nova linha com:
   - Email completo (@ifms.edu.br)
   - Nome do usuário
   - Perfil: `REQUISITANTE`, `CADASTRADOR` ou `ADMIN`
   - Ativo: `TRUE` ou `FALSE`

### 5.3. Cadastrar Endereços Padrão

Na aba **Enderecos**, adicione pelo menos um endereço padrão:

Exemplo:

| ID | Nome | Logradouro | Numero | Bairro | Cidade | UF | CEP | Complemento | Ativo |
|----|------|------------|--------|--------|--------|-----|-----|-------------|-------|
| 1 | IFMS Campus | Rua Ceará | 333 | Centro | Dourados | MS | 79804-090 | | TRUE |

---

## 🎯 PASSO 6: TESTAR O SISTEMA

### 6.1. Acessar o Sistema

1. Abra uma **nova aba anônima/privada** do navegador
2. Cole o **URL do aplicativo** copiado no Passo 4.4
3. Faça login com uma conta @ifms.edu.br

### 6.2. Testar Como Administrador

1. Acesse com: **teko.pora@ifms.edu.br**
2. Você deve ver:
   - Seção "Minhas Requisições"
   - Seção "Painel do Administrador"

### 6.3. Testar Criação de Requisição

1. Clique em **+ Nova Requisição**
2. Preencha todos os campos obrigatórios (marcados com *)
3. Adicione pelo menos 1 item
4. Clique em **💾 Salvar Rascunho**
5. Verifique se aparece mensagem de sucesso

### 6.4. Testar Envio de Requisição

1. Na requisição criada, clique em **📤 Salvar e Enviar**
2. Confirme o envio
3. **Verifique no email** teko.pora@ifms.edu.br:
   - Deve ter recebido e-mail de "Nova requisição"
   - Email com cópia para fernando.alves@ifms.edu.br

### 6.5. Testar Aprovação (Admin)

1. No Painel do Administrador, localize a requisição
2. Clique em **⚖️ Avaliar**
3. Selecione um cadastrador
4. Clique em **✅ Aprovar**
5. **Verifique no email do cadastrador:**
   - Deve ter recebido e-mail de "Requisição aprovada"

### 6.6. Testar Cadastrador

1. Faça login com um email de cadastrador
2. Você deve ver a requisição aprovada
3. Clique em **📝 Cadastrar FADEX**
4. Preencha Número WEB e Protocolo
5. Clique em **💾 Salvar Dados**
6. Clique em **📤 Enviar para Autorização**
7. **Verifique no email do coordenador:**
   - Deve ter recebido e-mail solicitando autorização

---

## ✅ CHECKLIST DE INSTALAÇÃO

Use este checklist para garantir que tudo foi instalado corretamente:

- [ ] Planilha **REQ_Teko_Pora** criada
- [ ] 9 abas criadas com nomes corretos
- [ ] Arquivo **Code.gs** criado e salvo
- [ ] Arquivo **Index.html** criado e salvo
- [ ] Função **setupInicial()** executada com sucesso
- [ ] Todas as abas possuem cabeçalhos e dados iniciais
- [ ] Aplicativo web implantado
- [ ] URL do aplicativo copiado e guardado
- [ ] Aba **Config** verificada e ajustada
- [ ] Usuários configurados na aba **Usuarios**
- [ ] Pelo menos 1 endereço cadastrado
- [ ] Teste de login realizado com sucesso
- [ ] Teste de criação de requisição realizado
- [ ] Teste de envio de requisição realizado
- [ ] E-mails sendo recebidos corretamente
- [ ] Teste completo do fluxo (criação → envio → aprovação → cadastro FADEX → autorização)

---

## 🛠️ CONFIGURAÇÕES AVANÇADAS (OPCIONAL)

### Compartilhar Planilha com Equipe

1. Na planilha, clique em **Compartilhar** (canto superior direito)
2. Adicione emails de usuários que precisam ter acesso direto aos dados
3. Defina permissão: **Editor** ou **Visualizador**

**IMPORTANTE:** Não é necessário compartilhar a planilha para usar o sistema. Apenas compartilhe com pessoas que precisam editar dados diretamente.

### Criar Atalho no Google Drive

1. No Google Drive, localize a planilha **REQ_Teko_Pora**
2. Clique com botão direito → **Adicionar atalho ao Drive**
3. Escolha uma pasta (ex: "Teko Porã")

### Adicionar aos Favoritos

1. Acesse o URL do aplicativo web
2. Adicione aos favoritos do navegador
3. Renomeie para: "Sistema de Requisições Teko Porã"

---

## 🔧 ATUALIZAÇÕES FUTURAS

### Como Atualizar o Código

Se precisar atualizar o sistema no futuro:

1. Acesse **Extensões** → **Apps Script**
2. Edite os arquivos necessários
3. Clique em **Salvar**
4. Vá em **Implantar** → **Gerenciar implantações**
5. Clique no ícone de **lápis** ✏️ na implantação ativa
6. Em **Versão**, selecione **Nova versão**
7. Adicione descrição da atualização
8. Clique em **Implantar**

**IMPORTANTE:** O URL do aplicativo permanece o mesmo após atualizações!

---

## 📞 SUPORTE E CONTATO

Em caso de dúvidas ou problemas:

- **Email de suporte:** teko.pora@ifms.edu.br
- **Responsável técnico:** Fernando Alves (fernando.alves@ifms.edu.br)

---

## 📚 DOCUMENTAÇÃO ADICIONAL

Consulte também:

- **ESTRUTURA_PLANILHA.md** - Detalhes completos da estrutura
- **README.md** - Visão geral do sistema
- **Code.gs** - Código-fonte comentado
- **Index.html** - Interface do sistema

---

**Desenvolvido para o Programa Teko Porã - IFMS**
**Versão: 2.0**
**Data: Janeiro 2025**

---

## 🎉 INSTALAÇÃO CONCLUÍDA!

Se todos os passos foram seguidos corretamente, seu sistema está pronto para uso!

Acesse o sistema através do URL do aplicativo e comece a criar suas requisições de compra.

**Bom trabalho! 🚀**
