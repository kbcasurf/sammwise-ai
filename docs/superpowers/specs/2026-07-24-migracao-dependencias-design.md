# Migração e atualização completa de dependências do SAMMwise

**Data:** 2026-07-24
**Status:** Aprovado, pronto para plano de implementação

## Contexto

O SAMMwise é uma aplicação Next.js 10 / React 16, 100% client-side (sem backend, sem
banco de dados, sem rotas de API), que implementa a calculadora de maturidade OWASP SAMM.
O `npm audit` reporta 39 vulnerabilidades (9 críticas). Rodar `npm run dev`/`build` com
Node 17+ falha com `error:0308010C:digital envelope routines::unsupported` (conflito
OpenSSL 3.x vs. o hash MD4 usado pelo webpack embutido no Next 10), o que só não foi
notado antes porque o único ambiente testado até então era o Docker, fixado em
`node:16.13-alpine`.

O componente central do app (`comps/surveyTypes/surveytypeone.js`) usa `survey-react`
(descontinuado pela SurveyJS em favor de `survey-core` + `survey-react-ui`) e manipula
diretamente o DOM/classes CSS geradas por ele (`document.getElementsByTagName("h4")`,
classes como `sv_main`) para implementar navegação customizada de painéis
(colapsar/expandir, botões "Next/Previous Practice"). O tema V2 do `survey-core` renderiza
HTML/classes nativas diferentes, então essa lógica não pode ser apenas re-importada —
precisa ser reescrita.

## Objetivo

Modernizar completamente o stack (motivador: segurança **e** atualização, igualmente),
eliminando vulnerabilidades conhecidas e saindo de dependências descontinuadas, mantendo
o comportamento/UX atual da aplicação (especialmente do fluxo de assessment) o mais fiel
possível.

## Escopo

**Dentro do escopo:**
- Limpeza de dependências mortas e não utilizadas
- Substituição de `reflexbox`/`rebass` por CSS puro
- Atualização de libs ativas para versões atuais
- Substituição de `survey-react` por `survey-core` + `survey-react-ui`
- Upgrade de Next.js (10 → mais atual, 16.2.11 no momento) e React (16 → 19.2.8,
  peer dependency obrigatória do Next 16)
- Atualização do Dockerfile (base image, `npm ci`) e do requisito de Node no CI
- Criação de uma suíte E2E mínima (Playwright) como rede de segurança, com gate no CI

**Fora do escopo (explicitamente adiado):**
- Migração de Pages Router para App Router — decisão explícita de manter Pages Router,
  já que o app é pequeno e não usa recursos server-side que justifiquem a mudança
- Testes de regressão visual automatizados (pixel-diff) — validação visual será manual
- **Feature de persistência em banco de dados** (armazenar avaliações em SQLite ou
  similar para comparação histórica) — é uma feature nova e arquiteturalmente distinta
  (introduz a primeira camada de backend/persistência do app), tratada em um
  brainstorming e spec **separados**, a começar após esta spec ser commitada

## Decisões registradas

| Decisão | Escolha |
|---|---|
| Motivador principal | Segurança e modernização, igualmente |
| Rede de segurança | Escrever testes E2E (Playwright) **antes** de migrar, cobrindo o comportamento atual |
| Roteamento | Manter Pages Router |
| Estratégia de execução | Incremental, em etapas — cada etapa é seu próprio PR, revertível isoladamente |
| Ordem das etapas | "Risco primeiro" — migrar o survey-react ainda em Next 10/React 16, antes de subir o framework |
| UX do survey | Preservar comportamento atual (não simplificar usando os padrões nativos do survey-core) |
| Infra/CI | Atualizar Dockerfile e pipelines junto, na última etapa |
| Alvo de versões | Sempre a mais atual estável disponível (Next 16.2.11 / React 19.2.8 / Node ≥20.9.0), com paradas intermediárias apenas como plano B se o salto direto gerar breaking changes demais para revisar de uma vez |

## Etapas

Cada etapa é um PR próprio, mergeado somente após a suíte E2E (a partir da Etapa 2)
passar contra ele.

### Etapa 1 — Housekeeping

- **Remover** (dependências mortas, confirmadas sem nenhum import no código):
  `chart.js`, `chartjs-gauge`, `@progress/kendo-drawing`, `@progress/kendo-licensing`,
  `@progress/kendo-react-pdf`, `react-file-drop`, `rebass`
- **Substituir por CSS puro**: `reflexbox` (`Flex`/`Box`, usado em 3 arquivos) — pacote
  abandonado (última versão publicada é a mesma já pinada, 4.0.6, de 2019)
- **Atualizar** (libs ativas):
  - `react-dropzone` 11.3.2 → 14.x
  - `react-to-print` 2.12.6 → 3.3.0
  - `react-gauge-chart` 0.3.0 → 0.5.1
- Rodar `npm audit fix` (sem `--force`) e reavaliar o que restar no relatório

### Etapa 2 — Rede de segurança E2E

- Adicionar `@playwright/test`, pasta `e2e/`, script `npm run test:e2e`
- Cobrir os fluxos: home → iniciar assessment; responder os 5 domínios + Details;
  **navegação de painéis** (colapsar/expandir, botões Next/Previous Practice — prioridade
  máxima, é a parte mais frágil); navegação direta via navbar; salvar respostas (download)
  e recarregar (upload); "Clear answers"; completar → redirecionamento para `/results`;
  gráficos e impressão em `/results`
- Adicionar job no GitHub Actions rodando essa suíte em cada PR, para que as etapas 3-5
  fiquem automaticamente barradas por ela

### Etapa 3 — Migração do motor de survey

- Trocar `survey-react` → `survey-core` + `survey-react-ui` (mesma versão entre os dois)
- Trocas mecânicas: `Survey.Model` → `Model` (de `survey-core`), `<Survey.Survey>` →
  `<Survey>` (de `survey-react-ui`), CSS de tema
- A API de eventos usada (`onCurrentPageChanged`, `onAfterRenderPanel`,
  `onUpdateQuestionCssClasses`, `onValueChanged`, `panel.collapse()/.expand()`) foi
  preservada pela SurveyJS — só a renderização/DOM mudou
- **Reescrever**: dentro de `onAfterRenderPanel`, trocar a busca por `<h4>` via
  `document.getElementsByTagName` + comparação de texto por acesso direto a
  `options.panel.title`/`options.htmlElement` (mais robusto que o original)
- **Ajustar CSS nativo**: `.sv_main` em `styles/globals.css` é uma classe nativa do
  `survey-react` antigo (diferente de `.sq-*`, que são nomes customizados injetados pelo
  próprio app e continuam funcionando) — precisa ser re-targetada para a classe raiz
  equivalente do tema V2
- Validar contra a suíte E2E da Etapa 2; passada visual manual complementar

### Etapa 4 — Upgrade de Next.js e React

- Tentar `npx @next/codemod@latest upgrade latest` (Next 10 → 16.2.11, React → 19.2.8)
  em um salto só, validado pela suíte E2E
- Se o codemod gerar breaking changes demais para revisar de uma vez, recuar para
  paradas intermediárias (ex: Next 12/14) apenas até a suíte E2E voltar a passar, e
  então continuar
- Atenção: React 18+ com Strict Mode invoca effects em dobro em modo dev — o componente
  do survey usa `sessionStorage` dentro de `useEffect`/handlers, o que pode expor
  duplicações que hoje passam despercebidas. Validar também rodando `npm run dev`
  manualmente, não só o build de produção
- Bônus esperado: o workaround `NODE_OPTIONS=--openssl-legacy-provider` deixa de ser
  necessário

### Etapa 5 — Docker e CI

- Dockerfile: `node:16.13-alpine` → `node:22-alpine` (LTS ativa, compatível com o
  `engines >= 20.9.0` do Next 16)
- Trocar `RUN npm install --frozen-lockfile` → `RUN npm ci` — `--frozen-lockfile` **não
  é uma flag válida do npm** (é sintaxe do Yarn); confirmado que o npm hoje só emite um
  aviso e segue com um install normal, sem de fato travar no lockfile
- Adicionar `"engines": { "node": ">=20.9.0" }` ao `package.json`
- Manter a estrutura multi-stage e o usuário não-root `nextjs`
- GitHub Actions e Azure Pipelines buildam a mesma imagem Docker — o bump do Dockerfile
  já os cobre; ajustar o job de E2E (Etapa 2) para usar Node 22.x no runner

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Nenhum teste existia antes desta spec | Etapa 2 cria a suíte E2E antes de qualquer mudança de risco |
| Reescrita da navegação de painéis do survey pode quebrar UX silenciosamente | Suíte E2E cobre esse fluxo com prioridade máxima; passada visual manual complementar |
| Rodar `survey-react` (descontinuado) sob React mais novo | Evitado pela ordem "risco primeiro" — survey migrado antes do upgrade de framework |
| Salto direto Next 10 → 16 pode gerar breaking changes demais de uma vez | Fallback documentado: paradas intermediárias guiadas pela suíte E2E |
| Build Docker não é tão determinístico quanto parece (`--frozen-lockfile` inválido) | Corrigido na Etapa 5 com `npm ci` |

## Próximos passos

1. Auto-revisão desta spec e commit no repositório
2. Revisão do usuário
3. Quando solicitado, invocar a skill `writing-plans` para transformar esta spec em um
   plano de implementação detalhado, etapa por etapa
4. Após esta spec ser commitada, iniciar um **novo brainstorming**, independente, para a
   feature de persistência em banco de dados (fora do escopo aqui)
