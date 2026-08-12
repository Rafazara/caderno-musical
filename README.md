# Caderno Musical

Caderno digital de teoria musical. Estudo ativo: o app não só mostra conteúdo —
ele pergunta, corrige e explica o porquê, e guarda o que você errou para você
praticar de novo.

**Escopo da V1:** leitura de notas em clave de sol, escalas maiores (Dó, Sol, Ré
e Fá), tom e semitom, fundamentos, material da professora, anotações, revisão de
erros e progresso. Sem escalas menores, sem login, sem backend — tudo salvo no
próprio navegador.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

Outros comandos:

```bash
npm run build      # build de produção
npm run start      # serve o build
npm run lint       # ESLint
```

## Arquitetura

```
app/                        rotas (App Router, Next.js 16)
  page.tsx  home-view.tsx     Início
  leitura-de-notas/           prática de leitura
  escalas-maiores/            conteúdo + exercícios + ordenação
  tom-e-semitom/              prática de intervalos
  revisar/                    "praticar somente o que errei"
  fundamentos/[slug]/         conteúdo didático
  material/                   upload e anotação do material de aula
  caderno/                    anotações pessoais
  progresso/                  estatísticas

lib/music/                  domínio: notas, pentagrama, escalas, intervalos
lib/study/                  estado de estudo, sessões, geradores de questões
lib/storage/                persistência em localStorage
lib/content/                texto dos fundamentos
components/music/           pentagrama, teclado, fita de escala, ciclo de quintas
components/study/           motor de exercícios compartilhado
components/ui/              primitivos (Button, Card, Modal, …)
```

### Duas decisões que explicam o resto

**As escalas são construídas, não tabeladas.** `lib/music/scales.ts` deriva cada
escala maior andando pelas sete letras e ajustando com sustenidos ou bemóis até
as distâncias baterem com a fórmula T-T-S-T-T-T-S. É por isso que Sol maior sai
com Fá♯ sem nenhuma tabela codificada à mão — e é o mesmo raciocínio que os
exercícios pedem ao aluno. Acrescentar Lá maior é só uma entrada em `SCALES`.

**Os erros são reconstruídos a partir de uma chave.** O localStorage guarda só a
chave do item errado (`G4`, `escala:G:4`, `E4-F4`). A revisão remonta o enunciado,
as alternativas e a explicação através de `lib/study/generators`. Assim o
histórico fica pequeno e nunca desatualizado em relação ao conteúdo.

### Persistência

Três chaves em `localStorage`, cada uma envelopada com uma versão de formato:

| Chave                       | Conteúdo                                  |
| --------------------------- | ----------------------------------------- |
| `caderno-musical:study`     | tentativas, fila de erros, dias de estudo |
| `caderno-musical:notebook`  | anotações pessoais                        |
| `caderno-musical:material`  | material da professora (arquivos inclusos)|

Leitura via `useSyncExternalStore`, não via efeito — o React lê o valor real na
renderização e usa o snapshot do servidor durante a hidratação.

**Limite de espaço:** o navegador dá cerca de 5 MB. Imagens são redimensionadas
para 1400 px e recomprimidas em JPEG 75% antes de salvar (uma foto de 500 KB cai
para ~60 KB). PDFs não podem ser recomprimidos, então são recusados acima de
2,5 MB, com aviso explícito.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
lucide-react. Fontes: Fraunces (títulos) e Inter (interface).

Os componentes de UI seguem as convenções do shadcn/ui mas são escritos à mão,
para casar com a paleta de papel e tinta em vez de sobrescrever um tema padrão.
