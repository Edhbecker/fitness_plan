# Publicação em Produção

## Arquitetura

- Aplicação Next.js: Vercel
- PostgreSQL: Supabase
- Dados sensíveis: Prisma executado somente no servidor
- Autenticação: Auth.js com credenciais e bcrypt

## Antes de publicar

1. Rotacione a senha do banco que já foi compartilhada.
2. Gere um `AUTH_SECRET` novo com pelo menos 32 caracteres.
3. Confirme que `.env` e `.env.local` não serão enviados.
4. Execute `npm run validate`, `npm run db:check` e `npm run supabase:check`.
5. Remova contas antigas sem dados vinculados, caso existam.

## Variáveis na Vercel

Cadastre no ambiente **Production**:

```dotenv
DATABASE_URL="Supavisor Transaction mode, porta 6543"
DIRECT_URL="Supavisor Session mode, porta 5432"
NEXT_PUBLIC_SUPABASE_URL="URL pública do projeto"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="chave publicável"
AUTH_SECRET="segredo novo e aleatório"
AUTH_TRUST_HOST="true"
AUTH_URL="https://dominio-final"
```

`DATABASE_URL`, `DIRECT_URL` e `AUTH_SECRET` são segredos.

## Preparar o banco

Execute antes do primeiro acesso em produção:

```powershell
npm run db:setup
```

O comando aplica migrations e cria somente o protocolo corporal obrigatório.
O primeiro profissional cria sua própria conta pela página de acesso.

Para remover uma conta antiga sem alunos ou treinos vinculados:

```powershell
$env:DELETE_USER_EMAIL="conta-antiga@exemplo.com"
npm run user:remove
Remove-Item Env:DELETE_USER_EMAIL
```

## Publicar

1. Envie o projeto para um repositório privado ou use a CLI da Vercel.
2. Importe o projeto na Vercel.
3. Cadastre as variáveis de produção.
4. Publique primeiro como Preview e valide o fluxo.
5. Promova para Production e configure o domínio.

## Teste após publicação

- usuário sem sessão é enviado para `/login`;
- criação de conta, login e logout funcionam;
- profissionais distintos não acessam dados alheios;
- cadastro de aluno persiste após atualizar;
- avaliação persiste e atualiza o perfil;
- exercício pode ser cadastrado;
- periodização, prescrição e execução persistem;
- dashboard reflete somente dados reais;
- logs e backups do Supabase estão ativos.
