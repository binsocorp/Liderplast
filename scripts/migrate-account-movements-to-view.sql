-- ============================================================
-- Migration: Replace account_movements table with a view
-- Steps:
--   1. Add transfer_id + expense_type columns
--   2. Migrate existing transfer pairs from the table
--   3. Drop the table
--   4. Create the view
-- ============================================================

-- ─── Step 1: Add columns ───────────────────────────────────
ALTER TABLE finance_incomes
    ADD COLUMN IF NOT EXISTS transfer_id uuid;

ALTER TABLE finance_expenses
    ADD COLUMN IF NOT EXISTS expense_type text,
    ADD COLUMN IF NOT EXISTS transfer_id uuid;

-- ─── Step 2: Migrate existing transfer pairs ───────────────
-- Each TRANSFERENCIA_OUT in account_movements has a matching TRANSFERENCIA_IN.
-- We create a finance_expense + finance_income pair linked by a new transfer_id.
DO $$
DECLARE
    out_rec RECORD;
    in_rec  RECORD;
    new_tid uuid;
BEGIN
    FOR out_rec IN
        SELECT * FROM account_movements WHERE movement_type = 'TRANSFERENCIA_OUT'
    LOOP
        SELECT * INTO in_rec
        FROM account_movements
        WHERE movement_type = 'TRANSFERENCIA_IN'
          AND amount = out_rec.amount
          AND movement_date = out_rec.movement_date
          AND payment_method_id = out_rec.transfer_to_method_id
        LIMIT 1;

        IF FOUND THEN
            new_tid := gen_random_uuid();

            INSERT INTO finance_expenses (
                issue_date, payment_date, status, amount, currency,
                payment_method_id, description, expense_type, transfer_id, created_by_user_id
            ) VALUES (
                out_rec.movement_date, out_rec.movement_date, 'PAGADO', out_rec.amount, 'ARS',
                out_rec.payment_method_id, out_rec.description,
                'TRANSFERENCIA_OUT', new_tid, out_rec.created_by_user_id
            );

            INSERT INTO finance_incomes (
                issue_date, amount, currency,
                payment_method_id, description, income_type, transfer_id, created_by_user_id
            ) VALUES (
                in_rec.movement_date, in_rec.amount, 'ARS',
                in_rec.payment_method_id, in_rec.description,
                'TRANSFERENCIA_IN', new_tid, in_rec.created_by_user_id
            );
        END IF;
    END LOOP;
END $$;

-- ─── Step 3: Drop the old table ────────────────────────────
DROP TABLE account_movements;

-- ─── Step 4: Create the view ───────────────────────────────
CREATE VIEW account_movements AS

    -- Regular incomes (all income_types except TRANSFERENCIA_IN)
    SELECT
        id,
        payment_method_id,
        'INGRESO'::text          AS movement_type,
        amount,
        description,
        issue_date               AS movement_date,
        created_at,
        created_by_user_id,
        NULL::uuid               AS transfer_to_method_id,
        'income'::text           AS source_type,
        NULL::uuid               AS transfer_id
    FROM finance_incomes
    WHERE payment_method_id IS NOT NULL
      AND (income_type IS NULL OR income_type != 'TRANSFERENCIA_IN')

UNION ALL

    -- Transfer incomes (TRANSFERENCIA_IN) — exposes source account via join
    SELECT
        fi.id,
        fi.payment_method_id,
        'TRANSFERENCIA_IN'::text AS movement_type,
        fi.amount,
        fi.description,
        fi.issue_date            AS movement_date,
        fi.created_at,
        fi.created_by_user_id,
        fe.payment_method_id     AS transfer_to_method_id,
        'income'::text           AS source_type,
        fi.transfer_id
    FROM finance_incomes fi
    JOIN finance_expenses fe ON fe.transfer_id = fi.transfer_id
    WHERE fi.income_type = 'TRANSFERENCIA_IN'
      AND fi.transfer_id IS NOT NULL

UNION ALL

    -- Regular expenses (PAGADO, not transfers)
    SELECT
        id,
        payment_method_id,
        'EGRESO'::text           AS movement_type,
        amount,
        description,
        COALESCE(payment_date, issue_date) AS movement_date,
        created_at,
        created_by_user_id,
        NULL::uuid               AS transfer_to_method_id,
        'expense'::text          AS source_type,
        NULL::uuid               AS transfer_id
    FROM finance_expenses
    WHERE payment_method_id IS NOT NULL
      AND status = 'PAGADO'
      AND (expense_type IS NULL OR expense_type != 'TRANSFERENCIA_OUT')

UNION ALL

    -- Transfer expenses (TRANSFERENCIA_OUT) — exposes destination account via join
    SELECT
        fe.id,
        fe.payment_method_id,
        'TRANSFERENCIA_OUT'::text AS movement_type,
        fe.amount,
        fe.description,
        COALESCE(fe.payment_date, fe.issue_date) AS movement_date,
        fe.created_at,
        fe.created_by_user_id,
        fi.payment_method_id     AS transfer_to_method_id,
        'expense'::text          AS source_type,
        fe.transfer_id
    FROM finance_expenses fe
    JOIN finance_incomes fi ON fi.transfer_id = fe.transfer_id
    WHERE fe.expense_type = 'TRANSFERENCIA_OUT'
      AND fe.transfer_id IS NOT NULL;
