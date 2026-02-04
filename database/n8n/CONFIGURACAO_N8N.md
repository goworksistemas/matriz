# Configuração do N8N - ETL HubSpot → Supabase

## 📋 Visão Geral

Este workflow automatiza a atualização dos dados de comissões:

```
Frontend (Dashboard) → Webhook N8N → SSH JupyterHub → Notebook ETL → Supabase
```

## 🔧 Pré-requisitos

1. **Acesso SSH ao servidor JupyterHub** (`161.35.104.75`)
2. **Notebook ETL** configurado em: `/home/luiscuba/Central de Dados/etl_hubspot_supabase.ipynb`
3. **N8N** rodando em: `https://flux.gowork.com.br`

---

## 🚀 Configuração Passo a Passo

### 1️⃣ Criar Credencial SSH no N8N

1. Acesse seu N8N: `https://flux.gowork.com.br`
2. Vá em **Settings** → **Credentials** → **Add Credential**
3. Selecione **SSH Password**
4. Preencha:
   - **Name**: `JupyterHub SSH`
   - **Host**: `161.35.104.75`
   - **Port**: `22`
   - **Username**: `luiscuba` (ou usuário com acesso)
   - **Password**: `[senha do usuário]`
5. Clique em **Save**
6. **Anote o ID** da credencial criada (aparece na URL)

### 2️⃣ Importar o Workflow

1. Vá em **Workflows** → **Import from File**
2. Selecione o arquivo: `workflow_atualizar_comissoes.json`
3. No nó **"Executar ETL via SSH"**:
   - Clique no nó
   - Em **Credentials**, selecione a credencial SSH criada
4. Clique em **Save**

### 3️⃣ Ativar o Workflow

1. Clique no toggle **Active** (canto superior direito)
2. O webhook estará disponível em:
   ```
   https://flux.gowork.com.br/webhook/atualizar_comissoes
   ```

---

## 🧪 Testar o Workflow

### Via Terminal (cURL)

```bash
curl -X POST https://flux.gowork.com.br/webhook/atualizar_comissoes \
  -H "Content-Type: application/json" \
  -d '{"source": "teste-manual", "timestamp": "2026-02-04T00:00:00Z"}'
```

### Resposta Esperada (Sucesso)

```json
{
  "status": "success",
  "message": "Dados do HubSpot sincronizados com sucesso!",
  "timestamp": "2026-02-04T12:00:00.000Z",
  "details": {
    "source": "HubSpot API",
    "destination": "Supabase",
    "tables": ["vw_comissoes_calculadas"]
  }
}
```

### Resposta Esperada (Erro)

```json
{
  "status": "error",
  "message": "Erro ao sincronizar dados. Tente novamente.",
  "timestamp": "2026-02-04T12:00:00.000Z",
  "error": "Detalhes do erro..."
}
```

---

## 📱 Integração no Frontend

O botão **"Sincronizar HubSpot"** no Dashboard de Comissões já está configurado para:

1. Chamar o webhook: `POST https://flux.gowork.com.br/webhook/atualizar_comissoes`
2. Mostrar feedback visual (loading, sucesso, erro)
3. Recarregar os dados automaticamente após sucesso

### Arquivo Modificado

```
relatorios/comissoes/src/App.tsx
```

---

## 🔍 Troubleshooting

### Erro: "Connection refused"
- Verifique se o SSH está habilitado no servidor
- Confirme a porta (22)
- Teste a conexão SSH manualmente

### Erro: "Permission denied"
- Verifique usuário/senha
- Confirme que o usuário tem acesso ao diretório do notebook

### Erro: "Notebook execution failed"
- Verifique os logs no JupyterHub
- Confirme que as variáveis de ambiente estão configuradas
- Timeout padrão: 600 segundos (10 minutos)

### Erro de CORS
- Configure headers no N8N se necessário
- O webhook já está configurado para aceitar requisições do frontend

---

## 📊 Fluxo de Dados

```
┌─────────────────┐
│   Dashboard     │
│   Comissões     │
└────────┬────────┘
         │ POST /webhook/atualizar_comissoes
         ▼
┌─────────────────┐
│     N8N         │
│   Workflow      │
└────────┬────────┘
         │ SSH Execute
         ▼
┌─────────────────┐
│   JupyterHub    │
│  (161.35.104.75)│
└────────┬────────┘
         │ jupyter nbconvert --execute
         ▼
┌─────────────────┐
│    Notebook     │
│ etl_hubspot_    │
│ supabase.ipynb  │
└────────┬────────┘
         │ API Calls
         ▼
┌─────────────────┐      ┌─────────────────┐
│   HubSpot API   │ ───► │    Supabase     │
└─────────────────┘      │ (PostgreSQL)    │
                         └─────────────────┘
```

---

## 📝 Notas

- O notebook é executado via `jupyter nbconvert` para não precisar da interface gráfica
- O timeout está configurado para 10 minutos (600s) - ajuste conforme necessário
- Os logs de execução ficam em `executed_output.ipynb` no mesmo diretório
