# Auditoría final — Reglamento VUCE · Revisión Final GNTI (06/10/2026)

**Documento:** `docs/06 10 2026 Reglamento VUCE Revisión Final GNTI.docx` (1,37 MB, guardado 06/10/2026 18:34)
**Versión anterior comparada:** `docs/06 10 2026 Reglamento VUCE Revisión GNTI.docx` (guardada 06/10/2026 10:34)
**Método:** extracción del XML del DOCX (`word/document.xml`), lectura de revisiones rastreadas (`w:ins`/`w:del`) con autor y fecha, resaltados y subrayados; aceptación de cambios para obtener el texto corrido con numeración resuelta (LibreOffice); cruce de remisiones internas, plazos, registros R-42x/R-71x y anexos.
**Salidas asociadas:**
- `docs/reports/2026-10-06_reglamento-vuce-auditoria-normativa.md` (127 hallazgos)
- `docs/reports/2026-10-06_reglamento-vuce-auditoria-sistemas.md` (86 hallazgos)
- `docs/reports/2026-10-06_reglamento-vuce-revision-docx-orden.md` (revisión por página, 11:17)
- `docs/reports/2026-10-05_reglamento-vuce-revision.md`

---

## 1. Veredicto

**El documento NO está listo para firma/publicación.** Se detectaron **~23 bloqueantes** que impiden la aprobación literal del reglamento. La buena noticia: **la ronda de correcciones del 06/10 (la tuya) es sustantiva y de calidad** — incorporó los vacíos técnicos más grandes que tenía el texto (interoperabilidad, seguridad, expediente electrónico, contingencias). Lo que frena el cierre no es tu revisión, sino **deuda estructural heredada**: un capítulo entero sin numerar, referencias cruzadas rotas y registros inexistentes.

---

## 2. TUS cambios (Brenda Lily G. — 06/10/2026)

Sí se pueden identificar y separar limpiamente. Son **los únicos con fecha 06/10/2026**; el resto son Valeria Tapia (17 sep–05 oct), Renato López Choque (17 sep) y Rbustamante (05 oct).

**Volumen:** 128 párrafos tocados · 58 borrados · 107 añadidos · **−14.652 / +24.450 caracteres** (neto +9.798).

| Zona | Párr. | Borrados | Añadidos | Carac. − | Carac. + |
|---|---:|---:|---:|---:|---:|
| Art. 2 · OBJETIVOS ESPECÍFICOS | 1 | 1 | 1 | 136 | 136 |
| Art. 6 · DEFINICIONES | 25 | 13 | 17 | 3.214 | 4.499 |
| Art. 22 · EPEs CON SISTEMA (APCO) | 12 | 9 | 10 | 1.363 | 1.786 |
| Art. 23 · *(sin título)* | 6 | 5 | 5 | 1.276 | 1.276 |
| Art. 24 · ENTIDADES SIN SISTEMA (APCO) | 6 | 1 | 4 | 256 | 745 |
| Art. 25 · MODELO DE OPERACIÓN DE LA VUCE | 10 | 9 | 8 | 3.004 | 942 |
| **Art. 26 · INTEROPERABILIDAD DE LA VUCE** | 12 | 0 | **12** | 0 | **4.239** |
| **Art. 27 · SEGURIDAD DE LA INFORMACIÓN** | 4 | 0 | **4** | 0 | **1.315** |
| **Art. 28 · CONFIDENCIALIDAD DE LA INFORMACIÓN** | 2 | 0 | **2** | 0 | **759** |
| Art. 30 · IDENTIFICACIÓN DEL TRÁMITE APCO | 1 | 1 | 0 | 30 | 0 |
| **Art. 52 · MEJORAS O ADECUACIONES** | 23 | 0 | **23** | 0 | **3.320** |
| Art. 53 · CONTINGENCIAS EN LA VUCE | 13 | 13 | 8 | 3.338 | 1.439 |
| **Art. 63 · EXPEDIENTE ELECTRÓNICO VUCE** | 13 | 6 | **13** | 2.035 | **3.994** |
| **TOTAL** | **128** | **58** | **107** | **14.652** | **24.450** |

> Los Art. 26, 27, 28 y 52 aparecen con **cero borrados y solo adiciones**: redactaste desde cero los artículos que estaban prácticamente vacíos. Ahí está el grueso de tu aporte.

**Inventario detalle (párrafo por párrafo, con texto eliminado y añadido):** generar con el script de extracción (ver §7) — 45 KB, 13 zonas.

### 2.1 Cómo ver SOLO tus cambios en Word

1. `Revisión` → `Mostrar para revisar` → `Todos los autores` (desplegable) → marca **solo** `Brenda Lily Gutierrez Bautista`.
2. `Revisión` → `Mostrar marcas de revisión` → solo `Insertar y eliminar` (apaga `Formato` y `Tachado`).
3. `Buscar` → `Avanzado` → `Contenido` → `Texto con formato` → `Resaltado = sin color` para barrer los párrafos con formato directo.
4. Para ver el resultado final limpio: `Revisión` → `Aceptar` → `Aceptar todos los cambios y detener la revisión` **(sobre una copia)**.

### 2.2 Ocho puntos a corregir en TU propia redacción

| # | Dónde | Problema | Acción |
|---|---|---|---|
| T1 | Art. 6, párr. `[249]` | Moviste pero **no resolviste** la consulta editorial: el cuerpo dice *"se debería establecer a la AGETIC y al BCB en la definición?"* | Resolverla y borrarla, o convertirla en comentario de Word |
| T2 | Art. 22, L532 | El inciso **`g)` quedó vacío** (tu adición `[555]` cayó en el inciso siguiente o no se insertó ahí) | Completar `g)` o eliminar la letra |
| T3 | Art. 22, L525–526 | Dos párrafos **sin letra** después de `e)` (entornos y pasarela) | Asignarles `f)` y reordenar, o meterlos como sub-incisos |
| T4 | Art. 22, L531 `[554]` | Cambiaste *"coordinación con el SIN y/o AGETIC"* por **"la instancia competente"** → pierdes al responsable de la facturación electrónica | Nombrar expresamente: `AGETIC (facturación) y SIN (recepción de comprobantes)` |
| T5 | Art. 22, L520 | `"Tener Tener la capacidad de interoperar"` — palabra duplicada | Borrar una |
| T6 | Art. 53 | Reescribiste las contingencias, pero **justo antes** está el bloque `ARTÍCULO X … X+7` (Cap. II Contingencias) que regula lo mismo | Unificar: o numerar X..X+7 y retirar Art. 53, o eliminar el bloque X y dejar Art. 53 |
| T7 | Art. 63, L963 | El encabezado del Art. 63 **empieza con texto literal** `ARTÍCULO 64.- (EXPEDIENTE ELECTRÓNICO VUCE)` → doble numeración en pantalla | Borrar el `ARTÍCULO 64.-` literal |
| T8 | Art. 6 | Añadiste definiciones largas (`Módulo`, `Aplicación informática`, `Plan de contingencia`, `Expediente Electrónico`) | Verificar que el término exista en Art. 7 (abreviaturas) y que ningún otro artículo lo use con otro sentido |

---

## 3. Bloqueantes transversales (verificados uno por uno)

| # | Bloqueante | Evidencia | Acción mínima |
|---|---|---|---|
| 1 | **Capítulo de Contingencias sin numerar**: `ARTÍCULO X`, `X+1` … `X+7` (8 artículos) | L805, 807, 818, 822, 828, 831, 835, 841 | Numerar 53–60 y **renumerar el resto (53→61 … 76→84)**; actualizar todas las remisiones |
| 2 | **Marcadores sin resolver**: `Artículo xx`, `Anexo xx` (×2), `xxxx` (×2), `R-XXX` (×3) | L436, L518, L1065, L845, L2617, L2627, L2855 | Resolver cada uno antes de publicar |
| 3 | **Doble numeración Art. 63/64** | L963 `ARTÍCULO 63.- ARTÍCULO 64.-` y L977 otro `ARTÍCULO 64` | Renumerar y rehacer el índice |
| 4 | **Índice desactualizado**: el cuerpo tiene **TÍTULO VI** (L947) y **ANEXO 10** (L2845); el índice se corta en Título V / Anexo 9 | ÍNDICE L26–66 vs cuerpo L947/L2845 | Regenerar índice automático (`Referencias → Insertar índice`) |
| 5 | **Registros inexistentes**: `R-214`, `R-428`, `R-712` — una sola mención cada uno, sin anexo | L734, L689, L718 | Eliminar o crear el registro y su anexo |
| 6 | **Anexo 9 (Cronograma) vacío** — lo citan Art. 14-g/h, 30-I, 56-II, 60 y 61-I | L2614 | Insertar la tabla entidad-trámite-fechas |
| 7 | **Remisiones internas rotas** — "Artículo 33/37/39/70/72/73/74", "parágrafo II del Art. 28", "inciso b) del Art. 19" apuntan a artículos que no tratan la materia | ~16 casos (ver informe normativo §2) | Reapuntar cada remisión al artículo correcto |
| 8 | **Base legal incompleta (Art. 5)** — el cuerpo cita Ley 4059, Ley 1178, Ley 2341, DS 5704, DS 5724 y **no están** en el Art. 5 | Art. 5, L138 | Agregarlas |
| 9 | **DS 5724 con dos fechas**: `24/09/2024` (Art. 54, L857) vs `24/09/2026` (Art. 62, L953) | — | Unificar en la fecha real de Gaceta |
| 10 | **Doble titularía de la operación**: Art. 10-I dice que operan las **EPEs**, Art. 10-IV que opera la **AN** | L365 vs L371 | Delimitar por componente con matriz AN/EPE/AGETIC |
| 11 | **Art. 28 vs realidad**: confidencialidad absoluta ("no pudiendo ponerse a conocimiento de terceros") choca con verificación pública (Art. 12), intercambio SUMA/VUCES y estadística pública | L593 | Matizar: *salvo verificación de autenticidad, ordenamiento jurídico y datos anonimizados* |
| 12 | **Obligaciones truncadas**: `la AN deber` (L1045) y `las coordinaciones necesarias para` (L1055) | — | Completar la frase |
| 13 | **Ventana de reprogramación vencida**: "hasta noviembre de la Gestión 2025" (Art. 57, L915) | — | Actualizar a gestión vigente |
| 14 | **Residuos de fusión de texto** (rastreo de ediciones): `pParte` y `VUCEVUCE` (L347), `DeterminarAplicar` (L518), `OPERACIÓNDE` (Art. 25), `Tener Tener` (L520), `no este` (L647) | — | Barrido ortográfico completo |
| 15 | **Consulta editorial embebida en el cuerpo**: `como se verifica?` (Art. 8, L389) y `se debería establecer a la AGETIC y al BCB…` (Art. 6) | L389 y Art. 6 | Resolver y borrar |

---

## 4. Semáforo por dimensión

| Dimensión | Estado | Comentario |
|---|---|---|
| Estructura y numeración | 🔴 | 8 artículos sin número + Art. 63/64 duplicado + índice incompleto |
| Concordancia interna (remisiones) | 🔴 | ~16 remisiones apuntan al artículo equivocado |
| Registros y anexos | 🔴 | R-214/R-428/R-712/R-XXX; Anexo 9 vacío; Anexo 10 no está en el índice |
| Plazos y cronograma | 🔴 | Ventana 2025 vencida; plazos internamente inviables |
| Base legal | 🟠 | Normas citadas fuera del Art. 5; DS 5724 con fecha dupla |
| Definiciones y abreviaturas | 🟠 | Ampliadas por ti el 06/10; falta sincronizar con Art. 7 |
| Interoperabilidad y API | 🟠 | Ya redactada (tuyo) pero sin versionado, idempotencia, homologación |
| Seguridad y datos personales | 🟠 | Contenido nuevo (tuyo); falta Ley 164, incidentes, RTO/RPO |
| Expediente electrónico | 🟠 | Contenido nuevo (tuyo); falta valor probatorio y conservación |
| Técnica legislativa / redacción | 🟠 | Duplicados (`I. I.`, `III. III.`), letras de inciso rotas, tildes |
| Ortografía y formato | 🟢 | Se corrigió fuerte en esta ronda; quedan ~20 residuos |

---

## 5. Plan de acción (en orden)

1. **Renumerar**: numerar `ARTÍCULO X … X+7` y renumerar 53→61 … 76→84; eliminar el `ARTÍCULO 64.-` literal del Art. 63.
2. **Regenerar el índice** (Título VI + Anexo 10) con el campo automático de Word.
3. **Resolver marcadores**: `Artículo xx` (L436), `Anexo xx` (L518, L1065), `xxxx` (L845), `R-XXX` (L2617, L2627, L2855).
4. **Reapuntar las ~16 remisiones internas** rotas (cruce Artículo↔materia).
5. **Cerrar registros y anexos**: eliminar o crear R-214, R-428, R-712; poblar Anexo 9; dar número al Anexo 10.
6. **Armonizar contradicciones de fondo**: operación AN vs EPE (Art. 10), confidencialidad vs verificación (Art. 28 vs 12), contingencias duplicadas (bloque X vs Art. 53), control funcional duplicado (Art. 43 vs Art. 75).
7. **Actualizar base legal y fechas** (Art. 5; DS 5724; ventana de reprogramación).
8. **Barrido de residuos** (§3.14 y §3.15) + revisión ortográfica con `Revisión → Ortografía`.
9. **Aceptar los cambios en una copia limpia** y generar el PDF para firma.

---

## 6. Qué SÍ está bien (respaldo)

- La **estructura de cinco/seis títulos** y el flujo proceso → optimización → implementación → cronograma es sólido.
- Los **Art. 26, 27, 28 y 52 quedaron redactados** en esta ronda: antes eran cáscaras.
- El **Art. 6 (Definiciones)** pasó a cubrir los términos operativos que el resto del texto usa.
- El **Art. 52 (mejoras/adequaciones)** ganó un procedimiento completo con registro R-427.
- La trazabilidad del expediente electrónico y los tiempos de restablecimiento del bloque de contingencias son adiciones bien orientadas.

---

## 7. Reproducir el inventario de cambios

```bash
# 1. Extraer párrafos con autor de cada revisión
python3 /tmp/opencode/vuce/extract.py final/word/document.xml final.json
# 2. Texto limpio con numeración
python3 .agents/skills/docx/scripts/accept_changes.py src.docx aceptado.docx
python3 .agents/skills/docx/scripts/office/soffice.py --headless \
  --convert-to "txt:Text (encoded):UTF8" --outdir out aceptado.docx
```

Para **traer el inventario a este repositorio** (hoy vive en `/tmp/opencode/vuce/brenda_inventory.md`), pedime y lo copio a `docs/reports/`.
