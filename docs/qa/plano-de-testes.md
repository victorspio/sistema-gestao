# Plano de Testes — Sistema de Gestão de Ordens de Serviço

> **Projeto:** Sistema de Gestão OS  
> **Versão do documento:** 1.0  
> **Elaborado por:** [Seu Nome]  
> **Data:** Setembro / 2026  
> **Tipo de teste:** Manual  
> **Ferramenta de gestão:** Planilha / Markdown  

---

## 1. Introdução

Este documento descreve o planejamento das atividades de teste do **Sistema de Gestão de Ordens de Serviço**, uma aplicação web desenvolvida em **React + Firebase** voltada ao gerenciamento de clientes, equipamentos, ordens de serviço, orçamentos, estoque, compras, vendas e financeiro de pequenas e médias empresas de assistência técnica.

O objetivo deste Plano de Testes é garantir que as funcionalidades principais do sistema atendam aos requisitos esperados, antes de qualquer entrega ou demonstração.

---

## 2. Escopo

### ✅ Módulos **dentro** do escopo

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | Login | Autenticação com Firebase Auth |
| 2 | Dashboard | Exibição de KPIs e indicadores gerais |
| 3 | Clientes | CRUD de clientes |
| 4 | Equipamentos | Cadastro e vinculação a clientes |
| 5 | Técnicos | Cadastro de técnicos |
| 6 | Ordens de Serviço | Criação, edição, exclusão e acompanhamento de OS |
| 7 | Orçamentos | Geração e controle de orçamentos |
| 8 | Estoque | Gestão de produtos e quantidades |
| 9 | Compras | Registro de compras com autocomplete de produtos |
| 10 | Vendas | Registro de vendas de produtos |
| 11 | Financeiro | Controle de entradas e saídas |
| 12 | Relatórios | Geração de relatórios em PDF |

### ❌ Módulos **fora** do escopo (nesta versão)

- Integração com APIs externas de pagamento
- Módulo de importação de Nota Fiscal Eletrônica (NF-e) — cobertura parcial
- Testes de carga / stress
- Testes de segurança (penetration testing)

---

## 3. Objetivos

- Validar os **fluxos principais (happy path)** de cada módulo
- Identificar **falhas funcionais** antes de exposição pública do portfólio
- Garantir que **campos obrigatórios** retornem mensagens de erro claras
- Validar **feedbacks visuais** ao usuário (sucesso, erro, carregamento)
- Verificar **comportamento em estados limite** (campos vazios, valores negativos, dados inválidos)
- Documentar **bugs encontrados** para demonstrar capacidade analítica

---

## 4. Critérios de Entrada e Saída

### Critérios de Entrada (quando iniciar os testes)
- [ ] Ambiente de desenvolvimento rodando localmente (`npm run dev`)
- [ ] Acesso ao Firebase configurado (`.env` preenchido)
- [ ] Base de dados de teste criada (dados fictícios inseridos)
- [ ] Casos de teste redigidos e revisados

### Critérios de Saída (quando considerar concluído)
- [ ] 100% dos casos de teste executados
- [ ] 0 bugs críticos abertos
- [ ] Bugs de severidade alta documentados com print e passos de reprodução
- [ ] Relatório de execução preenchido

---

## 5. Tipos de Teste

| Tipo | Objetivo | Será executado? |
|------|----------|:---:|
| **Teste Funcional** | Verificar se as funções agem conforme o especificado | ✅ |
| **Teste de Interface (UI)** | Validar layout, responsividade e consistência visual | ✅ |
| **Teste de Fronteira** | Testar limites de campos (máx. de caracteres, valores zero, negativos) | ✅ |
| **Teste Negativo** | Submeter dados inválidos e verificar o tratamento de erros | ✅ |
| **Teste de Regressão** | Re-executar após correções para garantir que não quebraram nada | ✅ |
| **Teste de Performance** | Tempo de resposta das operações | ⚠️ Parcial (observação visual) |
| **Teste de Segurança** | Acesso não autorizado, rotas protegidas | ⚠️ Parcial |
| **Teste Automatizado** | Scripts automatizados | ❌ Fora do escopo nesta versão |

---

## 6. Ambiente de Teste

| Item | Configuração |
|------|-------------|
| **Sistema Operacional** | Windows 11 |
| **Navegador principal** | Google Chrome (versão mais recente) |
| **Navegadores secundários** | Firefox, Edge |
| **Resolução desktop** | 1920×1080 |
| **Resolução mobile** | 375×812 (iPhone SE simulado via DevTools) |
| **Framework** | React 18 + Vite |
| **Backend** | Firebase Firestore + Firebase Auth |
| **Ambiente** | Local (localhost:5173) |

---

## 7. Dados de Teste

### Usuário de Teste
```
E-mail: teste@qa.portfolio.com
Senha: QATest@2026
```

### Massa de Dados Mínima
- **Clientes:** mínimo 3 cadastrados (com e sem equipamento)
- **Produtos no Estoque:** mínimo 5 produtos com dados completos
- **Técnicos:** mínimo 2 cadastrados
- **Ordens de Serviço:** mínimo 2 (aberta e concluída)

---

## 8. Módulos Prioritários para Teste

Os módulos foram priorizados com base na **criticidade de negócio** e **complexidade funcional**:

| Prioridade | Módulo | Justificativa |
|:---:|--------|---------------|
| 🔴 Alta | Login / Autenticação | Porta de entrada de todo o sistema |
| 🔴 Alta | Ordens de Serviço | Core do negócio |
| 🔴 Alta | Compras | Fluxo com autocomplete recém-implementado |
| 🔴 Alta | Estoque | Impacta diretamente as compras e vendas |
| 🟡 Média | Clientes | CRUD fundamental |
| 🟡 Média | Orçamentos | Fluxo financeiro crítico |
| 🟡 Média | Financeiro | Registro de entradas e saídas |
| 🟢 Baixa | Dashboard | Visualização derivada de outros dados |
| 🟢 Baixa | Relatórios | PDF gerado a partir de dados existentes |

---

## 9. Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:---:|:---:|-----------|
| Flakiness por latência do Firebase | Alta | Médio | Aguardar carregamento antes de interagir |
| Dados inconsistentes entre módulos | Média | Alto | Usar massa de dados controlada |
| Bugs visuais em tema escuro (dark mode) | Média | Baixo | Testar em ambos os temas |
| Comportamento diferente entre navegadores | Baixa | Médio | Testar em Chrome + Firefox |
| Campos de data com timezone incorreto | Média | Alto | Verificar se a data salva corresponde à inserida |

---

## 10. Métricas de Qualidade

Ao final da execução, as seguintes métricas serão calculadas:

```
Taxa de Aprovação   = (Casos Passou / Total Executados) × 100
Taxa de Falha       = (Casos Falhou / Total Executados) × 100
Taxa de Bloqueio    = (Casos Bloqueados / Total) × 100
Densidade de Bugs   = Total de Bugs / Total de Casos de Teste
```

---

## 11. Responsabilidades

| Papel | Responsável |
|-------|-------------|
| Analista de QA | [Seu Nome] |
| Desenvolvedor | [Seu Nome] |
| Aprovação do Plano | [Seu Nome] |

> ℹ️ Por se tratar de um projeto de portfólio individual, o mesmo profissional acumula os papéis de desenvolvedor e testador — o que é comum em startups e projetos solo.

---

## 12. Entregáveis de QA

- [x] `plano-de-testes.md` — este documento
- [x] `casos-de-teste.md` — casos detalhados com passos e resultados esperados
- [x] `relatorio-de-bugs.md` — bugs encontrados durante a execução
- [x] `relatorio-de-execucao.md` — resultado de cada ciclo de teste
- [x] `cobertura-de-testes.md` — mapa de cobertura por módulo
- [x] `README-QA.md` — visão geral da estratégia de QA para recrutadores

---

## 13. Referências

- [React Testing Library](https://testing-library.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [ISTQB Foundation Level Syllabus](https://www.istqb.org/)
- [Padrão de Escrita de Casos de Teste — IEEE 829](https://standards.ieee.org/standard/829-2008.html)

---

*Documento gerado em 26/09/2026 | Versão 1.0*
