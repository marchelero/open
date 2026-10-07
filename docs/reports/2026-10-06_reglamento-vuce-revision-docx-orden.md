# Revisión en orden — Reglamento VUCE (GNN-REG-14 v2), documento Word

**Fecha:** 2026-10-06
**Fuente:** `docs/06 10 2026 Reglamento VUCE Revisión GNTI.docx` (2,1 MB)
**Método:** conversión a PDF (LibreOffice) + extracción de texto página a página + lectura de `word/document.xml`, `comments.xml` y `numbering.xml`.
**Convención de página:** **PDF p.N** = página física del PDF (141 páginas, la última en blanco). **doc p.N** = número impreso en el encabezado ("Página N de 76"). Relación: **doc = PDF − 1** desde la portada; a partir de PDF 136 la numeración impresa **reinicia** (1–4). Al abrir el .docx en Word la paginación puede variar ±1 respecto del PDF.

**Marcas visibles del documento (revisión con control de cambios ACTIVO):**
- `w:ins` = **1.951** inserciones · `w:del` = **1.534** eliminaciones · autores: **Valeria Tapia** (mayoría), **Renato Lopez Choque**, **Rbustamante**.
- **5 comentarios**: 3 de *Brenda Lily Gutierrez Bautista* (06/10/2026) y 2 de *Valeria Tapia* (01 y 04/10/2026).
- En el PDF las inserciones se ven entre **[corchetes]** y las eliminaciones quedan como texto tachado (por eso aparecen restos pegados: `otorgadosemitidos`, `laLa`, `VUCEVUCE`).

---

## 1. Resumen ejecutivo

| Severidad | Total | Núcleo del hallazgo |
|---|---|---|
| CRITICAL | 9 | Anexo 9 vacío, sin Disposición Final/Derogatoria, doble serie de numeración, artículos "ARTÍCULO X" sin número, referencias a artículos inexistentes (70/72/73/74/376/463/389), cita de decreto corrupta, notas editoriales/personales dentro del texto normativo, sin régimen de sanciones/recursos |
| HIGH | 24 | Plazos inválidos fusionados (105/75/25/53), artículos vacíos/truncados, listas rotas, definiciones vacías, índice desfazado, Anexos 1 y 4 sin diagrama, sin SLA, sin protección de datos, fórmulas inválidas |
| MEDIUM | 25 | Instructivos/formularios desalineados, códigos R-XXX/R-214/R-710/R-711 mal citados, ortografía, campos vacíos |
| LOW | 10 | Erratas, formato, siglas muertas |

**Diagnóstico:** el .docx está **en pleno control de cambios y NO es imprimible/aprobable tal como está**: conviven la versión vieja (números de artículo sin corchete) y la nueva (entre corchetes), con párrafos, literales y epígrafes sin armar. Comparado con la revisión del 05/10 (sobre el .md), **se incorporaron** el Título VI, los registros R-710/R-711 y el Decreto 5724/2026, pero **persisten sin resolver** el Anexo 9 vacío, la ausencia de Disposición Final, la triple escala de plazos y la ausencia total de SLA/auditoría/backups.

---

# REVISIÓN EN ORDEN DE PÁGINA

## Portada e índice — PDF 1–4 (doc sin folio – 3)

| PDF | doc | Contenido | Hallazgo |
|---|---|---|---|
| 1 | – | Portada, firmas 18/08·20/08·21/08·29/08/2025 | Título de portada ("…DE LOS TRÁMITES Y SERVICIOS EN LA…") ≠ título del encabezado ("…OPERACIÓN DE LA VENTANILLA ÚNICA…"). "VERSIÓN 2:" con dos puntos. |
| 2 | 1 | (vacía) | Página sin contenido. |
| 3 | 2 | Índice Títulos I–IV | Índice desfazado del cuerpo: Título II declara p.12 / real 21; Cap. II declara 14 / real 27; Título III declara 22 / real 47. |
| 4 | 3 | Índice Título V, Historial, Anexos 1–9 | **No lista el Título VI ni el Anexo 10**; **no lista Disposición Final** (porque no existe); Anexos declarados en pp. 43–75 / reales 94–135. |

---

## TÍTULO I — GENERALIDADES · Cap. I Disposiciones Generales — PDF 5–21 (doc 4–20)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 5 | 4 | Portadilla Título I | – |
| 6 | 5 | **[1] OBJETIVO** · **[2] OBJETIVOS ESPECÍFICOS** a–f | Art. 2 lit. c) fusionado: "modelos de negocio**el modelo de negocio**"; literales en orden viejo+nuevo mezclado (a, b, c, d[c], e, [d], f[e]). |
| 7 | 6 | **[3] ALCANCE** · **[4] RESPONSABILIDADES** | *Crítico:* Art. 3 con restos de eliminación pegados — "APCO ((Autorizaciones…", "**otorgadosemitidos**", "**ys** que se incorporen", "Aestablecido por la ANN". **Nota editorial dentro del texto normativo: "que pasa con el BCB"**. Art. 4: **literal "c)" huérfano sin contenido**. |
| 8 | 7 | **[5] BASE LEGAL a–n** · **[6] DEFINICIONES** (inicio) | "Ley N° 998 **el** 27/11/2017" (falta "de"); "Organización Mundial Comercio"; "Comercio -– CNFC". **DS 5593 (24/03/2026) y DS 5595 (30/03/2026) son posteriores a la aprobación de la portada (29/08/2025)**. No figuran Ley 1178 ni Ley 2341 (que sí se invocan en el art. 29). |
| 9–10 | 8–9 | **[6] DEFINICIONES** (A–C) | Definición **vacía "Administración:"**; "Aprobación/Aprobador" encadenados; **"Autenticación" y "Ciudadanía Digital" con doble definición superpuesta**; "Contingencia" arranca roto; "dinamico" sin tilde. |
| 11 | 10 | Definiciones D–E + lista EPE 1–7 | "aduanero**de comercio exterior**" pegado. |
| 12 | 11 | Lista EPE 8–20 | **Numeración duplicada: dos veces el 13** ("13. MRE…Culturas" / "13.[14.] Economía"); fusiones "Relaciones Exteriores**Culturas**…", "Medio Ambiente y Agua**Producción Sostenible**". |
| 13 | 12 | Definiciones E–F | **Definiciones vacías: "Guía de aplicación general – servicio web:" e "Implementación:"**. Nota editorial: "definir si la firma digital incluye…". Nombre incorrecto: "**Agencia Estatal** de Tecnologías…". Comentario de *Valeria*: "OPEN BCB como es?". |
| 14–15 | 13–14 | Definiciones M–O | "Módulo Informático Estándar" con **dos definiciones sin separación**; **definición "Operación:" vacía**; "por si o por otro" (sí). |
| 16 | 15 | Definiciones P–P | **Párrafo huérfano sin término** (queda colgado entre "Plan de Trabajo" y "Puesta en vigencia"); nota editorial "se debería establecer a la AGETIC y al BCB?". |
| 17–18 | 16–17 | Definiciones R–T | – |
| 19 | 18 | Definiciones T–X · **[7] ABREVIATURAS** | "**Xtensible** Markup Language" (por Extensible); "internacionales ." |
| 20 | 19 | Abreviaturas B–V | Fusiones graves: "**MRE: Ministerio de Relaciones ExterioresCDyD:…**" y "**MPSMMAyYA: …Ambiente y AguaProducción Sostenible**"; "ANH: **Agencia** Nacional de Hidrocarburos" contradice la lista de EPE ("**Autoridad**"). |
| 21 | 20 | Abreviaturas (fin) | – |

---

## TÍTULO II — LA VUCE · Cap. I Generalidades — PDF 22–27 (doc 21–26)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 22 | 21 | Título II / Cap. I · **[8] VUCE** | "Exterior**con otras** Ventanillas", "pParte", "VUCE**VUCE**"; **tercer párrafo cortado a mitad** ("La VUCE es la única plataforma… Asimismo," sin continuidad). |
| 23 | 22 | **[9] (sin epígrafe)** · **[10] IMPLEMENTACIÓN** I–V | Art. 9 **sin título entre paréntesis**. Art. 10: **parágrafos III, III duplicados**, luego "IVV.", luego V. *Comentario de Brenda (pág. 38/39, véase más abajo).* **Art. 12 II: plazo fusionado "hasta tres (3) días hábiles mínimo de quince (15) días hábiles" → 3 vs 15 en la misma frase.** |
| 24 | 23 | **[11] ADMINISTRACIÓN** · **[12] OPERACIÓN** | Parágrafos **IV, "IVII" y IV** duplicados/fusionados; "para establecer**estableciendo**". |
| 25 | 24 | **[13] INDEPENDENCIA OPERATIVA** · **Art. 8 (OBLIGACIÓN DE USO) sin renumerar** | **Art. 8 duplicado** (el 8 ya es "VUCE" en pág. 21) y rompe la cadena 13→14. "módulo **infomático** estándar?." |
| 26 | 25 | **[14] VALIDEZ LEGAL DE LOS DOCUMENTOS DIGITALES** | Literales rotos: "**a. , Lla AN**", "**ni ni** redirigirlo"; **parágrafos "III." duplicados**; **notas editoriales embebidas: "Definir el alcance de firma digital", "como se verifica?"**. |
| 27 | 26 | **[15] PLAZO DE EMISIÓN** (5/10 días hábiles) | – (pero ver tabla de plazos en §Hallazgos transversales). |

---

## TÍTULO II · Cap. II Responsabilidades — PDF 28–33 (doc 27–32)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 28 | 27 | Cap. II · **[16] RESPONSABILIDADES DE LAS EPEs** I, a–g | Inicio de la lista con **literales duplicados** (g repetido). |
| 29 | 28 | [16] b–j | **[f)] y [n)] dicen lo mismo**; **[k)]/[o)] y [l)]/"h)"** repiten "Remitir normativa…"; "exterior**trámite**" pegado. **Referencias cruzadas incorrectas: "parágrafo II del Artículo 11" (el plazo está en el 12 II) y "parágrafo II del Artículo 28" (el 28 es Seguridad de la Información)**. |
| 30 | 29 | [16] k–s | – |
| 31 | 30 | [16] II–III · **[17] RESPONSABILIDADES DE LA AN** a–e | **Marcador "Artículo xx" sin número.** |
| 32 | 31 | [17] e–m | *Comentario de Brenda:* "consignar la definición de servidores…". |
| 33 | 32 | [17] n–o · **[18] RESPONSABILIDAD AGETIC** · **[19] RESPONSABILIDAD DEL USUARIO** | **Literales vacíos "d) ." y "[g)]"**; correo institucional repetido 8 veces. |

---

## TÍTULO II · Cap. III–V — PDF 34–41 (doc 33–40)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 34 | 33 | [19] a–c · Cap. III · **[20] COMUNICACIÓN Y COORDINACIÓN** | "**wattsapp**" (WhatsApp). |
| 35 | 34 | **[21] PUNTOS FOCALES** I–III · **[22] (insertado a mitad de frase)** | **Art. 22 metido dentro del Art. 21 I** ("…comercio exterior, . [ARTÍCULO 22.-] previendo…"): artículo sin epígrafe ni cuerpo propio. **Plazos fusionados: "diez cinco (105) días hábiles"** y **"cinco tres (53) días hábiles"**. |
| 36 | 35 | [21] IV–VI · Cap. IV · **[23] ATENCIÓN DE CONSULTAS** | **Otra vez "(105) días hábiles"** en 23 II. "se realizar**án**" con resto "realiza**n**"; lit. "[c)] **o imncorporado o actualizado plementado**". |
| 37 | 36 | [23] III–IV · **[24] CAPACITACIONES** | **Oración sin verbo:** "Las entidades… que establezcan herramientas electrónicas a las EPEs y al Usuario VUCE." |
| 38 | 37 | Cap. V · **[25] EPEs CON SISTEMA** a–c | **Marcador "Anexo xx" sin resolver.** *Comentario de Brenda (1):* los requisitos remiten a "planes de gobierno electrónico o lineamientos de la AGETIC" de forma **genérica**. |
| 39 | 38 | [25] d–g, II–IV | **Literal "b)" duplicado**; **"[f)]" vacío**; parágrafos **[II.] y II.[III.]** duplicados. *Comentario de Brenda (2):* "Sería recomendable consignar la definición de servidores". *Comentario de Brenda (3):* pagos CPT/QR con "lineamientos de la AGETIC u otra Entidad Pública" **genéricos**. |
| 40 | 39 | [25] V · **[26] MODELO DE NEGOCIO** | Notas editoriales: "debería desglosarse a mayor detalle el modelo de negocio". |
| 41 | 40 | **Art. 14 ENTIDADES SIN SISTEMA (sin renumerar)** | **Número 14 duplicado** (el 14 ya es "Validez legal" en pág. 26); nota editorial "debería definirse el tratamiento específico". |

---

## TÍTULO II · Interoperabilidad, Seguridad, Confidencialidad y **6 artículos nuevos sin numerar** — PDF 42–48 (doc 41–47)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 42–43 | 41–42 | **[27] INTEROPERABILIDAD** (bloque viejo I–III+V **sin IV** + bloque nuevo I–V) | *Crítico:* **nota personal visible en el texto: "comercio.. OJO MARCELO ZAMB"**. |
| 43 | 42 | **[28] SEGURIDAD DE LA INFORMACIÓN** | "información administrada **yo** almacenada" (o); "actos que **efectúen.generen o emitan**". |
| 44 | 43 | **[29] CONFIDENCIALIDAD** | **"Ley 1178 de 20/07/201190"** (fecha imposible; es 1990). 2 párrafos huérfanos que repiten el art. 28 II y III. |
| 45 | 44 | **ARTÍCULO X (EXPEDIENTE ELECTRÓNICO Y PERSISTENCIA)** | Primer artículo **sin número**. |
| 46 | 45 | **ARTÍCULO X (INDEPENDENCIA OPERATIVA DE LAS EPEs)** — marcador **"NUEVO ARTICULO"** visible | Literalmente escrito "NUEVO ARTICULO" y texto entre comillas ("…") en el cuerpo. |
| 47 | 46 | **ARTÍCULO X (SISTEMAS INSTITUCIONALES)** · **X (MODELO FUNCIONAL Y TECNOLÓGICO)** · **X (ACCESO Y CONSULTA)** | 3 artículos sin número en una sola página. |
| 48 | 47 | **ARTÍCULO X (INTEGRIDAD HISTÓRICA DEL EXPEDIENTE)** · **TÍTULO III** | Total: **6 artículos "ARTÍCULO X" sin numerar** (pp. 45–48). Redundancia con el art. 13 (independencia operativa). |

---

## TÍTULO III — IMPLEMENTACIÓN DE TRÁMITES · Cap. I — PDF 49–52 (doc 48–51)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 49 | 48 | **[30] PROCESO PARA LA IMPLEMENTACIÓN** · **[31] vacío** · **[32] 1 línea** · **[33] 1 línea** · **[34] vacío** | *Crítico:* **arts. 31 y 34 sin contenido**; 32 y 33 solo un renglón. Bloque del 30 maquetado en columna estrecha a la derecha ("Reglamento:I. Para"). **Literales duplicados: `d)[b)]`, `e)[c)]`, `[d)]`, `f)[e)]`.** |
| 50 | 49 | **[35] IDENTIFICACIÓN Y MAPEO / R-424** I (10 días hábiles) | Otra vez letras duplicadas (`h)[f)]`, `j)[h)]`…); "VUCE**lLas** EPEs"; "La AN en coordinación con la EPE, **podrán**"; el literal a) **repite dos veces** el mismo bullet. |
| 51 | 50 | [35] b, II | "Cuando corresponda **iIncluir**"; II partido entre páginas 51–52. |
| 52 | 51 | fin [35] II–III · **[36] REVISIÓN Y ANÁLISIS** | *Crítico:* **el mismo trámite exige 10 días (35 I) y 15 días (35 II)**. **"siete cinco (75) días hábiles"** (plazo inexistente). **"dos (2) hábiles"** (falta "días"). "no **este** correctamente llenado". |

---

## TÍTULO III · Cap. II Plan de trabajo · Cap. III Optimización — PDF 53–60 (doc 52–59)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 53 | 52 | Cap. II · **[37] PLAN DE TRABAJO** (120 días) · **[38] MODIFICACIÓN AL PLAN** · Cap. III · **15.-[39.] OPTIMIZACIÓN** | Referencia "parágrafo II del **Artículo 28**" **no coincide**. Pegados `R-710Plan`, `plazosta a la AN`, `establecidos en mediante`. **Renumeración 15→39 convive con 37/38 nuevos.** |
| 54 | 53 | fin [39] | Incisos **c) y d) casi idénticos**; sublista con niveles/letras duplicados (`[i.]`, `i.[iii.]`… y `[b)][c)][d)]` colgando sin a)). Página con cambios densos. |
| 55 | 54 | **16.-[40.] PARTICIPACIÓN DEL SECTOR PRIVADO** · **17.- VALIDACIÓN** (sin renumerar) · **18.- VERIFICACIÓN DE SUBPARTIDAS** (sin renumerar) | **Epígrafe duplicado:** art. 40 (p.55) y art. 41 (p.56) se titulan igual. **[III.] vacío.** Renumeración inconsistente (unos con corchete, otros sin él). |
| 56 | 55 | **[41] PARTICIPACIÓN DEL SECTOR PRIVADO** (2.ª vez) · **[42] REQUERIMIENTOS FUNCIONALES** | **Dos párrafos "II." seguidos**. "subpartidas **arancelarias arancelarias**". **Conflicto de anexos:** aquí remite a "Anexo 5 y 6" como R-425 y Diccionario de Datos; el índice dice que el Anexo 6 es R-711. |
| 57 | 56 | [42] III–VI | Pegados `puntos focalesel servidor público`, `sistema de la AN;. caso contrario`, `Plan de TrabajoR-710`. |
| 58 | 57 | **19.- DISEÑO INFORMÁTICO** · **[43] vacío** · **[44] "Añadir el diseño de interfaces"** · **[45] "Solicitar la creación de código…"** · **20.- DESARROLLO** | *Crítico:* **arts. 43–45 sin estructura de artículo ni plazos** (frases sueltas). Referencia a "Artículo 36" no coincide. "**R-711 Plan de Trabajo**" (el Plan es R-710). Nota informal **"(Sujeto a sanción de no cumplir con los tiempos establecidos)"**. `[IV.]` vacío. |
| 59 | 58 | fin 20 (IV, V, "V." vacío, otro IV) · **[46] VACÍO** · **[47] VACÍO** · **23.- CONTROL DE CALIDAD** | *Crítico:* **arts. 46 y 47 absolutamente vacíos**; numeración de parágrafos IV×2 y V×2. |
| 60 | 59 | fin 23 (II–III) · **[48] CONTROL FUNCIONAL** I–III | "registrar **y y** remitir"; "(**R-426 y**)"; **el inc. II del art. 23 se repite casi textual en el II del art. 48**. |

---

## TÍTULO III · Control de calidad, normativa, implementación — PDF 61–64 (doc 60–63)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 61 | 60 | "**IV. IV.**" (R-426/R-**214**), V, VI (1 día) · **[49] GESTIÓN Y EMISIÓN DE NORMATIVA** (10 días) | **Referencia "parágrafo V. del Artículo 376" → número de artículo inexistente.** Código **R-214** inexistente (sería R-426). "V.De requerirse" pegado. |
| 62 | 61 | [49] II–IV · **[50] TRANSITORIEDAD** | **"cinco dos (25) días hábiles" → plazo inválido**. "**IVI.**" numerador corrupto. "un plazo máximo de **en el plazo máximo de**" (frase duplicada). |
| 63 | 62 | Cap. IV · **[51] IMPLEMENTACIÓN** · **[52] PRUEBA PILOTO** | **Referencia "Artículo 463" → inexistente.** **II. vacío**; texto pegado ilegible en el inc. II. |
| 64 | 63 | fin [52] (R-427/Anexo 8) · **[53] PUESTA EN VIGENCIA** I–IV | **Referencia "Artículo 44" para el R-427 → no coincide.** "Cuando **la APCO** un documento"; "requerid**ao**". El art. 53 **no fija fechas** (todo depende del Anexo 9). |

---

## TÍTULO IV — OPERACIÓN · Cap. I Modificación de normativa — PDF 65–67 (doc 64–66)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 65 | 64 | **24.- FACILIDADES DEL OEA** · **25.- SEGUIMIENTO** (sin renumerar) · **26.-[54] COMUNICACIÓN A LA AN** (3 días) | *Crítico:* **basura de edición "jklhjkl" al pie de la página**. Arts. 24/25 huérfanos respecto de la serie nueva. |
| 66 | 65 | **[55] ADECUACIONES/MEJORAS** a–c + párrafos sin numerar | Epígrafe garbled ("ADECUACIONES MEJORAS O ADECUACIONES"). **Referencias "inciso b) del Artículo 19" y "Artículo 28" no coinciden.** Pegado `adecuacionesmejoras`. |
| 67 | 66 | fin [55] II–III | **Referencia "Artículos 36 37 y 389" → 389 no existe.** |

---

## TÍTULO IV · Cap. II Contingencias — PDF 68–69 (doc 67–68)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 68 | 67 | **[56] CONTINGENCIAS EN LA VUCE** · **27.-[57] CONTINGENCIA DE LAS EPEs** | *Crítico:* **placeholders sin resolver "xxxx, la xxxx"** ("computables a partir de xxxx"); **nota editorial "ojo revisar la redacción"**; "Portal VUCE.**ojo**". Referencia al "Artículo 14" para un plazo que está en el 15. *Comentario de Brenda (1 y 3) sobre lineamientos genéricos.* |
| 69 | 68 | fin [57] · **28.-[58] CONTINGENCIAS Y REESTABLECIMIENTO AGETIC** | Numerador corrupto "**IVII.**" y salto IV→IV sin III. Párrafo con `soporte@vuce.gob.bo` **repite literalmente el inc. a)**. Dos formulaciones del plazo de 1 día pegadas (ambigüedad). *Sin SLA, sin RTO/RPO, sin backup (ver §transversal).* |

---

## TÍTULO V — EJECUCIÓN DEL CRONOGRAMA — PDF 70–76 (doc 69–75)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 70 | 69 | **29.-[59] REGISTRO DE INCIDENCIAS** · **30.- DOCUMENTOS POR CONTINGENCIA** · **[60] PARÁMETROS DEL CRONOGRAMA** | *Crítico:* **cita corrupta "Decreto Supremo N° 5724211 de 284/089/2024"** (mezcla 5724/5211 y fechas ilegibles). "**CONTIGENCIA**". Los 4 parámetros del art. 60 **no coinciden** con los 4 que se valoran en el 61. |
| 71 | 70 | **[a)–d)] insertados** · **31.-[61] PONDERACIÓN** | **Contradicción:** el art. 60 declara 4 parámetros (representatividad, madurez, RRHH, adecuación normativa) y el 61 promedia **otros 4 distintos** (declaraciones, FOB, documentos, madurez): RRHH y normativa **nunca se valoran**. |
| 72 | 71 | fin [61] II–IV (fórmulas) | **Fórmula b: `VFM = Entidad Pública Emisora`** → dimensión inválida (numerador numérico, denominador entidad). |
| 73 | 72 | fin [61] (fórmula c, V–VII) | **Fórmula c `(100−(CDE×100))/CDM` produce valores negativos** (paréntesis mal puestos) y **reutiliza CDE/CDM con otro significado**. VII dice "cuatro (4) parámetros" sin coincidir con el art. 60. **Sentido invertido** respecto del inc. IV. |
| 74 | 73 | Cap. II · **32.-[62] PLAZO PARA LA IMPLEMENTACIÓN** (inicio en Anexo 9) · **33.-[63] REPROGRAMACIÓN** | Referencia "parágrafo II del Artículo 28" no coincide. **"hasta noviembre de la Gestión 2025" → fecha vencida** e incompatible con un decreto citado de 24/09/2026. |
| 75 | 74 | fin [63] III (3 meses) · **[64] IMPLEMENTACIÓN ANTICIPADA** · **34.-[65] REPROGRAMACIÓN POR LA AN** | Referencia "Artículo 29" no coincide. "**REPROGRAMACION**" sin tilde. Los 5 bullets del 65 repiten los 4 del 60. |
| 76 | 75 | **35.-[66] REPORTE DE EJECUCIÓN** · **36.-[67] IMPLEMENTACIÓN DEL CRONOGRAMA** | DS 5211 citado 3 veces (coherente), pero **en p.70 el mismo DS aparece mezclado con 5724**. **El art. 67 no dice quién publica/actualiza el Anexo 9.** |

---

## TÍTULO VI — IMPLEMENTACIÓN DEL SERVICIO (**nuevo, no está en el índice**) — PDF 77–85 (doc 76–84)

| PDF | doc | Artículo | Hallazgo |
|---|---|---|---|
| 77 | 76 | **37.- IMPLEMENTACIÓN DE SERVICIOS** · **38.- MÓDULO EXPEDIENTE ELECTRÓNICO** | *Crítico:* **REINICIO DE LA NUMERACIÓN: el 37 y el 38 ya se usaron en la pág. 53.** "Decreto **Nº 5724 de 24/09/2026**" sin "Supremo". **Referencia al "Artículo 70" que no existe** (la serie llega a 67). |
| 78 | 77 | fin 38 III–VI | "Cuando la información o documentación **sea modificado**" (discordancia). |
| 79 | 78 | **39.- RUOCE** · **40.- GESTIÓN PORTUARIA** | **Referencias "Artículo 73" y "Artículo 72" → no existen.** "implementara la y administrará". Duplicidad 39/40 vs p.53/55. |
| 80 | 79 | **41.- REPORTES ESTADÍSTICOS** · **42.- BUSCADOR ARANCELARIO** | **Referencia "Artículo 74" → no existe.** Duplicidad 41/42 vs p.56. |
| 81 | 80 | **43.- PARÁMETROS DE IMPLEMENTACIÓN** (12 bullets) | Sin plazos; lista termina en "Otros" sin definir. Duplicidad 43 vs p.58. |
| 82 | 81 | **44.- PROCESO DE IMPLEMENTACIÓN DEL SERVICIO** (12 etapas) · **45.- IDENTIFICACIÓN** · **46.- RELEVAMIENTO** | Sin plazos; no remiten a R-710. "APROBACION" sin tilde. |
| 83 | 82 | **47.- PROPUESTA** · **48.- REQUERIMIENTO FUNCIONAL** | **Art. 47 inc. II TRUNCADO: termina "…la AN deber".** |
| 84 | 83 | fin 48 (**II truncado: "…para"**) · **49.- DESARROLLO Y CONTROL DE CALIDAD** | **Art. 48 II truncado**; el 49 III duplica el 49 II. |
| 85 | 84 | **50.- CONTROL FUNCIONAL** · **51.- IMPLEMENTACIÓN DEL SERVICIO** · **HISTORIAL DE CAMBIOS** | **"Anexo xx" sin resolver**; el 50 II ordena remitir el **R-425 cuando corresponde R-426** (contradice al art. 48 III). **Aquí termina el cuerpo normativo: NO hay Disposición Final ni Derogatoria.** |

---

## HISTORIAL DE CAMBIOS v2 — PDF 86–93 (doc 85–92)

| PDF | doc | Contenido | Hallazgo |
|---|---|---|---|
| 86 | 85 | Tabla: v1 = **RD 01-087-24 de 28/08/2024**; fila v2 "Cambios realizados:" | **La columna "Documento y Fecha de Aprobación de la versión revisada" de la v2 está VACÍA** (sin RD ni fecha) a lo largo de las pp. 86–93. |
| 87–93 | 86–92 | Bullets de cambios de la v2 (definiciones, abreviaturas, plan de contingencia, interoperabilidad, control funcional, R-427, contingencias >60 min, R-710/R-711, ampliación a noviembre 2025) | Ortografía: "**Xtensible**", "Tramite APCO". El art. 50 remite a "**Anexo xx**". Zona densa de cambios **sin corchetes** (texto corrido). |

---

## ANEXOS — PDF 94–140 (doc 93–134 + reinicio 1–4)

| PDF | doc | Anexo | Hallazgo |
|---|---|---|---|
| 94 | 93 | Separador "**ANEXOS**" | Página casi vacía. |
| 95–96 | 94–95 | **ANEXO 1 — FLUJO DE IMPLEMENTACIÓN DEL TRÁMITE APCO** | *CRITICAL:* **solo el título; la pág. 96 está COMPLETAMENTE VACÍA** (el diagrama no existe en el texto). El cuerpo lo cita en p.49. |
| 97 | 96 | **ANEXO 2 — R-424** Relevamiento de información | Ítem "**12.** DETALLE LOS EL(LOS) DOCUMENTO (S)S" (debería ser 2); nota "**N1**"; "**Ejemplo: eEjemplo**" ×5; "**EMITE FACTURA: Ejemplo: Nosi nO**"; "Página 3 de ___" en blanco. *Comentario de Valeria: "OPEN BCB como es?"* |
| 98 | 97 | R-424 secciones B–D | **Dos secciones "D"** en la misma sección I. "**S NO**" garbled. |
| 99 | 98 | R-424 procesos y sistema informático | "4. F. SISTEMA INFORMÁTICO" (4 huérfano); "**REGISTRO DE OPERADORESENTIDADES**"; "SI **N** EN DESARROLLO: **O** %"; "**citadosl**". |
| 100 | 99 | R-424 instancias/software | **Dos ítems 5 y falta el ítem 4**, pero la instrucción manda "VAYA A LA PREGUNTA 4". |
| 101 | 100 | R-424 diagramas/estadística | "**114.** REGISTRE ADJUNTE EL DIAGRAMA" (numeración fusionada 10→114→12). **Ítem 17 remite a "LAS PREGUNTAS 11 Y 13" (debería ser 12 y 14).** |
| 102–103 | 101–102 | R-424 Entidades sin sistema | **Falta el ítem 6**; los bloques 4–9 **duplican la sección II**. |
| 104 | 103 | R-424 estadística | "**21.III. DATOSINFORMACIÓN ESTADÍSTICOSA**"; encabezado de tabla colapsado; **contradicción "últimos dos (2) años" vs "las últimas 3 gestiones"**. |
| 105 | 104 | R-424 pasos y personas | "**APCOTRÁMITE**", "**B. REQUISITOS…B. REQUISITOS**", "5. **Envió** de la solicitud"; **tabla V solo con encabezados, sin filas**. |
| 106 | 105 | R-424 firma y fin | – |
| 107–118 | 106–117 | **INSTRUCTIVO R-424** | Instructivo dice ítem "**2.**" mientras el formulario dice "**12.**"; **ítem 17 "11 Y 13" repetido 4 veces** (pp. 101, 111, 115 y formulario); el instructivo ofrece "EN DESARROLLO" donde el formulario solo tiene SI/NO; p.118 manda adjuntar el diagrama **del registro equivocado**. |
| 119–121 | 118–120 | **ANEXO 3 — R-710 Plan de Trabajo** + instructivo | Cronograma con 5 actividades y **columnas Responsable/Inicio/Conclusión/Plazo en blanco**. Secciones "**3.[2.]**" y "**4.[3.]**" (doble numeración) que además **no coinciden con el instructivo**. |
| 122–123 | 121–122 | **ANEXO 4 — FLUJO REFERENCIAL DE ETAPAS** | *CRITICAL:* **solo el título; la pág. 123 está COMPLETAMENTE VACÍA.** |
| 124–125 | 123–124 | **ANEXO 5 — R-425 Requerimientos funcionales** | **Entidad Pública Emisora pre-llenada con "AN/GNN/DNPTA/RF/31/2024"** (parece código de expediente); **sección "2. CARACTERÍSTICAS DEL REQUERIMIENTO" sin ningún campo**; "JUSTIFICAC IÓN" partido; el 4 ("Firma") aparece debajo de la tabla. |
| 126–128 | 125–127 | **ANEXO 6 — R-711 Programación de actividades** + instructivo | **Tabla solo con encabezados, sin filas**. El anexo no abre en página nueva. "**Denominación del Tramite APCO**" sin tilde. |
| 129–132 | 128–131 | **ANEXO 7 — R-426 Control funcional** + instructivo | **Dos secciones "4"** en el mismo formulario; el instructivo las numera 4 y 5. "**SOLICTUD** DE PUESTA EN PRODUCCIÓN" (falta la O); "Registras… **realizo**"; "elaboró y **autorizo**". |
| 133–135 | 132–134 | **ANEXO 8 — R-427 Funcionalidades** + instructivo | Tercera vez el pre-llenado "AN/GNN/DNPTA/RF/31/2024"; "**2 DESCRIPCIÓN BREVE**" sin punto; "JUSTIFICAC IÓN" partido; el instructivo no explica el campo "Justificación". |
| **135** | **134** | **ANEXO 9 — CRONOGRAMA DE IMPLEMENTACIÓN GRADUAL** | *CRITICAL:* **ESTÁ VACÍO — solo el título.** No hay tabla, filas ni contenido; la página siguiente ya es el Anexo 10. **Del dependen los arts. 60, 62 II y 67 I.** |
| 136 | **76 de 76** (reinicio) | **ANEXO 10 — "R-XXX / REGISTRO DICCIONARIO DE DATOS"** | *Alto:* **código "R-XXX" sin asignar** (el cuerpo lo llama R-428); bloque de versión sin el "2"; encabezados colapsados ("SECCIÓ N"); **falta la fila C.1**; el cuerpo **jamás cita "Anexo 10"**. |
| 137 | 1 de 76 (reinicio) | fin del diccionario + "4. FIRMA Y SELLOS" | El formulario tiene secciones **1, 2 y 4** (no existe la 3). |
| 138–139 | 2–3 de 76 | **INSTRUCTIVO R-XXX** | Sin secciones numeradas ni bloque de firma (a diferencia de los demás anexos). |
| 140 | 4 de 76 | (vacía) | Página en blanco. |
| 141 | – | (vacía) | Última página del PDF. |

---

# HALLAZGOS TRANSVERSALES (los que no viven en una página sola)

### CRITICAL
1. **Anexo 9 (Cronograma) vacío** — pp. 74, 76 y 135. Reglamento exigible e inaplicable: sin cronograma no hay vigencia ni ejecución.
2. **Sin Disposición Final ni Derogatoria** — 0 ocurrencias de "derogar/disposición final" en las 141 páginas; el cuerpo cierra en p.85 con el Historial. No fija entrada en vigor ni deroga la v1.
3. **Doble serie de numeración de artículos activa** — conviven números sin corchete (v1) y entre corchetes (v2); el Título VI **reinicia en 37** (ya usado en p.53) y duplica 37–51.
4. **Seis "ARTÍCULO X" sin numerar** (pp. 45–48) + marcador "NUEVO ARTICULO".
5. **Referencias a artículos inexistentes:** **70, 72, 73, 74, 376, 463, 389**; y referencias que no coinciden con el tema: "Artículo 11" (por 12 II), "Artículo 28" (×3), "Artículo 29", "Artículo 36", "Artículo 44", "Artículo 14", "Artículo 19 inc. b)", "**Anexo xx**" (pp. 38, 85), "**Artículo xx**" (p.32).
6. **Cita de decreto corrupta:** "**Decreto Supremo N° 5724211 de 284/089/2024**" (p.70) — mezcla el DS 5724/2026 con el DS 5211/2024 y ambas fechas.
7. **Notas editoriales y basura dentro del texto normativo:** "que pasa con el BCB" (p.7), "OJO MARCELO ZAMB" (p.43), "NUEVO ARTICULO" (p.46), "jklhjkl" (p.65), "xxxx, la xxxx" y "ojo revisar la redacción" (p.68), "Anexo xx" (pp.38/85), "Artículo xx" (p.32), "como se verifica?" y "Definir el alcance de firma digital" (p.26), "(Sujeto a sanción…)" (p.58).
8. **Sin régimen de sanciones, recursos ni plazos de resolución** de la AN; Ley 2341 solo se cita de pasada en el art. 29 (p.44) y ni siquiera está en la base legal del art. 5.
9. **Historial de la v2 sin RD ni fecha de aprobación** (pp. 86–93) → el documento no acredita su propia aprobación.

### HIGH
10. **Escalas de plazos inválidas por fusión de texto:** "(105) días" (pp.35,36), "(53) días" (p.35), "(75) días" (p.52), "(25) días" (p.62). Más la contradicción real **10 vs 15 días** en el art. 35 I/II (pp.50 y 52) y **3 vs 15 días** dentro del art. 12 II (p.23).
11. **Artículos vacíos o de una línea:** 31, 32, 33, 34 (p.49), 43 (p.58), **46 y 47 (p.59)**; **truncados:** 47 II "…la AN deber" (p.83), 48 II "…para" (p.84); art. 9 sin epígrafe (p.23); art. 22 metido dentro del 21 (p.35).
12. **Listas rotas:** literal "c)" huérfano (p.7), "d) ." y "[g)]" vacíos (p.33), "[f)]" vacío (p.39), `[III.]` vacío (p.55), `[IV.]` vacío (p.58), numeración de EPE duplicada (p.12), literales duplicados en arts. 16, 25, 30, 35, 39, 41.
13. **Sin SLA / niveles de servicio:** 0 ocurrencias de "SLA", "niveles de servicio", "ventana de mantenimiento"; "alta disponibilidad" sin % ni medición (arts. 12, 25 III).
14. **Sin respaldo/recuperación:** 0 "backup", 0 "RTO/RPO", 0 "hash"; las contingencias (arts. 56–58) solo obligan a **comunicar**, no a recuperar.
15. **Sin protección de datos personales:** 0 "Ley 164/1266/1760"; solo "confidencialidad" (art. 29) y "datos personales de los puntos focales" (arts. 18 c, 21 I).
16. **Trazabilidad sin bitácora:** una sola mención de "registros de auditoría" (art. X, p.45); 0 "bitácora" exigible, 0 gestión de incidentes.
17. **Índice desfazado** (pp. 3–4): páginas, capítulos y anexos mal ubicados; **sin Título VI ni Anexo 10**; encabezados con **"de 76"** cuando el documento tiene 134+4 páginas impresas.
18. **Anexos 1 y 4 sin diagrama** (pp. 96 y 123 vacías).
19. **Fórmulas de ponderación inválidas** (arts. 61/31, pp. 72–73): `VFM` definido como entidad, `c` con paréntesis que dan negativos, CDE/CDM redefinidos, 4 parámetros declarados ≠ 4 promediados.
20. **Fecha vencida:** "hasta noviembre de la Gestión 2025" (art. 63, p.74) incompatible con el DS 5724/2026.
21. **Autenticación/firma abierta:** "firma digital … u otros" (art. 14) sin tipo de certificado ni sello de tiempo; sin MFA/federación.
22. **Base legal con DS 5593/5595 de marzo 2026** posteriores a la aprobación de la portada (29/08/2025) y **sin Ley 1178 ni 2341** en el art. 5.
23. **Notas de revisión sin resolver (5):** 3 de Brenda (genéricos en requisitos de EPE, definición de servidores, pagos), 2 de Valeria ("OPEN BCB como es?" y una vacía).
24. **Duplicidad de epígrafes:** "Participación del Sector Privado" en arts. 40 y 41; independencia operativa en art. 13 y en art. X.
25. **Ambientes de prueba contradictorios** (arts. 25/23 vs 48 II) sin dueño ni plazo de entrega.

### MEDIUM
26. **Códigos de registro mal citados:** R-711 llamado "Plan de Trabajo" (p.58, es R-710); **R-214** inexistente (p.61); "R-428" para el diccionario que en el Anexo 10 es **R-XXX**; R-710/R-711 no aparecen en el índice.
27. **Formularios/instructivos desalineados:** R-424 (ítem 12 vs 2; dos secciones "D"; dos ítems 5; falta ítem 6; "11 y 13" por "12 y 14" ×4), R-710 (3/4 vs [2.]/[3.] vs 1–4), R-426 (dos secciones "4"), R-427 (2 vs 2 DESCRIPCIÓN; falta explicar "Justificación").
28. **Tablas vacías:** R-425 sección 2, R-711 (sin filas), R-424 sección V, R-426 sección 2, Anexo 10 fila C.1.
29. **Definiciones vacías u huérfanas:** Administración, Implementación, Operación, Guía de aplicación general (p.13), párrafo sin término (p.16); ~20 términos definidos y nunca usados.
30. **Nombres institucionales incorrectos:** "Agencia Estatal de TIC" (p.13), "ANH: Agencia Nacional de Hidrocarburos" (p.20), fusiones MRE/CDyD y MPSMMAyYA.
31. **Correos y canales de notificación** repetidos/inconsistentes (8 veces el mismo; `soporte@vuce.gob.bo` duplicado en el art. 57).

### LOW
32. Erratas: `SOLICTUD`, `Xtensible`, `Tramite`, `Envió`, `wattsapp`, `infomático`, `imncorporado`, `CONTIGENCIA`, `REPROGRAMACION`, `citadosl`, `realizo`, `autorizo`, "Ley 1178 de 20/07/201190".
33. Formato: "CAratulas"-style, encabezados de tabla colapsados, "Página 3 de ___" en blanco, portada ≠ encabezado, página final en blanco.

---

## Qué SÍ está bien (respaldo positivo)

1. **Se incorporaron elementos que faltaban en la v1:** Título VI de servicios (Expediente Electrónico, RUOCE, Gestión Portuaria, Buscador Arancelario), registros **R-710/R-711**, y referencia al **DS 5724 de 24/09/2026**.
2. **Glosario amplio** (arts. 6–7): 40+ términos y siglas, con lista de EPEs actualizada (lista entera entre corchetes en pp. 11–12).
3. **Proceso por etapas completo** (arts. 30–53 y 44–51): relevamiento → mapeo → revisión → plan → optimización → diseño → desarrollo → control → piloto → vigencia.
4. **Registros con código** (R-424/425/426/427/710/711) con instructivo de llenado para cada uno.
5. **Contingencias con umbral objetivo** (60 minutos) y canal de escalamiento (soporte@vuce.gob.bo).
6. **Art. 61 con fórmulas explícitas** (aunque con errores): intenta objetivar el orden de implementación.
7. **El control de cambios está bien trazado:** 3 autores, fechas y 5 comentarios localizables — permite aceptar/rechazar con criterio.

---

## Plan de acción (en orden de ejecución)

**Fase 1 — Bloqueantes antes de imprimir/aprobar:**
1. **Aceptar o rechazar los 3.485 cambios** y eliminar la serie vieja → la numeración de artículos debe quedar única (y el Título VI sin reiniciar en 37).
2. **Numerar los 6 "ARTÍCULO X"** (pp. 45–48) y eliminar el marcador "NUEVO ARTICULO".
3. **Llenar el Anexo 9** (p.135) o reprogramar el cronograma a criterio relativo; mientras esté vacío, los arts. 60/62/67 no son exigibles.
4. **Añadir Disposición Final y Derogatoria** (vigencia + derogatoria de la RD 01-087-24 en lo incompatible).
5. **Purgar notas editoriales/basura:** "OJO MARCELO ZAMB", "jklhjkl", "xxxx", "ojo revisar", "que pasa con el BCB", "Anexo xx", "Artículo xx", "(Sujeto a sanción…)", "como se verifica?".
6. **Corregir la cita corrupta del decreto** (p.70) y unificar DS 5211/2024 vs DS 5724/2026 + refechar el art. 63 (nov-2025).
7. **Arreglar referencias rotas:** 70, 72, 73, 74, 376, 463, 389, 11→12, 28 (×3), 29, 36, 44, 14, 19 b.
8. **Completar artículos vacíos/truncados:** 31, 32, 33, 34, 43, 46, 47, 47 II, 48 II, 9, 22.
9. **RD y fecha de la v2 en el Historial** (pp. 86–93).

**Fase 2 — Coherencia:**
10. Unificar plazos: eliminar "(105)/(53)/(75)/(25)" y decidir **una** escala (3/5/10/15 días) con jerarquía por tipo de evento.
11. Sustituir "xxxx" del art. 57 y cerrar la responsabilidad de operación (AN vs AGETIC vs EPEs).
12. Corregir fórmulas del art. 61 y alinear parámetros 60 vs 61.
13. Completar Anexos 1 y 4 (diagramas) y el índice (Título VI, Anexo 10, páginas reales, total de páginas del encabezado).
14. Resolver los 5 comentarios (definir OPEN BCB, definir servidores, desglosar lineamientos AGETIC/pagos).

**Fase 3 — Cobertura técnica (separada del reglamento):**
15. Añadir artículo de **niveles de servicio** (SLA: métrica, umbral, medición, consecuencia), **bitácora de auditoría**, **respaldo/recuperación (RTO/RPO)**, **protección de datos (Ley 164)** y **régimen de recursos/sanciones (Ley 2341)**.
16. Alinear formularios e instructivos (R-424, R-710, R-425, R-711, R-426, R-427) y asignar el código real del Anexo 10 (R-XXX → R-428 o el que corresponda).

**Advertencia:** tal como está, el .docx **no puede ser la versión publicada**: muestra simultáneamente dos reglamentos en edición, seis artículos sin número, siete referencias a artículos inexistentes y el cronograma vacío. Imprimirlo o aprobarlo sin aceptar/rechazar los cambios consolidaría los defectos de ambas versiones.
