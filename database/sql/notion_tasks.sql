-- ============================================
-- TABELA: notion_tasks
-- Tarefas sincronizadas do Notion via N8N
-- ============================================

CREATE TABLE IF NOT EXISTS public.notion_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notion_id text NOT NULL UNIQUE,
  title text,
  status text,
  priority text,
  description text,
  executor text,
  requester text,
  department text,
  created_by text,
  date_start date,
  date_end date,
  notion_url text,
  created_at timestamptz,
  updated_at timestamptz,
  _extracted_at timestamptz DEFAULT now(),
  _source_system text DEFAULT 'Notion'
);

ALTER TABLE public.notion_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notion_tasks_select" ON public.notion_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "notion_tasks_service_all" ON public.notion_tasks
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- REGISTRAR RELATORIO
-- ============================================

INSERT INTO public.reports (slug, name, description, icon, category, active, standalone_public)
VALUES (
  'notion',
  'Tarefas Notion',
  'Acompanhamento de tarefas, prazos e responsaveis do Notion',
  'layout-dashboard',
  'operacional',
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;
