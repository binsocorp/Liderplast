-- ============================================================
-- PASO 1: BACKUP de account_movements
-- Ejecutar y verificar ANTES de limpiar.
-- ============================================================

CREATE TABLE account_movements_backup_20260426 AS
SELECT * FROM account_movements;

-- Verificar que el backup tiene filas:
SELECT COUNT(*) AS backup_count FROM account_movements_backup_20260426;

-- ============================================================
-- PASO 2: LIMPIAR (solo después de confirmar el backup)
-- El orden importa: primero movimientos, luego ingresos/egresos.
-- ============================================================

DELETE FROM account_movements;
DELETE FROM finance_incomes;
DELETE FROM finance_expenses;

-- Verificar que quedaron vacías:
SELECT
  (SELECT COUNT(*) FROM account_movements) AS movimientos,
  (SELECT COUNT(*) FROM finance_incomes)   AS ingresos,
  (SELECT COUNT(*) FROM finance_expenses)  AS egresos;
