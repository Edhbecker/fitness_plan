-- Registra como aplicadas as migrations que foram executadas pelo SQL Editor.
-- Pode ser executado mais de uma vez.

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count"
)
SELECT
  gen_random_uuid()::text,
  '5eb1eb0e8f44902c55f2bd5e3889c019c3255d6970f0b39281fe595bf7d282d2',
  now(),
  '20260611233000_initial_schema',
  now(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations"
  WHERE "migration_name" = '20260611233000_initial_schema'
);

INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count"
)
SELECT
  gen_random_uuid()::text,
  'c41fb64b9e2999c2f2891bbda697e9dd2410609886c60addf3662a0dd9993e0c',
  now(),
  '20260611234000_enable_rls',
  now(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations"
  WHERE "migration_name" = '20260611234000_enable_rls'
);
