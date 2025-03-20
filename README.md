# Planejamento POLOAR

Aplicação web para gestão de planejamento de vendas utilizando Next.js, Supabase e integração com a API do Pipedrive.

## Funcionalidades

- Sistema de autenticação de usuários com diferentes níveis de acesso (vendedor e adm)
- Planejamento de negócios para vendedores com validação de IDs de Deals no Pipedrive
- Dashboard administrativo com visualização de dados consolidados e gráficos
- Integração em tempo real com a API do Pipedrive para validação e atualização de dados
- Cache implementado para otimizar as requisições

## Tecnologias Utilizadas

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase
- **Integração Externa**: API Pipedrive
- **Cache e Gerenciamento de Estado**: SWR
- **Gráficos**: Chart.js com React-Chartjs-2
- **Sessão**: Cookies via js-cookie

## Configuração do Projeto

1. Clone o repositório

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env.local` na raiz do projeto:
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
PIPEDRIVE_API_TOKEN=seu_token_pipedrive
PIPEDRIVE_BASE_URL=https://poloarbauru2.pipedrive.com/
NEXTAUTH_SECRET=sua_chave_secreta_para_next_auth
NEXTAUTH_URL=http://localhost:3000
```

4. Configure o banco de dados Supabase:
   - Crie uma tabela `users` com os campos:
     - `id` (UUID, chave primária)
     - `nome` (string)
     - `senha` (string)
     - `role` (string, "vendedor" ou "adm")
   - Crie uma tabela `plannings` com os campos:
     - `id` (UUID, chave primária)
     - `user_id` (UUID, chave estrangeira para `users.id`)
     - `data` (timestamp)
     - `deal_ids_close` (array)
     - `deal_ids_followup` (array)
     - `partners_count` (integer)

5. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

- `/src/app` - Páginas da aplicação (Next.js App Router)
- `/src/app/api` - Rotas de API 
- `/src/components` - Componentes reutilizáveis
- `/src/lib` - Utilitários e configurações

## Fluxo da Aplicação

1. **Login**: Usuários acessam o sistema via `/login` informando nome e senha
2. **Vendedores**: Acessam `/seller/planning` para informar IDs de negócios e quantidade de parceiros
3. **Administradores**: Acessam `/admin/dashboard` para visualizar dados consolidados e gráficos

## Licença

Este projeto é licenciado sob a licença MIT.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
