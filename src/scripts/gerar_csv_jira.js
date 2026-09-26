import fs from 'fs';
import path from 'path';

// Carregar o arquivo markdown
const mdPath = path.resolve('docs/qa/casos-de-teste.md');
const content = fs.readFileSync(mdPath, 'utf8');

// Regex para extrair casos de teste
// Formato: ### CT-XXX-000 — Título
const sections = content.split(/### (CT-[A-Z]+-\d+) — (.+)/);

const testCases = [];

for (let i = 1; i < sections.length; i += 3) {
  const id = sections[i].trim();
  const title = sections[i + 1].trim();
  const body = sections[i + 2];

  // Extrair prioridade
  let priority = 'Medium';
  if (body.includes('🔴 Alta')) priority = 'High';
  else if (body.includes('🟢 Baixa')) priority = 'Low';
  else if (body.includes('🟡 Média')) priority = 'Medium';

  // Extrair módulo a partir do ID
  let module = 'Geral';
  if (id.startsWith('CT-LOGIN')) module = 'Login e Autenticação';
  else if (id.startsWith('CT-COMPRA')) module = 'Compras';
  else if (id.startsWith('CT-ESTOQUE')) module = 'Estoque';
  else if (id.startsWith('CT-CLIENTE')) module = 'Clientes';
  else if (id.startsWith('CT-OS')) module = 'Ordens de Serviço';
  else if (id.startsWith('CT-UI')) module = 'Interface e Usabilidade';

  // Extrair pré-condição
  const precondMatch = body.match(/\|\s*\*\*Pré-condição\*\*\s*\|\s*([^|]+)\|/);
  const precondition = precondMatch ? precondMatch[1].trim() : 'Nenhuma';

  // Extrair Passos
  const passosMatch = body.match(/\*\*Passos:\*\*([\s\S]*?)(?=\*\*Resultado Esperado:\*\*)/);
  const steps = passosMatch ? passosMatch[1].trim() : '';

  // Extrair Resultado Esperado
  const resultMatch = body.match(/\*\*Resultado Esperado:\*\*([\s\S]*?)(?=---|###|$)/);
  const expectedResult = resultMatch ? resultMatch[1].trim() : '';

  testCases.push({
    id,
    title,
    module,
    priority,
    precondition,
    steps,
    expectedResult
  });
}

function escapeCsv(val) {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// 1. CSV Padrão Jira (Issue Type = Task/Test, Summary, Description, Priority, Component, Labels)
const jiraRows = [
  ['Issue Type', 'Summary', 'Description', 'Priority', 'Component', 'Labels'].join(',')
];

for (const tc of testCases) {
  const summary = `[${tc.id}] ${tc.title}`;
  const description = 
`h3. Informações do Teste
* *ID:* ${tc.id}
* *Módulo:* ${tc.module}
* *Pré-condição:* ${tc.precondition}

h3. Passos para Reprodução:
${tc.steps}

h3. Resultado Esperado:
${tc.expectedResult}`;

  jiraRows.push([
    escapeCsv('Test'),
    escapeCsv(summary),
    escapeCsv(description),
    escapeCsv(tc.priority),
    escapeCsv(tc.module),
    escapeCsv('QA,Regressivo,Manual')
  ].join(','));
}

// 2. CSV Zephyr / Xray / Qase (com colunas separadas para passos e resultado esperado)
const zephyrRows = [
  ['Test Case ID', 'Name', 'Folder', 'Priority', 'Precondition', 'Step-by-Step Steps', 'Expected Result'].join(',')
];

for (const tc of testCases) {
  zephyrRows.push([
    escapeCsv(tc.id),
    escapeCsv(`[${tc.id}] ${tc.title}`),
    escapeCsv(tc.module),
    escapeCsv(tc.priority),
    escapeCsv(tc.precondition),
    escapeCsv(tc.steps),
    escapeCsv(tc.expectedResult)
  ].join(','));
}

// UTF-8 BOM (\uFEFF) para garantir acentuação correta no Excel / Jira
const jiraCsv = '\uFEFF' + jiraRows.join('\r\n');
const zephyrCsv = '\uFEFF' + zephyrRows.join('\r\n');

fs.writeFileSync('docs/qa/jira_casos_de_teste.csv', jiraCsv, 'utf8');
fs.writeFileSync('docs/qa/zephyr_casos_de_teste.csv', zephyrCsv, 'utf8');

console.log(`Gerados com sucesso ${testCases.length} casos de teste em CSV!`);
