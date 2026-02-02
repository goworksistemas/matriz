# 🎨 Guia de Temas - NetworkGo

Este documento descreve a paleta de cores, variáveis CSS e regras estruturadas para os dois temas do sistema (Claro e Escuro).

---

## 📋 Índice

1. [Visão Geral do Sistema de Temas](#visão-geral-do-sistema-de-temas)
2. [Paleta de Cores](#paleta-de-cores)
3. [Variáveis CSS](#variáveis-css)
4. [Classes de Tema](#classes-de-tema)
5. [Regras por Contexto](#regras-por-contexto)
6. [Componentes Específicos](#componentes-específicos)
7. [Animações](#animações)
8. [Boas Práticas](#boas-práticas)

---

## 🔄 Visão Geral do Sistema de Temas

### Arquitetura
- **Framework CSS**: Tailwind CSS v3
- **Modo Dark**: `class` (classe aplicada no elemento `<html>`)
- **Gerenciamento**: React Context (`ThemeProvider`)
- **Persistência**: localStorage (`networkgo-theme`)
- **Padrão**: Dark mode

### Arquivos Principais
| Arquivo | Descrição |
|---------|-----------|
| `src/index.css` | Variáveis CSS e regras globais de tema |
| `tailwind.config.js` | Configuração Tailwind e cores customizadas |
| `src/contexts/ThemeContext.tsx` | Contexto React para gerenciamento |
| `src/hooks/useTheme.ts` | Hook de acesso ao tema |
| `src/acesso_publico/custom-datepicker.css` | DatePicker tema claro |
| `src/pages/custom-datepicker-dark.css` | DatePicker tema escuro |

### Como Funciona
```
html.dark → Tema escuro (sistema interno)
html.light → Tema claro (sistema interno)
.public-page → Força tema claro (páginas externas/públicas)
.auth-page → Força tema claro (telas de login)
```

---

## 🎨 Paleta de Cores

### Cores Primárias (Primary - Azul)

| Token | Hex | Uso |
|-------|-----|-----|
| `primary-50` | `#f0f9ff` | Backgrounds muito sutis |
| `primary-100` | `#e0f2fe` | Backgrounds hover leves |
| `primary-200` | `#bae6fd` | Borders sutis, estados ativos leves |
| `primary-300` | `#7dd3fc` | Ícones secundários |
| `primary-400` | `#38bdf8` | Elementos de destaque |
| `primary-500` | `#0ea5e9` | **COR PRINCIPAL - Botões, links** |
| `primary-600` | `#0284c7` | Botões hover |
| `primary-700` | `#0369a1` | Botões active/pressed |
| `primary-800` | `#075985` | Textos de destaque |
| `primary-900` | `#0c4a6e` | Textos escuros de marca |

### Escala de Cinza (Gray)

| Token | Hex Light | Hex Dark | Uso |
|-------|-----------|----------|-----|
| `gray-50` | `#f9fafb` | `#374151` | Background secundário |
| `gray-100` | `#f3f4f6` | - | Background terciário |
| `gray-200` | `#e5e7eb` | - | Bordas leves |
| `gray-300` | `#d1d5db` | - | Bordas, divisores |
| `gray-400` | `#9ca3af` | `#9ca3af` | Texto muted, placeholders |
| `gray-500` | `#6b7280` | - | Texto terciário |
| `gray-600` | `#4b5563` | - | Texto secundário |
| `gray-700` | `#374151` | - | Texto principal (light) |
| `gray-750` | `#243240` | - | Variação customizada |
| `gray-800` | `#1f2937` | - | Background cards (dark) |
| `gray-900` | `#111827` | - | Background principal (dark) |

### Cores Semânticas

| Categoria | Light | Dark | Uso |
|-----------|-------|------|-----|
| **Sucesso** | `#10b981` (green-500) | `#34d399` (green-400) | Estados de sucesso |
| **Perigo** | `#ef4444` (red-500) | `#f87171` (red-400) | Erros, ações destrutivas |
| **Alerta** | `#f59e0b` (amber-500) | `#fbbf24` (amber-400) | Avisos |
| **Info** | `#3b82f6` (blue-500) | `#60a5fa` (blue-400) | Informações |

---

## 🔧 Variáveis CSS

### Tema Claro (`:root`)

```css
:root {
  color-scheme: light;
  
  /* React-Select */
  --select-bg: #ffffff;
  --menu-bg: #ffffff;
  --border-color: #d1d5db;
  --text-color: #111827;
  --placeholder-color: #9ca3af;
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --gray-50: #f9fafb;
  --danger-color: #ef4444;
  
  /* Cores do sistema */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
}
```

### Tema Escuro (`html.dark`)

```css
html.dark {
  color-scheme: dark;
  
  /* React-Select */
  --select-bg: #374151;
  --menu-bg: #1f2937;
  --border-color: #4b5563;
  --text-color: #f3f4f6;
  --placeholder-color: #9ca3af;
  --primary-50: rgba(59, 130, 246, 0.1);
  --primary-100: rgba(59, 130, 246, 0.2);
  --gray-50: #374151;
  --danger-color: #f87171;
  
  /* Cores do sistema */
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-muted: #9ca3af;
}
```

### Backgrounds Dark Mode (Tailwind Extend)

```css
/* Definidos em tailwind.config.js */
bg-dark: #121212
bg-dark-card: #1E1E1E
bg-dark-hover: #2A2A2A
```

---

## 🏷️ Classes de Tema

### Classes Base

| Classe | Aplicação | Efeito |
|--------|-----------|--------|
| `html.light` | Elemento `<html>` | Ativa tema claro globalmente |
| `html.dark` | Elemento `<html>` | Ativa tema escuro globalmente |
| `.public-page` | Container de página | **Força tema claro** - sobrescreve dark mode |
| `.auth-page` | Páginas de login | **Força tema claro** - sobrescreve dark mode |

### Prefixos Tailwind Dark Mode

Usar prefixo `dark:` para estilos condicionais:

```html
<!-- Exemplo -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Conteúdo
</div>
```

---

## 📄 Regras por Contexto

### 1. Sistema Interno (Logado)

**Contexto**: Usuários autenticados no painel administrativo

| Elemento | Light Mode | Dark Mode |
|----------|------------|-----------|
| Body | `bg-gray-50 text-gray-900` | `bg-gray-900 text-gray-100` |
| Cards | `bg-white` | `bg-gray-800` |
| Bordas | `border-gray-200` | `border-gray-700` |
| Inputs | `bg-white text-gray-900` | `bg-gray-700 text-white` |
| Placeholders | `text-gray-400` | `text-gray-400` |

### 2. Páginas Públicas (`.public-page`)

**Contexto**: Portal do cliente, formulários externos

| Elemento | Valor Forçado |
|----------|---------------|
| Background | `#ffffff` |
| Texto principal | `#1f2937` |
| Inputs | `bg-white text-gray-800` |
| Labels | `text-gray-700` |
| Headings (h1-h5) | `#111827` |
| Parágrafos | `#4b5563` |
| Bordas | `border-gray-200 / border-gray-300` |

**Exceções preservadas**:
- `.text-white` - mantém branco
- Classes de cor explícitas (`text-blue-*`, `text-green-*`, `text-red-*`)

### 3. Telas de Autenticação (`.auth-page`)

**Contexto**: Login, reset de senha, registro

| Elemento | Valor Forçado |
|----------|---------------|
| Background | Gradiente azul claro (`#eff6ff → #dbeafe → #bfdbfe`) |
| Cards | `bg-white` |
| Inputs | `bg-white text-gray-800` |
| Labels | `text-gray-700` |
| Textos | `text-gray-900`, `text-gray-600` |

---

## 🧩 Componentes Específicos

### React-Select

#### Tema Claro
```css
.react-select__control { background: #ffffff; border-color: #d1d5db; }
.react-select__menu { background: #ffffff; }
.react-select__option { color: #111827; }
.react-select__option--is-focused { background: #eff6ff; }
```

#### Tema Escuro
```css
html.dark .react-select__control { background: #374151; border-color: #4b5563; }
html.dark .react-select__menu { background: #1f2937; }
html.dark .react-select__option { color: #f3f4f6; }
html.dark .react-select__option--is-focused { background: rgba(59, 130, 246, 0.1); }
```

### DatePicker

#### Tema Claro (Páginas Públicas)
| Elemento | Cor |
|----------|-----|
| Header | `bg-gray-50`, text `#1f2937` |
| Calendário | `bg-white`, border `#e5e7eb` |
| Dias | `text-gray-800` |
| Dia selecionado | `bg-blue-500 text-white` |
| Hoje | `border-blue-500` |
| Desabilitado | `text-gray-400 opacity-40` |

#### Tema Escuro (Sistema Interno)
| Elemento | Cor |
|----------|-----|
| Header | `bg-gray-800`, text `white` |
| Calendário | `bg-gray-800`, border `#374151` |
| Dias | `text-gray-200` |
| Dia selecionado | `bg-blue-500 text-white` |
| Hoje | `border-blue-500` |
| Desabilitado | `text-gray-600 opacity-40` |

### Inputs e Forms

#### Tema Claro
```css
input { color: #1f2937; background: #ffffff; }
input::placeholder { color: #9ca3af; }
input:focus { border-color: #3b82f6; }
```

#### Tema Escuro
```css
input { color: #ffffff; background: #374151; }
input::placeholder { color: #9ca3af; }
input:focus { border-color: #3b82f6; }
```

---

## ✨ Animações

### Animações Disponíveis

| Classe | Duração | Descrição |
|--------|---------|-----------|
| `.animate-fade-in` | 0.5s | Fade in simples |
| `.animate-slide-up` | 0.5s | Slide de baixo + fade |
| `.animate-fade-in-up` | 0.5s | Combinação fade + slide up |
| `.animate-scale-in` | 0.2s | Scale de 0.95 para 1 + fade |
| `.animate-slide-in-from-bottom` | 0.3s | Modal mobile (de baixo) |
| `.animate-slide-in-from-top` | 0.2s | Dropdown (de cima) |
| `.animate-shake` | 0.5s | Shake horizontal (erros) |
| `.animate-shimmer` | 2s infinite | Efeito shimmer/skeleton |
| `.animate-pulse-glow` | 1.5s infinite | Pulso luminoso |
| `.animate-ping-slow` | 1.5s infinite | Badge NEW - onda 1 |
| `.animate-ping-slower` | 1.5s infinite | Badge NEW - onda 2 |
| `.animate-pulse-ring` | 2s infinite | Contorno pulsante expandindo |

### Definições Tailwind

```javascript
// tailwind.config.js
animation: {
  'scale-in': 'scale-in 0.2s ease-out',
  'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
  'bell-ring': 'bell-ring 0.5s ease-in-out',
  'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
  'fade-in': 'fade-in 0.2s ease-out'
}
```

---

## ✅ Boas Práticas

### 1. Usar Classes Dark Mode do Tailwind

```html
<!-- ✅ Correto -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">

<!-- ❌ Evitar -->
<div style="background: var(--bg-primary)">
```

### 2. Respeitar Hierarquia de Cores

```
Backgrounds:
- Nível 1 (base): bg-gray-50 / dark:bg-gray-900
- Nível 2 (cards): bg-white / dark:bg-gray-800
- Nível 3 (hover): bg-gray-100 / dark:bg-gray-700

Textos:
- Principal: text-gray-900 / dark:text-gray-100
- Secundário: text-gray-600 / dark:text-gray-400
- Muted: text-gray-400 / dark:text-gray-500
```

### 3. Bordas Consistentes

```html
<!-- Bordas padrão -->
<div class="border border-gray-200 dark:border-gray-700">

<!-- Bordas sutis -->
<div class="border border-gray-100 dark:border-gray-800">
```

### 4. Focus States (Removidos por padrão)

O sistema remove `ring` e `outline` em focus por padrão. Se precisar de indicação visual de focus, use bordas:

```html
<input class="focus:border-blue-500" />
```

### 5. Páginas Públicas

Sempre adicionar classe `.public-page` no container raiz:

```tsx
export function PublicPage() {
  return (
    <div className="public-page min-h-screen">
      {/* Conteúdo sempre será light mode */}
    </div>
  );
}
```

### 6. Uso do ThemeContext

```tsx
import { useTheme } from '@/hooks/useTheme';

function Component() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Tema atual: {isDarkMode ? 'Escuro' : 'Claro'}
    </button>
  );
}
```

### 7. PWA Theme Color

O meta theme-color é atualizado automaticamente:
- Dark: `#111827`
- Light: `#ffffff`

---

## 📊 Tabela Resumo de Cores

### Comparativo Light vs Dark

| Propriedade | Light Mode | Dark Mode |
|-------------|------------|-----------|
| **Background Base** | `#f9fafb` (gray-50) | `#111827` (gray-900) |
| **Background Card** | `#ffffff` (white) | `#1f2937` (gray-800) |
| **Background Hover** | `#f3f4f6` (gray-100) | `#374151` (gray-700) |
| **Texto Principal** | `#111827` (gray-900) | `#f9fafb` (gray-50) |
| **Texto Secundário** | `#4b5563` (gray-600) | `#d1d5db` (gray-300) |
| **Texto Muted** | `#9ca3af` (gray-400) | `#9ca3af` (gray-400) |
| **Borda Padrão** | `#e5e7eb` (gray-200) | `#4b5563` (gray-600) |
| **Borda Sutil** | `#f3f4f6` (gray-100) | `#374151` (gray-700) |
| **Cor Primária** | `#0ea5e9` (primary-500) | `#0ea5e9` (primary-500) |
| **Cor Primária Hover** | `#0284c7` (primary-600) | `#38bdf8` (primary-400) |
| **Danger** | `#ef4444` (red-500) | `#f87171` (red-400) |
| **Success** | `#10b981` (green-500) | `#34d399` (green-400) |

---

## 🔗 Referências

- [Tailwind CSS - Dark Mode](https://tailwindcss.com/docs/dark-mode)
- Arquivos do projeto:
  - `src/index.css`
  - `tailwind.config.js`
  - `src/contexts/ThemeContext.tsx`
