# Cloud Sync V1.3

O Caderno Musical continua **local-first**. Sem conta ou sem conexão, os quatro conjuntos existentes permanecem no `localStorage`; ao autenticar, o navegador sincroniza uma cópia privada com o Supabase.

## Configuração

1. Copie `.env.example` para `.env.local` e preencha a URL e a publishable key do projeto.
2. Execute `supabase/migrations/202608130001_cloud_sync.sql` no projeto Supabase (CLI ou SQL Editor).
3. Em Authentication, habilite Email. Se a confirmação de e-mail estiver ativa, configure a Site URL e os Redirect URLs do ambiente.

Nunca coloque a `service_role` no frontend. O cliente usa apenas a publishable key; todas as tabelas têm RLS e o bucket `study-materials` é privado.

## Mapa de dados

| Dado local | Destino remoto | Estratégia |
| --- | --- | --- |
| Progresso e revisão | `study_states.content` | um JSON versionado por usuário |
| Caderno | `notebook_notes` | uma linha por anotação |
| Ateliê | `atelier_boards.content` | uma linha por quadro, elementos em JSON |
| Material | `study_materials` + bucket privado | metadados na tabela, arquivo em `user_id/material_id` |

Na primeira entrada com dados locais, a interface pede autorização antes de migrar. A migração combina registros pelo ID, usa `updated_at` como desempate, envia o arquivo antes dos metadados e só grava o marcador local ao terminar. É idempotente e não apaga a cópia local.

Depois disso, alterações locais são agrupadas por 1,2 segundo. Ao abrir em outro dispositivo, vence o conjunto com alteração mais recente; exclusões só são propagadas depois da inicialização da conta, evitando que um primeiro acesso vazio apague dados remotos.
