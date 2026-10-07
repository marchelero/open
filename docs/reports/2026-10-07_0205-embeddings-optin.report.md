# Embeddings opt-in (router) · Report de ejecución

> PRD: `docs/prds/2026-10-07_0035-router-semantico.prd.md` (Capa B / M4)
> Plan: `docs/plans/2026-10-07_0205-embeddings-optin.plan.md`

## Status
COMPLETADO — 8/8 gates verdes.

## Contexto
Extra §11.2 #4 (Capa B), diferido en el PRD del router. Modo embeddings opt-in, degradable, vendor-neutral.

## Cambios
**Nuevo**: `.opencode/bin/lib/embeddings.js` (Capa B; caché en `.opencode/embeddings-cache.json`, fingerprint por sha256, nunca la URL cruda).
**Modificados**: `lib/route-engine.js` (`routeAsync()`; `route()` sync/lexical intacto), `route-match.js` (mode/degraded), `commands/route.md` (cómo habilitar).

## Criterios (evidencia)
| Escenario | Resultado |
|---|---|
| env limpio | `mode=lexical`, `degraded=false`, exit 0, E16 gate:true, sin red |
| `OPEN_ROUTER_EMBEDDINGS=1` sin URL/key | `mode=lexical(degraded)`, `degraded=true`, exit 0, sin crash |
| URL/key inválidas | degrada, exit 0, `LEAK=NONE` |
| servidor local fake `/embeddings` | `mode=embeddings`, `degraded=false`, caché escrita sin la key |
| batería | 8/8 gates verdes; clis=22; boot 1527 GREEN |

## Desvíos / Incidentes
- `knowledge.js` no se tocó (opcional); E17 intacto.
- Env vars extra opcionales: `OPEN_ROUTER_EMBEDDINGS_MODEL` (default `text-embedding-3-small`), `OPEN_ROUTER_EMBEDDINGS_TIMEOUT` (5000 ms). La activación sigue siendo solo las 3 requeridas.
- La caché solo se escribe tras una llamada real exitosa → en default/degradado CI queda cero-red (verificado: no se crea).
- Sin vendor real: el camino positivo se validó con un endpoint local.

## Próximos pasos
Extras §11 restantes (4/10 en adelante): LLM-as-judge, policy engine, sandbox, versionado de prompts, A/B, telemetría de uso, fallback local.

---
*Auditable via `/audit-report embeddings-optin`.*
