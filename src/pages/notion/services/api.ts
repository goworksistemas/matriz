import { supabase } from './supabase';

export interface NotionTask {
  id: string;
  notion_id: string;
  title: string;
  status: string;
  priority: string;
  description: string;
  executor: string;
  requester: string;
  department: string;
  created_by: string;
  date_start: string | null;
  date_end: string | null;
  notion_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  _extracted_at: string;
}

export interface TarefaProcessada {
  id: string;
  notionId: string;
  titulo: string;
  status: string;
  prioridade: string;
  descricao: string;
  executor: string;
  executores: string[];
  solicitante: string;
  departamento: string;
  criadoPor: string;
  dataInicio: string | null;
  dataFim: string | null;
  notionUrl: string | null;
  criadoEm: string | null;
  atualizadoEm: string | null;
  diasAtraso: number;
  statusPrazo: 'vencida' | 'hoje' | 'no_prazo' | 'sem_data';
}

async function fetchTasks(): Promise<NotionTask[]> {
  const allRows: NotionTask[] = [];
  const pageSize = 1000;
  let lastId: string | null = null;

  while (true) {
    let query = supabase
      .from('notion_tasks')
      .select('*')
      .order('id', { ascending: true })
      .limit(pageSize);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar tarefas do Notion:', error);
      throw error;
    }
    if (!data || data.length === 0) break;
    allRows.push(...(data as NotionTask[]));
    lastId = data[data.length - 1].id;
    if (data.length < pageSize) break;
  }

  return allRows;
}

function calcularStatusPrazo(dateEnd: string | null): { diasAtraso: number; statusPrazo: TarefaProcessada['statusPrazo'] } {
  if (!dateEnd) return { diasAtraso: 0, statusPrazo: 'sem_data' };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const fim = new Date(dateEnd + 'T00:00:00');
  fim.setHours(0, 0, 0, 0);

  const diffMs = hoje.getTime() - fim.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias > 0) return { diasAtraso: diffDias, statusPrazo: 'vencida' };
  if (diffDias === 0) return { diasAtraso: 0, statusPrazo: 'hoje' };
  return { diasAtraso: diffDias, statusPrazo: 'no_prazo' };
}

function processTasks(tasks: NotionTask[]): TarefaProcessada[] {
  return tasks.map(t => {
    const { diasAtraso, statusPrazo } = calcularStatusPrazo(t.date_end);
    const executores = t.executor
      ? t.executor.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    return {
      id: t.id,
      notionId: t.notion_id,
      titulo: t.title || 'Sem titulo',
      status: t.status || 'Sem status',
      prioridade: t.priority || 'Sem prioridade',
      descricao: t.description || '',
      executor: t.executor || 'Nao atribuido',
      executores,
      solicitante: t.requester || '',
      departamento: t.department || 'Sem departamento',
      criadoPor: t.created_by || '',
      dataInicio: t.date_start,
      dataFim: t.date_end,
      notionUrl: t.notion_url,
      criadoEm: t.created_at,
      atualizadoEm: t.updated_at,
      diasAtraso,
      statusPrazo,
    };
  });
}

async function fetchUltimaAtualizacao(): Promise<string | null> {
  const { data } = await supabase
    .from('notion_tasks')
    .select('_extracted_at')
    .order('_extracted_at', { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return (data[0] as { _extracted_at: string })._extracted_at;
  }
  return null;
}

export interface DadosNotionResult {
  tarefas: TarefaProcessada[];
  statusUnicos: string[];
  prioridadesUnicas: string[];
  departamentosUnicos: string[];
  executoresUnicos: string[];
  ultimaAtualizacao: string | null;
}

export async function fetchDadosNotion(): Promise<DadosNotionResult> {
  const [tasksRaw, ultimaAtualizacao] = await Promise.all([
    fetchTasks(),
    fetchUltimaAtualizacao(),
  ]);

  const tarefas = processTasks(tasksRaw);

  const statusUnicos = [...new Set(tarefas.map(t => t.status))].sort();
  const prioridadesUnicas = [...new Set(tarefas.map(t => t.prioridade))].sort();
  const departamentosUnicos = [...new Set(tarefas.map(t => t.departamento))].sort();

  const executoresSet = new Set<string>();
  tarefas.forEach(t => t.executores.forEach(e => executoresSet.add(e)));
  const executoresUnicos = [...executoresSet].sort();

  return {
    tarefas,
    statusUnicos,
    prioridadesUnicas,
    departamentosUnicos,
    executoresUnicos,
    ultimaAtualizacao,
  };
}
