# 🚀 Guia de Deploy - Central de Relatórios NetworkGO

Este documento descreve o processo completo para fazer deploy da Central de Relatórios em produção.

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo 1: Deploy do Comissões](#passo-1-deploy-do-comissões)
4. [Passo 2: Atualizar URL no Hub](#passo-2-atualizar-url-no-hub)
5. [Passo 3: Deploy do Hub](#passo-3-deploy-do-hub)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Plataformas de Deploy](#plataformas-de-deploy)
8. [Troubleshooting](#troubleshooting)
9. [Checklist Final](#checklist-final)

---

## 🏗️ Visão Geral da Arquitetura

A Central de Relatórios é composta por **duas aplicações React independentes**:

```
┌─────────────────────────────────────────────────────────┐
│                    HUB (Portal)                         │
│              https://matriz.exemplo.com                 │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │                   IFRAME                         │   │
│   │                                                  │   │
│   │     Carrega: https://comissoes.exemplo.com      │   │
│   │                                                  │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

| Aplicação | Descrição | Porta Local |
|-----------|-----------|-------------|
| **Hub** | Portal principal que lista e carrega relatórios | 5174 |
| **Comissões** | Dashboard de comissões (carregado via iframe) | 5173 |

### ⚠️ Ordem de Deploy Importante!

```
1️⃣ Comissões  →  2️⃣ Hub
```

O **Comissões** deve ser deployado **PRIMEIRO**, pois o Hub precisa da URL de produção do Comissões para configurar o iframe.

---

## ✅ Pré-requisitos

Antes de iniciar o deploy, certifique-se de ter:

- [ ] Conta na plataforma de deploy (Vercel, Netlify, etc.)
- [ ] Acesso ao repositório GitHub: `https://github.com/goworksistemas/matriz`
- [ ] Credenciais do Supabase (URL e API Key)
- [ ] Node.js 18+ instalado (para build local, se necessário)

---

## 📦 Passo 1: Deploy do Comissões

### Usando Vercel (Recomendado)

#### 1.1 Conectar Repositório

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório `goworksistemas/matriz`

#### 1.2 Configurar o Projeto

| Campo | Valor |
|-------|-------|
| **Project Name** | `comissoes-networkgo` (ou outro nome) |
| **Framework Preset** | Vite |
| **Root Directory** | `relatorios/comissoes` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

#### 1.3 Configurar Variáveis de Ambiente

Adicione as seguintes variáveis em **Settings > Environment Variables**:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://xggqzueehfvautkmaojy.supabase.co` |
| `VITE_SUPABASE_KEY` | `sua_chave_do_supabase` |

#### 1.4 Deploy

Clique em **"Deploy"** e aguarde o build finalizar.

#### 1.5 Anotar a URL

Após o deploy, você receberá uma URL como:
```
https://comissoes-networkgo.vercel.app
```

**📝 Guarde esta URL! Você vai precisar no próximo passo.**

---

## 🔧 Passo 2: Atualizar URL no Hub

Antes de fazer deploy do Hub, atualize a URL do Comissões no arquivo de configuração:

### Arquivo: `hub/src/config/relatorios.ts`

```typescript
export const RELATORIOS: Relatorio[] = [
  {
    id: 'comissoes',
    nome: 'Dashboard de Comissões',
    descricao: 'Análise e gestão de comissões de vendedores e SDRs',
    icone: 'coins',
    url: 'https://comissoes-networkgo.vercel.app',  // ← Altere aqui!
    categoria: 'vendas',
    ativo: true,
  },
]
```

### Commit da Alteração

```bash
git add hub/src/config/relatorios.ts
git commit -m "fix: atualiza URL do Comissões para produção"
git push origin main
```

---

## 🌐 Passo 3: Deploy do Hub

### Usando Vercel

#### 3.1 Criar Novo Projeto

1. No Vercel, clique em **"Add New Project"**
2. Selecione o mesmo repositório `goworksistemas/matriz`

#### 3.2 Configurar o Projeto

| Campo | Valor |
|-------|-------|
| **Project Name** | `matriz-networkgo` (ou outro nome) |
| **Framework Preset** | Vite |
| **Root Directory** | `hub` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

#### 3.3 Deploy

Clique em **"Deploy"** e aguarde.

#### 3.4 URL Final

Após o deploy, você terá algo como:
```
https://matriz-networkgo.vercel.app
```

**Este é o link principal da Central de Relatórios!** 🎉

---

## 🔐 Variáveis de Ambiente

### Comissões (`relatorios/comissoes`)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `VITE_SUPABASE_KEY` | Chave de API do Supabase | ✅ Sim |

### Hub (`hub`)

O Hub **não precisa** de variáveis de ambiente.

---

## 🛠️ Plataformas de Deploy

### Vercel (Recomendado)

**Prós:**
- Deploy automático a cada push
- SSL gratuito
- Preview de branches
- Excelente para Vite/React

**Como usar:**
1. Conecte o repositório GitHub
2. Configure o Root Directory
3. Deploy!

### Netlify

**Prós:**
- Similar ao Vercel
- Interface amigável
- Formulários integrados

**Configuração:**
- Build Command: `npm run build`
- Publish Directory: `dist`
- Base Directory: `hub` ou `relatorios/comissoes`

### GitHub Pages

**Prós:**
- Totalmente gratuito
- Integrado ao GitHub

**Contras:**
- Mais configuração necessária
- Apenas sites estáticos
- Precisa configurar base URL no Vite

---

## 🔧 Troubleshooting

### Erro: "Page not found" ao acessar rotas

**Causa:** SPA (Single Page Application) precisa de redirecionamento.

**Solução Vercel:** Criar arquivo `vercel.json` na pasta do projeto:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**Solução Netlify:** Criar arquivo `_redirects` na pasta `public`:
```
/*    /index.html   200
```

---

### Erro: "CORS" ao carregar iframe

**Causa:** O Comissões pode estar bloqueando o iframe.

**Solução:** Verificar headers de segurança e permitir embedding.

---

### Erro: Variáveis de ambiente não funcionam

**Causa:** Variáveis com prefixo `VITE_` são embutidas no build.

**Solução:** 
1. Certifique-se que as variáveis começam com `VITE_`
2. Faça redeploy após adicionar/alterar variáveis

---

### Build falha com "Module not found"

**Causa:** Dependências não instaladas.

**Solução:** 
1. Verifique se o `package.json` está correto
2. Delete `node_modules` e `package-lock.json`
3. Execute `npm install` novamente

---

## ✅ Checklist Final

### Antes do Deploy

- [ ] Repositório atualizado no GitHub
- [ ] Variáveis de ambiente documentadas
- [ ] Testado localmente (`npm run build` sem erros)

### Deploy do Comissões

- [ ] Root Directory: `relatorios/comissoes`
- [ ] Variáveis de ambiente configuradas
- [ ] Build com sucesso
- [ ] URL anotada

### Atualização do Hub

- [ ] URL do Comissões atualizada em `hub/src/config/relatorios.ts`
- [ ] Commit e push realizados

### Deploy do Hub

- [ ] Root Directory: `hub`
- [ ] Build com sucesso
- [ ] Teste de acesso ao portal
- [ ] Teste de carregamento do Comissões no iframe

### Validação Final

- [ ] Acessar URL do Hub
- [ ] Clicar em "Dashboard de Comissões"
- [ ] Verificar se carrega corretamente
- [ ] Testar filtros e dados

---

## 📊 URLs de Produção

Após o deploy, preencha aqui as URLs finais:

| Aplicação | URL de Produção |
|-----------|-----------------|
| **Hub (Portal)** | `https://___________________` |
| **Comissões** | `https://___________________` |

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs de build na plataforma de deploy
2. Consulte a documentação da plataforma (Vercel/Netlify)
3. Revise este guia

---

**Última atualização:** Fevereiro 2026  
**Autor:** GoWork Sistemas
