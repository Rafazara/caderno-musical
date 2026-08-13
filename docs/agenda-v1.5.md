# Agenda & Diário de Aprendizado V1.5

## Modelo e persistência

A Agenda é a quinta coleção local (`caderno-musical:agenda`). Cada `StudyEvent` contém o compromisso e os blocos serializáveis de preparação, conteúdo, reflexão, tarefas, referências, recorrência e lembretes. A cópia remota usa uma única tabela `study_events`; os campos consultáveis ficam em colunas e o restante em `content jsonb`.

A migration `202608130002_study_agenda.sql` cria tabela, índice e políticas RLS para `authenticated`. O sync reutiliza debounce, merge por `updatedAt`, exclusões pós-inicialização e funcionamento offline da V1.3.

## Recorrência

Semanal e quinzenal são materializadas como ocorrências independentes com o mesmo `seriesId`. Assim, cancelar ou editar uma data não muda as demais. Uma série sem fim cria um horizonte de dois anos (máximo de 106 ocorrências); uma versão futura pode estender o horizonte ao se aproximar do fim.

## Datas

Valores de formulários `YYYY-MM-DD` são montados com o construtor local de `Date`, nunca interpretados como UTC. No armazenamento e no banco, início e fim são ISO/timestamptz, acompanhados do timezone IANA capturado no navegador.

## Lembretes

O canal `in_app` funciona no cliente e não depende de serviço externo. O canal `email` existe em `ReminderSettings`, mas fica desativado. Para ativá-lo com segurança:

1. escolher um provedor transacional;
2. manter a API key apenas em uma Edge Function ou servidor;
3. executar um job periódico que leia eventos elegíveis usando credenciais server-side;
4. persistir a chave idempotente `event_id:offset:email` antes do envio;
5. enviar apenas horário, preparação e uma referência curta, com link para o app.

Nenhuma chave de e-mail deve ser exposta com prefixo `NEXT_PUBLIC_`. A ausência desse provedor não afeta a Agenda.

## Referências

Recursos são vinculados por `{ kind, id, label, href? }`; não são duplicados. Referências ausentes continuam legíveis pelo label salvo. A tela da aula oferece atalhos para criar uma anotação, quadro ou material e permite relacionar os itens existentes.
