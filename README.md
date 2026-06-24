# Pulso Training

Aplicação web para profissionais acompanharem alunos, avaliações corporais,
periodizações e treinos planejados versus realizados.

## Funcionalidades

- criação de conta profissional e autenticação com senha protegida;
- isolamento dos dados por profissional;
- cadastro, listagem e desativação de alunos;
- avaliações corporais e cálculos de composição;
- biblioteca individual de exercícios com aliases;
- periodização, prescrição por dia e registro de execução;
- dashboards derivados dos dados persistidos;
- auditoria nas principais operações.

Não existem contas, credenciais ou dados fictícios criados automaticamente.
Cada novo profissional recebe apenas uma biblioteca inicial de exercícios.

## Executar localmente

1. Crie `.env` a partir de `.env.example`.
2. Configure as conexões Supabase e um `AUTH_SECRET` forte.
3. Instale, prepare o banco e execute:

```powershell
npm install
npm run db:setup
npm run dev
```

Use **Criar conta** na página de acesso para cadastrar o primeiro profissional.

## Validação

```powershell
npm run validate
npm run db:check
npm run supabase:check
npm run production:check
```

## Produção

Siga [PRODUCAO.md](PRODUCAO.md). Nunca publique `.env`, `.env.local`, senhas,
`DATABASE_URL`, `DIRECT_URL` ou `AUTH_SECRET`.
