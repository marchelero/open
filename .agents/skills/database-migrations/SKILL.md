---
name: database-migrations
description: "Use when creating, reviewing, or troubleshooting database migrations across any ORM or framework."
---

# Database Migrations Skill

Safe, reversible database migrations for any stack.

## Core Principles

1. **Migrations must be reversible** — always write `up` and `down`
2. **Schema first, data second** — separate schema migrations from data migrations
3. **Additive changes only** — never rename/delete columns in place; add new, migrate, drop old
4. **Backward compatible** — old code must work with new schema during deploys
5. **Test rollback** — if `down` doesn't work, the migration isn't complete

## Migration Safety Checklist

- [ ] Rollback (`down`) is implemented and tested
- [ ] Column additions are nullable or have defaults
- [ ] Indexes are created CONCURRENTLY (PostgreSQL) to avoid locks
- [ ] Large data migrations are batched (not single DELETE/UPDATE)
- [ ] No sensitive data in migration files (passwords, API keys)
- [ ] Migration is idempotent (safe to run multiple times)

## Schema Migration Patterns

### Safe Column Addition

```sql
-- GOOD: Add nullable column (no lock on large tables)
ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL;

-- GOOD: Postgres 11+ — a DEFAULT no longer rewrites the table (metadata only)
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- BAD: NOT NULL without default on a populated table (full rewrite + lock)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;
```

Pre-11 PostgreSQL (and MySQL < 8.0.12, older SQL Server) still rewrites on `ADD COLUMN ... DEFAULT` — check the engine version before relying on this.

### Safe Column Removal (3-step)

```sql
-- Step 1: Stop reading from column (deploy code that doesn't use it)
-- Step 2: Drop column (migration)
ALTER TABLE users DROP COLUMN phone;
-- Step 3: Remove from ORM/model (next deploy)
```

### Safe Index Creation

```sql
-- PostgreSQL: Create index without locking table
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- SQLite: No CONCURRENTLY support, but tables are locked anyway
CREATE INDEX idx_users_email ON users(email);
```

`CONCURRENTLY` **cannot run inside a transaction block** — most migration tools wrap every migration in one, so this needs tool-specific handling (Prisma/`prisma migrate` raw, Alembic `autocommit_block()`, Django `RunSQL` with `atomic = False`).

If `CREATE INDEX CONCURRENTLY` fails or is cancelled, it leaves an `INVALID` index that still holds disk and blocks a plain `CREATE INDEX`. Clean it up:

```sql
SELECT indexname FROM pg_indexes WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_email;
```

Prefer a partial index on large tables (`WHERE deleted_at IS NULL`) — smaller, faster, and cheaper to keep current.

## Data Migration Patterns

### Batched Updates

```sql
-- BAD: Update millions of rows at once
UPDATE users SET status = 'active' WHERE last_login > '2024-01-01';

-- GOOD: Batch in chunks
-- Process 1000 rows at a time in application code
UPDATE users SET status = 'active'
WHERE id IN (SELECT id FROM users WHERE last_login > '2024-01-01' LIMIT 1000);
```

When more than one worker runs the backfill, take a row lock per batch so two workers never process the same row:

```sql
UPDATE users SET normalized_email = LOWER(email)
WHERE id IN (
  SELECT id FROM users
  WHERE normalized_email IS NULL
  LIMIT 5000
  FOR UPDATE SKIP LOCKED      -- skip rows another worker already holds
);
```

Rules:
- Order batches deterministically (`ORDER BY id`) so progress is measurable and resumable.
- Log `rows affected` per batch; stop when a batch returns 0.
- Keep each batch short enough that its transaction commits in < a few seconds — long transactions hold locks and bloat WAL/snapshots.
- Wrap schema change and data backfill in **separate** migrations; a backfill that fails must not roll back the schema.

### Data Backfill

```sql
-- Separate migration for data backfill
-- 1. Add new column (nullable)
ALTER TABLE orders ADD COLUMN total_cents BIGINT NULL;
-- 2. Backfill in batches (application code)
-- 3. Add NOT NULL constraint after backfill completes
ALTER TABLE orders ALTER COLUMN total_cents SET NOT NULL;
```

## Framework-Specific

### Prisma

```bash
npx prisma migrate dev --name add_user_phone    # Create migration
npx prisma migrate deploy                       # Apply in production
npx prisma migrate reset                         # Reset DB (dev only)
npx prisma db push                               # Push schema without migration file
```

### Drizzle

```bash
npx drizzle-kit generate                         # Generate migration
npx drizzle-kit push                             # Push schema changes
npx drizzle-kit studio                           # Visual DB browser
```

### Kysely (kysely-ctl)

```bash
kysely init                     # Creates kysely.config.ts
kysely migrate make add_avatar  # Create migration file
kysely migrate latest           # Apply pending
kysely migrate down             # Rollback last
kysely migrate list             # Status
```

```typescript
// migrations/2024_01_15_001_create_user_profile.ts
import { type Kysely, sql } from 'kysely'

// ALWAYS Kysely<any>: migrations are frozen in time and must not
// depend on the current, evolving schema types.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_profile')
    .addColumn('id', 'serial', c => c.primaryKey())
    .addColumn('email', 'varchar(255)', c => c.notNull().unique())
    .addColumn('avatar_url', 'text')
    .addColumn('created_at', 'timestamp', c => c.defaultTo(sql`now()`).notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_profile').execute()
}
```

Programmatic runs use `Migrator` + `FileMigrationProvider`. Leave `allowUnorderedMigrations` disabled in every non-dev environment — it disables timestamp-ordering validation and produces silent schema drift between environments.

### Alembic (Python)

```bash
alembic revision --autogenerate -m "add user phone"  # Generate
alembic upgrade head                                  # Apply
alembic downgrade -1                                  # Rollback one
alembic history                                       # List migrations
```

### Django

```bash
python manage.py makemigrations              # Generate
python manage.py migrate                     # Apply
python manage.py migrate app_name 0003       # Rollback to specific
python manage.py showmigrations              # Show status
python manage.py makemigrations --empty app -n description  # Blank migration for custom SQL
```

Data migration — always go through `apps.get_model` (historical model), never the live import, and batch your writes:

```python
from django.db import migrations

def backfill(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    batch = list(User.objects.filter(display_name="")[:5000])
    for user in batch:
        user.display_name = user.username
    User.objects.bulk_update(batch, ["display_name"], batch_size=5000)

class Migration(migrations.Migration):
    dependencies = [("accounts", "0015_add_display_name")]
    operations = [migrations.RunPython(backfill, migrations.RunPython.noop)]
```

`SeparateDatabaseAndState` — drop a field from the model without touching the database (the first half of expand-contract when the column must survive longer than the code):

```python
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[migrations.RemoveField(model_name="user", name="legacy_field")],
            database_operations=[],   # DB untouched; drop it in a later migration
        ),
    ]
```

### ActiveRecord (Rails)

```bash
rails generate migration AddPhoneToUsers phone:string  # Generate
rails db:migrate                                       # Apply
rails db:rollback                                      # Rollback one
rails db:migrate:status                                # Show status
```

### Goose (Go)

```bash
goose -dir ./migrations postgres "db_url" up         # Apply
goose -dir ./migrations postgres "db_url" down        # Rollback one
goose -dir ./migrations postgres "db_url" status      # Status
```

## Zero-Downtime Patterns

### Expand and Contract

1. **Expand**: Add new column/table (backward compatible)
2. **Migrate**: Backfill data, update code to use new schema
3. **Contract**: Drop old column/table (after code migration complete)

### Rename Column (Zero-Downtime)

```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);
-- Step 2: Copy data
UPDATE users SET email_address = email;
-- Step 3: Deploy code to read/write new column
-- Step 4: Add NOT NULL constraint
-- Step 5: Drop old column (separate migration, later)
```

### Deploy Timeline (expand-contract in practice)

```
Phase 1 EXPAND   Day 1  migration: add new_status column (nullable)
                 Day 1  deploy: app writes to BOTH status and new_status
                 Day 2  migration: backfill existing rows in batches
Phase 2 MIGRATE  Day 3  deploy: app reads new_status only, writes both
                         verify data consistency (counts, checksums)
Phase 3 CONTRACT Day 7  migration: drop old status column
                         (only after every instance runs the new code)
```

The gap between MIGRATE and CONTRACT is the safety window: never collapse it into a single deploy, and never start CONTRACT while an older release can still be rolled back to.

## Common Anti-Patterns

| Anti-Pattern | Why Bad | Fix |
|-------------|---------|-----|
| Renaming columns directly | Breaks running code | Expand-contract pattern |
| `DELETE FROM table` without WHERE | Locks table, kills performance | Batch delete with LIMIT |
| Adding index in transaction | Locks table for duration | Use CONCURRENTLY (Postgres) |
| `ALTER TABLE` on large table | Can take minutes, locks writes | Use pt-online-schema-change or gh-ost |
| Storing secrets in migration | Leaks credentials | Use env vars, not migration files |
| Skipping rollback testing | Broken rollback = stuck schema | Test `down` before merging |
| Hand-written SQL run in production | No audit trail, not repeatable | Always through a migration file |
| Editing a deployed migration | Drift between environments | Create a new migration instead |
| `NOT NULL` added before backfill | Table rewrite / lock, or fails outright | Add nullable → backfill → then constrain |
| Schema change + data backfill in one migration | Long transaction, hard to roll back | Split into two migrations |
| Dropping a column before the code stops using it | Runtime errors on every read | Remove code first, drop column next deploy |

## Rollback Testing

```bash
# Test rollback works
npx prisma migrate down
alembic downgrade -1
rails db:rollback
python manage.py migrate app_name <previous_migration>
```

## References

- See `skill: backend-patterns` for ORM patterns
- See `skill: security-review` for data security
- See `agent: database-reviewer` for query optimization
