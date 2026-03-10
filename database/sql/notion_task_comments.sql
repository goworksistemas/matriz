-- ============================================
-- TABELA: notion_task_comments
-- Comentários das tarefas do Notion via N8N
-- ============================================

CREATE TABLE IF NOT EXISTS public.notion_task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id text NOT NULL UNIQUE,
  notion_id text NOT NULL,
  text text,
  author text,
  commented_at timestamptz,
  _extracted_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notion_task_comments_notion_id ON public.notion_task_comments(notion_id);

ALTER TABLE public.notion_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notion_task_comments_select" ON public.notion_task_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "notion_task_comments_service_all" ON public.notion_task_comments
  FOR ALL USING (auth.role() = 'service_role');
