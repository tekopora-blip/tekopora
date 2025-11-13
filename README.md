# Sistema de Requisições - Projeto Teko Porã

## 🌿 Sobre o Sistema

Sistema completo de gerenciamento de requisições para o Projeto Teko Porã com:
- ✅ Autenticação restrita para @ifms.edu.br
- ✅ Gestão de rubricas e saldos
- ✅ Fluxo de aprovação
- ✅ Controle de status (Rascunho, Pendente, Aprovado, Rejeitado)
- ✅ Geração de PDF

## 📁 Arquivos do Sistema

1. **index.html** - Tela de login e gerenciamento principal
2. **formulario_requisicao.html** - Formulário de cadastro de requisições

## 🚀 Como Usar

### Primeira Vez

1. Abra o arquivo `index.html` no navegador
2. Faça login com um e-mail @ifms.edu.br
3. Na primeira vez, o sistema criará automaticamente sua conta
4. Use a mesma senha nas próximas vezes

### Acesso Administrativo

**E-mail especial:** `teko.pora@ifms.edu.br`

Este e-mail tem poderes de administrador:
- ✅ Gerenciar saldos das rubricas
- ✅ Aprovar/devolver requisições
- ✅ Visualizar todas as requisições pendentes

### Usuários Comuns

Qualquer e-mail @ifms.edu.br pode:
- ✅ Criar novas requisições
- ✅ Salvar requisições como rascunho
- ✅ Enviar requisições para aprovação
- ✅ Visualizar suas próprias requisições
- ✅ Corrigir requisições devolvidas

## 📝 Fluxo de Trabalho

### 1. Criar Requisição (Usuário)
- Acesse "Nova Requisição"
- Preencha todos os campos obrigatórios
- Adicione os itens necessários
- **Opções:**
  - **Salvar Rascunho** - Pode editar depois
  - **Enviar** - Envia para aprovação (não pode mais editar)

### 2. Gerenciar Rubricas (Admin)
- Acesse "Gerenciar Rubricas"
- Selecione a rubrica desejada
- Informe o saldo total disponível
- Clique em "Atualizar Saldo"
- O sistema calcula automaticamente:
  - Saldo Disponível = Total - Utilizado

### 3. Aprovar/Devolver (Admin)
- Acesse "Aprovações"
- Visualize requisições pendentes
- **Opções:**
  - **Aprovar** - Requisição aprovada
  - **Devolver** - Volta para correção (informe motivo)

### 4. Corrigir (Usuário)
- Se devolvida, aparece em "Minhas Requisições"
- Status: REJEITADO
- Botão "Corrigir" disponível
- Após correção, pode reenviar

## 📊 Rubricas Cadastradas

O sistema já vem com 78 rubricas pré-cadastradas:

### Principais Categorias:
- **33.90.18** - BOLSA (5 tipos)
- **33.90.39** - OUTROS SERVIÇOS PESSOA JURÍDICA (5 tipos)
- **33.90.20** - BOLSAS PESQUISADOR (35 tipos)
- **33.90.14** - DIÁRIAS (1 tipo)
- **44.90.52** - EQUIPAMENTOS E MATERIAL PERMANENTE (27 tipos)
- **33.90.30** - MATERIAL DE CONSUMO (2 tipos)
- **33.90.33** - PASSAGENS E DESPESAS (1 tipo)
- **33.00.36** - SERVIÇOS PESSOA FÍSICA (1 tipo)
- **33.90.47** - OBRIGAÇÕES TRIBUTÁRIAS (1 tipo)

## 🔒 Segurança

- Acesso restrito apenas @ifms.edu.br
- Senhas armazenadas localmente (localStorage)
- Admin único: teko.pora@ifms.edu.br
- Requisições vinculadas ao usuário criador

## 💾 Armazenamento

O sistema usa **localStorage** do navegador para simular banco de dados:
- Usuários cadastrados
- Requisições criadas
- Saldos das rubricas
- Histórico de aprovações/rejeições

**Importante:** Os dados ficam salvos no navegador. Para produção real, é necessário implementar um backend com banco de dados real.

## 📄 Geração de PDF

O botão "Gerar PDF" cria um documento completo com:
- Dados gerais da requisição
- Todas as metas e informações
- Tabela resumida dos itens
- Detalhamento completo de cada item
- Observações

## 🌐 Publicação no GitHub Pages

Para publicar o sistema:

1. Faça upload dos 2 arquivos no GitHub:
   - index.html
   - formulario_requisicao.html

2. Vá em Settings → Pages

3. Configure a branch main

4. Acesse: `https://seu-usuario.github.io/seu-repo/index.html`

## 🔧 Customizações Futuras

Para implementar em produção real:

1. **Backend (Recomendado: Firebase, Node.js + MongoDB)**
   - Autenticação real
   - Banco de dados persistente
   - API REST

2. **E-mail Notifications**
   - Notificar usuário quando aprovado/devolvido
   - Notificar admin de novas requisições

3. **Relatórios**
   - Dashboard com gráficos
   - Exportação para Excel
   - Histórico completo

4. **Anexos**
   - Upload de documentos
   - Armazenamento em nuvem

## 📞 Suporte

Para dúvidas ou problemas:
- Contate: teko.pora@ifms.edu.br

---

**Desenvolvido para o Projeto Teko Porã - IFMS**
