# sp-ui-shell — Strategic Roadmap

**Shell Micro-Frontend (Host)** — App Tauri/SvelteKit e host de Module Federation do Sovereign Pair. Consome os demais microfrontends (`sp-ui-chat`, `sp-ui-vault`, `sp-ui-projects`, `sp-ui-rag`, `sp-ui-coding`) como remotes independentes.

**Versão Atual:** 1.7.0
**Última Atualização:** 2026-08-06

---

## 🏛️ Histórico Vivo

- **v0.7.0 (2026-03-19):** Marco zero — migração completa de Vue 3 para Svelte 5, fim da era `vue-ui`.
- **v0.8 – v1.0 (Março-Abril 2026):** Multi-workspace, Cognitive Graph, Spotlight Chat, CI/CD nativo.
- **v1.1 – v1.3.2 (Abril 2026):** Hardening visual macOS, Deep Research UI, testes de segurança/acessibilidade (XSS, SSRF, CSP restritiva do Tauri).
- **v1.6.0 (2026-06-10):** **Nascimento da arquitetura federada** — host de Module Federation do Vite consumindo os 5 microfrontends como remotes, adoção do `@sp/ui-core` compartilhado, Gate FOSS DevSecOps.
- **Unreleased (atual):** Hardening de CI pós-federação + Painel Resilience Shield (GAP-RS-02).

Ver `CHANGELOG.md` para o detalhamento completo, versão a versão, com hashes de commit.

---

## 🛡️ Estado Atual

- [x] **SvelteKit 2 + Svelte 5 (Runes)** + Tauri (desktop, multi-OS)
- [x] **Module Federation (Host)**: consome `sp-ui-chat`, `sp-ui-vault`, `sp-ui-projects`, `sp-ui-rag`, `sp-ui-coding` como remotes, com lazy loading e bundle local de produção
- [x] **`@sp/ui-core`**: estado, config e componentes compartilhados integrados (`env_config`, `telemetry`, `BlockEditor`)
- [x] **CI/CD**: `devsecops.yml` (Gate FOSS: Gitleaks, Trivy, lint)
- [x] **`release.yml` (pipeline Tauri multi-OS)**: **nunca teve sucesso desde a modularização** até 2026-08-06 (todo o histórico de runs era falha/cancelado, nenhuma release publicada) — corrigidos os dois bugs que impediam qualquer build real: (1) faltava checkout+build dos 5 repos irmãos antes do `npm run build` do Shell; (2) o sidecar do `sp-service` baixava de uma org inexistente e caía silenciosamente num binário dummy. Ver `CHANGELOG.md` ([Unreleased]).
- [x] **Testes**: E2E Playwright (`provider_settings`, `security_accessibility`, `core`) + unit tests (`security.test.ts`, `state.test.ts`)
- [x] **Resilience Shield UI (GAP-RS-02)**: painel de status por-API (`HEALTHY`/`UNREACHABLE`/`DEAD`/`EMPTY`/`SKIP`) em `engineer/analytics`
- [x] **Federation Drift (Gap #2) resolvido**: `BlockEditor`/`MicrophoneButton` deduplicados, migrados para `@sp/ui-core`
- [ ] **Versionamento sincronizado**: `package.json` estava travado em `1.3.2` apesar da tag real `v1.6.0` — corrigido nesta sessão, mas segue manual (sem automação de bump)
- [ ] **ROADMAP.md**: este arquivo não existia até agora — repositório rodou ~5 meses sem plano documentado localmente

---

## 🚀 Próximos Passos

### Imediato
- [ ] Tag de release formal cobrindo o trabalho pós-`v1.6.0` (13 commits de CI hardening + Resilience Shield UI)
- [ ] Automatizar sincronização de versão entre `package.json`, tags Git e `CHANGELOG.md` (hoje é manual e já divergiu uma vez) — `tauri.conf.json` também ficou pra trás (`1.3.2`), não só o `package.json`
- [ ] **Bloqueador pra testar o Desktop CD via tag real**: `sp-service` nunca cortou uma tag com `publish-stable` de verdade (histórico só tem `push main`) — a release `v1.7.0-rc1` de lá não tem nenhum asset. Cortar uma tag real no `sp-service` antes de tentar uma tag `v*.*.*` aqui, ou usar `workflow_dispatch` com `backend_tag: nightly` pra validar o pipeline enquanto isso

### Curto Prazo — Confiabilidade da Interface (Item 7 do roadmap mestre, v1.7)
- [ ] **WebSockets**: reconexão automática com backoff exponencial no frontend caso o `sp-service` caia
- [ ] **mTLS/HTTPS**: conexão loopback local estrita
- [ ] **Design System**: auditoria e enforcement das regras "Neural Architect" (Slate & Azure) no `@sp/ui-core` — hoje aplicado de forma inconsistente entre páginas

### Médio Prazo
- [ ] Cobertura de testes unitários fora de `security.test.ts`/`state.test.ts` (hoje concentrada em segurança, pouca cobertura funcional de componentes)
- [ ] Observabilidade client-side (Item 6 do roadmap mestre): consumir métricas de TTFT/TPS quando o backend expuser os endpoints de tracing

---

## 📅 Timeline de Lançamentos

| Versão | Data | Foco | Status |
|--------|------|------|--------|
| v1.3.2 | 2026-04-29 | Hardening visual, Deep Research UI, testes de segurança | ✅ Stable |
| v1.6.0 | 2026-06-10 | Module Federation Host, `@sp/ui-core`, Gate FOSS DevSecOps | ✅ Stable |
| v1.7.0-dev | Em progresso | CI hardening pós-federação, Resilience Shield UI, Federation Drift resolvido | 🟡 Em desenvolvimento |

---

> [!TIP]
> Este roadmap é um documento vivo. Para o histórico commit-a-commit, ver `CHANGELOG.md`. Para os gaps compartilhados entre todos os módulos, ver `/project_docs/PENDING_GAPS_AND_ROADMAP.md` na raiz do monorepo.
>
> **Última atualização:** 2026-08-01 — ROADMAP.md criado (não existia); versão sincronizada com a tag real `v1.6.0` + trabalho em progresso.
