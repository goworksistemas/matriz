# Templates de Email - Supabase Auth

Templates HTML para os emails de autenticação do Supabase. Copie o conteúdo de cada arquivo e cole no painel do Supabase em **Authentication → Emails**.

## Mapeamento

| Arquivo | Tipo no Supabase | Subject sugerido |
|---------|------------------|-----------------|
| `confirm-signup.html` | Confirm sign up | Confirme seu cadastro |
| `invite-user.html` | Invite user | Você foi convidado para o ConectGo |
| `magic-link.html` | Magic link | Seu link de acesso - ConectGo |
| `change-email.html` | Change email address | Confirmar novo email |
| `reset-password.html` | Reset password | Redefinir senha |
| `reauthentication.html` | Reauthentication | Confirme sua identidade |

## Variáveis Supabase

- `{{ .ConfirmationURL }}` — URL do link de confirmação (usar no href do botão)
- `{{ .Email }}` — Email do usuário
- `{{ .SiteURL }}` — URL do site configurado
- `{{ .RedirectTo }}` — URL de redirecionamento
- `{{ .Token }}` — Token (evitar expor)
- `{{ .TokenHash }}` — Hash do token
- `{{ .Data }}` — Dados adicionais

## Como usar

1. Acesse **Supabase Dashboard → Authentication → Emails**
2. Selecione o tipo de email (ex: Reset password)
3. Clique em **source** para editar o HTML
4. Copie o conteúdo do arquivo correspondente
5. Cole no editor e salve
