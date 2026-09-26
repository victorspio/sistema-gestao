# 🔍 Documentação de QA — Sistema de Gestão OS

> **Para recrutadores e avaliadores:** esta seção documenta o trabalho de Garantia de Qualidade (QA) realizado neste projeto. Aqui você encontrará evidências do processo de teste, metodologia aplicada e os resultados obtidos.

---

## Sobre o Projeto

O **Sistema de Gestão de Ordens de Serviço** é uma aplicação web completa desenvolvida com **React + Firebase**, voltada ao gerenciamento de pequenas e médias empresas de assistência técnica. O sistema contempla 12 módulos funcionais:

| Módulo | Descrição |
|--------|-----------|
| 🔐 Login | Autenticação com Firebase Auth |
| 📊 Dashboard | KPIs e indicadores em tempo real |
| 👥 Clientes | Cadastro e gestão de clientes |
| 🛠️ Ordens de Serviço | Core do negócio — abertura, acompanhamento e encerramento |
| 📋 Orçamentos | Geração e controle de propostas comerciais |
| 📦 Estoque | Controle de produtos e quantidades |
| 🛒 Compras | Registro de compras com autocomplete inteligente |
| 💰 Vendas | Registro de vendas de produtos |
| 💳 Financeiro | Entradas, saídas e fluxo de caixa |
| 📈 Relatórios | Geração de PDF para OS e orçamentos |
| 🔧 Equipamentos | Cadastro de equipamentos dos clientes |
| 👨‍🔧 Técnicos | Cadastro de técnicos responsáveis |

---

## 📂 Documentação de QA

| Documento | Descrição | Link |
|-----------|-----------|------|
| 📋 Plano de Testes | Estratégia, escopo, riscos e critérios | [plano-de-testes.md](./plano-de-testes.md) |
| ✅ Casos de Teste | 22 casos detalhados com passos e resultados esperados | [casos-de-teste.md](./casos-de-teste.md) |
| 🐛 Relatório de Bugs | 5 bugs documentados com causa raiz e correção | [relatorio-de-bugs.md](./relatorio-de-bugs.md) |
| 📊 Cobertura de Testes | Mapa de cobertura por módulo e funcionalidade | [cobertura-de-testes.md](./cobertura-de-testes.md) |

---

## 🧪 Metodologia Aplicada

### Tipos de teste executados
- ✅ **Teste Funcional** — verificação de regras de negócio
- ✅ **Teste de Interface (UI)** — consistência visual e responsividade
- ✅ **Teste Negativo** — comportamento com dados inválidos
- ✅ **Teste de Fronteira** — limites de campos e valores extremos
- ✅ **Teste de Regressão** — validação após correções de bugs

### Técnicas utilizadas
- **Partição de Equivalência:** agrupamento de entradas em classes válidas e inválidas
- **Valor Limite:** teste nos extremos dos campos numéricos (0, negativo, máximo)
- **Tabela de Decisão:** mapeamento de combinações de entradas e saídas esperadas para validações de formulário

---

## 📊 Cobertura de Testes por Módulo

| Módulo | Casos de Teste | Funcionalidades Cobertas | Cobertura |
|--------|:--------------:|--------------------------|:---------:|
| Login | 5 | Login válido, senha errada, campos vazios, rota protegida, logout | 🟢 Alta |
| Compras | 11 | CRUD completo + autocomplete + validações | 🟢 Alta |
| Estoque | 3 | Cadastro, duplicata, campo obrigatório | 🟡 Média |
| Clientes | 2 | Cadastro, busca | 🟡 Média |
| Ordens de Serviço | 2 | Criação, mudança de status | 🟡 Média |
| Interface / UI | 2 | Mobile, tema escuro | 🟡 Média |
| Orçamentos | 0 | — | 🔴 Não coberto |
| Financeiro | 0 | — | 🔴 Não coberto |
| Relatórios | 0 | — | 🔴 Não coberto |

> **Nota:** Os módulos não cobertos estão identificados e seriam priorizados em um próximo ciclo de testes. A documentação das lacunas de cobertura é parte importante do trabalho de QA.

---

## 🐛 Bugs Encontrados e Corrigidos

Durante o ciclo de testes, **5 bugs** foram identificados e documentados:

| ID | Módulo | Título (resumo) | Severidade | Status |
|----|--------|-----------------|:----------:|--------|
| BUG-001 | Compras | Quantidade preenchida automaticamente ao selecionar produto | 🟡 Médio | ✅ Corrigido |
| BUG-002 | Compras | Dropdown fecha antes do item ser clicado (bug de blur) | 🟠 Alto | ✅ Corrigido |
| BUG-003 | Compras | Dropdown não abre com campo vazio ao focar | 🟡 Médio | ✅ Corrigido |
| BUG-004 | Compras | Baixo contraste no dropdown em dark mode | 🟢 Baixo | 📋 Aberto |
| BUG-005 | Compras | Badge "Do Estoque" desincronizado após remover item | 🟡 Médio | 📋 Aberto |

**Detalhe completo:** [relatorio-de-bugs.md](./relatorio-de-bugs.md)

---

## 🛠️ Stack Tecnológica do Sistema

| Tecnologia | Uso |
|------------|-----|
| React 18 | Framework de interface |
| Vite | Bundler e servidor de desenvolvimento |
| Firebase Firestore | Banco de dados NoSQL em nuvem |
| Firebase Auth | Autenticação de usuários |
| React Hook Form + Zod | Formulários e validação |
| TailwindCSS | Estilização |
| Lucide React | Ícones |
| jsPDF | Geração de PDFs |

---

## 🎯 Competências Demonstradas neste Projeto

Como **Analista de QA**, este projeto evidencia as seguintes habilidades:

### Planejamento
- ✅ Elaboração de Plano de Testes com escopo, objetivos, critérios e riscos
- ✅ Priorização de módulos por criticidade de negócio
- ✅ Identificação e documentação de riscos do projeto

### Execução de Testes
- ✅ Escrita de casos de teste claros com ID, pré-condições, passos e resultado esperado
- ✅ Teste de fluxos positivos (happy path) e negativos (sad path)
- ✅ Teste de validações de formulário e campos obrigatórios
- ✅ Teste de interface em diferentes resoluções

### Documentação de Bugs
- ✅ Relatório de bugs com severidade, prioridade e status
- ✅ Identificação de causa raiz dos defeitos
- ✅ Sugestão de correção técnica para os bugs encontrados
- ✅ Ciclo completo: abertura → correção → reteste → fechamento

### Raciocínio Analítico
- ✅ Identificação de bugs de UX (ex: dropdown que fechava antes do clique)
- ✅ Percepção de comportamento inesperado (campo sendo preenchido quando não deveria)
- ✅ Mapeamento de lacunas de cobertura

---

## 📞 Contato

**[Seu Nome]**  
Analista de QA em formação  
📧 [seuemail@email.com]  
💼 [linkedin.com/in/seulinkedin]  
🐙 [github.com/seuusuario]

---

*Documentação gerada em Setembro de 2026*
