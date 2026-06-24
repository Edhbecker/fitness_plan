# Configuração do Supabase

Use as strings de conexão PostgreSQL exibidas em `Connect > ORMs > Prisma`.

```env
DATABASE_URL="conexão pelo pooler na porta 6543"
DIRECT_URL="conexão direta ou session pooler na porta 5432"
```

Prepare um projeto vazio executando:

```powershell
npm run db:setup
```

Esse comando aplica as migrations rastreadas e cria apenas o protocolo corporal
necessário. Nenhuma conta ou credencial é criada automaticamente. O primeiro
profissional deve usar a opção **Criar conta** na página de acesso.

Se as tabelas já tiverem sido criadas manualmente, execute
`supabase/baseline-prisma.sql` uma vez no SQL Editor para alinhar o histórico.
