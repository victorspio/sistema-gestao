# Casos de Teste — Sistema de Gestão de Ordens de Serviço

> **Projeto:** Sistema de Gestão OS  
> **Versão:** 1.0  
> **Autor:** [Seu Nome]  
> **Última atualização:** Setembro / 2026  

---

## Legenda de Status

| Símbolo | Status |
|:---:|--------|
| ✅ | Passou |
| ❌ | Falhou |
| ⚠️ | Bloqueado |
| 🔄 | Não executado |

---

## Legenda de Prioridade

| Símbolo | Prioridade |
|:---:|--------|
| 🔴 | Alta |
| 🟡 | Média |
| 🟢 | Baixa |

---

## Módulo 1 — Login e Autenticação

---

### CT-LOGIN-001 — Login com credenciais válidas

| Campo | Valor |
|-------|-------|
| **ID** | CT-LOGIN-001 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Usuário cadastrado no Firebase Auth |
| **Status** | 🔄 |

**Passos:**
1. Acessar `http://localhost:5173/login`
2. Preencher o campo **E-mail** com `teste@qa.portfolio.com`
3. Preencher o campo **Senha** com `QATest@2026`
4. Clicar em **Entrar**

**Resultado Esperado:**
- Usuário é redirecionado para `/dashboard`
- Dashboard exibe os indicadores do sistema
- Nenhuma mensagem de erro é exibida

---

### CT-LOGIN-002 — Login com senha incorreta

| Campo | Valor |
|-------|-------|
| **ID** | CT-LOGIN-002 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Usuário cadastrado no Firebase Auth |
| **Status** | 🔄 |

**Passos:**
1. Acessar `/login`
2. Preencher **E-mail** com `teste@qa.portfolio.com`
3. Preencher **Senha** com `senhaErrada123`
4. Clicar em **Entrar**

**Resultado Esperado:**
- Usuário **permanece** na tela de login
- Uma mensagem de erro é exibida (ex: "Credenciais inválidas" ou similar)
- Nenhuma navegação para dashboard ocorre

---

### CT-LOGIN-003 — Login com campos em branco

| Campo | Valor |
|-------|-------|
| **ID** | CT-LOGIN-003 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Nenhuma |
| **Status** | 🔄 |

**Passos:**
1. Acessar `/login`
2. Não preencher nenhum campo
3. Clicar em **Entrar**

**Resultado Esperado:**
- Mensagem de validação exibida para os campos obrigatórios
- Nenhuma chamada à API é realizada

---

### CT-LOGIN-004 — Acesso direto a rota protegida sem login

| Campo | Valor |
|-------|-------|
| **ID** | CT-LOGIN-004 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Usuário NÃO autenticado |
| **Status** | 🔄 |

**Passos:**
1. Sem estar logado, digitar na barra de endereço: `http://localhost:5173/dashboard`
2. Pressionar Enter

**Resultado Esperado:**
- Usuário é redirecionado para `/login`
- Nenhum dado sensível é exibido

---

### CT-LOGIN-005 — Logout

| Campo | Valor |
|-------|-------|
| **ID** | CT-LOGIN-005 |
| **Prioridade** | 🟡 Média |
| **Pré-condição** | Usuário autenticado |
| **Status** | 🔄 |

**Passos:**
1. Estar logado no sistema
2. Localizar a opção de sair/logout no menu ou avatar do usuário
3. Clicar em **Sair**

**Resultado Esperado:**
- Sessão encerrada
- Redirecionamento para `/login`
- Tentativa de voltar ao dashboard redireciona para `/login`

---

## Módulo 2 — Compras

> **Contexto:** Módulo com autocomplete de produtos recentemente implementado. Ao digitar no campo "Nome do Produto", o sistema sugere produtos já cadastrados no estoque. Ao selecionar, todos os campos são preenchidos automaticamente, **exceto a quantidade**.

---

### CT-COMPRA-001 — Registrar nova compra com produto do estoque (happy path)

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-001 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Pelo menos 1 produto cadastrado no estoque |
| **Status** | 🔄 |

**Passos:**
1. Acessar o módulo **Compras**
2. Clicar em **Nova Compra**
3. Preencher o campo **Fornecedor** com `Distribuidora ABC`
4. Confirmar que a **Data da Compra** já está preenchida com a data atual
5. No campo **Nome do Produto**, clicar (sem digitar nada)
6. Verificar se o dropdown aparece com produtos do estoque
7. Selecionar o primeiro produto da lista
8. Verificar se os campos **Categoria**, **Unidade de Compra**, **Unidade Base**, **Fator**, **Valor de Compra** e **Valor de Venda** foram preenchidos automaticamente
9. Verificar que o campo **Quantidade** está **em branco**
10. Preencher **Quantidade** com `5`
11. Verificar que o **Valor Total** foi calculado automaticamente
12. Selecionar **Forma de Pagamento** → `PIX`
13. Clicar em **Salvar Compra**

**Resultado Esperado:**
- Compra registrada com sucesso
- Mensagem de sucesso exibida (ou formulário fecha/recarrega)
- Compra aparece na lista com os dados corretos
- O estoque do produto aumenta na quantidade comprada

---

### CT-COMPRA-002 — Autocomplete filtra por texto digitado

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-002 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Pelo menos 2 produtos com nomes diferentes no estoque |
| **Status** | 🔄 |

**Passos:**
1. Abrir formulário de nova compra
2. No campo **Nome do Produto**, digitar as 3 primeiras letras de um produto existente (ex: `Cap`)
3. Observar o dropdown de sugestões

**Resultado Esperado:**
- Dropdown exibe apenas produtos cujo nome contém o texto digitado
- Produtos que não correspondem **não aparecem** na lista
- A busca é case-insensitive (maiúsculas e minúsculas funcionam igual)

---

### CT-COMPRA-003 — Campo Quantidade fica em branco ao selecionar produto

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-003 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Pelo menos 1 produto no estoque |
| **Status** | 🔄 |

**Passos:**
1. Abrir formulário de nova compra
2. No campo **Nome do Produto**, selecionar qualquer produto do dropdown

**Resultado Esperado:**
- O campo **Quantidade** permanece **vazio** / sem valor
- O badge **"Do Estoque"** aparece ao lado do label do produto
- O texto **"← informe quantos comprou"** aparece ao lado do label Quantidade

---

### CT-COMPRA-004 — Produto não encontrado no estoque

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-004 |
| **Prioridade** | 🟡 Média |
| **Pré-condição** | Nenhuma |
| **Status** | 🔄 |

**Passos:**
1. Abrir formulário de nova compra
2. No campo **Nome do Produto**, digitar um nome inexistente (ex: `ProdutoXXXZZZ`)

**Resultado Esperado:**
- Dropdown exibe mensagem: *"Nenhum produto encontrado — será cadastrado como novo"*
- Os campos permanecem em branco para preenchimento manual
- Não ocorre nenhum erro de JavaScript

---

### CT-COMPRA-005 — Tentativa de salvar compra sem fornecedor

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-005 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Nenhuma |
| **Status** | 🔄 |

**Passos:**
1. Abrir formulário de nova compra
2. Deixar o campo **Fornecedor** em branco
3. Preencher os demais campos com dados válidos
4. Clicar em **Salvar Compra**

**Resultado Esperado:**
- Compra **não é salva**
- Mensagem de validação exibida: *"Fornecedor é obrigatório"*
- Foco é direcionado para o campo com erro

---

### CT-COMPRA-006 — Tentativa de salvar compra sem quantidade

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-006 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Nenhuma |
| **Status** | 🔄 |

**Passos:**
1. Abrir formulário de nova compra
2. Preencher todos os campos, exceto **Quantidade**
3. Clicar em **Salvar Compra**

**Resultado Esperado:**
- Compra **não é salva**
- Mensagem de validação exibida: *"Quantidade é obrigatória"*

---

### CT-COMPRA-007 — Cálculo automático do Valor Total

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-007 |
| **Prioridade** | 🟡 Média |
| **Pré-condição** | Formulário de compra aberto |
| **Status** | 🔄 |

**Dados de entrada:**
- Quantidade: `10`
- Valor de Compra: `R$ 25,00`

**Passos:**
1. Preencher **Quantidade** com `10`
2. Preencher **Valor de Compra** com `25`
3. Observar o campo **Valor Total**

**Resultado Esperado:**
- Valor Total exibe automaticamente `R$ 250,00`
- Cálculo é feito em tempo real (sem necessidade de clicar em nada)

---

### CT-COMPRA-008 — Editar compra existente

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-008 |
| **Prioridade** | 🟡 Média |
| **Pré-condição** | Pelo menos 1 compra cadastrada |
| **Status** | 🔄 |

**Passos:**
1. Na lista de compras, localizar uma compra existente
2. Clicar no ícone de **Editar** (lápis)
3. Alterar o campo **Fornecedor**
4. Clicar em **Atualizar Compra**

**Resultado Esperado:**
- Compra atualizada com o novo fornecedor
- Registro na lista reflete a alteração

---

### CT-COMPRA-009 — Excluir compra

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-009 |
| **Prioridade** | 🟡 Média |
| **Pré-condição** | Pelo menos 1 compra cadastrada |
| **Status** | 🔄 |

**Passos:**
1. Na lista de compras, clicar no ícone de **Excluir** (lixeira)
2. Modal de confirmação é exibido
3. Clicar em **Excluir Compra**

**Resultado Esperado:**
- Modal fecha
- Compra removida da lista
- Nenhuma mensagem de erro

---

### CT-COMPRA-010 — Cancelar exclusão de compra

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-010 |
| **Prioridade** | 🟢 Baixa |
| **Pré-condição** | Modal de confirmação de exclusão aberto |
| **Status** | 🔄 |

**Passos:**
1. Abrir o modal de exclusão de uma compra
2. Clicar em **Cancelar**

**Resultado Esperado:**
- Modal fecha
- Compra **permanece** na lista

---

### CT-COMPRA-011 — Busca de compras por fornecedor

| Campo | Valor |
|-------|-------|
| **ID** | CT-COMPRA-011 |
| **Prioridade** | 🟡 Média |
| **Pré-condição** | Pelo menos 2 compras cadastradas de fornecedores diferentes |
| **Status** | 🔄 |

**Passos:**
1. Na tela de Compras, localizar a **barra de busca**
2. Digitar o nome de um fornecedor existente

**Resultado Esperado:**
- Lista filtrada exibe apenas compras do fornecedor buscado
- Compras de outros fornecedores ficam ocultas

---

## Módulo 3 — Estoque

---

### CT-ESTOQUE-001 — Cadastrar novo produto (happy path)

| Campo | Valor |
|-------|-------|
| **ID** | CT-ESTOQUE-001 |
| **Prioridade** | 🔴 Alta |
| **Status** | 🔄 |

**Dados de entrada:**
- Nome: `Capacitor 100uF 25V`
- Categoria: `Componentes Eletrônicos`
- Unidade: `un`
- Quantidade: `50`
- Preço de Compra: `R$ 0,50`
- Preço de Venda: `R$ 1,50`

**Passos:**
1. Acessar o módulo **Estoque**
2. Clicar em **Novo Produto**
3. Preencher todos os campos com os dados acima
4. Clicar em **Salvar**

**Resultado Esperado:**
- Produto cadastrado com sucesso
- Produto aparece na lista do estoque com os dados corretos

---

### CT-ESTOQUE-002 — Tentativa de cadastrar produto com nome duplicado

| Campo | Valor |
|-------|-------|
| **ID** | CT-ESTOQUE-002 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Produto "Capacitor 100uF 25V" já cadastrado |
| **Status** | 🔄 |

**Passos:**
1. Tentar cadastrar um segundo produto com o mesmo nome: `Capacitor 100uF 25V`

**Resultado Esperado:**
- Sistema bloqueia o cadastro
- Mensagem de erro: *"Já existe um produto cadastrado com o nome semelhante/idêntico"*

---

### CT-ESTOQUE-003 — Produto sem nome não pode ser salvo

| Campo | Valor |
|-------|-------|
| **ID** | CT-ESTOQUE-003 |
| **Prioridade** | 🔴 Alta |
| **Status** | 🔄 |

**Passos:**
1. Abrir formulário de novo produto
2. Deixar o campo **Nome** em branco
3. Preencher os demais campos
4. Clicar em **Salvar**

**Resultado Esperado:**
- Produto **não é salvo**
- Mensagem de validação exibida para o campo Nome

---

## Módulo 4 — Clientes

---

### CT-CLIENTE-001 — Cadastrar novo cliente (happy path)

| Campo | Valor |
|-------|-------|
| **ID** | CT-CLIENTE-001 |
| **Prioridade** | 🟡 Média |
| **Status** | 🔄 |

**Dados de entrada:**
- Nome: `João da Silva`
- Telefone: `(11) 99999-0001`
- E-mail: `joao@email.com`
- Endereço: `Rua das Flores, 100`

**Passos:**
1. Acessar o módulo **Clientes**
2. Clicar em **Novo Cliente**
3. Preencher os dados acima
4. Clicar em **Salvar**

**Resultado Esperado:**
- Cliente cadastrado e exibido na lista

---

### CT-CLIENTE-002 — Buscar cliente pelo nome

| Campo | Valor |
|-------|-------|
| **ID** | CT-CLIENTE-002 |
| **Prioridade** | 🟡 Média |
| **Pré-condição** | Clientes cadastrados |
| **Status** | 🔄 |

**Passos:**
1. Na tela de Clientes, digitar `João` na barra de busca

**Resultado Esperado:**
- Lista filtrada mostra apenas clientes com "João" no nome
- Busca insensível a maiúsculas/minúsculas

---

## Módulo 5 — Ordens de Serviço

---

### CT-OS-001 — Criar nova Ordem de Serviço (happy path)

| Campo | Valor |
|-------|-------|
| **ID** | CT-OS-001 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | Cliente e técnico cadastrados |
| **Status** | 🔄 |

**Dados de entrada:**
- Cliente: `João da Silva`
- Equipamento: `Notebook Dell`
- Problema: `Não liga`
- Técnico Responsável: `Carlos`
- Status: `Aberta`

**Passos:**
1. Acessar **Ordens de Serviço**
2. Clicar em **Nova OS**
3. Preencher os campos com os dados acima
4. Clicar em **Salvar**

**Resultado Esperado:**
- OS criada com número gerado automaticamente
- OS aparece na lista com status "Aberta"

---

### CT-OS-002 — Alterar status de OS de "Aberta" para "Concluída"

| Campo | Valor |
|-------|-------|
| **ID** | CT-OS-002 |
| **Prioridade** | 🔴 Alta |
| **Pré-condição** | OS com status "Aberta" cadastrada |
| **Status** | 🔄 |

**Passos:**
1. Localizar uma OS com status "Aberta"
2. Clicar em **Editar**
3. Alterar o status para `Concluída`
4. Clicar em **Salvar**

**Resultado Esperado:**
- OS atualizada com status "Concluída"
- Badge de status muda visualmente na lista

---

## Módulo 6 — Interface e Usabilidade

---

### CT-UI-001 — Responsividade em tela mobile

| Campo | Valor |
|-------|-------|
| **ID** | CT-UI-001 |
| **Prioridade** | 🟡 Média |
| **Status** | 🔄 |

**Passos:**
1. Abrir o DevTools do Chrome (`F12`)
2. Ativar o modo responsivo (ícone de celular)
3. Selecionar o dispositivo `iPhone SE` (375×667)
4. Navegar por todos os módulos

**Resultado Esperado:**
- Menus se adaptam para versão mobile
- Tabelas usam layout de cards em telas pequenas
- Nenhum elemento ultrapassa os limites da tela

---

### CT-UI-002 — Alternância entre tema claro e escuro

| Campo | Valor |
|-------|-------|
| **ID** | CT-UI-002 |
| **Prioridade** | 🟢 Baixa |
| **Status** | 🔄 |

**Passos:**
1. Localizar o botão de alternância de tema
2. Clicar para ativar o **tema escuro**
3. Navegar por pelo menos 3 módulos diferentes
4. Retornar ao **tema claro**

**Resultado Esperado:**
- Tema muda sem necessidade de recarregar a página
- Todos os textos permanecem legíveis nos dois temas
- Preferência é mantida ao navegar entre módulos

---

*Documento gerado em 26/09/2026 | Total de casos: 22*
