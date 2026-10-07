# Informe de Auditoría Normativa — Reglamento de la VUCE

**Fuente auditada:** `/tmp/opencode/vuce/out/accepted.txt` — 2.908 líneas. Título de trabajo: *"Reglamento de Implementación, Administración, Operación **y Actualización** de los Trámites y Servicios en la VUCE"*.  
**Fecha:** 06/10/2026 · **Modo:** solo lectura (el archivo no fue modificado).  
**Referencias:** todas las líneas corresponden a `accepted.txt`.

---

## Resumen ejecutivo

1. El texto NO es publicable: contiene 8 artículos sin numerar (`ARTÍCULO X` a `X + 7`), 1 artículo con marcadores `xxxx`, 1 registro `R-XXX` y 4 marcadores `xx` sin resolver.
2. La numeración de artículos está rota: existe un artículo sin número entre los Arts. 8 y 9, el Art. 63/64 están fusionados, el Art. 64 aparece dos veces y el Art. 53 queda fuera de secuencia.
3. Se detectan ~22 hallazgos BLOQUEANTES, ~45 de severidad ALTA, ~38 MEDIA y ~22 BAJOS, totalizando ~127 observaciones con línea, cita y corrección propuesta.
4. El problema más grave de fondo es la remisión normativa: 16 referencias internas ("Artículo xx/33/37/39/70/72/73/74", "parágrafo II del Art. 11/28", "inciso b) del Art. 19") apuntan a artículos que no tratan la materia citada.
5. Hay registros inexistentes (R-214, R-428, R-712, R-XXX) que no corresponden a ningún Anexo, lo que impide ejecutar los procedimientos descritos.
6. Existen contradicciones sustantivas: operación de la VUCE atribuida tanto a las EPEs (Art. 10 I) como a la AN (Art. 10 IV), y los Arts. 43 y 75 regulan el mismo "control funcional" con registros y responsables distintos.
7. Los plazos son internamente inviables: Art. 44 IV exige 2 días hábiles de remisión más 1 día hábil previo de publicación; el Historial consigna cuatro plazos distintos (3, 5, 10 y 15 días) para la misma obligación.
8. La base legal (Art. 5) omite normas que el cuerpo sí cita: Ley 4059, Ley 1178, Ley 2341, DS 5704 (APCO) y DS 5724.
9. Verificación externa: **DS 5724 es de 24/09/2026** (Gaceta Oficial); el Art. 54 lo fecha erróneamente en 2024. El DS 5219 (26/11/2021) del contexto no aparece ni se corrobora.
10. El Anexo 9 (Cronograma de Implementación Gradual), el índice (sin Título VI ni Anexo 10) y las disposiciones finales (ausentes) impiden la entrada en vigencia del Reglamento.

---

## Cuadro general

| Severidad | Cantidad | Definición |
|---|---:|---|
| **BLOQUEANTE** | **23** | Impide la aprobación/publicación o la aplicación literal de la norma |
| **ALTO** | **45** | Remisiones rotas, contradicciones, registros inexistentes, errores normativos |
| **MEDIO** | **38** | Definiciones, técnica legislativa, coherencia interna, plazos secundarios |
| **BAJO** | **21** | Ortografía, acentuación, formato, estilo |
| **TOTAL** | **127** | |

**Metodología:** lectura íntegra de las 2.908 líneas; mapeo de los 86 bloques de artículo (76 numerados + 8 placeholders + 2 huérfanos); cruce de remisiones internas (`Artículo N`, `parágrafo`, `Anexo`); inventario de plazos; contraste con el inventario previo de correcciones (`brenda_inventory.md`) y con fuentes externas (Gaceta Oficial de Bolivia).

---

## 1. HALLAZGOS BLOQUEANTES (23)

| # | Art. | Línea(s) | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| B01 | "X" … "X + 7" | 805, 807, 818, 822, 828, 831, 835, 841 | `ARTÍCULO X.- (OBJETO Y ALCANCE)` … `ARTÍCULO X + 7.- (DOCUMENTOS EMITIDOS EN CONTINGENCIA)` | Numerarlos Arts. 53–60 y renumerar correlativamente los actuales 53–76 → 61–88. |
| B02 | 53 / 54 | 845, 851, 857 | `ARTÍCULO 53.- (CONTINGENCIAS EN LA VUCE)` aparece **después** del bloque X+7 y antes de `TÍTULO V` | Reasignar numeración (según B01) y ubicar el artículo dentro del Cap. II "Contingencias" del Título IV. |
| B03 | 53 | 845 | `computables a partir de xxxx, la xxxx, la AN comunicará` | Redactar: *"computables a partir de la activación del Plan de Contingencia por la entidad que la declare"*. |
| B04 | 63 / 64 | 963 | `ARTÍCULO 63.- ARTÍCULO 64.- (EXPEDIENTE ELECTRÓNICO VUCE).` | Conservar solo `ARTÍCULO 63.- (EXPEDIENTE ELECTRÓNICO VUCE).` |
| B05 | 64 | 963 y 977 | Dos encabezados `ARTÍCULO 64` (el de 977 es RUOCE) | El de L977 → Art. 65 y renumerar hasta el Art. 88. |
| B06 | 23 | 543 | `ARTÍCULO 23.-` **sin objeto ni contenido** | Redactar el artículo o eliminarlo y renumerar. |
| B07 | Entre 8 y 9 | 349 | `(IMPLEMENTACIÓN DE LOS TRÁMITES Y SERVICIOS EN LA VUCE). I. La AN implementará…` — encabezado sin número | Anteponer `ARTÍCULO 9.-` y renumerar 9→10 … 76→77, o integrarlo al Art. 8. |
| B08 | 14, 22, 24, 30 | 413, 532, 556, 620 | Incisos vacíos: `n) ` · `g) ` · `iii. ` · `• ` | Completar el contenido o eliminar el inciso y reordenar la serie. |
| B09 | 12 | 377–391 | Incisos numerados I, II, III (385), **III** (387), **II** (389), **III** (391) | Reordenar y numerar I–VI consecutivamente. |
| B10 | 12 | 382 y 387 | Duplicidad sustantiva: `Las EPEs no pueden exigir… el uso de interfaces, aplicaciones o sistemas…` (382) y `Las EPEs no podrán exigir… una interfaz, aplicación o sistema propio…` (387) | Eliminar L387 o fusionar en un solo inciso. |
| B11 | 12 | 389 | `…a través del Portal de la VUCE. como se verifica?` — comentario editorial | Eliminar la pregunta; redactar el inciso de verificación de autenticidad. |
| B12 | 2 g) | 125 | `…continuidad permanente de las operaciones en la VUCE. que pasa con el BCB` | Eliminar; si procede, incluir al BCB como responsable del inciso. |
| B13 | 11 II | 374 | `…en el caso de la utilización del módulo infomático estándar?.` | Eliminar `?`, corregir a *"informático"*, cerrar el período. |
| B14 | 22 | 538, 540 | `…Servicios WEB publicada en el Portal de la VUCE este no es el modelo de negocio de la VUCE` · `Esto no debería ponerse como los lineamientos del modelo de negocio VUCE` | Eliminar ambos comentarios editoriales. |
| B15 | 24 | 544 | `…previo cumplimiento de lo siguiente : debería definirse el tratamiento específico para este artículo.` | Eliminar el comentario; redactar el tratamiento específico. |
| B16 | 8, 10, 14, 15, 22, 25, 65 | 347, 429, 518, 522, 540, 568, 980 | Artefactos de cambios rastreados concatenados: `pParte` · `VUCEVUCE` · `tramiteFormular` · `DeterminarAplicar` · `Tener Tener` · `podrádeberá` · `OPERACIÓNDE… I. I.` · `implementara la y` | Reconstruir cada frase eliminando la versión rechazada/superscrita. |
| B17 | Anexo 9 | 2614 | `ANEXO 9` / `CRONOGRAMA DE IMPLEMENTACIÓN GRADUAL` **sin contenido ni figura** (el rótulo es el último objeto antes de `ANEXO 10`) | Incorporar la tabla del cronograma. |
| B18 | 15 i), 22 a), 75 II | 436, 518, 1065 | `conforme establece el Artículo xx del presente Reglamento` · `el Anexo xx` · `conforme Anexo xx del presente Reglamento` | Sustituir: 15 i) → **Art. 69**; 22 a) → **Anexo 1 y 2**; 75 II → **Anexo 7**. |
| B19 | Anexo 10 | 2617, 2855 | `R-XXX` (encabezado del registro e instructivo) | Asignar el registro definitivo (p. ej. `R-715`) o unificar con el registro de diccionario de datos. |
| B20 | Índice | 28–87 | El índice termina en `ANEXO 9` y lista Títulos I–V; faltan `TÍTULO VI` (cuerpo L947) y `ANEXO 10` (cuerpo L2616) | Añadir ambos epígrafes con su paginación. |
| B21 | Disposiciones finales | 2897–2908 | El documento termina tras el Anexo 10 con líneas en blanco: **no hay** Disposición Transitoria, Disposición Final, derogatoria ni artículo de vigencia | Redactar las disposiciones transitoria, final, derogatoria y de entrada en vigencia. |
| B22 | 65 | 980 | `La AN implementara la y administrará el Módulo de Gestión Portuaria` | `La AN implementará y administrará el Módulo de Gestión Portuaria` |
| B23 | 15 q) | 444 | `…mecanismos de conservación del módulo  los Expedientes ElectrónicosVUCE` | `…de conservación del Expediente Electrónico VUCE` |

---

## 2. HALLAZGOS DE SEVERIDAD ALTA (45)

### 2.1 Remisiones internas rotas (16)

| # | Art. | Línea | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| A01 | 14 i) | 408 | `considerando lo previsto en el Artículo 33` (Art. 33 = Modificación al Plan de Trabajo) | → **Art. 36** (Validación de la optimización). |
| A02 | 14 m) | 412 | `conforme establecen los Artículos 37 y 38` (37 = verificación de subpartidas; 38 = requerimientos funcionales) | → **Arts. 42 y 43** (Control de Calidad y Control Funcional). |
| A03 | 14 o) | 414 | `Gestionar, emitir o actualizar normativa… conforme establece el Artículo 39` (39 = Diseño Informático) | → **Art. 44** (Gestión y Emisión de Normativa). |
| A04 | 14 p) | 415 | `…en los plazos establecidos del Artículo 39` | → **Art. 44 IV**. |
| A05 | 14 h) | 407 | `cumpliendo lo establecido en el parágrafo II del Artículo 28` (28 II = sanciones por uso indebido de información) | → **Art. 32** (Plan de Trabajo). |
| A06 | 14 u) | 420 | `considerando los plazos previstos en el parágrafo II del Artículo 11` (11 II = independencia operativa, sin plazo) | → **Art. 10 II** y **Art. 51 I** (3 días hábiles). |
| A07 | 15 e) | 432 | `considerando lo previsto en el Artículo 33` | → **Art. 36**. |
| A08 | 15 g) | 434 | `conforme establece el Artículo 37 del presente Reglamento` | → **Art. 40** (Desarrollo de funcionalidades). |
| A09 | 15 i) | 436 | `conforme establece el Artículo xx` | → **Art. 69** (Proceso de implementación de servicios). |
| A10 | 43 V | 736 | `conforme establece el parágrafo V. del Artículo 37` (Art. 37 no trata R-425) | → **Art. 38** (Requerimientos Funcionales). |
| A11 | 52 a) | 795 | `los medios de comunicación y coordinación señalados en el inciso b) del Artículo 19` (Art. 19 usa I/II/III; su b) no existe) | → **Art. 18, inciso b)**. |
| A12 | 52 III | 801 | `conforme establecen los Artículos 37 y 39` | → **Arts. 38 y 43**. |
| A13 | 62 II | 961 | `considerando lo establecido en el Artículo 70` (70 = identificación del servicio) | → **Arts. 54–61** (parámetros y ejecución del cronograma). |
| A14 | 64 II | 978 | `conforme establece el Artículo 73` (73 = requerimiento funcional) | → **Arts. 69 a 72** (proceso e incorporación de servicios). |
| A15 | 65 II | 982 | `considerando lo establecido en el Artículo 72` (72 = propuesta de nuevo servicio) | → **Art. 26** (Interoperabilidad de la VUCE). |
| A16 | 66 I | 984 | `considerando lo establecido en el Artículo 74` (74 = desarrollo/control de calidad) | → **Arts. 66, 68 y 76**. |

### 2.2 Registros inexistentes (5)

| # | Art. | Línea | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| A17 | 38 I | 689 | `el Registro Diccionario de Datos R-428 conforme establecen los Anexo 5 y 6` | El Anexo 6 es **R-711**; unificar a `R-711` o crear el registro `R-428`. |
| A18 | 40 IV | 718 | `el área tecnológica de la AN elaborará el R-712` | Registro sin anexo ni definición; referir a **R-710** o crear su Anexo. |
| A19 | 43 IV | 734 | `de no tener observaciones elabora el R-214 y registra ambos documentos` | Registro inexistente; sustituir por **R-426** o *"acta de control funcional"*. |
| A20 | 43 IV | 734 | `en la Plataforma de Seguimiento de la Aduana Nacional` | Plataforma no definida ni normada; definirla en Art. 6 o eliminar la referencia. |
| A21 | 29 | 597–613 | Las etapas del proceso no asocian registro; el Art. 43 III exige `R-426` sin que el Art. 29 lo liste | Añadir R-426, R-427, R-711 y R-710 a las etapas correspondientes. |

### 2.3 Contradicciones sustantivas (10)

| # | Art. | Línea(s) | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| A22 | 10 I vs 10 IV | 365 vs 371 | `La operación de la VUCE estará a cargo de las EPEs…` vs `La AN estará a cargo de la operación de la VUCE…` | Delimitar: EPEs → tramitología de su trámite; AN → plataforma, incorporación y funcionalidades. |
| A23 | 43 vs 75 | 728–736 vs 1063–1065 | Art. 43: EPEs remiten `R-426` (Anexo 7); Art. 75: EPEs remiten `R-425` y `la AN realizarán las pruebas` | Unificar ambos artículos o suprimir el Art. 75 como duplicado del Art. 43. |
| A24 | 12 b) vs 12 III | 382 vs 387 | Misma regla redactada dos veces (ver B10) | Suprimir una. |
| A25 | 24 v) | 558 y 559 | `La EPE contará con acceso a la información…` repetido en inciso y en párrafo | Suprimir L559. |
| A26 | 24 | 561 | Párrafo suelto: `La información administrada o almacenada por la VUCE será protegida mediante controles…` | Trasladarlo al **Art. 27** (Seguridad de la Información). |
| A27 | 53 vs Cap. II | 845 vs 805–843 | Dos regímenes de contingencias simultáneos (Arts. X–X+7 y Art. 53) | Fusionar o subordinar el Art. 53 al Cap. II renumerado. |
| A28 | 55 II/III | 871, 879 | `para el resto de las EPEs con el mayor Valor FOB` / `con el mayor número de declaraciones` | Debe decir **"con el menor"** (el resto excluye a los máximos). |
| A29 | 55 IV vs II | 887 vs 868 | `CDE`/`CDM` se definen como *declaraciones* y se redefinen como *documentos emitidos* | Usar símbolos distintos (p. ej. `NDE`/`NDM`) o una sola definición. |
| A30 | 6 vs 54/55 | 241–246 vs 857–890 | `Grado de Madurez Tecnológica` con criterios cualitativos no cuantificados que Art. 55 pondera numéricamente | Explicitar la tabla de conversión de criterios a puntaje. |
| A31 | 19/20 vs 14 | 474/494 vs 417 | Publicar medios de contacto: `hasta cinco (5) días hábiles antes` (20 II) vs `hasta dos días hábiles antes` (14 r) | Unificar el plazo en un solo artículo. |

### 2.4 Errores normativos y de base legal (11)

| # | Art. | Línea | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| A32 | 54 | 857 | `Decreto Supremo N° 5724 de 24/09/2024` | **24/09/2026** (verificado en Gaceta Oficial: DS 5724, 24/09/2026). |
| A33 | 62 | 953 | `Decreto Nº 5724` (fecha correcta 2026, pero sin "Supremo") | `Decreto Supremo N° 5724 de 24/09/2026`. |
| A34 | 54 vs 62 | 857 vs 953 | El mismo DS 5724 aparece con dos fechas distintas | Homologar a **24/09/2026**. |
| A35 | 28 II | 595 | `sancionado conforme la Ley 1178 de 20/07/201190` | `Ley N° 1178 de 20/07/1990` (fecha verificada). |
| A36 | 28 II | 595 | `Ley de Administración y control gubernamental` | `Ley de Administración y Control Gubernamentales`. |
| A37 | 28 I | 593 | `conforme a lo establecido en el artículo 237 de la Constitución Política del Estado` | Verificar: el derecho de acceso a la información pública está en el **art. 159 CPE**; ajustar o complementar. |
| A38 | 5 | 138–156 | Base legal sin **Ley N° 4059** (Comercio Exterior) pese a su centralidad en APCO | Añadir literal correspondiente. |
| A39 | 5 | 138–156 | Sin **Ley 1178** ni **Ley 2341**, citadas en el cuerpo (Art. 28 II, L595) | Añadir literales. |
| A40 | 5 | 138–156 | Sin **DS 5724**, citado en Arts. 54 y 62 | Añadir literal. |
| A41 | 5 | 138–156 | Sin **DS 5704** (regulación de APCO según contexto de referencia) | Añadir o aclarar su ausencia. |
| A42 | 5 n) / contexto | 153 | Cita `DS N° 5211 de 28/08/2024` como creador de la VUCE; el contexto de referencia indicaba DS 5219 de 26/11/2021 | Verificar: las fuentes públicas coinciden con el **DS 5211**; corregir el contexto de referencia. |

### 2.5 Plazos inviables o incompatibles (7)

| # | Art. | Línea | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| A43 | 44 IV | 746 | `en un plazo máximo de dos (2) días hábiles de concluido el control funcional` **y** publicación `un día hábil anterior` | Si el control concluye ≤2 días antes, ambos plazos no pueden cumplirse: unificar a un plazo mínimo de **3 días hábiles** de anticipación. |
| A44 | 44 IV vs Historial | 746 vs 1140 | Cuerpo: `dos (2) días hábiles`; Historial: `cinco (5) días hábiles` | Homologar cuerpo e historial. |
| A45 | Historial | 1104, 1140, 1143, 1145 | Cuatro plazos distintos para la misma obligación: `quince (15) días` · `cinco (5) días hábiles` · `10 días hábiles` · `hasta 3 días hábiles` | Fijar **un** plazo en el cuerpo (3 días hábiles, Art. 10 II) y corregir el Historial. |
| A46 | 30 I vs 31 I | 614 vs 640 | `en el plazo de hasta diez (10) días hábiles antes` + `en el plazo máximo de cinco (5) días hábiles… antes del inicio de actividades` | Si la EPE presenta el R-424 la víspera, la AN no puede revisar en 5 días: redactar **"no menos de diez (10) días hábiles antes"**. |
| A47 | 20 II vs 14 r) | 494 vs 417 | Nómina y medios de contacto: `hasta cinco (5) días hábiles antes` vs `hasta dos días hábiles antes` | Unificar (5 días hábiles). |
| A48 | 10 II vs 51 I | 367 vs 787 | Misma obligación de comunicar cambios normativos en `tres (3) días hábiles antes de su puesta en vigencia`, redactada dos veces | Consolidar en el Art. 10 II y remitir desde el Art. 51 I. |
| A49 | 32 II vs 56 I | 654 vs 911 | `ciento veinte (120) días calendario` duplicado en Plan de Trabajo y en plazo de implementación | Definir si son el mismo plazo o plazos acumulativos. |

### 2.6 Anexos: discrepancias formulario vs instructivo (6)

| # | Anexo | Línea(s) | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| A50 | 2 | 1308/1342 vs 1493/1656 | Secciones: form. `II. REGISTRO DE OPERADORES` / `III. INFORMACIÓN ESTADÍSTICA`; instructivo `II. ENTIDADES CON SISTEMA…` / `III. ENTIDADES SIN SISTEMA…` | Alinear títulos y numeración de secciones. |
| A51 | 2 | 1343 vs 1884, 1891 | Form.: `las últimas 3 gestiones`; instructivo: `últimos dos (2) años` con filas `2023/2024` | Unificar a dos gestiones (2025–2026). |
| A52 | 2 | 1654, 1851 | `EL DICCIONARIO DE DATOS… (DE LAS PREGUNTAS 11 Y 13)` | Las preguntas de diccionario son la **12 y 14** (11 y 13 son diagramas). |
| A53 | 3 | 2060, 2067, 2125, 2130 | Numeración del formulario: `1.`, `2.`, `4.`, `5.` — **falta el 3.** | Renumarar 1–5. |
| A54 | 7 | 2441, 2444 | `4. SOLICITUD DE PUESTA EN PRODUCCIÓN` y `4. FIRMA Y SELLOS` | `5. FIRMA Y SELLOS`. |
| A55 | 10 | 2636, 2647, 2821 | Numeración: `1.`, `2.`, `4. FIRMA Y SELLOS` — **falta el 3.** | Añadir/renumerar la sección 3. |

---

## 3. HALLAZGOS DE SEVERIDAD MEDIA (38)

| # | Art. | Línea | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| M01 | 6 | 163 | `Administración:` **sin definición** (siguiente línea es "Arancel Aduanero…") | Eliminar el término o redactar la definición. |
| M02 | 6 | 247 | `Implementación:` **sin definición** | Ídem. |
| M03 | 6 | 261 | `Operación:` **sin definición** | Ídem. |
| M04 | 6 | 171 y 175 | `Ciudadanía Digital: Identidad digital…` y párrafo suelto `Consiste en el ejercicio de derechos y deberes…` | Fusionar en una única definición. |
| M05 | 6 | 177 y 179 | `Contingencia:` definida **dos veces** (una prospectiva, otra como evento ocurrido) | Suprimir una o distinguir *riesgo* de *contingencia*. |
| M06 | 6 | 185 y 186 | `Control Funcional:` definido **dos veces** (pruebas vs. verificación) | Suprimir una. |
| M07 | 6 | 231 y 232 | `Firma Digital:` + párrafo sin término (`Es la firma electrónica que identifica únicamente a su titular…`) | Unificar; eliminar el párrafo huérfano. |
| M08 | 6 | 193 y 196 | `Diagrama de Estados:` + párrafo sin término (`Representación gráfica que describe el ciclo de vida…`) | Unificar; eliminar el huérfano. |
| M09 | 6 | 273 y 275 | `Plan de Contingencia:` + párrafo sin término (`Instrumento que establece las medidas…`) | Unificar. |
| M10 | 6 | 200 | `Diseño de interfaces: Conjunto de actividades técnicas y funcionales destinadas a definir, diseñar, construir…` | La definición describe *desarrollo*, no *diseño de interfaces*; corregir. |
| M11 | 6 | 279 y 280 | `Puesta en vigencia` y `Prueba Piloto` ambas iniciadas con `Implementación del trámite APCO en la VUCE` | Diferenciar: una es definitiva, la otra es temporal. |
| M12 | 6 | 295 | `Usuario VUCE: Operador de Comercio Exterior, persona natural o jurídica…` (circular con L260 y con Art. 4 f) | Definir sin remitir al término definido. |
| M13 | 6 | 252 | `La interoperabilidad no implica la prohibición de almacenar…` — norma dentro de una definición | Trasladar a los Arts. 26/27. |
| M14 | 6 | 244 | `Interoperabilidad con la Agencia Estatal de Tecnologías de la Información y Comunicación` | Nombre erróneo → **Agencia de Gobierno Electrónico y Tecnologías de la Información y Comunicación (AGETIC)**. |
| M15 | 6 | 260 y 283 | `Padrón de Operadores de Comercio Exterior` (L260) vs `Registro Único de Operadores de Comercio Exterior` (L283) | Unificar nombres del mismo registro. |
| M16 | 6 | — | Falta definir `Expediente Electrónico Único` (usado en Art. 10 III, L363) | Añadir a Art. 6. |
| M17 | 6 | — | Falta definir `Guía de Recursos Informáticos` (L820) | Añadir o sustituir por "Guía de Aplicación General". |
| M18 | 6 | — | Falta definir `Plataforma de Seguimiento de la Aduana Nacional` (L734) | Añadir o eliminar la referencia (ver A20). |
| M19 | 7 | — | **22 abreviaturas definidas sin uso** en el resto del texto: ABT, AETN, AFC, AGEMED, AJ, ALBO, ANH, ASP-B, ATT, DAB, DGAC, DGSC, HTTP, INSO, MAES, MRE, MD, MEFP, MPSMAyA, SENARECOM, VCLI, VMT | Eliminar las no usadas. |
| M20 | 7 | — | Siglas **usadas sin definir**: OEA (Art. 49, L777), PISI/PSI (L587), CTT6-VUCE (L439) | Añadir al Art. 7. |
| M21 | 7 vs 6 | 306 vs 212 | `ANH: Agencia Nacional de Hidrocarburos` vs lista de EPEs `6. Autoridad Nacional de Hidrocarburos` | Homologar a **Autoridad Nacional de Hidrocarburos**. |
| M22 | 5 | 142 | `Decisión N° 885… (Nomenclatura… (NANDINA), que incorpora…` — paréntesis desequilibrados (2 aperturas, 1 cierre) | Cerrar correctamente los paréntesis. |
| M23 | 5 | 148 | `Ley N° 998 el 27/11/2017 que ratifica… la Organización Mundial Comercio` | `Ley N° 998 de 27/11/2017… Organización Mundial del Comercio`. |
| M24 | 5 | 141–155 | Uso indistinto de `N°` y `Nº` | Uniformizar (`N°` en todo el documento). |
| M25 | 13 | 393 | Plazo de emisión `cinco (5) días hábiles` (excepcional `diez`) sin mecanismo de prórroga formal | Explicitar el trámite de ampliación. |
| M26 | 21 III | 511 | `Las entidades públicas o privadas que establezcan herramientas electrónicas a las EPEs y al Usuario VUCE.` — oración sin predicado | Completar: *"…deberán interoperar con la VUCE en los términos de este Reglamento"*. |
| M27 | 24 b) i | 554 | `Evaluar nota para pronunciarse en un plazo máximo de diez (10) días hábiles.` sin cómputo ni supuestos de suspensión | Definir cómputo (días hábiles continuos) y causales de suspensión. |
| M28 | 29 | 613 | `II. La AN en coordinación con la EPE, podrán ejecutar…` **sin parágrafo I** | Insertar `I.` antes de la lista a)–n) o renumerar a `I.`. |
| M29 | 38 | 691 y 698 | **Dos parágrafos `II.`** en el mismo artículo | Renumerar II, III, IV… consecutivamente. |
| M30 | 32 I | 652 | `La AN en coordinación con los puntos focales…, elaborarán y suscribirán el R-710` | Concordancia: *"la AN… elaborará y suscribirá"*. |
| M31 | 45 | 748 | `(TRANSITORIEDAD)` sin punto tras el paréntesis | `(TRANSITORIEDAD).` |
| M32 | 49 | 777 | `(FACILIDADES DEL OEA)` — OEA sin definir (ver M20) | Definir OEA en Art. 7. |
| M33 | 55 | 866–910 | Redactado en tiempo pasado: `se empleó la técnica`, `se asignó la ponderación` | Redactar en presente genérico: *"se emplea"*, *"se asigna"*. |
| M34 | 55 | 885 | `VFM= Entidad Pública Emisora con el máximo valor FOB` | El símbolo debe expresar una magnitud: *"VFM = Valor FOB máximo de las EPEs"*. |
| M35 | 69–76 | 1013–1070 | Título VI duplica la estructura de los Arts. 30–46 sin remisión ni criterio de aplicación (¿aplica a trámites o a servicios?) | Aclarar la diferencia trámite APCO vs. servicio y remitir entre ambos regímenes. |
| M36 | 71 | 1030 | `…entre otros elementos necesaria relacionada con el servicio que se va implementar` | `…entre otros elementos necesarios… del servicio que se va a implementar`. |
| M37 | 75 I | 1063 | `Concluido el control de calidad, la AN realizarán las pruebas de funcionalidad` | `…la AN realizará` (o atribuirlo a EPEs + AN, como el Art. 43 I). |
| M38 | Historial | 1084–1150 | Solo documenta versiones 1 y 2; no registra la versión vigente ni las correcciones de esta revisión | Añadir la fila de la versión 3 con los cambios de esta revisión. |

---

## 4. HALLAZGOS DE SEVERIDAD BAJA (21)

| # | Art. | Línea | Hallazgo (cita) | Corrección propuesta |
|---|---|---|---|---|
| D01 | Portada | 107 | `REGLAMENTO DE IMPLEMENTACIÓN, ADMINISTRACIÓN Y OPERACIÓN DE LOS TRAMITES…` — sin tilde y sin `Y ACTUALIZACIÓN` (que sí figura en el Art. 1, L115) | `…Y ACTUALIZACIÓN DE LOS TRÁMITES Y SERVICIOS EN LA VENTANILLA ÚNICA DE COMERCIO EXTERIOR`. |
| D02 | 3 | 128 | Período final con coma: `…servicios que se incorporen en la VUCE,` | Cerrar con punto. |
| D03 | 12 | 377 | Título sin punto: `(OBLIGACIÓN DE USO DE LA VUCE) I.` | `(OBLIGACIÓN DE USO DE LA VUCE). I.` |
| D04 | 14 b) | 401 | `pasarela de pagos, , entre otros` (coma duplicada) | Eliminar una coma. |
| D05 | 14 t) | 419 | `otra entidad que cuente conla pasarela de pago` | `que cuente con la pasarela de pago`. |
| D06 | 15 f) | 433 | `del modelo de negocio de la VUCEy lo establecido` | Insertar espacio: `VUCE y`. |
| D07 | 18 | 468 | `(COMUNICACIÓN Y COORDINACIÓN ENTRE LA AN, EPEs y ENTIDADES PUBLICAS…` | `ENTIDADES PÚBLICAS`. |
| D08 | 18 b) | 471 | `teléfono fijo o móvil, wattsapp u otros canales` | `WhatsApp`. |
| D09 | 25 | 568 | `(MODELO DE OPERACIÓNDE LA VUCE). I. I.` | `(MODELO DE OPERACIÓN DE LA VUCE). I.` |
| D10 | 26 | 575 | `ARTÍCULO 26.-  INTEROPERABILIDAD DE LA VUCE` sin paréntesis ni punto | `ARTÍCULO 26.- (INTEROPERABILIDAD DE LA VUCE).` |
| D11 | 46 | 755 | `mediante Prueba piloto o Puesta en vigencia` (mayúsculas inconsistentes) | `mediante prueba piloto o puesta en vigencia`. |
| D12 | 59 | 925 | `(REPROGRAMACION DEL CRONOGRAMA POR LA AN).-` | `(REPROGRAMACIÓN…).` |
| D13 | 70, 72 | 1028, 1032 | Cierre `).-` y `APROBACION` sin tilde | `).` y `APROBACIÓN`. |
| D14 | 76 | 1070 | `La AN implementara el servicio en la VUCE` | `La AN implementará…` |
| D15 | 75 II | 1065 | `de no tener observaciones las EPEs…, al correo… y nota forma a la AN. En caso de que la EPEs identifique…` | `sin observaciones de las EPEs…, y mediante nota a la AN. En caso de que la EPE identifique…` |
| D16 | Anexo 2 | 1379 | `5. Envió de la solicitud con firma digital` | `5. Envío de la solicitud…` |
| D17 | Anexo 2 | 2006, 2009, 2012, 2015 | `la persona que lleno el formulario` (×4) | `llenó`. |
| D18 | Anexo 7 | 2480 | `4. SOLICTUD DE PUESTA EN PRODUCCIÓN.` | `SOLICITUD`. |
| D19 | Anexo 10 | 2650 | `No CAMPO` | `N° CAMPO` o `Nº DE CAMPO`. |
| D20 | Anexo 8 | 2553 vs 2595 | Formulario: `DESCRIPCIÓN BREVE DE LA SOLICITUD`; instructivo: `DESCRIPCIÓN DE LA SOLICITUD DE MODIFICACIÓN.` | Homologar el título. |
| D21 | Anexo 6 | 2480 area | Instructivo: `por el personal elaboró la programación` (verbo omitido) | `por el personal que elaboró la programación`. |

---

## 5. Verificación externa realizada

| Afirmación del documento | Verificación | Resultado |
|---|---|---|
| `DS N° 5724 de 24/09/2024` (Art. 54, L857) | Gaceta Oficial de Bolivia | **Incorrecta.** DS 5724 = **24 de septiembre de 2026** (modifica el DS 5211 de 28/08/2024). La fecha del Art. 62 (2026) sí es correcta. |
| `DS N° 5211 de 28/08/2024` crea la VUCE (Art. 5 n, L153) | Fuentes públicas (aduananews, aduana.gob.bo) | **Consistente.** El DS 5219 (26/11/2021) de tu contexto de referencia no se pudo corroborar. |
| `DS 5704` regula APCO (contexto de referencia) | Gaceta Oficial | **No localizado** con esa descripción; el DS **no figura en el documento** (ver A41). |
| `Ley 1178 de 20/07/201190` (Art. 28 II, L595) | Texto oficial de la Ley SAFCO | **Incorrecta.** Ley N° 1178 = **20 de julio de 1990**. |
| `ANEXO 1` y `ANEXO 4` (rótulos sin texto) | XML con imágenes | **Sí contienen diagramas** (imágenes) → no son omisiones. |
| `ANEXO 9` | XML | **No hay imagen ni tabla posterior al rótulo** → confirmado vacío. |
| Ejemplo del usuario: `Artículos 36 37 y 389` | Búsqueda en `accepted.txt` | **No existe.** Las remisiones reales defectuosas son `37 y 38` (L412) y `37 y 39` (L801). |
| `SIAC` | Búsqueda | **No aparece** en el documento. |

---

## 6. Pendientes de verificación (no resueltos en esta pasada)

1. **Contenido visual de Anexos 1 y 4**: confirmar que los diagramas incrustados corresponden al flujo descrito en el texto.
2. **Art. 55 fórmulas**: las referencias a fórmulas (L868, 876, 882, 890) requieren cotejo con la tabla original en `final.docx`, ya que `accepted.txt` aplana las tablas.
3. **Correspondencia `brenda_inventory.md` ↔ `accepted.txt`**: un cambio documentado en el inventario (`[171]`, texto "del comportamiento dinamico") **no aparece** en el texto aceptado; verificar si se perdió en la aceptación de cambios.
4. **Numeración de anexos y sus referencias**: el Art. 5 y el Índice deben rehacerse tras aplicar la renumeración de artículos propuesta en B01–B07.
5. **Cotejo con `final.docx` (cambios rastreados)**: los artefactos concatenados (B16) deben reconstruirse descartando las corridas rechazadas, lo que requiere abrir el XML con marcas de cambio.

---

**Conclusión:** el Reglamento no puede tramitarse para aprobación. La ruta mínima es (i) resolver la numeración de artículos (B01–B07), (ii) eliminar marcadores y comentarios editoriales (B03, B08, B11–B19), (iii) corregir las 16 remisiones rotas y los 4 registros inexistentes (A01–A21), (iv) homologar plazos (A43–A49) y (v) completar base legal, índice, Anexo 9 y disposiciones finales (A38–A41, B17, B20, B21).