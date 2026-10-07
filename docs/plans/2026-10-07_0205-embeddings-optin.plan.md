---
prd: docs/prds/2026-10-07_0035-router-semantico.prd.md
status: APPROVED
created: 2026-10-07_0205
---

# Implementation Plan: Embeddings opt-in (router) — M4 del PRD del router

## Overview
Activar la **Capa B** ya especificada en `2026-10-07_0035-router-semantico.prd.md` (M4): modo embeddings
**opt-in, degradable, vendor-neutral** para el router, sin romper el default zero-dep (BM25).

## Diseño (del PRD del router, Capa B)
- Se activa solo si `OPEN_ROUTER_EMBEDDINGS=1` **y** `OPEN_ROUTER_EMBEDDINGS_URL` + `OPEN_ROUTER_EMBEDDINGS_KEY`.
- Endpoint compatible OpenAI `/embeddings`; cachea vectores del catálogo; ranking por similitud coseno.
- Cualquier fallo (sin key, timeout, HTTP≠2xx, JSON inválido) → **cae en silencio a BM25** y marca `degraded:true`.
- **Nunca** imprime/loguea la key. Default CI (sin env) = solo BM25 (zero-dep intacto).

## Pasos
1. `lib/route-engine.js`: añadir ruta de embeddings opt-in (fetch vía `https`/`fetch` de Node 18) + caché de vectores; cosine ranking; fallback a BM25.
2. `route-match.js`/`knowledge.js`: exponer `mode` (`lexical|embeddings|lexical(degraded)`) en texto y `--json`.
3. Tests de escenarios de entorno: limpio (`mode=lexical`), `=1` sin URL/key (`degraded:true`), key/URL inválida (degraded, sin crash, sin filtrar key).
4. Docs (route.md / manual): cómo habilitar.

## Success Criteria
- [ ] env limpio → `mode=lexical`, exit 0, cero red; E16/E17 intactos.
- [ ] `OPEN_ROUTER_EMBEDDINGS=1` sin URL/key → `degraded:true`, exit 0, key no expuesta.
- [ ] default CI zero-dep; batería completa verde.
