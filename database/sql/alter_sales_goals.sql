-- ==============================================================================
-- ALTER TABLE: Expandir sales_goals para 3 tipos de meta
-- (receita, seats, deals)
-- ==============================================================================
-- As colunas monthly_goal e annual_goal existentes representam RECEITA (R$).
-- Novas colunas adicionadas para seats (posições) e deals (negócios).
-- ==============================================================================

ALTER TABLE sales_goals
  ADD COLUMN IF NOT EXISTS monthly_goal_seats DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_goal_seats DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_goal_deals INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_goal_deals INTEGER NOT NULL DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN sales_goals.monthly_goal IS 'Meta mensal de receita (R$)';
COMMENT ON COLUMN sales_goals.annual_goal IS 'Meta anual de receita (R$)';
COMMENT ON COLUMN sales_goals.monthly_goal_seats IS 'Meta mensal de seats (posições de trabalho)';
COMMENT ON COLUMN sales_goals.annual_goal_seats IS 'Meta anual de seats (posições de trabalho)';
COMMENT ON COLUMN sales_goals.monthly_goal_deals IS 'Meta mensal de deals (negócios ganhos)';
COMMENT ON COLUMN sales_goals.annual_goal_deals IS 'Meta anual de deals (negócios ganhos)';
