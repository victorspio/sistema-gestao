# Zeu-Tech

Sistema web de controle financeiro e de vendas desenvolvido para a Zeu-Tech.

## 🚀 Tecnologias

- React
- Vite
- TailwindCSS
- Firebase
- React Router DOM
- React Hook Form + Zod
- Framer Motion
- Lucide Icons
- Recharts

## 📋 Pré-requisitos

- Node.js 18+ instalado
- NPM ou Yarn
- Conta no Firebase (para configurar as credenciais)

## 🔧 Instalação

1. Clone o repositório:
\`\`\`powershell
git clone [URL_DO_REPOSITÓRIO]
cd zeu-tech
\`\`\`

2. Instale as dependências:
\`\`\`powershell
npm install
# ou
yarn
\`\`\`

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Preencha com as credenciais do seu backend/Firebase conforme necessário

4. Inicie o servidor de desenvolvimento:
\`\`\`powershell
npm run dev
# ou
yarn dev
\`\`\`

5. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📦 Build para Produção

Para criar uma build de produção:

\`\`\`powershell
npm run build
# ou
yarn build
\`\`\`

## 🛠️ Estrutura do Projeto

\`\`\`
src/
├─ components/     # Componentes reutilizáveis
│  ├─ forms/      # Inputs, buttons, etc
│  ├─ layout/     # Layout components
├─ pages/         # Páginas da aplicação
│  ├─ vendas/
│  ├─ clientes/
│  ├─ estoque/
│  ├─ financeiro/
│  ├─ relatorios/
│  ├─ configuracoes/
├─ hooks/         # Custom hooks
├─ context/       # Contexts do React
├─ services/      # Serviços (Firebase, etc)
├─ utils/         # Funções utilitárias
├─ styles/        # Estilos globais
\`\`\`

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.