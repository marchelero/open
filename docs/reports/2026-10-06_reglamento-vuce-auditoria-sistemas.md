# INFORME DE AUDITORÍA TÉCNICO-SISTÉMICA
## Reglamento de Implementación, Administración, Operación y Actualización de los Trámites y Servicios en la VUCE (Bolivia)
**Fuente auditada:** `/tmp/opencode/vuce/out/accepted.txt` (2.908 líneas, Art. 1–76 + Historial + Anexos 1–10), cruzado con `brenda_inventory.md` (ronda 06/10/2026) y `final/word/document.xml` (tablas, 3 fórmulas OMML, 6 imágenes).
**Referencias:** `Art. N · L<línea>` = artículo y línea en accepted.txt. Secciones: **§1** Arquitectura · **§2** Interoperabilidad · **§3** Seguridad/datos · **§4** Expediente · **§5** Cronograma · **§6** Registros/Anexos · **§7** Modelo de proceso · **§8** Técnico-lingüístico.

---

## RESUMEN EJECUTIVO — 10 problemas técnicos más graves

1. Un capítulo entero (Contingencias) está redactado con marcadores `ARTÍCULO X`, `X+1`…`X+7`: norma incititable e inaplicable (L805–841).
2. El Art. 63/64 está duplicado (`ARTÍCULO 63.- ARTÍCULO 64.-` y otro `ARTÍCULO 64` para RUOCE): todas las referencias cruzadas del Título VI quedan rotas (L963, L977).
3. La "operación de la VUCE" se atribuye a las EPEs (L365) **y** a la AN (L371) en el mismo artículo: no hay titular de SLA, soporte ni incidentes.
4. El **Anexo 9 (Cronograma de Implementación Gradual) está vacío** en el cuerpo documental: Arts. 30-I, 56-II, 61-I, 14-g/h y 60 carecen de calendario operativo (L2614).
5. Obligaciones truncadas: `la AN deber` (L1045) y `las coordinaciones necesarias para` (L1055) dejan el proceso de servicios sin obligación definida.
6. Art. 28 impone confidencialidad absoluta (`no pudiendo ponerse a conocimiento de terceros`, L593), incompatible con verificación pública (L389), intercambio con SUMA/VUCES (L578/580) y estadística pública (L990).
7. Registros inexistentes en la cadena de producción: **R-214** (L734), **R-428** (L689), **R-712** (L718) y **R-XXX** (L2617) — sin anexo ni definición.
8. El pase a producción exige el Anexo 9 (cronograma), el Anexo xx (modelo de negocio, L518), el Artículo xx (L436) y la `GUIA...` sin identificar (L967/969): cuatro referencias irresueltas.
9. Cronograma técnicamente inviable: 120 días (L654/L911) incluyen aprobación de Ley/Decreto (L744) y la ventana de reprogramación está fijada `hasta noviembre de la Gestión 2025` (L915), ya vencida.
10. Interoperabilidad sin especificación técnica: se eliminaron REST/OpenAPI/JSON/códigos HTTP (L522–523) y no existen versionado, idempotencia, reintentos, firma de mensajes ni ambiente de homologación (0 ocurrencias en 2.908 líneas).

**Recuento: 13 BLOQUEANTE · 38 ALTO · 27 MEDIO · 8 BAJO = 86 hallazgos.**

---

# 🔴 BLOQUEANTE (13)

**§6 · Art. 63 · L963** — `"ARTÍCULO 63.- ARTÍCULO 64.- (EXPEDIENTE ELECTRÓNICO VUCE)"` — dos números en un encabezado y un segundo `ARTÍCULO 64` (RUOCE, L977): identificadores duplicados invalidan toda cita del Título VI. → Renumerar 63–76, rehacer índice y actualizar referencias internas.

**§1 · Art. 10 · L365/L371** — `"La operación ... estará a cargo de las EPEs"` / `"La AN estará a cargo de la operación"` — doble titularía sin delimitar componentes (portal, sistema, módulo, interoperabilidad): imposible asignar disponibilidad, soporte o responsabilidad por incidentes. → Sustituir por una matriz AN/EPE/AGETIC por componente con SLA asociado.

**§7 · Art. X–X+7 · L805–841** — `"ARTÍCULO X.- (OBJETO Y ALCANCE)"`, `X+1`…`X+7` — capítulo entero con marcadores sin resolver: continuidad, respaldos y procedimientos alternos sin número de artículo. → Renumerar (53–59) y reindexar todas las remisiones al "capítulo de contingencias".

**§6 · Anexo 9 · L2614** — `"ANEXO 9 / CRONOGRAMA DE IMPLEMENTACIÓN GRADUAL"` sin contenido (seguido directo de Anexo 10) — Arts. 30-I, 56-II, 61-I, 14-g/h y 60 remiten a un calendario inexistente. → Insertar la tabla por entidad/trámite con fechas inicio–fin, responsables y publicarla.

**§7 · Art. 72 · L1045 / Art. 73 · L1055** — `"la AN deber"` y `"las coordinaciones necesarias para"` — obligaciones truncadas en la aprobación de propuestas y coordinación con EPEs: proceso de servicios no ejecutable. → Completar cada numeral con obligación, plazo, responsable y consecuencia del incumplimiento.

**§3 · Art. 28 · L593** — `"no pudiendo ponerse a conocimiento de terceros"` — confidencialidad absoluta incompatible con verificación pública de documentos (L389), interoperabilidad con SUMA/VUCES (L578/580) y publicación estadística (L990): regla inaplicable. → Reemplazar por acceso por finalidad con excepciones taxativas (trámite, control aduanero, cooperación internacional) y base legal.

**§6 · Art. 38 · L689** — `"Registro Diccionario de Datos R-428 ... Anexo 5 y 6"` — R-428 no existe y el Anexo 6 es el R-711; el diccionario es Anexo 10 con código `R-XXX` (L2617). → Asignar código definitivo al diccionario, publicarlo como anexo e invocarlo desde el Art. 38.

**§6 · Art. 43 · L734** — `"elabora el R-214 y registra ambos documentos"` — registro inexistente (sin anexo ni definición): el traspaso R-425→R-426→producción queda sin evidencia formal. → Crear el registro o sustituirlo por R-426 y anexarlo.

**§3 · Art. 53 · L845** — `"computables a partir de xxxx, la xxxx"` — umbral de 60 minutos sin punto de partida ni método de medición, y contradictorio con Art. X+2 (umbrales "en la Guía", L820): activación de contingencia indeterminada. → Definir inicio, medición y fuente, o unificar con un único umbral en el reglamento.

**§4 · Art. 64 · L967/L969** — `"de acuerdo con la GUIA..."` / `"conforme al principio de una sola vez y la GUIA...."` — garantías del expediente (integridad, inmutabilidad) remitidas a documento no identificado. → Citar Guía por código, versión y fecha, o reglamentar internamente los controles.

**§1 · Art. 8 · L349** — `"(IMPLEMENTACIÓN DE LOS TRÁMITES Y SERVICIOS EN LA VUCE). I. La AN implementará..."` — bloque normativo completo (I–V) dentro del Art. 8 sin número de artículo: no citable. → Extraerlo a artículo propio con renumeración o integrarlo a los incisos del Art. 8.

**§3/§8 · Art. 12 · L387** — `"(VALIDEZ LEGAL DE LOS DOCUMENTOS DIGITALES). ... III."` + `"Definir el alcance de firma digital"` — segundo bloque con numeral III duplicado (L385 y L387) y validez jurídica condicionada a una definición pendiente. → Extraer a artículo propio, renumerar párrafos y definir el efecto jurídico de firma digital, SOFTOKEN y aprobador de documentos.

**§1 · Art. 23 · L543** — `"ARTÍCULO 23.-"` vacío, y Art. 25 (L568) `"MODELO DE OPERACIÓNDE LA VUCE. I. I."` con numeral I repetido — hueco de numeración más defecto de estructura en el modelo de operación. → Suprimir o completar el Art. 23 y corregir los numerales del Art. 25.

---

# 🟠 ALTO (38)

### §1 Arquitectura y modelo de operación
1. **Art. 16 · L450** — `"Garantizar de manera ininterrumpida la disponibilidad"` (AGETIC) — obligación sin métrica (% disponibilidad, RTO/RPO, horario): no auditable ni sancionable. → Fijar SLA mínimo por servicio de gobierno electrónico con métrica y consecuencia.
2. **Art. 22 · L534** — `"serán responsables de mantener la disponibilidad ... según la guía de aplicación"` — disponibilidad delegada a una Guía sin código ni versión en el acto: obligación condicionada a documento no integrado. → Anexar o citar la Guía con código, versión y vigencia, o fijar umbrales mínimos en el reglamento.
3. **Art. 24 · L550 vs L555** — `"asumir ... la administración y operación del módulo estándar"` (EPE) vs `"Administrará y alojará ... la AN"` — doble titularía de la infraestructura sin transición. → Definir hito, criterios y responsabilidad durante la transferencia AN→EPE.
4. **Art. 2 · L125** — `"asegurar la continuidad permanente ... que pasa con el BCB"` — nota editorial en inciso operativo y el BCB (Open BCB, L263) ausente de los responsables pese a sustentar pagos. → Eliminar la nota y crear responsabilidad expresa del BCB en pagos y conciliación.
5. **Art. 10 · L367 vs Historial L1104** — `"tres (3) días hábiles"` vs `"plazo mínimo de quince (15) días"` — contradicción entre cuerpo e historial sobre aviso de cambios normativos. → Unificar el plazo y actualizar el historial.
6. **Art. 62 · L953 vs Art. 54 · L857** — `"Decreto Nº 5724 de 24/09/2026"` vs `"Decreto Supremo N° 5724 de 24/09/2024"` — misma norma con dos fechas y ausente del Art. 5 (base legal). → Verificar fecha, corregir y añadir el DS al Art. 5.
7. **Art. 13 · L393** — `"cinco (5) días hábiles ... excepcionalmente ... diez (10)"` — plazo de emisión sin regla de cómputo (¿se suspende con observaciones, pagos, inspecciones?): métrica no calculable. → Definir hechos que suspenden/reinician el cómputo y quién los certifica.
8. **Art. 42/43 · L724/L730** — `"solicitar a la AGETIC ... otorgue el ambiente de prueba"` — habilitación de ambientes no atribuida a la AN (dueña de la plataforma) ni definida con datos de prueba. → Asignar a AN la provisión de ambientes, con datos sintéticos y calendario de disponibilidad.

### §2 Interoperabilidad
9. **Art. 22 · L522/L523** — `"servicios web que utilicen un mismo formato y reglas"` — se eliminó la especificación REST/OpenAPI/JSON/códigos HTTP: contrato de integración no homogéneo ni verificable. → Exigir OpenAPI/Swagger versionado, esquema JSON validado y catálogo de códigos de error.
10. **Art. 26 · L576** — `"intercambio seguro de información ... integridad, inmutabilidad"` — sin versionado de servicios, idempotencia, reintentos/backoff, semántica síncrona/asincrónica ni firma de mensajes (0 ocurrencias). → Regular estos cinco elementos por artículo o por Guía técnicamente vinculante.
11. **Art. 22 · L516** — `"sin la necesidad de suscribir convenios interinstitucionales específicos"` — exime el marco jurídico para intercambiar información confidencial (Art. 28): base de interoperabilidad débil. → Condicionar la integración a acuerdo de intercambio de datos o encargo institucional expreso.
12. **Art. 22 · L525** — `"dos entornos diferenciados: Producción y Pruebas"` — no existe ambiente de homologación/interoperación ni proceso de sincronización de catálogos entre entornos. → Agregar ambiente de homologación con dataset de catálogos y prueba de conectividad previa a producción.
13. **Art. 37 · L683 / Art. 6 · L198** — `"verificación de las subpartidas arancelarias"` / `"Diccionario de Datos"` — sin catálogo maestro compartido (subpartidas, entidades, monedas, unidades) ni distribución versionada a EPEs. → Definir catálogo maestro de la VUCE con versión, fecha de vigencia y canal de distribución.
14. **Art. 40 · L716** — `"implementar la firma digital, para realizar todo intercambio de información"` — obliga firma sin definir autenticación máquina-a-máquina ni firma de mensaje entre sistemas. → Especificar autenticación de servicios (mTLS/OAuth2 client-credentials) y firma/verificación de payloads.
15. **Art. 67 · L996** — `"mecanismos para la actualización, consulta, interoperabilidad"` (Buscador) — fuente, frecuencia y responsable de actualización de datos no definidos: catálogo divergente. → Fijar fuente maestra, frecuencia mínima y responsable de publicación.

### §3 Seguridad y datos
16. **Art. 27 · L587** — `"PISI y la Política de Seguridad de la Información (PSI) de la Aduana Nacional"` — obliga a EPEs a cumplir documentos internos de la AN sin versión pública ni alcance: control no verificable. → Publicar/citar PSI y PISI por versión o transponer los requisitos mínimos al reglamento.
17. **Art. 53 · L822** — `"comunicará a la AN de inmediato ... causa presunta"` — solo contingencias operativas: no hay gestión de incidentes de seguridad (detección, notificación con plazo, análisis forense, cierre) ni bitácora de auditoría (0 ocurrencias). → Crear artículo de incidentes de seguridad con plazos, clasificación y registro de auditoría con retención mínima.
18. **Art. 28 · L593 / Art. 5 · L146** — `"confidencialidad"` sin cita a protección de datos personales — se procesan datos personales (puntos focales L452/473, RUOCE, Ciudadanía Digital) sin base legal ni derechos del titular (Ley 1244 ausente). → Incorporar base legal de protección de datos, finalidad, plazo de retención y mecanismo de derechos del titular.
19. **Art. X+6 · L835** — `"respaldos periódicos ... recuperación ante pérdida"` — sin frecuencia, RPO/RTO, cifrado, ubicación geográfica ni prueba de restauración: recuperabilidad no demostrable. → Definir política de respaldo (frecuencia, retención, cifrado, prueba anual) exigible a AN y EPEs.
20. **Art. 17 · L458** — `"cuando corresponda obtener la Ciudadanía Digital"` — autenticación opcional y sin nivel de garantía por rol/transacción. → Exigir nivel mínimo de autenticación (MFA/Ciudadanía Digital) para todo usuario que firme o decida.
21. **Art. 12 · L389** — `"podrá efectuarse a través del Portal de la VUCE. como se verifica?"` — verificación de autenticidad sin mecanismo público (API/QR/folio). → Publicar servicio de verificación por folio o huella con respuesta firmada por la AN.
22. **Art. 14 · L401** — `"la firma digital, la firma SOFTOKEN"` — cadena de firmas sin titular claro por acto (EPE emite, AGETIC aprueba, AN custodia): custodia y repudio no determinables. → Publicar matriz acto→tipo de firma→titular→validación.

### §4 Expediente Electrónico VUCE
23. **Art. 64 · L975 / Art. 6 · L229** — `"reconstruir de manera íntegra y cronológica"` — sin sello de tiempo, huella criptográfica por evento ni cadena de custodia: integridad probatoria no demostrable. → Exigir sellado de tiempo y hash encadenado por actuación, verificable por terceros.
24. **Art. 64 · L967** — `"conservación de sus registros"` — sin plazo de conservación, disposición final ni formato de preservación. → Fijar plazo mínimo de conservación, política de migración y baja con acta.
25. **Art. 63/64 · L965/L967 vs versión "MÓDULO" del inventario** — garantías divergentes (`inalterabilidad` en una versión, ausente en la otra) para el mismo objeto. → Unificar en un solo artículo con conjunto único de garantías.

### §5 Cronograma de implementación gradual
26. **Art. 54 vs 55 · L857 vs L905** — `"Los cuatro (4) parámetros ... son promediados"` — el Art. 54 enumera cinco parámetros y solo cuatro tienen fórmula: orden de implementación no reproducible. → Tabla única de parámetros con fórmula, fuente y fecha de corte por cada uno.
27. **Art. 55 · L905** — `"promediados y ordenados de mayor a menor"` — promedio simple sin pesos, sin regla de desempate ni fuente de datos: resultado discrecional. → Especificar pesos, dataset (SIN/AN), fecha de corte y criterio de desempate.
28. **Art. 55 · L887** — `"100-(CDE*100)/CDM"` — parámetro invertido respecto de a) y b) sin declarar la dirección de orden, y sin guarda de división por cero (CDM/VFM=0). → Explicitar asc/desc por parámetro y añadir protección de división por cero.
29. **Art. 55 · L871** — `"técnica de Normalización Min-Max"` — la fórmula `CDE*100/CDM` es normalización por máximo (no resta el mínimo): método declarado ≠ aplicado. → Corregir denominación o fórmula.
30. **Art. 57 · L915** — `"reprogramación ... hasta noviembre de la Gestión 2025"` — ventana vencida en un documento con base legal 2026: mecanismo de excepción inaplicable. → Reemplazar por criterios vigentes con ventana móvil y límite de ampliación.
31. **Art. 32/56 · L654/L911 vs Art. 44 · L744** — `"ciento veinte (120) días calendario"` incluye `"aprobación de la Normativa (Ley, Decreto Supremo...)"` — ruta crítica sin colchón ni excepción: despliegue por fases no viable. → Excluir plazos de aprobación normativa externa del cómputo o publicar cronograma por hito con colchón.
32. **Art. 59 · L925** — `"reprogramar ... Entre otros factores"` — criterios discrecionales sin procedimiento, evidencia ni comunicación de reglas. → Publicar procedimiento, evidencia exigible y criterios de decisión.

### §6 Cruce de registros y anexos
33. **Art. 15 · L436** — `"conforme establece el Artículo xx"` — referencia pendiente para incorporar servicios. → Resolver el número de artículo (corresponde al Título VI) y verificar cadenas.
34. **Art. 22 · L518** — `"considerando lo establecido en el Anexo xx"` (modelo de negocio) — anexo inexistente: requisito de EPEs sin sustento. → Crear el Anexo de modelo de negocio o eliminar la remisión.
35. **Art. 75 · L1065** — `"remitirán el R-425, conforme Anexo xx"` — registro y anexo incorrectos en control funcional de servicios (corresponde R-426/Anexo 7). → Corregir registro, anexo y plazos.
36. **Art. 40 · L718** — `"elaborará el R-712"` — registro inexistente (sin anexo ni instructivo). → Crear el registro o reemplazarlo por R-711 con campo específico de módulo estándar.
37. **Art. 43/48/51 · L736/L775/L801** — `"parágrafo V. del Artículo 37"` (debe ser 38), `"Artículo 44"` (debe ser 47/50/52), `"Artículos 37 y 39"` (debe ser 38 y 43) — referencias cruzadas erróneas en control funcional, baja de trámite y adecuaciones. → Rehacer el mapa de referencias cruzadas con verificación automática.
38. **Art. 32/56 · L652/L911** — `"parágrafo II del Artículo 28"` (Art. 28 es confidencialidad; el proceso es Art. 29) y **Art. 58 · L921** `"requisitos ... Artículo 29"` (R-424 está en Art. 30) — plan de trabajo, cronograma y anticipación remiten al artículo equivocado. → Corregir a Art. 29-II y Art. 30 respectivamente.

### §7 Calidad del modelo de proceso
39. **Art. 29 · L597–612** — `"etapas, aplicables de forma secuencial"` — 14 etapas sin responsable, entregable, criterio de aceptación ni gate de aprobación por etapa. → Matriz etapa×responsable×entregable×criterio×aprobador.
40. **Art. 29 · L613** — `"podrán ejecutar las actividades cuando así lo requieran"` — permite saltar etapas sin control de cambios ni registro de decisión. → Condicionar desvíos a registro/acta con aprobación y análisis de impacto.
41. **Art. 47 · L757** — `"En caso de no requerirse una Prueba Piloto, se aplicará lo establecido en el Artículo 46"` — referencia circular (46 remite a piloto o vigencia): ruta de implementación indeterminada. → Definir criterios objetivos de selección (riesgo, volumen, EPE nueva).
42. **Art. 47 · L765** — `"realizarán las adecuaciones respectivas"` — sin criterios de no conformidad ni plan de reversión durante el piloto: sin rollback. → Establecer umbrales de fallo, decisión de aborto y retorno al estado previo.
43. **Art. 42/43 · L722/L728** — `"deban prever la interoperabilidad, los ambientes y usuarios de prueba"` (idéntico en ambos) + doble definición de Control Funcional (L185/L186) — QA técnico y UAT funcional solapados. → Diferenciar alcance, responsables y criterios de salida de cada control.
44. **Art. 69 · L1013–1026** — `"12. Monitoreo, evaluación y mejora continua"` — 12 etapas pero sin artículos para las etapas 9 (normativa), 10 (capacitación) y 12 (monitoreo); Capítulo II repite el título del Título VI (L1067). → Dictar los artículos faltantes y renombrar el capítulo.
45. **Anexo 5 · L2189–2220 (R-425)** — `"CARACTERÍSTICAS DEL REQUERIMIENTO"` genérico — sin ID de requisito, criterio de aceptación ni prioridad, mientras el R-426 exige `"Prueba a ser realizada"` (L2417): trazabilidad requisito→prueba rota. → Añadir campos identificador, criterio de aceptación y prioridad al R-425.

### §8 Técnico-lingüístico
46. **Art. 9 · L359 / Art. 67 · L992** — `"actualizar la plataforma"` / `"en la Plataforma y Sistema VUCE"` — "Plataforma VUCE" se usa como objeto de obligación pero no está definida en el Art. 6 (sí Portal, Sistema, Servicios y Módulo). → Definir Plataforma y reemplazar usos ambiguos por el componente exacto.

---

# 🟡 MEDIO (27)

47. **§8 · Art. 6 · L163, L247, L261** — `"Administración:"`, `"Implementación:"`, `"Operación:"` — tres definiciones vacías de términos transversales. → Completar o suprimir las entradas.
48. **§8 · Art. 6 · L177/L179, L185/L186, L273/L275** — definiciones duplicadas de Contingencia, Control Funcional y Plan de Contingencia con alcances distintos. → Consolidar en una única definición con criterio operativo.
49. **§8 · Art. 6 · L238** — `"Guía ... –: Documento ... esto no corresponde al modelo de negocio de la VUCE"` — nota editorial dentro de definición. → Eliminar la nota.
50. **§8 · Art. 11 · L374** — `"en el caso de la utilización del módulo infomático estándar?"` — pregunta residual en norma vigente. → Resolverla y redactar la regla.
51. **§8 · Art. 22/24 · L538, L540, L544** — `"este no es el modelo de negocio"`, `"Esto no debería ponerse..."`, `"debería definirse el tratamiento..."` — tres comentarios editoriales en requisitos técnicos. → Integrarlos como decisiones normativas o eliminarlos.
52. **§7 · Art. 14/22/24/30 · L413, L532, L556, L620** — incisos vacíos (`n)`, `g)`, `iii.`, viñeta sin texto) — lista de obligaciones incompleta. → Eliminar ítems o completarlos.
53. **§8 · Art. 3 · L128** — `"servicios que se incorporen en la VUCE,"` — artículo terminado en coma: alcance incompleto. → Cerrar la frase con destinatarios y efectos.
54. **§1 · Art. 24 · L558/L560/L562** — `"La EPE contará con acceso a la información..."` duplicado y párrafo de seguridad suelto fuera de artículo. → Deduplicar y mover el párrafo al Art. 27.
55. **§8 · Art. 14 · L422** — `"Las EPEs aceptarán la APCO ..."` con numeral III repetido respecto de L387. → Renumerar párrafos.
56. **§8 · Art. 25 · L568** — `"MODELO DE OPERACIÓNDE LA VUCE). I. I."` — palabra concatenada y numeral duplicado. → Corregir.
57. **§8 · Art. 26 · L575** — `"ARTÍCULO 26.- INTEROPERABILIDAD DE LA VUCE"` sin paréntesis (los demás artículos sí los usan) y `"aplicable.."` (L584). → Normalizar formato de encabezados y puntuación.
58. **§7 · Art. 38 · L691/L698** — dos numerales `"II."` consecutivos en la estructura del R-425. → Renumerar.
59. **§7 · Art. 44 · L746** — `"en un plazo máximo de en el plazo máximo de un día hábil"` — texto duplicado en plazo crítico de publicación. → Corregir redacción y verificar el plazo (2 días hábiles en el mismo artículo).
60. **§7 · Art. 38 · L706** — `"esta última deberá  el R-425 complementario"` — verbo faltante en obligación de remisión. → Completar ("remitir").
61. **§6 · Anexo 2 · L1308/L1493/L1656 vs L1342/L1343/L1884** — secciones del formulario (`II. REGISTRO DE OPERADORES`, `III. INFORMACIÓN ESTADÍSTICA`) no coinciden con el instructivo, que además pide `"últimos dos (2) años"` frente a `"últimas 3 gestiones"` del formulario. → Alinear numeración, títulos y ventana estadística.
62. **§6 · Anexo 2 · L1475/L1494** — instructivo exige `"MEDIO DE PAGO"`, `"EN DESARROLLO"` y `"% DE AVANCE"` inexistentes en el formulario. → Sincronizar campos de formulario e instructivo.
63. **§6 · Anexo 3 · L2060–2130** — secciones `1, 2, 4, 5` (falta la 3) e instructivo `1, 2, 3, 4`: numeración interna divergente. → Renumerar y unificar.
64. **§6 · Anexo 7 · L2441/L2444** — dos secciones `"4."` (Solicitud y Firmas) e instructivo con `"5."`. → Renumerar.
65. **§6 · Anexo 10 · L2636–2821** — secciones `1, 2, 4` (falta 3); el instructivo define `"Regla de llenado"` (L2883) que no existe como columna (L2649–2659). → Completar numeración y añadir la columna.
66. **§7 · Anexo 10 · L2885** — `"validaciones funcionales que deben implementarse principalmente en el frontend"` — validación exclusivamente client-side es eludible; no se exige validación en servidor. → Exigir validación en servidor como obligatoria y el frontend solo como experiencia.
67. **§6 · Anexos 5/8/10 · L2192, L2536, L2639** — `"AN/GNN/DNPTA/RF/31/2024"` precargado bajo `"Entidad Pública Emisora"` — dato de ejemplo fijo en plantillas oficiales. → Reemplazar por marcador de campo obligatorio.
68. **§6 · Historial · L1075–1163 vs L1104/L1140** — historial solo registra v1/v2 (2024) sin los cambios 2025/2026 (Arts. 62–76, DS 5593/5595) y contradice los plazos vigentes (15 días vs 3; 5 días vs 2). → Insertar versión vigente con fecha de aprobación y sincronizar plazos.
69. **§5 · Art. 55 · L895 vs Art. 6 · L241** — factores de madurez tecnológica redactados distinto (`"Interacción con AGETIC"` vs `"Interoperabilidad ... con la AGETIC"`; `"Sistema"` vs `"Procesos ... sistematizados"`). → Unificar los cinco factores en una sola tabla.
70. **§1 · Art. 53 · L455** — `"Establecer y comunicar el Plan de contingencia"` (AGETIC) sin artículo de restablecimiento para AGETIC (eliminado respecto de versiones previas) → sin proceso de recuperación para el nodo de gobierno electrónico. → Reglamentar notificación y restablecimiento AGETIC con plazos.
71. **§3 · Art. 66 · L990** — `"no afectará la confidencialidad"` — publicación estadística sin regla de agregación, supresión de datos identificables ni umbral de anonimización. → Definir umbral de agregación y supresión de datos personales en estadísticas.
72. **§2 · Art. 49 · L777** — `"gestionará mecanismos de interoperabilidad"` (OEA) — mecanismo, campo de datos y marca de identificación no definidos. → Especificar el atributo OEA, su fuente y su propagación en la VUCE/EPE.
73. **§6 · Art. 5 · L156** — base legal sin el `"Decreto Supremo N° 5724"` invocado por los Arts. 54 y 62. → Añadirlo al Art. 5.
74. **§8 · Anexo 10 · L2721, L2756, L2778** — `"Email ... 30"` caracteres; `"Precio Unitario ... Longitud 4"` con `"Dos decimales, separador de miles"`; `"Cantidad ... 255"` — modelo de datos imposible de implementar. → Corregir longitudes, tipos y precisiones decimales.
75. **§7 · Art. 22 · L525/L526** — ítems de requisitos sin letra (tras el `e)`), seguidos de `f)` y `g)` vacíos (L532) — lista ilegible para auditoría. → Reetiquetar alfabéticamente todos los ítems.
76. **§8 · Art. 62/64 · L954, L977** — el Expediente Electrónico figura como `"servicio"` (L954) y como módulo/artículo propio; `"conforme como mecanismo"` (L977). → Unificar la naturaleza (servicio/módulo) y corregir la redacción.

---

# 🟢 BAJO (8)

77. **§8 · Art. 18 · L471** — `"wattsapp"` — error ortográfico en canal de comunicación oficial. → Corregir a "WhatsApp".
78. **§8 · Art. 7 · L307** — `"APCO: Autorizaciones Previas, Certificaciones Autorización Previa, Certificación..."` — abreviatura con texto duplicado. → Redefinir en una sola frase.
79. **§8 · Art. 28 · L595** — `"Ley 1178 de 20/07/201190"` — fecha corrupta. → Corregir a 20/07/1990.
80. **§8 · Art. 27 · L587** — `"en el *Plan Institucional"` — asterisco residual de edición. → Eliminar.
81. **§8 · Art. 75/76 · L1065, L1070** — `"nota forma"`, `"implementara"` — errores de texto en obligación y título. → Corregir.
82. **§6 · Anexo 7 · L2468, L2480** — `"Registras el detalle ... realizado"`, `"SOLICTUD"` — instructivo con erratas. → Revisar instructivos de los seis registros.
83. **§6 · Anexos · L1190–1194, L2054–2059** — campos `"Versión / Página"` y `"2 de "` sin diligenciar en registros oficiales. → Fijar versión y numeración en la plantilla.
84. **§6 · Anexo 10 · L2741** — ejemplo inicia en `"C.2"` (no existe C.1) — numeración de campos incompleta. → Reenumerar.

---

## MAPA DE ACTORES Y DEPENDENCIAS TÉCNICAS

| Actor | Obligación técnica | Artículo | Brecha principal |
|---|---|---|---|
| **AN (Aduana Nacional)** | Administrar, operar, custodiar Expediente Electrónico, infraestructura, respaldos, estándares de interoperabilidad | 9, 15 q/r/s, 24 b-ii, 63/64, X+6 | Titularía de "operación" duplicada con EPEs (L365/L371); Art. 63/64 duplicado; respaldos sin RPO/RTO; Art. 15 i) cita `Artículo xx`. |
| **AGETIC** | Disponibilidad ininterrumpida de ciudadanía digital, pasarela, aprobador de documentos; soporte; ambientes de prueba | 16 a/b/e/f, 42 II, 43 II | Sin SLA/RTO medible; sin artículo propio de restablecimiento; ambientes de prueba exigidos sin calendario ni datos sintéticos. |
| **EPEs** | Interoperar, documentar servicios web, dos entornos, firma/pago/facturación, planes de contingencia, plazos de emisión | 10, 14, 22, 24, 40 III, 42–43, 53 | Estándar técnico retirado (REST/OpenAPI/JSON); titularía del módulo estándar compartida con AN; plazo de emisión sin regla de cómputo. |
| **Usuario VUCE / OCE** | Registro RUOCE, Ciudadanía Digital "cuando corresponda", subsanación, uso exclusivo de la VUCE | 12, 17, 12 II | Verificación de autenticidad sin mecanismo (L389); autenticación opcional y sin nivel de garantía. |
| **BCB / Open BCB** | Pasarela, QR, órdenes de pago y conciliación | Def. L263 (sin artículo) | No figura entre responsables (nota residual L125); sin obligación de disponibilidad ni de conciliación automática. |
| **SIN** | Facturación electrónica y coordinación de comunicación | 2 e, 22 f | Responsabilidad de facturación diluida ("instancia competente") sin artículo que la asigne. |
| **SUMA** | Intercambio de estados de trámites APCO | 26 II | Sin contrato de datos, sin semántica de eventos ni idempotencia de notificaciones. |
| **VUCES de otros países** | Acuerdos de integración y reconocimiento mutuo de firmas | 26 III | Sin estándar de reconocimiento ni procedimiento de validación de firmas extranjeras. |
| **CNFC / Ministerios cabeza de sector** | Puntos focales, seguimiento semestral, acciones por retraso | 60, 61 | Reporte sin Anexo 9 que lo sustente; sin indicadores ni formato de reporte. |
| **SEPREC** | Coordinación de comunicación y operaciones | 2 e | Sin artículo que defina el intercambio ni su periodicidad. |
| **SENASAG, SENAVEX, VMT, ANH, ABT y demás EPEs (22)** | Emitir APCO, optimizar, desarrollar/adecuar, control funcional, normativa | 14, 30–44 | Plazos condicionados a cronograma inexistente; R-214/R-428/R-712 inexistentes; sin criterios de aceptación en R-425. |
| **EPEs sin sistema** | Usar Módulo Informático Estándar; infraestructura propia en 2 años | 24 a-iii | Transferencia AN→EPE sin hitos ni criterios; doble titularía de alojamiento. |
| **Sector privado (OCE, cámaras)** | Sugerencias en optimización | 35 | Participación sin canal, plazo ni efecto vinculante. |
| **Guía de aplicación e implementación de recursos informáticos** | Niveles de servicio, umbrales, interoperabilidad, seguridad, contingencias | Def. L238; 22 III/IV; X+2 III | Referenciada como fuente de exigencias sin código, versión ni texto integrado al reglamento. |