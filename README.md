# 🌿 Sistema de Requisições de Compra - Programa Teko Porã

Sistema completo de gerenciamento de requisições de compras desenvolvido em Google Apps Script para o Programa Teko Porã do IFMS (Instituto Federal de Mato Grosso do Sul).

![Status](https://img.shields.io/badge/status-ativo-success)
![Versão](https://img.shields.io/badge/versão-2.0-blue)
![Plataforma](https://img.shields.io/badge/plataforma-Google%20Apps%20Script-yellow)

---

## 📋 Sobre o Sistema

O Sistema de Requisições de Compra foi desenvolvido para automatizar e gerenciar todo o fluxo de requisições do Programa Teko Porã, desde a criação da requisição pelo solicitante até a autorização final no portal FADEX.

### Principais Funcionalidades

✅ **Gestão Completa de Requisições**
- 5 tipos de requisições suportadas
- Numeração automática (001/2025)
- Cadastro ilimitado de itens por requisição
- Validações automáticas de campos obrigatórios

✅ **Workflow de Aprovação**
- Status rastreáveis (Rascunho → Enviada → Aprovada → Cadastrada → Autorizada)
- Aprovação/rejeição pelo administrador
- Solicitação de correções
- Histórico completo em logs

✅ **Notificações Inteligentes**
- E-mails HTML formatados e profissionais
- Notificações automáticas em cada etapa
- Assuntos únicos para fácil identificação

✅ **Integração FADEX**
- Cadastradores especializados
- Registro de Número WEB e Protocolo
- Upload de comprovantes
- Envio para autorização do coordenador

✅ **Segurança e Controle**
- 3 níveis de acesso (Admin, Requisitante, Cadastrador)
- Usuários cadastrados previamente
- Logs de todas as ações
- Proteção contra edição após envio

---

## 🎯 Tipos de Requisições

O sistema suporta 5 tipos de requisições de compra:

1. **Material de Consumo**
2. **Material Permanente**
3. **Serviços de Pessoa Jurídica**
4. **Compra de Passagens**
5. **Reembolso de Compras**

---

## 👥 Perfis de Usuário

### 🔐 Administrador
**Email:** teko.pora@ifms.edu.br

**Permissões:**
- Visualizar todas as requisições
- Aprovar/Rejeitar requisições
- Solicitar correções
- Atribuir cadastradores
- Criar requisições (opcional)

### 👤 Requisitante
**Qualquer usuário @ifms.edu.br cadastrado**

**Permissões:**
- Criar novas requisições
- Salvar como rascunho
- Enviar para aprovação
- Editar requisições em Rascunho ou Em Correção
- Visualizar próprias requisições

### 📝 Cadastrador FADEX
**Usuários específicos:**
- laryssa.brasil.tp@ifms.edu.br
- sonia.biron.tp@ifms.edu.br
- angela.schwingel.tp@ifms.edu.br

**Permissões:**
- Visualizar requisições aprovadas atribuídas
- Preencher dados do portal FADEX (Número WEB, Protocolo)
- Upload de comprovantes
- Enviar para autorização do coordenador

---

## 🔄 Fluxo do Sistema

```
┌─────────────────┐
│  Requisitante   │
│  Cria Requisição│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    RASCUNHO     │ ◄─┐
│ (pode editar)   │   │
└────────┬────────┘   │
         │            │
         │ Enviar     │
         ▼            │
┌─────────────────┐   │
│     ENVIADA     │   │
│  (não edita)    │   │
└────────┬────────┘   │
         │            │
    Administrador     │
    avalia            │
         │            │
         ├──Aprovar───┼──Rejeitar──┐
         │            │            │
         │    Solicitar Correção   │
         │            └────────────┤
         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│    APROVADA     │      │  EM CORREÇÃO    │
│                 │      │  (pode editar)  │
└────────┬────────┘      └─────────────────┘
         │
    Cadastrador
    preenche FADEX
         │
         ▼
┌─────────────────┐
│   CADASTRADA    │
│  (dados FADEX)  │
└────────┬────────┘
         │
         │ Enviar Autorização
         ▼
┌─────────────────┐
│ENVIADA AUTORIZAÇÃO│
│  (coordenador)  │
└─────────────────┘
```

---

## 📧 Notificações por E-mail

O sistema envia e-mails automáticos HTML formatados em 4 situações:

### 1. Nova Requisição Enviada
- **Para:** teko.pora@ifms.edu.br
- **CC:** fernando.alves@ifms.edu.br
- **Quando:** Requisitante envia requisição

### 2. Requisição Aprovada
- **Para:** Cadastrador designado
- **CC:** teko.pora@ifms.edu.br
- **Quando:** Admin aprova requisição

### 3. Requisição Rejeitada/Em Correção
- **Para:** Requisitante
- **CC:** teko.pora@ifms.edu.br
- **Quando:** Admin rejeita ou solicita correção

### 4. Requisição Cadastrada FADEX
- **Para:** teko.pora@ifms.edu.br (coordenador)
- **CC:** teko.pora@ifms.edu.br
- **Quando:** Cadastrador envia para autorização

---

## 📦 Estrutura de Arquivos

```
tekopora/
├── Code.gs                      # Código principal do sistema
├── Index.html                   # Interface web do sistema
├── ESTRUTURA_PLANILHA.md       # Documentação completa da planilha
├── GUIA_INSTALACAO.md          # Guia passo a passo de instalação
└── README.md                    # Este arquivo
```

---

## 🚀 Instalação Rápida

### Pré-requisitos
- Conta Google @ifms.edu.br
- Acesso ao Google Drive
- Permissões para criar Google Sheets

### Passos Básicos

1. **Criar Google Sheets** com nome `REQ_Teko_Pora`
2. **Criar 9 abas:** Config, Usuarios, Metas, Rubricas, Enderecos, Numeracao, Requisicoes, Itens, Logs
3. **Acessar Apps Script:** Extensões → Apps Script
4. **Criar arquivos:**
   - Code.gs (copiar código do repositório)
   - Index.html (copiar código do repositório)
5. **Executar função** `setupInicial()` uma vez
6. **Implantar como Aplicativo Web**
7. **Acessar URL** gerado

📖 **Para instruções detalhadas, consulte: [GUIA_INSTALACAO.md](GUIA_INSTALACAO.md)**

---

## 📊 Estrutura da Planilha

O sistema utiliza uma planilha Google Sheets com 9 abas:

| Aba | Descrição |
|-----|-----------|
| **Config** | Configurações gerais (emails, projeto, fuso horário) |
| **Usuarios** | Cadastro de usuários e perfis |
| **Metas** | 9 metas do Programa Teko Porã |
| **Rubricas** | Rubricas orçamentárias |
| **Enderecos** | Endereços de entrega cadastrados |
| **Numeracao** | Controle de numeração das requisições |
| **Requisicoes** | Armazena todas as requisições (33 colunas) |
| **Itens** | Itens de cada requisição |
| **Logs** | Registro de todas as ações do sistema |

📖 **Para detalhes completos, consulte: [ESTRUTURA_PLANILHA.md](ESTRUTURA_PLANILHA.md)**

---

## 🎨 Interface do Sistema

A interface é moderna, responsiva e intuitiva:

- **Design Clean:** Interface profissional com cores institucionais
- **Responsivo:** Funciona em desktop, tablet e celular
- **Modais:** Formulários em janelas modais para melhor UX
- **Validações em Tempo Real:** Feedback imediato ao usuário
- **Tabelas Responsivas:** Adaptam-se a diferentes tamanhos de tela

---

## 🔐 Segurança

- ✅ Acesso restrito a usuários cadastrados
- ✅ Validação de perfis de acesso
- ✅ Proteção contra edição não autorizada
- ✅ Escape de HTML para prevenir XSS
- ✅ Validação de dados no servidor
- ✅ Logs de auditoria de todas as ações

---

## 📝 Campos da Requisição

### Campos Obrigatórios:
- ✅ Tipo de Requisição
- ✅ Meta/Etapa
- ✅ Rubrica (seleção pela descrição)
- ✅ Endereço de Entrega
- ✅ Justificativa da Forma de Avaliação
- ✅ Pelo menos 1 item

### Campos por Item (Obrigatórios):
- ✅ Descrição Detalhada
- ✅ Unidade (un, kg, m, etc.)
- ✅ Quantidade (numérica, 2 casas decimais)
- ✅ Valor Unitário (numérica, 2 casas decimais)

### Campos Calculados Automaticamente:
- 🔢 Número da Requisição (001/2025)
- 🔢 Código da Rubrica
- 🔢 Valor Total do Item (Quantidade × Valor Unitário)
- 📅 Data de Cadastro
- 📅 Data de Última Atualização

---

## 🌟 Diferenciais do Sistema

### Para o Requisitante
- Interface intuitiva e fácil de usar
- Salvar rascunhos e continuar depois
- Adicionar quantos itens quiser
- Upload de documentos anexos via links
- Feedback claro sobre status da requisição

### Para o Administrador
- Visão completa de todas as requisições
- Filtros por status
- Aprovação/rejeição com justificativa
- Atribuição automática de cadastradores
- Notificações por e-mail

### Para o Cadastrador
- Lista apenas de requisições atribuídas
- Interface específica para cadastro FADEX
- Controle de Número WEB e Protocolo
- Upload de comprovantes
- Notificação ao coordenador

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Google Apps Script (JavaScript)
- **Frontend:** HTML5 + CSS3 + JavaScript
- **Banco de Dados:** Google Sheets
- **E-mail:** Gmail API (MailApp)
- **Hospedagem:** Google Apps Script Web App

---

## 📈 Roadmap Futuro

Possíveis melhorias para versões futuras:

- [ ] Dashboard com gráficos e estatísticas
- [ ] Exportação para PDF das requisições
- [ ] Upload direto de arquivos (via Google Drive)
- [ ] Relatórios gerenciais
- [ ] Integração direta com API FADEX
- [ ] App mobile (PWA)
- [ ] Assinatura digital
- [ ] Controle de orçamento por rubrica

---

## 👨‍💻 Desenvolvimento

### Estrutura do Código

O código é organizado em seções lógicas:

**Code.gs:**
- Constantes e configurações
- Funções utilitárias
- Gerenciamento de usuários
- CRUD de requisições
- Workflow de aprovação
- Envio de e-mails
- Setup inicial

**Index.html:**
- Estilos CSS (responsivo)
- Interface HTML (modais, tabelas, formulários)
- JavaScript (lógica client-side)
- Integração com Google Apps Script

### Padrões de Código

- ✅ Código comentado e documentado
- ✅ Funções com JSDoc
- ✅ Validações client-side e server-side
- ✅ Tratamento de erros
- ✅ Escape de HTML
- ✅ Locks para evitar race conditions
- ✅ Logs de auditoria

---

## 📞 Suporte

Em caso de dúvidas, problemas ou sugestões:

- **Email:** teko.pora@ifms.edu.br
- **Responsável Técnico:** fernando.alves@ifms.edu.br

---

## 📄 Licença

Este sistema foi desenvolvido exclusivamente para o Programa Teko Porã do IFMS.

---

## 🙏 Agradecimentos

Desenvolvido para apoiar o importante trabalho do **Programa Teko Porã** em prol das comunidades indígenas de Mato Grosso do Sul.

---

## 📚 Documentação Completa

- 📖 [GUIA_INSTALACAO.md](GUIA_INSTALACAO.md) - Instalação passo a passo
- 📖 [ESTRUTURA_PLANILHA.md](ESTRUTURA_PLANILHA.md) - Estrutura completa da planilha
- 💻 [Code.gs](Code.gs) - Código backend comentado
- 🎨 [Index.html](Index.html) - Interface web

---

**Desenvolvido com ❤️ para o Programa Teko Porã - IFMS**

**Versão 2.0 | Janeiro 2025**

---

## 🚀 Quick Start

```bash
# 1. Crie a planilha REQ_Teko_Pora no Google Sheets
# 2. Crie as 9 abas necessárias
# 3. Acesse Extensões → Apps Script
# 4. Crie Code.gs e Index.html
# 5. Execute setupInicial()
# 6. Implante como Aplicativo Web
# 7. Acesse o URL e comece a usar!
```

✅ **Sistema pronto para produção!**
