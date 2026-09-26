# Relatório de Bugs — Sistema de Gestão de Ordens de Serviço

> **Projeto:** Sistema de Gestão OS  
> **Versão:** 1.0  
> **Autor:** [Seu Nome]  
> **Data de abertura:** Setembro / 2026  

---

## Legenda de Severidade

| Nível | Descrição |
|:---:|-----------|
| 🔴 **Crítico** | Bloqueia o uso do sistema / perda de dados |
| 🟠 **Alto** | Funcionalidade principal quebrada |
| 🟡 **Médio** | Funcionalidade afetada mas com contorno |
| 🟢 **Baixo** | Cosmético / melhoria |

---

## Legenda de Status

| Status | Descrição |
|--------|-----------|
| `ABERTO` | Bug confirmado, aguardando correção |
| `EM CORREÇÃO` | Desenvolvedor trabalhando na correção |
| `CORRIGIDO` | Correção implementada |
| `FECHADO` | Verificado pelo QA em reteste |
| `NÃO REPRODUZÍVEL` | Não foi possível reproduzir após investigação |

---

## Bug Report #001

| Campo | Valor |
|-------|-------|
| **ID** | BUG-001 |
| **Módulo** | Compras |
| **Severidade** | 🟡 Médio |
| **Prioridade** | Alta |
| **Status** | `CORRIGIDO` |
| **Reportado em** | 26/09/2026 |
| **Corrigido em** | 26/09/2026 |
| **Caso de Teste** | CT-COMPRA-003 |

### Título
Campo Quantidade é preenchido automaticamente ao selecionar produto do estoque, impedindo o usuário de informar a quantidade comprada.

### Passos para Reprodução
1. Acessar o módulo **Compras**
2. Clicar em **Nova Compra**
3. No campo **Nome do Produto**, selecionar qualquer produto do dropdown de sugestões

### Resultado Atual
O campo Quantidade era preenchido com a quantidade **atual em estoque** do produto selecionado.

### Resultado Esperado
O campo Quantidade deve permanecer **em branco** após a seleção, pois o usuário precisa informar quantas unidades comprou (pode ser diferente do estoque atual).

### Evidência
> *Comportamento observado durante execução do CT-COMPRA-003.*

### Correção Aplicada
Removida a linha `setValue('itens.${index}.quantidade', produto.quantidade)` da função `selecionarProduto` no componente `CompraForm.jsx`. O campo agora mantém o valor anterior ou permanece vazio.

---

## Bug Report #002

| Campo | Valor |
|-------|-------|
| **ID** | BUG-002 |
| **Módulo** | Compras — Autocomplete |
| **Severidade** | 🟠 Alto |
| **Prioridade** | Alta |
| **Status** | `CORRIGIDO` |
| **Reportado em** | 26/09/2026 |
| **Corrigido em** | 26/09/2026 |
| **Caso de Teste** | CT-COMPRA-001 |

### Título
Dropdown de sugestões de produtos fecha antes do item ser clicado, quando o usuário move o mouse para a lista.

### Passos para Reprodução
1. Abrir formulário de nova compra
2. Clicar no campo **Nome do Produto** (dropdown aparece)
3. Mover o mouse para uma sugestão na lista
4. Tentar clicar em um produto

### Resultado Atual
O campo perde o foco (`blur`) antes que o `onClick` seja disparado, fazendo o dropdown fechar sem selecionar o produto.

### Resultado Esperado
O dropdown deve permanecer aberto durante o movimento do mouse e fechar apenas após a seleção do produto.

### Causa Raiz
O evento `blur` do input era disparado antes do `click` no item do dropdown. O listener de `click` para fechar o dropdown ao clicar fora também interferia.

### Correção Aplicada
1. Substituído `onClick` por `onMouseDown` com `e.preventDefault()` no item do dropdown, impedindo que o campo perca o foco antes da seleção.
2. Substituído `addEventListener('click', ...)` por `addEventListener('mousedown', ...)` no listener de fechamento externo.

---

## Bug Report #003

| Campo | Valor |
|-------|-------|
| **ID** | BUG-003 |
| **Módulo** | Compras — Autocomplete |
| **Severidade** | 🟡 Médio |
| **Prioridade** | Média |
| **Status** | `CORRIGIDO` |
| **Reportado em** | 26/09/2026 |
| **Corrigido em** | 26/09/2026 |
| **Caso de Teste** | CT-COMPRA-001 |

### Título
Dropdown de produtos não aparece ao focar no campo Nome do Produto com o campo vazio.

### Passos para Reprodução
1. Abrir formulário de nova compra
2. Clicar no campo **Nome do Produto** sem digitar nada

### Resultado Atual
O dropdown **não aparecia** quando o campo estava vazio. O usuário precisava digitar pelo menos 2 caracteres para ver sugestões.

### Resultado Esperado
Ao focar no campo (mesmo sem texto), o dropdown deve exibir os primeiros produtos disponíveis no estoque (até 8), permitindo seleção direta por reconhecimento visual.

### Impacto
Usuário não sabia que havia produtos cadastrados para selecionar, podendo digitar o nome manualmente e criar duplicatas.

### Correção Aplicada
Alterada a função `buscarProdutosSimilares` para, quando o texto for vazio, buscar e exibir os primeiros 8 produtos ativos do estoque. O evento `onFocus` agora sempre chama a busca, independente do conteúdo do campo.

---

## Bug Report #004

| Campo | Valor |
|-------|-------|
| **ID** | BUG-004 |
| **Módulo** | Compras |
| **Severidade** | 🟢 Baixo |
| **Prioridade** | Baixa |
| **Status** | `ABERTO` |
| **Reportado em** | 26/09/2026 |

### Título
Texto de sugestão no dropdown exibe cores inadequadas no tema escuro (dark mode).

### Passos para Reprodução
1. Ativar o **tema escuro** no sistema
2. Abrir formulário de nova compra
3. Clicar no campo **Nome do Produto** para exibir o dropdown

### Resultado Atual
O texto de apoio dentro do dropdown (*"Produtos no estoque — clique para preencher automaticamente"*) apresenta baixo contraste no tema escuro, dificultando a leitura.

### Resultado Esperado
Todos os textos dentro do dropdown devem manter contraste adequado (mínimo WCAG AA: 4.5:1) em ambos os temas.

### Sugestão de Correção
Revisar as classes Tailwind do parágrafo de instrução do dropdown:
```
// Atual (pode ter problema de contraste)
className="text-xs text-slate-500 dark:text-slate-400"

// Sugerido
className="text-xs text-slate-500 dark:text-slate-300"
```

---

## Bug Report #005

| Campo | Valor |
|-------|-------|
| **ID** | BUG-005 |
| **Módulo** | Compras |
| **Severidade** | 🟡 Médio |
| **Prioridade** | Média |
| **Status** | `ABERTO` |
| **Reportado em** | 26/09/2026 |

### Título
Após remover um item da lista de compras (quando há múltiplos itens), o badge "Do Estoque" pode exibir informações de um item incorreto.

### Passos para Reprodução
1. Abrir formulário de nova compra
2. Adicionar **2 produtos** usando o autocomplete (ambos do estoque)
3. Remover o **primeiro** produto clicando no ícone de lixeira
4. Verificar o badge "Do Estoque" do produto que era o segundo

### Resultado Atual
O badge "Do Estoque" pode mostrar dados do item removido devido ao índice desatualizado no estado `itensDoEstoque`.

### Resultado Esperado
Após remover um item, os badges dos itens restantes devem continuar exibindo as informações corretas dos seus respectivos produtos.

### Impacto
Bug cosmético e informacional — não impede o salvamento da compra, mas pode confundir o usuário.

### Sugestão de Correção
Refatorar o estado `itensDoEstoque` para usar um identificador único do item (como `field.id` do `useFieldArray`) ao invés do índice numérico, evitando dessincronização após remoções.

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Total de bugs reportados** | 5 |
| **Críticos** | 0 |
| **Altos** | 1 |
| **Médios** | 2 |
| **Baixos** | 1 |
| **Corrigidos** | 3 |
| **Abertos** | 2 |
| **Taxa de correção** | 60% |

---

## Histórico de Versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 26/09/2026 | Criação do documento — ciclo inicial de testes |

---

*Relatório gerado em 26/09/2026 | Sistema de Gestão OS v1.0*
