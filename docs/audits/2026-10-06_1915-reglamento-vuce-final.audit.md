# Reglamento VUCE — Auditoría de la Revisión Final GNTI (06/10/2026)

**Fecha:** 2026-10-06 19:15
**Objeto:** `docs/06 10 2026 Reglamento VUCE Revisión Final GNTI.docx` (guardado 18:34)
**Base comparativa:** `docs/06 10 2026 Reglamento VUCE Revisión GNTI.docx` (guardado 10:34)
**Método:** lectura directa de `word/document.xml` + aceptación de cambios con LibreOffice + verificación manual de cada hallazgo contra `accepted.txt` (2.908 líneas).

---

## 1. Veredicto

**FAIL (no apto para firma).** 15 bloqueantes verificados, ninguno depende de la última ronda de correcciones. La ronda del 06/10 se evalúa como **PASS con 8 nits propios**.

---

## 2. Verificación de identidad de los cambios

| Check | Resultado | Evidencia |
|---|---|---|
| Autores de revisión rastreada en el DOCX | ✅ 4 | Valeria Tapia (2.738 ins / 1.203 del), **Brenda Lily G. (283 ins / 342 del)**, Renato López Choque (75/19), Rbustamante (23/1) |
| Fecha de los cambios de Brenda | ✅ 06/10/2026 12:08–17:44 | único autor con fecha posterior al guardado de la versión 10:34 |
| Cambios de Brenda presentes en la versión 10:34 | ✅ No | `prev.json` no contiene al autor → los suyos son íntegramente nuevos |
| Volumen de Brenda | ✅ 128 párr. · −14.652 / +24.450 car. | `brenda_inventory.md` |
| Resaltados (cyan/verde/amarillo) | ⚠️ NO son de Brenda | preexistentes de Valeria (29k/23k/6k car. ya en la versión 10:34) |
| Subrayados (`w:u single`) | ✅ residuales | 1.811 car. en 10:34 → **18 car.** en final (casi todos eliminados) |
| Revisiones `w:ins`/`w:del` totales | ✅ 69.276 / 29.149 car. | vs 54.056 / 16.672 en 10:34 |

---

## 3. Hallazgos bloqueantes — verificación uno por uno

| # | Hallazgo | Línea | Verificado |
|---|---|---|---|
| B1 | 8 artículos con marcador literal `ARTÍCULO X … X+7` | 805, 807, 818, 822, 828, 831, 835, 841 | ✅ leído |
| B2 | `Artículo xx` sin resolver | 436 | ✅ |
| B3 | `Anexo xx` sin resolver | 518, 1065 | ✅ |
| B4 | `xxxx` en Art. 53 | 845 | ✅ |
| B5 | `R-XXX` / `R-xxx` | 2617, 2627, 2855 | ✅ |
| B6 | Encabezado `ARTÍCULO 63.- ARTÍCULO 64.-` | 963 | ✅ |
| B7 | Segundo `ARTÍCULO 64` (RUOCE) | 977 | ✅ |
| B8 | Índice corta en Título V / Anexo 9; el cuerpo tiene TÍTULO VI y ANEXO 10 | Índice L26–66 vs L947 / L2845 | ✅ |
| B9 | Registros sin anexo: `R-214`, `R-428`, `R-712` (1 mención c/u) | 734, 689, 718 | ✅ grep único |
| B10 | Anexo 9 (Cronograma) sin tabla de contenido | 2614 | ✅ |
| B11 | DS 5724 con fecha `24/09/2024` (Art. 54) y `24/09/2026` (Art. 62) | 857 / 953 | ✅ |
| B12 | Operación de la VUCE atribuida a EPEs y a la AN en el mismo art. | 365 / 371 | ✅ |
| B13 | Obligaciones truncadas `la AN deber` / `las coordinaciones necesarias para` | 1045 / 1055 | ✅ |
| B14 | Ventana de reprogramación "noviembre de la Gestión 2025" vencida | 915 | ✅ |
| B15 | Consultas editoriales embebidas en el cuerpo | 389 (`como se verifica?`), Art. 6 (`se debería… AGETIC y BCB`) | ✅ |

**Residuos de fusión de texto confirmados:** `pParte`, `VUCEVUCE` (347) · `DeterminarAplicar` (518) · `Tener Tener` (520) · `OPERACIÓNDE` + `I. I.` (Art. 25) · `no este` (647) · incisos `f)/g)` rotos en Art. 22 (525–532).

---

## 4. Cambios del 06/10 — evaluación

**PASS con nits.** Aportes correctos y bien enfocados: Art. 26 (interoperabilidad, +4.239 car.), Art. 27 (seguridad, +1.315), Art. 28 (confidencialidad, +759), Art. 52 (mejoras/adequaciones, +3.320), Art. 63 (expediente electrónico, +3.994), Art. 6 (definiciones, +4.499).

Nits propios a corregir (8, detallados en el informe final §2.2): consulta editorial sin resolver en Art. 6, inciso `g)` vacío en Art. 22, dos párrafos sin letra, pérdida de la mención al SIN en facturación, `Tener Tener`, solapamiento Art. 53 vs bloque X, `ARTÍCULO 64.-` literal en Art. 63, sincronía definiciones ↔ abreviaturas.

---

## 5. Artefactos producidos

| Archivo | Contenido |
|---|---|
| `docs/reports/2026-10-06_reglamento-vuce-auditoria-final.md` | Síntesis, veredicto, plan de acción |
| `docs/reports/2026-10-06_reglamento-vuce-auditoria-normativa.md` | 127 hallazgos normativos |
| `docs/reports/2026-10-06_reglamento-vuce-auditoria-sistemas.md` | 86 hallazgos técnicos |
| `docs/reports/2026-10-06_brenda-cambios-inventario.md` | Inventario párrafo a párrafo de los cambios del 06/10 |
| `docs/reports/2026-10-06_reglamento-vuce-revision-docx-orden.md` | Revisión por página (previa, 11:17) |

**Recuento total:** ~23 bloqueantes · ~45 altos · ~38 medios · ~21 bajos (normativa) + 13/38/27/8 (sistemas).
