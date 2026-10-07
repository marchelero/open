# Reporte de Revisión — Reglamento VUCE (GNN-REG-14 Versión 2)

**Fecha:** 2026-10-05
**Fuente:** `Reglamento VUCE Propuestas(2).docx` → `Reglamento VUCE Propuestas(2).md` (1691 líneas, 57 artículos, 9 anexos)
**Alcance:** revisión de redacción normativa + auditoría de cobertura del área de Sistemas
**Contexto:** el reglamento cubre 2 áreas (Normativa y Sistemas). En Sistemas no se hizo nada. El documento debe servir de **respaldo**, no de riesgo.

---

## Resumen ejecutivo

| Severidad | Normativa | Sistemas | Total |
|---|---|---|---|
| CRITICAL | 2 | 6 | **8** |
| HIGH | 14 | 10 | **24** |
| MEDIUM | 12 | 11 | **23** |
| LOW | 2 | 3 | **5** |
| **Total** | **30** | **30** | **60** (≈52 únicos tras deduplicar solapes) |

**Diagnóstico:**
- **Área Normativa:** razonablemente cubierta en estructura (Títulos I–V, capítulos, anexos), pero con **defectos de redacción que la hacen impugnable**: art. 1 duplicado y truncado, tachados visibles, numeraciones rotas, 3 plazos incompatibles para el mismo acto, sin artículo de vigencia/derogatoria, sin régimen de recursos ni sanciones.
- **Área de Sistemas:** el patrón es único y grave — **exige resultados tecnológicos sin definir mecanismos, métricas, dueños ni evidencias**. Cero ocurrencias de: SLA, bitácora, hash, regresión, ventana de mantenimiento, criterio de aceptación. El `.docx` trae **18 comentarios de revisión** que proponen justo los elementos faltantes (SLA ≤ 2h, gestión de cambios con prioridad, acta de hallazgos, log API, migración con hash) y **ninguno se incorporó al texto**.
- **Cruce de ambos:** el Anexo 9 (Cronograma) está **vacío** y todo el Título V cuelga de él; el art. 53 tiene plazo vencido (nov-2025).

---

## CRITICAL (8)

| # | Área | Hallazgo | Ref. | Recomendación |
|---|---|---|---|---|
| C1 | Ambas | **ARTÍCULO 1 duplicado y truncado**: `ARTÍCULO 1.- (EXPEDIENTE ELECTRONICO VUCE).....` huérfano tras el art. 57, sin cuerpo. El "corazón" del valor probatorio quedó sin redactar (no define retención, integridad, acceso, custodia; el art. 24 remite a reglas inexistentes → referencia circular). | L935; art. 24 (L598) | Redactar el artículo completo (objeto, plazo de conservación, integridad, acceso, responsables) y eliminar la remisión circular; o borrar el residuo. Modelo técnico aparte: sellado hash, retención, disposición final. |
| C2 | Normativa | **Base legal potencialmente desactualizada**: arts. 5 n, 10, 50, 52, 56, 57 remiten al DS 5211 de 28/08/2024. Se reporta un DS modificatorio de 24/09/2026 (Gaceta 2105NEC) que amplía 24 meses la Disposición Transitoria y obliga a modificar el cronograma en 20 días hábiles (≈22/10/2026). *⚠ Verificar antes de actuar.* | L189, 423, 835, 899-933 | Verificar en Gaceta Oficial si el DS 5211 fue modificado; si es así, actualizar base legal y reconducir arts. 50–57 y Anexo 9 al nuevo cronograma. |
| C3 | Sistemas | **Anexo 9 (Cronograma) completamente vacío** — tras el encabezado solo `sectPr` en el .docx (0 tablas/objetos). arts. 52 II, 57 I, 29 II, 23 II, 15 b remiten a él. Reglamento exigible pero **matemáticamente inaplicable**. | L1689–1691 | Incorporar el Anexo 9 con ítems por EPE, mes de inicio, hitos (R-424, R-425, control funcional, piloto) y fecha de vigencia. |
| C4 | Sistemas | **Sin SLA**: "alta disponibilidad" sin %, medición, ventana de mantenimiento ni tiempo de respuesta (arts. 11 I, 23 III, 10). Obligación inverificable e inimpugnable. | arts. 11, 23 | Artículo de niveles de servicio: métrica, umbral, cálculo, reporte y consecuencias. Técnico aparte: plan de capacidad, monitoreo. |
| C5 | Sistemas | **Sin respaldo ni recuperación ante desastres**: arts. 46–49 norman la contingencia **solo como comunicación**. Cero "backup", "recuperación", RTO/RPO. Pérdida de BD = pérdida de trámites con valor jurídico. | arts. 46–49 | Obligar plan de continuidad con RTO/RPO, respaldos y evidencia de prueba de restauración. Técnico: política de backups, DR. |
| C6 | Sistemas | **Validez legal plena condicionada a "firma digital … u otros"** (art. 13 I): cláusula abierta, sin tipo de certificado, sello de tiempo ni revocación. Un APCO puede impugnarse por mecanismo de firma no reglado. | art. 13 I; def. L255 | Cerrar la cláusula (mecanismos admitidos + estándar reconocido). Técnico: perfil PAdES/XAdES, PKI, CRL/OCSP. |
| C7 | Sistemas | **Responsabilidad de operación huérfana y contradictoria**: art. 4 c (AGETIC opera) vs. art. 11 I ("operación a cargo de las EPEs") vs. art. 16 g (AN mantiene portal/sistema). El art. 17 (AGETIC) no recoge la obligación y escapa 3 veces con "en el marco de sus competencias". Todo depende de AGETIC sin plazo, métrica ni plan B. | arts. 4 c, 10, 11 I, 16 g, 17, 46, 48 | Artículo "Operación técnica de la VUCE": núcleo → AN, servicios de gobierno electrónico → AGETIC, tramitología → EPEs; con plazos, métricas, escalamiento y consecuencias. |
| C8 | Sistemas | **Sin régimen de recursos, sanciones ni plazos de resolución de la AN**; base legal sin la Ley 2341 de 04/04/2002 (Procedimiento Administrativo). Actos sin recurso de apelación → posible ilegalidad (arts. 115, 117 CPE). | arts. 27 II, 32, 45 II, 54 II; L174–190 | Plazos máximos de resolución, recurso administrativo, remisión expresa a Ley 2341. *(También cruza el área normativa.)* |

---

## HIGH (24)

### Normativa

| # | Hallazgo | Ref. | Recomendación |
|---|---|---|---|
| H1 | Art. 24: estructura de listas rota — tercer literal "a)" huérfano sin contenido | L586–600 | Convertir en parágrafo ("Parágrafo único. Expediente Electrónico VUCE…") o mover al art. 45. |
| H2 | Art. 36: párrafo **II duplicado, falta III** (I, II, II, IV, V) | L729–735 | Renumerar y unificar estilo de listas. |
| H3 | Cruz-referencia errónea: art. 43 IV remite el R-427 al "Artículo 44" (debe ser **45**) | L783 | Corregir a "Artículo 45". |
| H4 | **Tres plazos incompatibles** para actualizar normativa en la VUCE: 15 días (art. 11 II) vs. 10 días (art. 43 IV) vs. 3 días (art. 44 I) | L429, 783, 793 | Unificar un solo plazo con jerarquía por tipo de evento. |
| H5 | Art. 18: **deberes tachados visibles** (control de cambios sin aceptar); posible que d)/e) fueran los que debían suprimirse | L510–511 | Definir qué versión es la válida antes de aprobar. |
| H6 | Historial de cambios: **v2 sin RD ni fecha de aprobación** (celda vacía); v1 fechada el mismo día del DS 5211 (posible error) | L941–942 | Completar RD/fecha de v2 y conciliar con portada. |
| H7 | Art. 25 II "únicamente … con el SUMA" contradice al art. 25 III (interoperabilidad internacional) y al art. 2 d | L604/606 | Precisar que "únicamente" es ámbito nacional (fase 1). |
| H8 | Art. 51: **fórmulas de ponderación matemáticamente inválidas** (valores negativos, símbolos reutilizados con 2 significados, factores a)/c)/e) sin b)/d), VFM definido como entidad) | L847–891 | Corregir fórmulas y completar factores; riesgo de impugnación del cronograma. |
| H9 | Ventana estadística contradictoria: "tres gestiones" (art. 50 a) vs. "dos años" (Anexo 2) | L837 vs. 1123, 1314 | Homogeneizar. |
| H10 | Anexo 2 instructivo remite a diccionarios de "PREGUNTAS 11 Y 13" (son **12 y 14**) — 4 participantes guían mal | L1054, 1114, 1245, 1307 | Corregir numeración. |
| H11 | **Sin régimen de protección de datos personales** (Ley 164 solo en base legal; art. 27 solo "confidencialidad") | arts. 20, 27 | Añadir finalidad, minimización, retención y remisión expresa a Ley 164. |
| H12 | Cronograma sin soporte: art. 53 I "hasta noviembre de la Gestión 2025" **vencido**; Anexos 1 y 4 solo `Embedded object: Visio` | L903, 950, 1427, 1689 | Cargar Anexo 9, reponer diagramas, refechar art. 53 a criterio relativo. |

### Sistemas

| # | Hallazgo | Ref. | Recomendación |
|---|---|---|---|
| H13 | **Interoperabilidad sin contrato de interfaz**: "Guía de Aplicación General" dada por existente, sin obligar publicación ni contenido; 0 "API"/"OpenAPI" | art. 23 b,g,IV | Obligar publicación de la Guía con contenido mínimo y plazo. Técnico: OpenAPI, mTLS/OAuth2, certificación de integración. |
| H14 | **Autenticación dual sin federación**: OCE ante AN **u** Ciudadanía Digital con AGETIC; sin SSO, MFA, roles ni revocación | art. 18 a | Identidad federada única, niveles de autenticación, control por rol. |
| H15 | **Seguridad declarativa**: "estándares de seguridad" sin nombrar ninguno; art. 26 obliga solo a EPEs; sin cifrado, pentest, gestión de incidentes ni brechas | arts. 10 II, 26, 27 | Capítulo de seguridad con obligaciones verificables; PSI de la VUCE aparte. |
| H16 | **Trazabilidad sin bitácora**: se define "Trazabilidad" (art. 6) y no se exige la evidencia (0 "bitácora", 0 "auditor") | arts. 6, 24, 25 IV | Exigir log de auditoría inmutable con conservación mínima y acceso a control. |
| H17 | **Proceso 36→38 incompleto**: silencio = aprobación, sin criterios de aceptación, sin pruebas (seguridad/carga/regresión), sin rollback; la EPE **se auto-certifica** (R-426) con solo 2 días | arts. 36–38, 41; Anexo 7 | Ciclo completo: aprobación expresa, criterios de entrada/salida, acta conjunta, ventana de despliegue y reversión. |
| H18 | **Gestión de cambios sin plazo ni priorización** (R-427): art. 45 II solo dice "reuniones de coordinación" | art. 45; Anexo 8 | Plazo máximo de evaluación, categorías, prioridades y vía de urgencia. |
| H19 | **Plazos tecnológicos contradictorios** para comunicar cambios (15 vs. 3 días; ver H4) | arts. 11 II, 43 IV, 44 I, 21 II | Un solo artículo con jerarquía: cambio documental vs. con impacto informático. |
| H20 | **Ambientes de prueba contradictorios**: art. 23 d (EPEs disponen servidores) vs. art. 38 II (EPEs piden a AGETIC); sin plazo de entrega ni dueño claro | arts. 23 d, 38 II, 16 e/g | Asignar quién provee cada ambiente con plazo; aislamiento y datos sintéticos aparte. |
| H21 | **Módulo Estándar: 2 años de alojamiento sin plan de salida** — vencido el plazo, nada define continuidad ni formato de entrega | art. 24 a iii, b i–ii | Prórroga condicionada, plan de migración anticipado y consecuencia; protocolo de exportación (JSON/XML + acta + hash) aparte. |
| H22 | "Únicamente SUMA" choca con obligación de interoperar con SIN/SEPREC/etc. (arts. 2 d, 15 III) — exigencia sin canal técnico | arts. 25 II, 2 d, 15 III | Matizar "únicamente" (fase 1); mapa de interoperabilidades aparte. |

---

## MEDIUM (23)

**Normativa:** art. 17 c) sin sujeto y en conflicto con art. 20 (¿AGETIC o EPEs designan puntos focales?) · art. 14 excepción de plazo sin criterio ni autoridad · art. 13 validez documental abierta ("u otros", declaratoria jurada discrecional) · "Expediente Electrónico" sin definición y sin tilde · definiciones discordantes/no usadas ("Aprobación de Documentos", "Buscador Arancelario", "Módulo Estándar" vs "Módulo Estándar de la VUCE", "Plan de Contingencia(s)") · nombres institucionales incorrectos (AGEMED/AGETIC, "Autoridad de Juego", "Agencia Nacional de Hidrocarburos") y abreviaturas muertas/faltantes en art. 7 · R-710/R-711 nunca citados en el articulado · mismo plazo en días calendario y simples (arts. 31 II vs 52 I) · art. 51 "mayor" por "menor" + tiempos verbales en pasado · 3 versiones del Grado de Madurez Tecnológica · correos inconsistente texto/`mailto:` y formularios con código prellenado · arts. 46–47 con voz pasiva sin sujeto.

**Sistemas:** Anexo 5 (R-425) sin campos de criterios de aceptación (contradice su propia definición de "verificable y medible") · Anexo 6 (R-711) **enteramente vacío** (7 filas en blanco) · Anexo 7 auto-certificación sin firma AN y numeración rota (dos secciones "4") · Anexo 8 sin severidad/estado/fecha límite · Anexo 3 (R-710) omite actividades obligatorias del art. 28 II (plan de contingencias) · Anexos 1 y 4 solo objetos embebidos · Anexo 2 con pregunta 9 duplicada y sin datos técnicos de integración · art. 17 c) vs 20 · correos de notificación inconsistentes (canal viciado = plazo discutible) · art. 53 caducado · art. 48 promete "reestablecimiento" y solo exige comunicar (sin plazo, aunque ciudadanía digital/pasarela bloquean autenticación y pago).

---

## LOW (5)

- **Erratas/residuales:** CONTIGENCIA, REPROGRAMACION, "se realizaran", "no este", "14. 14. ADJUNTE", SOLICTUD, "Xtensible Markup Language", art. 44 "I**.**", ejemplos numéricos incoherentes en Anexo 2.
- **Formato/conversión:** "CAratulas AN 2", índice solo por capítulos (sin artículos), listas `a. b. c.` vs `a) b)`, definiciones con formato mixto.
- **Definiciones técnicas que no se convierten en requisitos:** XML/JSON/REST/VPN/IP definidos pero el art. 23 a no exige cifrado mínimo ni autenticación servicio-a-servicio.
- **Sin documentación técnica obligatoria ni soporte post-lanzamiento** (manuales, runbooks, horarios, escalamiento).

---

## Qué está bien redactado (respaldo positivo)

1. **Arquitectura de documento:** Títulos I–V con capítulos bien delimitados (generalidades → implementación → operación → cronograma) y glosario de 40+ términos en arts. 6–7.
2. **Base normativa sustantiva:** DS 5211/2024, Decisiones Andinas 770/885/906 citadas correctamente (verificadas); encaje correcto con el marco de facilitación del comercio.
3. **Proceso de implementación por etapas** (arts. 28–43): relevamiento → mapeo → revisión → plan de trabajo → optimización → desarrollo → control funcional → piloto → vigencia. Es un ciclo completo y bien secuenciado.
4. **Sistemas de registro con código** (R-424/425/426/427) y anexos formularios: dan trazabilidad administrativa real.
5. **Contingencias con umbral objetivo** (60 minutos, art. 46) y comunicación a través de un canal con correo institucional.
6. **Corresponsabilidad EPE–AN explícita** en casi todos los artículos (matriz de obligaciones clara en arts. 15–17).

---

## Plan de acción recomendado

**Fase 1 — Antes de aprobar (bloqueantes):**
1. Verificar en Gaceta si el DS 5211 fue modificado (24/09/2026) y actualizar base legal. *(C2)*
2. Eliminar/reedactar el ARTÍCULO 1 residual y definir el Expediente Electrónico. *(C1)*
3. Llenar el Anexo 9 (Cronograma) o el reglamento no es ejecutable. *(C3)*
4. Resolver los 18 comentarios del .docx pendientes (SLA, gestión de cambios, evidencias, migración). *(C4, H17, H18, H21)*
5. Añadir Disposición Final (vigencia + derogatoria de v1) y régimen de recursos/sanciones con Ley 2341. *(C8, H-fix)*
6. Limpiar tachados (art. 18), numeraciones rotas (arts. 24, 36) y la referencia art. 43→45. *(H1–H5)*

**Fase 2 — Unificar plazos y responsables:**
7. Un solo plazo para cambios normativos (15/10/3 días) y un artículo de operación técnica que reparta AN/AGETIC/EPEs. *(H4, H19, C7)*
8. Zanjar "únicamente SUMA", dueño de ambientes y protección de datos. *(H7, H20, H11)*

**Fase 3 — Separar lo técnico del reglamento:**
9. El reglamento exige **qué**; un **documento técnico/pliego** debe definir **cómo**: SLA, API/OpenAPI, PKI/firma, logs, backups/DR, RTO/RPO, pruebas y rollback, catálogo de soporte. No cargar el reglamento con detalle técnico, pero sí obligar a su publicación con plazo.

**Advertencia final:** tal como está, el documento **no protege**: obligaciones sin métrica, sin plazo ni dueño son inimpugnables pero también inexigibles, y los vacíos de firma/conservación/contingencia son vías de nulidad de los actos que emita la VUCE.
