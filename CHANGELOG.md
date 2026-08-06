# Changelog

All notable changes to `sp-ui-shell` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Nota histórica**: até `v0.6.x` a interface do Sovereign Pair era uma Web-UI em Vue 3.
> Em `v0.7.0` (2026-03-19) o diretório `vue-ui` foi deletado e a interface inteira foi
> reescrita do zero em Svelte 5 — esse é o marco zero da árvore genealógica real deste
> módulo. Versões anteriores a `0.7.0` pertencem ao monolito Python/Vue pré-Rust e não
> estão listadas aqui.

---

## [Unreleased] — Fix: Desktop CD nunca produziu um app de verdade

*Investigado em 2026-08-06 depois de o usuário não encontrar o app em `/Applications` no macOS. Descoberta: o workflow "Sovereign Desktop CD" (`release.yml`) nunca teve sucesso desde a modularização — todo o histórico de runs é falha/cancelado, e este repo nunca publicou uma release. Dois bugs independentes, ambos corrigidos nesta rodada.*

### Fixed — Gap Item 9 (`PENDING_GAPS_AND_ROADMAP.md`): build de produção sem os 5 repos irmãos
- **Problema**: `npm run build` do Shell executa `cp -r ../sp-ui-chat/build/* ...` (e mais 4 repos) esperando-os já buildados como diretórios-irmãos, mas `release.yml` só fazia checkout do próprio `sp-ui-shell` — falhava sempre com `cp: cannot stat '../sp-ui-chat/build/*': No such file or directory`, então `tauri build` nunca chegava no estágio de empacotar o app de verdade.
- **Fix**: `publish-tauri` agora faz checkout de `sp-ui-core` + os 5 remotes (`sp-ui-chat`, `sp-ui-vault`, `sp-ui-projects`, `sp-ui-rag`, `sp-ui-coding`) como diretórios-irmãos de `sp-ui-shell` (mesmo `$GITHUB_WORKSPACE`, `ref: main` fixo — não herda a tag/ref do Shell, que não existe nos repos irmãos), instala `sp-ui-core` uma única vez (consumido como source via `file:../sp-ui-core` por todos, sem precisar de 6 cópias) e builda os 5 remotes antes do `tauri-action`. `projectPath: sp-ui-shell` adicionado ao `tauri-action` pra apontar pro subdiretório correto.
- **Validado localmente** (git worktrees, sem tocar nos repos reais): os 5 remotes buildam com sucesso e `sp-ui-shell/build/assets/{sp_ui_chat,sp_ui_vault,sp_ui_projects,sp_ui_rag,sp_ui_coding}/` vêm com conteúdo real (20-27 arquivos cada) — o `cp -r` que sempre falhava agora funciona de ponta a ponta.

### Fixed — Sidecar do `sp-service` apontava para um repositório inexistente
- **Problema**: o step "Download & Scaffold Backend Sidecar" baixava de `https://github.com/sovereign-platform/sp-service/releases/...` — organização `sovereign-platform` não existe (o projeto é `personal-digital-sovereignty`), e o nome de asset esperado (`sp-service-<triple>`) não bate com o que `sp-service/ci.yml` publica (`sp-service-linux-amd64-binary`, `sp-service-windows-amd64-binary.exe`, `sp-service-macos-arm64-binary`). Resultado: download sempre falhava e o script **silenciosamente** gerava um binário dummy (`exit 0`) como sidecar — mesmo corrigindo o gap acima, o app resultante teria um backend fantasma.
- **Fix**: URL corrigida pra `personal-digital-sovereignty/sp-service`, nomes de asset alinhados com o que o `ci.yml` do backend realmente publica, e a triple do macOS corrigida de `x86_64-apple-darwin` (Intel, nunca compilado) pra `aarch64-apple-darwin` (Apple Silicon, o único target que `sp-service` builda — `macos-latest` também roda em Apple Silicon). Removido o fallback de binário dummy: `curl -fL` sem swallow de erro — **fail loud**, conforme a regra do projeto de nunca mascarar falha de dependência externa. Se o release do backend não existir pra aquela tag, o job falha de verdade em vez de publicar um app quebrado silenciosamente.
- **Validado**: `curl` contra a release real (`nightly`) retorna HTTP 200 pros 3 assets corrigidos.
- **Caveat encontrado durante a validação**: a release `v1.7.0-rc1` do `sp-service` (a que uma tag `v1.7.0-rc1` neste repo tentaria consumir) **não tem nenhum asset** — `publish-stable` do `sp-service` nunca rodou de verdade (histórico de runs é só `push main`, nunca `push tags/*`). Testar o pipeline completo via tag real vai falhar até alguém cortar uma tag de verdade no `sp-service` primeiro (ou usar `workflow_dispatch` com `backend_tag: nightly`, que já tem assets).

### Fixed — 2 bugs adicionais achados ao rodar o pipeline de verdade (`workflow_dispatch`, `backend_tag: nightly`)
- **`tauri.conf.json` `resources: ["../../sp-service/python_workers/**/*"]`** não resolvia (glob vazio = erro fatal do `build.rs` do Tauri) porque `sp-service` nunca era checked out como irmão do workspace. Corrigido com checkout sparse (só `python_workers/`).
- **Windows**: `npm run build` falhava com "The syntax of the command is incorrect" — o script usava `mkdir -p`/`cp -r` (POSIX, incompatível com `cmd.exe`). Substituído por `scripts/bundle-remotes.mjs` (Node `fs.cpSync`, cross-platform de verdade).
- **Resultado real, confirmado em CI** (run `31061535829`, `workflow_dispatch`): as 3 plataformas completaram com sucesso pela primeira vez desde a modularização, gerando `.dmg`+`.app.tar.gz` (macOS), `.deb`+`.rpm`+`.AppImage` (Linux) e `.exe`(NSIS)+`.msi` (Windows) — publicados como release draft (`tag: main`).

---

## [1.7.0-dev] - 2026-08-04

*CI/CD hardening pós-tag `v1.6.0` (2026-06-18 a 2026-06-20), seguido de GAP-RS-02 e Item 7 (2026-08-01), da rodada de segurança abaixo (2026-08-04) e da correção de uma regressão de versão: uma sessão anterior havia renomeado esta entrada para `1.5.0-rc.1` (alinhando com a tag suite-wide cortada nos outros 7 repos), mas isso contradizia a correção documentada logo abaixo (`1.3.2` → `1.7.0-dev`, refletindo a tag real `v1.6.0` já shippada). Renomeado de volta para `1.7.0-dev` — a numeração deste repo segue sua própria linhagem, não a da suite.*

### Added
- **Painel "Resilience Shield" (GAP-RS-02)**: Nova seção em `engineer/analytics/+page.svelte` renderizando o status por-API do Resilience Shield (`telemetryState.apiEntries`), com badge e ícone distintos para `HEALTHY`/`UNREACHABLE`/`DEAD`/`EMPTY`/`SKIP` — antes esse dado era buscado do backend mas nenhum componente da UI o exibia.
- **`ROADMAP.md`**: criado do zero — não existia neste repo.

### Changed — GAP Item 7: Confiabilidade da Interface
- **Design System centralizado**: `app.css` (antes uma cópia própria de 164 linhas) agora importa `@sp/ui-core/theme.css`, fonte única compartilhada com os outros 5 repos de UI.
- **`svelte:component` modernizado**: painel Resilience Shield migrado pro dynamic-component nativo do Svelte 5 (`<StatusIcon />` via `{@const}`), removendo warning de depreciação.
- **`package.json`**: versão corrigida de `1.3.2` (desatualizada há meses) para `1.7.0-dev`, refletindo a tag real `v1.6.0` + trabalho em progresso.

### Fixed — GAP Item 7
- **6 violações de preto puro corrigidas**: `bg-black`/`text-black`/`#000` substituídos por equivalentes Slate (`bg-slate-950/*`) em `settings/prompts`, `engineer/distillation`, `engineer/system-logs`, `setup` — conforme regra "nunca preto puro" do `DESIGN_SYSTEM.md` recém-portado.

### Changed
- **Tauri Release Pipeline para `sp-service`**: Pipeline de release do Tauri adaptado e configuração do sidecar ajustada para consumir o binário do `sp-service` já extraído como módulo independente (`ec7a111c`).
- **Bundle de Remotes Federados Local**: Os módulos federados via Module Federation passam a ser empacotados (`bundle`) localmente no build de produção do Shell, em vez de depender de remotes servidos externamente (`2abc6791`).

### Fixed
- **CI — Shell Injection em `release.yml`**: Corrigida vulnerabilidade de shell injection no workflow de release e fixadas (pinned) as dependências do Tauri para evitar incompatibilidades de build (`89a38a29`).
- **CI — Checkout do `sp-ui-core`**: Pipeline passou a fazer checkout e symlink explícito da dependência `sp-ui-core` (branch especificada, `npm install` em vez de `npm ci`) para builds cross-repo funcionarem (`daa6278b`, `7777bfe1`).
- **CI — Shellcheck/Actionlint**: `pwd` citado corretamente no comando de link para satisfazer `shellcheck`/`actionlint`, junto com correções na config de build (`3d327ee7`).
- **CI — GitHub Status Check**: Adicionado publisher de status check no Gate FOSS DevSecOps; removidos emojis da descrição do status por causarem `422` na API do GitHub (`782f3271`, `6df5931c`).

### Added
- **Ignorar Extensões de Pacote Compilado**: `.gitignore` atualizado para ignorar extensões de pacotes de release compilados (`90a41bbe`).

### Security
- **Trivy (SCA)**: corrigidas 3 vulnerabilidades `HIGH` do gate `FOSS DevSecOps` — `CVE-2026-59869` (`js-yaml`, DoS) via bump para `^4.3.0`; `CVE-2026-48801`/`CVE-2026-59887` (`linkify-it`, DoS algorítmico/mailto) via override forçado para `5.0.2`. Revalidado localmente com Trivy v0.72.0 real: 0 vulnerabilidades.
- **Semgrep (SAST)**: `actions/checkout@v4` e `actions/setup-node@v4` fixados em SHA de commit em todos os workflows, resolvendo a regra `github-actions-mutable-action-tag`.
- **Correção do gate quebrado**: o SHA de `actions/setup-node` pinado acima estava incorreto (inexistente no repositório real), derrubando toda pipeline com "unable to resolve action". Corrigido para o SHA real de v4.1.0. Também pinados `dtolnay/rust-toolchain@stable` e `tauri-apps/tauri-action@v0`, que ainda estavam em tag mutável e continuavam bloqueando o gate Semgrep.

---

## [1.6.0] - 2026-06-10

*Epic: Sovereign Shell — Module Federation, `@sp/ui-core` e Fundação de CI/CD (2026-05-11 a 2026-06-10).*

> Esta é a mudança arquitetural mais significativa da história do módulo: o `sp-ui-shell`
> deixa de ser uma aplicação Svelte monolítica e passa a ser o **host** de Module
> Federation do Vite, consumindo os demais microfrontends (Chat, Projects, Vault, RAG,
> Coding) como remotes independentes — o nascimento formal da arquitetura federada
> descrita em `SOVEREIGN_PAIR_ARCHITECTURE.md`.

### Added
- **Vite Module Federation (Host)**: Configurado o host e os remotes do Module Federation no Vite, permitindo que o Shell consuma microfrontends compilados e versionados independentemente (`2f10e7c`).
- **Consumo dos Microfrontends Federados**: Integrados como remotes federados o módulo de Chat (`5408524`), Projects/Vault/RAG (`f5600b2`) e o módulo de Coding na navegação do shell (`4038c9b`).
- **`InlineSpotlight` Federado**: O componente `InlineSpotlight` (Spotlight Chat) passou a ser consumido diretamente do remote federado `sp_ui_chat` em vez de existir localmente no Shell (`2014f54`).
- **Lazy Loading Dinâmico de Remotes**: Implementada capacidade de carregamento tardio (lazy) para os módulos remotos federados, evitando payload inicial inflado (`fe657912`, Epic A).
- **Consumo Dinâmico de `/v1/models`**: O dropdown de seleção de modelo em Settings passou a consumir o endpoint `/v1/models` dinamicamente em vez de listas estáticas (`1cb8fdb5`, Epic L1).
- **Pipeline de CD do Tauri (Scaffold)**: Scaffold inicial do pipeline de Continuous Delivery do Tauri para release desktop multi-OS (`277d4bfe`, Epic B).
- **Gate FOSS DevSecOps**: Novo pipeline de CI com gate de merge obrigatório (`68db3624`) e hook de pre-push com Gitleaks (`e155f506`).

### Changed
- **Integração com `@sp/ui-core`**: O pacote compartilhado `@sp/ui-core` (estado e estilos, conforme diretriz de federação do `CLAUDE.md`) foi integrado ao Shell, resolvendo também um conflito de versão do Vite (`d20a0b49`).
- **Migração de Imports para `@sp/ui-core`**: Todos os imports de `env_config` e o restante dos imports de `$lib/*` foram migrados para `@sp/ui-core/config` e `@sp/ui-core/*`, eliminando a duplicação de lógica entre microfrontends (`51b808b`, `2443662`).
- **Formatação Padronizada (Prettier)**: Indentação e formatação de todo o código-fonte padronizadas via Prettier (`9085d92`, Epic L6).

### Fixed
- **Binário do Sidecar Tauri Fora do Git**: Removido um binário de 53 MB do sidecar do Tauri do repositório e adicionado ao `.gitignore` — o binário deve ser buildado, não versionado (`9c4a76f2`).
- **Código Morto em Fine-Tuning**: Removidos 3 blocos `{#if false}` de código morto (~200 linhas) e uma cópia quebrada do `BlockEditor` na página de fine-tuning (`3d776288`).
- **`console.log` de Debug**: Removidos logs de debug residuais do Cognitive Graph, das páginas raiz e do handler do stream SSE (`91cdcde7`, `769dccc2`).
- **CVE-2026-42570 (`devalue`)**: Dependência `devalue` atualizada para `5.8.1` corrigindo a vulnerabilidade, com o scan real do Trivy SCA restaurado no pipeline (`27fdcff4`).
- **Pipeline CI Instável**: Diversas correções de estabilização do FOSS DevSecOps Gate recém-criado — `npm install` em vez de `npm ci` (lockfile fora de sincronia após split do repo), trigger de push ausente, Trivy/Vitest tornados non-blocking, script bash com `if/fi` desbalanceado e linhas duplicadas corrigido (`f3a155cf`, `101ae2c5`, `163632e5`, `a8190425`, `6b50db8e`, `7d50c826`).

---

## [1.3.2] - 2026-04-29

*Epic: Sovereign Shield (Autonomous Testing), CI/CD Hardening, MacOS Intel Support & Unified SecOps Vault.*

### Added
- **Configurações de Provedores de Nuvem**: Adicionadas interfaces de Settings dedicadas para OpenRouter (`04b76ce6`, Epic 1 Fase 5), Alibaba Qwen (`2542636a`, Epic 2 Fase 3) e NVIDIA NIM (`e7a1db3c`, Epic 3 Fase 3).
- **Testes E2E dos Provedores**: Adicionados testes de validação E2E para as novas configurações de provedores e corrigida ambiguidade de headers duplicados nos testes existentes (`5032a393`, Epic 4 Fase 2).

### Changed
- **Settings Persistence**: Unificada a lógica de persistência de configurações para múltiplos provedores de nuvem no frontend Svelte.
- **Auto-Sync de Versão**: O badge de versão exibido na UI passou a ser sincronizado automaticamente a partir do `package.json` via `define` do Vite, eliminando divergência entre a versão real e a exibida (`9effc627`).

### Fixed
- **Bundle do Tauri (macOS)**: Corrigido o empacotamento dos `python_workers` no app bundle do macOS e a resolução de path em ambiente de desenvolvimento (`5e199175`).
- **Dependências Frontend (CVE Trivy HIGH)**: Bump de `cookie` (0.6 → 0.7.2) e `dompurify` (3.3.3 → 3.4.1) no frontend Svelte como parte do gate de segurança de dependências (`c12646d2`).

### Documentation
- **Auditoria de Código e Blueprints**: Completada auditoria de código em nível técnico e os blueprints de arquitetura correspondentes (`6e29276b`, Epic 5).

---

## [1.3.1] - 2026-04-25

*MacOS Visual Identity & Agentic Performance Hardening (Optional Deep Research & ReWOO).*

### Added
- **Optional ReWOO**: Controle granular sobre o planejamento multi-etapa; desativado por padrão, ativável via toggle na UI (`BrainCircuit`).
- **Triage de Trivialidade**: Camada Zero-Shot para detectar saudações/comandos simples e pular o acionamento de agentes pesados.

### Fixed
- **🍎 Ícone da Bandeja no MacOS**: Ícone do systray refatorado para transparência total e modo template nativo do macOS, adaptando-se automaticamente aos temas claro/escuro.
- **Comando `/web` Ignorado em Perguntas Curtas**: Corrigida anomalia onde o gatilho explícito de Deep Research era descartado pelo bloqueio de trivialidade.

### Changed
- **Default State "Fast First"**: Todos os fluxos agênticos pesados desativados por padrão em `state.svelte.ts`, priorizando latência de chat responsiva.

---

## [1.3.0] - 2026-04-20

*Epic: Resilience Shield, Hardware Telemetry, Oracle Cloud Integration & Selective Agentic Modalities.*

### Added
- **Resilience Shield / API Health Gate**: Painel de saúde de APIs consumindo o novo endpoint de health check do backend (`911fc698`), com 4 gaps de auditoria (GAP-RS) corrigidos em seguida (`f8fe1d84`).
- **Telemetria VRAM/RAM via Vulkan (`ash`)**: Isolado o tracking de contexto de VRAM/RAM usando hook do Vulkan `ash`, com fechamento de gaps técnicos residuais em duas rodadas de auditoria independente (`cf8a73fd`, `e2b5aba8`, `e17f0a4a`, `e98dcd42`).
- **Reflection Lab (SSE + Backend Real)**: Implementado o backend SSE e persistência SQLite do Reflection Lab, com 16 gaps de auditoria fechados entre Rust/Svelte/SQL (`17307351`, `78c9bd74`).
- **Settings Trilha C**: Configurações dinâmicas para P2P Mesh e OCI Sandboxing (`d3685953`).
- **Selective Agentic Modalities**: Controles dedicados na UI para Sovereign ReWOO (Plan & Execute) e Deep Research (Internet Access) — o sistema deixa de planejar automaticamente tarefas complexas, economizando VRAM/latência.
- **Native Chat Tool Dispatcher**: Chat regular ganha suporte nativo a ferramentas (Weather, Finance, Search) via interceptador de streaming SSE.

### Fixed
- **CSP e Path do Motor Matemático**: Corrigidos path do Vault e a Content Security Policy do "Accountant" (motor matemático) na estabilização gold do v1.3.0 (`33e0f790`).
- **Gating Explícito de ReWOO/Deep Research**: Implementado gate explícito com triagem de saudações, evitando disparo automático de fluxos agênticos pesados (`f742cf76`).

### Changed
- **P2P Mesh Connector Hot-Reloading**: Túneis Mesh reconfiguram portas P2P via Configurações Svelte/SQLite sem restart do processo.
- **DOMPurify Sanitization Benchmark**: Threshold do teste de performance de sanitização estabilizado (`eaf45f19`).

---

## [1.2.11] a [1.2.3] - 2026-04-14 a 2026-04-18

*Ciclo de estabilização do Deep Research/Scribe pipeline (majoritariamente backend `api_trainer.rs`), com correções pontuais de frontend e da suíte de testes.*

### Added
- **Model Operations Matrix — Expansão**: Tabela de controle de capacidades de modelos (Master/Scribe/Coder) expandida para controle completo de capacidades (`cf84d67d`, v1.2.4).
- **Prompt Vault + Scrape Limits**: Novos cards de configuração para o Prompt Vault e limites de scraping em Settings (`3512621a`).
- **Settings como Sub-Página do Engineer**: Refatoração de `Settings` para seguir o padrão de sub-página do módulo Engineer (`53d4df41`).
- **Viewer de Prompts**: Adicionado ícone "Eye" para visualizar qualquer prompt na coluna de Ações do Prompt Vault (`fffec12a`).
- **Botão de Exclusão Manual na Matrix**: Adicionado botão de exclusão manual de modelos na Model Operations Matrix (`eb87c77b`).
- **Suíte de Testes Abrangente (135+ testes)**: Cobertura formal de Segurança (JWT, SSRF, KMS, XSS, Path Traversal), Regressão (paths cross-platform, venv por OS), E2E/Exploratório e Acessibilidade WCAG 2.1 via Playwright, e Performance (DOMPurify, mount do Shell, navegação do Vault) — ver `svelte-ui/tests/e2e/security_accessibility.spec.ts` e `svelte-ui/src/lib/security.test.ts` (`62b3e639`, v1.2.9).
- **Self-Provisioning de Python**: Provisionamento automático de Python standalone via `python-build-standalone` (Astral) no sandbox (`77432b7f`, v1.2.11).

### Fixed
- **Chat Invisível (Mismatch Frontend↔Backend)**: O frontend salvava o modelo selecionado como `modelName`, mas o backend procurava `doctor_model`/`llm_model`. Corrigido com bridge `llm_model: settingsState.modelName` em `saveSettings()` (v1.2.8).
- **Resposta de Chat Vazia sem Feedback**: Guard adicionado em `state.svelte.ts` que detecta stream vazio e injeta mensagem diagnóstica ao usuário (v1.2.8).
- **Dropdown de Modelo Duplicado**: Removida opção estática duplicada e filtrados modelos de embedding (não chat-capable) do dropdown em `SettingsModal.svelte` (v1.2.8).
- **🍎 Prompt Vault Invisível no macOS**: Chamadas `fetch()` para `/v1/settings/prompts` não enviavam `Authorization: Bearer <token>`; header adicionado em `loadPrompts()`, `savePrompt()` e `deletePrompt()` (`svelte-ui/src/routes/settings/prompts/+page.svelte`, v1.2.9).
- **🍎 Badge de Versão Desatualizado**: Badge do Control Hub exibia `v1.1.0` fixo em vez da versão corrente; corrigido em `+layout.svelte` (v1.2.9).
- **🍎 Spotlight Chat sem Transparência (FIX-41)**: `InlineSpotlight.svelte` usava classes Tailwind inexistentes no projeto (CSS vanilla puro), resultando em modal sem estilo/blur/fechamento no WebKit do macOS. Reescrito com CSS nativo (glassmorphism via `backdrop-filter`) (`fec29f9d`).
- **Tauri CSP Desabilitada**: `csp: null` no `tauri.conf.json` permitia que XSS injetado no WebView tivesse acesso irrestrito ao IPC nativo; habilitada CSP restritiva com allowlist explícita de origens (`svelte-ui/src-tauri/tauri.conf.json`, Pass 2 audit, `09ddc2db`).
- **XSS via Conteúdo do LLM sem DOMPurify (P3-04)**: `{@html marked(...)}` renderizava conteúdo do LLM sem sanitização na página de RAG Pipeline; corrigido com `DOMPurify.sanitize()` (`8ab3d02e`, Pass 3 audit).

---

## [1.1.0] - 2026-04-09

*Data Compaction, Dynamic Decoupling & Cibrid Architecture Finalization.*

### Changed
- **Epic 2 — WAG Endpoint Decoupling**: Expurgados mais de 55 endpoints hardcoded (`127.0.0.1`/`localhost`) do backend e **35 requisições Axios/Fetch do frontend Svelte**. Toda a UI migrou para `$lib/env_config.ts` (`VITE_API_URL`, `VITE_OLLAMA_URL`), eliminando dependências geocêntricas de host (`cc24e964`).
- **Epic 10 — Autonomous Semantic Versioning & UI Sync**: Script `scripts/release.py` propaga a versão simultaneamente para `Cargo.toml`, `tauri.conf.json`/`package.json`, e espelha `CHANGELOG.md` em `svelte-ui/src/lib/` para consumo offline pelo `ChangelogModal` do Control Hub.
- **Epic 7 — WAG 2.0**: Parser on-the-fly intercepta chunks SSE da tag `<think>` do DeepSeek e renderiza via dropdown `<details>` estilizado, permitindo auditoria da cadeia de raciocínio sem poluir o texto de output.

### Fixed
- **Hotfix Pós-1.1.0**: Correções de loops cognitivos, métricas e telemetria logo após o corte da versão (`b5338c80`).

---

## [1.0.2] - 2026-04-08

*Hotfix: Anti-Hallucination & AI Tooling (majoritariamente backend `api.rs`).*

Sem alterações de frontend documentadas nesta versão — bump de versão em conjunto com correção de bounding da ferramenta de geração de imagem no motor Rust.

---

## [1.0.1] - 2026-04-08

*Frontend Stability & Model Agnosticism.*

### Changed
- **Kanban Agent Resurrection**: Substituído o modelo `qwen2.5:3b` hardcoded pelo `llama3.2:3b` como router universal nas rotas `ProjectAssistant` e `HubAssistant` (`f685b291`).

### Security
- **Alertas de Code Scanning**: Resolvidos alertas ativos do Dependabot e do Zizmor (`82565f0d`).

---

## [1.0.0] - 2026-04-06

*Release Candidate: True Autonomous Orchestration, CI/CD Polish, Desktop Integration ("The Sovereign V1 Master Release").*

### Added
- **Tauri Borderless Window**: Configuração de janela flutuante nativa (`transparent: true`, `decorations: false`, `alwaysOnTop: true`) inspirada em launchers como Spotlight/Raycast.
- **Systray Spotlight Chat**: `ChatPanel` extraído para uma rota dedicada minimalista (`/spotlight`) com transparência de fundo total (`backdrop-blur`).
- **System Tray Integration**: Gatilho nativo no backend do Tauri (`src-tauri/src/lib.rs`) permitindo invocar a IA a partir da bandeja do sistema, com dismiss automático ao perder foco.
- **KDE Plasma & Native Action Injection**: Hooks QML do widget Plasma chamam diretamente `/v1/system/launch-gui`, destravando interações nativas sob Wayland.
- **Deep Research Null-Safe Data Yielding**: Em caso de falha de busca com correlação financeira, o agente aborta e emite "Dado Faltante" diretamente no painel Svelte, evitando falsas verdades.

### Fixed
- **Universal Tool-Leak Interceptor**: Expandida a "Thought Nanny" para capturar JSON cru de `"type":"function"` vazado no corpo da resposta por SLMs genéricos, evitando crashes estruturais na UI durante a síntese final.

### Removed
- **Model Sanitation**: Padronizados os pesos locais de referência (`phi4:14b`, `llama3.2:3b`, `qwen2.5-coder:7b`, `deepseek-r1:7b`).

---

## [0.10.0] - 2026-04-05

*Sovereign Multimodal Vision Enablement (Phase G.1).*

### Added
- **Palette UI Bypass**: Ícone dedicado no `ChatPanel.svelte` que intercepta instruções de imagem e invoca o Daemon Multimodal sem gastar tokens de inferência do LLM principal (`ceea5aed`).
- **Systray Spotlight Floating Chat (Phase H)**: Chat flutuante acessível pela bandeja do sistema (`d21c4cda`).

### Fixed
- **Porta Hardcoded Incorreta**: Corrigido fallback de app root com porta `8080` hardcoded para `38001`, eliminando `ERR_CONNECTION_REFUSED` ao rodar via bypass do Tauri (`59253903`).
- **Vault Dual-Truth Persistence**: Renomeada a tabela de destino de `messages` para `chat_messages`, corrigindo persistência e reload da UI para imagens geradas.
- **Native Routing Repair (404)**: Corrigida a URL de mídia gerada que apontava para `/live`; corrigida para `/v1/vault/media`.

---

## [0.9.9] - 2026-04-02

*Sovereign WAG TurboQuant Evolution & Multi-Hop Ecosystem.*

### Added
- **TipTap: Imagens Base64 Inline**: Extensão de imagem do TipTap instalada para renderizar SVGs base64 gerados pelo Rust de forma segura e otimizada em memória (`13403db9`), com parsing HTML habilitado no Markdown (`20a43cf8`) e widget de decoração ProseMirror dedicado para gráficos inline (`ef29c94e`).
- **Sovereign UI Read-Only Gateway**: Editor web converte ZIPs binários (Office) para leitura em Markdown vivo via TipTap.
- **Tailwind Prose Typography**: Injetado `@tailwindcss/typography` no SvelteKit UI.
- **Glassmorphism Download Overlay**: Interceptador regex no `ChatPanel.svelte` que detecta tags `<img>` do Markdown e sobrepõe um overlay de download (`2ebc4248`).

### Changed
- **Nomenclatura de Plugins**: Plugins legados renomeados de "obsidian" para o ecossistema Sovereign (`e0bc9655`).
- **Purga de Apps Não Autorizados**: Removidas todas as referências a aplicativos de terceiros não autorizados (`28b693ab`).

### Fixed
- Quatro iterações sucessivas de correção do token de injeção de gráficos base64 (colisão com wikilinks, lexer de admonition, regex multiline para AST softbreaks) até a substituição final do parser DOM customizado pelo mapeamento nativo de URL do TipTap (`e84fb4c3`, `198c5b3a`, `a19f90d1`, `9b3aa9a8`).

---

## [0.9.8] - 2026-03-31

*Sovereign Multimodal Hybrid Architecture & Neural Architect (Dark Mode UI).*

### Added
- **Svelte Native Microphone (ASR)**: Componente `MicrophoneButton.svelte` na textarea principal do Chat, usando a API `MediaRecorder` do navegador para capturar áudio `webm` e transcrever via backend (`cc952f88`).
- **Universal Dark Theme**: Finalizada a topologia `darkMode: 'class'` no Tailwind v4, com persistência global de tema (`86637349`).
- **Markdown Callouts Dark Mode**: Estilos reversos para callouts do TipTap/Markdown (`[!info]`, `[!warning]`, `[!danger]`, `[!success]`).

### Fixed
- **Tabelas Markdown no Dark Mode**: Fundos escuros explícitos para tabelas no editor e no chat (`d8204ee7`).
- **Tri-Agent Dropdowns Ilegíveis**: Corrigida visibilidade dos seletores de IA (Doctor/Coder/Nurse) em System Settings contra fundo preto.
- **Badge de Versão**: Sincronizado `appVersion` para `0.9.8` (`8c39b0b9`).
- **Svelte 5 Runes & A11y**: Corrigidos erros de compilação de runes e labels de acessibilidade (`a597b64f`).

### Changed
- **Engineer Matrix Polish**: Cores semânticas M3 revisadas em todo o Hub de Engenharia para eliminar telas brancas no modo escuro.
- **Sidebar Spacing**: Espaçamento das rotas principais (Vault, Projects, Chat, Home) padronizado no Control Hub.

### Removed
- **`whisper-rs`**: Removida a dependência nativa que quebrava a compilação com Clang 22, substituída pelos workers Python isolados (`audio_transcriber.py`).
- **DOMPurify Dinâmico em Modais SSR**: `ChangelogModal`/`ManualModal` passaram a usar pré-processamento estático via `marked`.

### Security
- **CVEs em Dependências**: Bump de `lodash-es` e `picomatch` para corrigir vulnerabilidades de severidade alta (`8f3e1d98`).

---

## [0.9.7] - 2026-03-24

*Enterprise RAG Pipeline & Agentic Search Loop — grande epic de consolidação do Engineer Hub.*

### Added
- **Engineer Hub — Unificação**: RAG Engine e Model Trainer unificados em um único módulo Engineer (`0c51edc2`), com API e persistência de telemetria consolidadas (`c923564c`).
- **De-mock do Fine-Tuning e Unsloth Monitor**: UIs de Fine-Tuning e Unsloth Monitor de-mockadas e conectadas a telemetria real via Axum/SQLite (histogramas de VRAM, métricas de época, streaming de logs) (`f918aab6`, `abfd2b41`).
- **Reflection Lab — Telemetria Real**: Mocks removidos, com validação de dataset JSON, log streaming e remoção do botão de ação flutuante (`f826a788`).
- **Deep Research Orchestrator**: A aba de RAG Pipeline transformada em orquestrador generativo com telemetria SSE em tempo real e cancelamento via `tokio` (`35cdc8b3`, `298e722d`).
- **Chat: Botão de Parar Geração**: Botão "stop generation" com suporte a `AbortController` (`51c6cd44`).
- **Claude-like Reasoning UI**: Interface de raciocínio com desacoplamento de stream SSE via MPSC (`bc39cb5b`).
- **Boot Page Preferences**: Preferência de página de boot, modal de guia do usuário em Markdown e exportação em PDF (`ce7dc457`).
- **Telemetria AMD APU**: Leitura nativa de VRAM para APUs AMD integrada ao Trainer (`fad808d6`).

### Fixed
- **Svelte 5 State Module**: Substituída macro `derived` exportada inválida por uma função getter reativa (`c18fd215`), corrigindo também um import órfão que causava crash SSR 500 no Reflection Lab (`9521bb47`).
- **Sessão Recarregada no Meio do Stream**: Corrigido `$effect` que forçava reload do array de sessão durante streaming de chat novo (`4d4b5454`).

### Changed
- **Vault**: Controles segmentados para filtrar entre fontes e artefatos gerados por IA (`8f56737b`).
- **Identidade Visual Tauri**: Vetores de marca navy/indigo forjados para todos os alvos de OS (`372695ba`).

---

## [0.9.6] - 2026-03-24

*MacOS Compatibility & Zero-Shot Nodes.*

### Added
- **Zero-Shot Paperclip Node**: Anexos de texto/código (`.md`, `.rs`, `.py`, `.json`, `.csv`) carregados via `HTML5 FileReader` direto para o contexto do chat.
- **Native Changelog Modal**: Badge de versão no Control Hub vira botão que abre o histórico completo do `CHANGELOG.md`.
- **Semver UI Badge**: Badge minimalista no cabeçalho do Sidebar expondo a versão compilada pelo Vite (`5ac87ece`).

### Changed
- **Multi-Tenant Architecture / Deep Memory**: Interface Svelte passa a reconstruir o array completo do histórico de conversa por sessão; estado global `chatLayoutState` isolado por tenant (`7c6e83ad`).

---

## [0.9.3] - 2026-03-23

*Cross-Platform Pipeline Expansion.*

### Added
- **Native Sidecar (Phases 41-42)**: Emancipação da base do Tauri, permitindo orquestrar sub-rotinas compiladas do diretório de instalação (`36251ce1`).
- **Pipeline Cross-Platform Standalone**: Pontes de integração `tauri-cli` para gerar artefatos Windows (`.msi`/`.exe`) e AppImage.

### Fixed
- **Windows DOS Path**: Removido prefixo `\\?\` de paths canonicalizados no Windows ao resolver rotas do Vault (`f87aba2e`).

---

## [0.9.1] - 2026-03-22

*O Berço do Deep Research WAG.*

### Added
- **UI Research Toggle**: Gatilho booleano visual na caixa de texto do chat orquestrando a injeção sob demanda do Deep Research (`acd7736e`).
- **Model Trainer UIs & Mesh Trainer Engine**: Fase 37 de UIs do Model Trainer conectadas ao Mesh Trainer Engine (`7b0f90c9`).

### Fixed
- **Telemetria Mockada Removida**: Removida telemetria simulada de H100 e vinculado atalho de configurações de modelo (`984607cd`).

---

## [0.9.0] - 2026-03-22

*O Despertar do Protocolo MCP & Ollama Real Engine.*

### Added
- **SSE Progress Tracker**: Progresso de criação de modelo do Ollama transmitido em tempo real para o Model Trainer em Svelte 5.
- **Auto-Evaluator UI & Routing CRUD**: Modais de CRUD de roteamento e UI do Auto-Evaluator (LLM-as-a-Judge) (`bc516a87`).
- **Chat State em Background Worker + Notification Center**: Estado do chat abstraído para worker de background, com central de notificações cíbrida (`d98c0670`).
- **"Design Magestoso"**: Unificação visual com headers glassmórficos em todo o app (`e721df8c`, `1c1e0a5b`).

### Fixed
- **Premium Identity Silhouettes**: Substituído avatar de texto (`ui-avatars.com`) por silhueta vetorial (Lucide `User`) em paleta navy.
- **Svelte Zero-Warning State (A11y)**: Mais de 30 alertas de acessibilidade eliminados; `svelte-check` chega a 0 erros no pipeline.

---

## [0.8.3] - 2026-03-21

*The Omniscient Cibrid Hub & Dynamic Topology Mapping — maior epic de UI da série 0.8.x, ~50 commits.*

### Added
- **Cognitive Graph — Reescrita Completa em D3/WebGL**: Motor de física do grafo cognitivo reconstruído do zero: clusters em galáxia, estratificação orbital, gravidade dinâmica, contenção de arraste, zoom e limites absolutos de viewport (série de commits `cb054690`…`f86c374f`).
- **Kanban — Redesign Completo**: Redesenho abrangente da UI do Kanban com telemetria de projeto e injeção de contexto RAG local (`5d8277e3`); `HubAssistant`/`ProjectAssistant` convertidos em drawers flutuantes com a logo oficial Sovereign Pair (`8b27eab0`…`100acc56`).
- **Analytics Command Center**: Painel "Nexus Command Center" com integração em tempo real (`d2b34f13`) e redesenho da telemetria da Home (`d38cd6ae`).
- **DevSecOps Firewall Guardrails**: Implementação de guardrails de segurança na interface (`9cb37198`, Phase 17).
- **SettingsModal Polido**: 9 presets de persona, campo de nome da IA e fetcher de modelos (`0eb78d6f`).
- **TheAccountant Math AST**: Motor de expressões aritméticas com AST próprio e menu de contexto customizado no editor (`da3ebb4f`).

### Fixed
- **Chat/Vault**: Restaurados sidebar de chat, hidratação assíncrona de arquivos e renderização recursiva da árvore no Vault; corrigida destruturação de payload que impedia hidratação de Markdown (`4f4f0f65`, `e22a0025`, `406c12a7`).
- **Layout**: Corrigidos z-index sobrepostos no header master e vazamento de estado no padding do painel auxiliar; sidebars de chat, padding global e scrollbars unificados (`bd87a562`, `31f9923e`).
- **Dynamic Hub Reality**: Home passa a refletir o status real do Vault e dos Projetos em vez de dados estáticos.
- **GPU Autodiscovery**: Macro multiplataforma nativa (`glxinfo`/`system_profiler`) infere chipset e VRAM total em runtime (`97139196`).

---

## [0.8.1] - 2026-03-20

*A Atualização Estabilizadora.*

### Fixed
- **Tauri — Warnings de Compilação**: Silenciados warnings de compilação da lib do Tauri no Windows/macOS (`312476e5`).
- **SQLite Workspaces**: Corrigida falha "Falha ao Ler Tabela de Workspaces" que corrompia o Watcher assíncrono.

---

## [0.8.0] - 2026-03-20

*GUI Setup, System Tray & Daemon Separation.*

### Added
- **Instalador Visual Tauri v2**: App engloba o backend Rust via `externalBin` e executa Setup Wizard na primeira inicialização da Dashboard Svelte.
- **System Tray Cross-Platform**: Engine permanece ativo com o WebView desligado com segurança de RAM.
- **KDE Plasma & Shell Implants**: Widget `sovereign-pair-widget` (Plasmoid) integrado via `tauri-plugin-fs`.
- **Headless Universal Daemon Setup**: Setup de daemon headless e auto-escalação gráfica de privilégios (`a16bb61a`).

### Changed
- **Arquitetura Thin-Client / Fat-Daemon**: Motor de dados e segurança movido para daemon de background escalonado via `sudo`/UAC/`pkexec`.

---

## [0.7.2] - 2026-03-20

*Pipeline DevSecOps: Estabilização e Zero-Downtime CD Fixes.*

### Changed
- **Estabilidade de Database e KMS**: Aplicadas correções estritas de estabilidade de banco de dados e KMS junto ao bump de versão (`8acc3179`).

---

## [0.7.1] - 2026-03-19

*CI/CD Unification & Namespacing.*

### Fixed
- **MacOS Svelte/Vite SSR**: Corrigidos crashes de resolução SSR e de atribuição reativa no Vite/Svelte específicos do macOS (`4de0ccd1`).
- **`.gitignore` Excluindo `src/lib/`**: Restaurado `src/lib/` do Svelte, excluído indevidamente por regras de `.gitignore` herdadas do Python legado (`98ca07f1`).
- **Mapeamento TypeScript do Vite**: Corrigido mapeamento TypeScript do Vite e colisão de nomenclatura de artefatos de release (`dd179624`).

---

## [0.7.0] - 2026-03-19

*Major Release — Svelte Mesh, Multi-Workspaces & Native CI/CD. Marco zero: migração completa de Vue 3 para Svelte 5.*

### Added
- **Migração Vue 3 → Svelte 5**: Interface inteira reescrita nativamente em Svelte 5 (`d4a4237e`).
- **Cognitive Graph em Svelte 5**: Grafo cognitivo portado para Svelte 5, purgando dependências legadas do Obsidian (`44ce6640`).
- **Cards de Settings Fluidos**: Cards de configurações com material design fluido e OS shell responsivo (`825763a8`).
- **Multi-Workspace Selector**: Seletor de múltiplos workspaces com backup/restore de configuração `.cybrid` (`3aa6590e`).
- **Chat Completions Real via SSE**: Estabilização de Global Workspaces e chat completions real via SSE (`acb5f81d`).

### Removed
- **Vue 3 Web-UI**: Diretório `vue-ui` inteiro deletado, encerrando a era Vue.

---

## Tipos de Mudanças

- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades que serão removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Correções de vulnerabilidades
- `Documentation` - Mudanças na documentação

## [Unreleased]
### Fixed
- Resolved Module Federation Hydration and Build issues by using Vanilla JS Wrappers for remote components.
