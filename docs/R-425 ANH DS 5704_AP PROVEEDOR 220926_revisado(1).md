<table>
<colgroup>
<col style="width: 31%" />
<col style="width: 5%" />
<col style="width: 31%" />
<col style="width: 31%" />
</colgroup>
<thead>
<tr class="header">
<th colspan="4"><ol type="1">
<li><p><strong>DATOS DEL REQUERIMIENTO</strong></p></li>
</ol></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>Entidad Pública Emisora:</strong></td>
<td colspan="3">Agencia Nacional de Hidrocarburos - ANH</td>
</tr>
<tr class="even">
<td><strong>Gerencia o Unidad Responsable:</strong></td>
<td colspan="3">complementar</td>
</tr>
<tr class="odd">
<td><strong>Servidores Públicos Responsables:</strong></td>
<td colspan="3">complementar</td>
</tr>
<tr class="even">
<td><strong>Sistema VUCE:</strong></td>
<td colspan="3"><p><strong>Autorización Previa de Importación para el Proveedor</strong></p>
<p><strong>GREQ N° 20261110 - AN/GNN/DNPV/RF/73/2026</strong></p></td>
</tr>
<tr class="odd">
<td><strong>Fecha de emisión:</strong></td>
<td colspan="3">16/09/2026</td>
</tr>
<tr class="even">
<td colspan="4"><ol start="2" type="1">
<li><p><strong>CARACTERÍSTICAS DEL REQUERIMIENTO</strong></p></li>
</ol></td>
</tr>
<tr class="odd">
<td colspan="4"><p>En el marco de lo establecido en el Decreto Supremo Nº 5211 de 28/08/2024 que crea la Ventanilla Única de Comercio Exterior (VUCE) y la Resolución de Directorio Nº RD 01-062-25 de 29/08/2024 que aprueba el Reglamento de Implementación, Administración y Operación de la VUCE, a continuación, se detallan las funcionalidades que deben ser desarrollados en el sistema VUCE para la “Autorización Previa de Importación para el Proveedor”.</p>
<ol type="A">
<li><p><strong>DESCRIPCIÓN DE ADECUACIONES FUNCIONALES PARA EL INGRESO A LA VUCE.</strong></p></li>
</ol>
<p><strong>Ingreso a la VUCE.</strong></p>
<p><strong>Actor:</strong> Usuario VUCE (PROVEEDOR).</p>
<p><strong>Descripción:</strong> Para la autenticación del usuario en la plataforma VUCE se deberá habilitar una opción de ingreso denominado “<strong>Empresas Extranjeras</strong>”, a través del cual se registrará el usuario y contraseña provista por la VUCE.</p>
<p>La generación de credenciales de la VUCE para el proveedor se efectuará a partir de la información proporcionada para el registro ante la ANH (<mark>Nombre del Representante Legal, Nombre de la Empresa o Razón Social, Domicilio legal de la empresa, Nº de Identificación Personal, <strong><u>Registro identificador,</u></strong> Teléfono de contacto, Correo electrónico</mark>), información que será remitida por parte de la ANH mediante correo electrónico al Departamento de Desarrollo e Implementación de la VUCE y nota formal a la Aduana Nacional, una vez generada las credenciales serán notificados a los correos electrónicos de los usuarios (empresas extranjeras). <mark>VERIFICAR CONFORME A RESOLUCIÓN MINISTERIAL A EMITIRSE.</mark></p>
<p><img src="docs/media/media/image1.png" /></p>
<ol start="2" type="A">
<li><p><strong>DESCRIPCIÓN DIAGRAMA DE ACTIVIDADES SOLICITUD DE AUTORIZACIÓN PREVIA DE IMPORTACIÓN PARA EL PROVEEDOR.</strong></p></li>
</ol>
<ol type="1">
<li><p><strong>Iniciar Solicitud.</strong></p></li>
</ol>
<p><strong>Actor:</strong> Usuario VUCE</p>
<p><strong>Descripción:</strong> Esta actividad corresponde a la selección del documento APCO que el usuario requiere solicitar, en este caso <em>AUTORIZACIÓN PREVIA DE IMPORTACIÓN PARA EL PROVEEDOR</em>.</p>
<ul>
<li><p><strong>Código del Certificado</strong>: Permite localizar el certificado con código IM-0xx AUTORIZACIÓN PREVIA DE IMPORTACIÓN PARA EL PROVEEDOR.</p></li>
<li><p><strong>Entidad</strong>: Permite localizar el certificado ingresando al logo de la ANH.</p></li>
</ul>
<p><img src="docs/media/media/image2.png" style="width:4.75486in;height:4.42431in" /></p>
<p><strong>Código:</strong> IM-XXX</p>
<p><strong>Descripción:</strong> AUTORIZACIÓN PREVIA DE IMPORTACIÓN PARA EL PROVEEDOR.</p>
<p><strong>Tipo de Operación:</strong> IMPORTACIÓN</p>
<p><img src="docs/media/media/image3.png" /></p>
<p>Una vez elija “Iniciar Solicitud” se desplegará el Formulario de Solicitud con la siguiente información:</p>
<ol type="a">
<li><p>Código del documento y su denominación: <strong>IM-0xx AUTORIZACIÓN PREVIA DE IMPORTACIÓN PARA EL PROVEEDOR.</strong></p></li>
<li><p>Costo: <strong>Sin costo</strong></p></li>
<li><p>Plazo de Emisión: <strong>1 día hábil</strong></p></li>
<li><p>Vigencia: <strong>1 año</strong></p></li>
</ol>
<ol start="2" type="1">
<li><p><strong>Envía IDENTIFICADOR DE PROVEEDOR (Usuario conectado).</strong></p></li>
</ol>
<p><strong>Actor:</strong> sistema VUCE</p>
<p><strong>Descripción:</strong> Cuando ingrese a través de “<strong>Empresas Extranjeras</strong>” la VUCE enviará el <strong>Código <mark>IDENTIFICADOR DE PROVEEDOR VERIFICAR SEGÚN Resolución Ministerial a emitirse</mark></strong> al sistema de la ANH para su validación, de ser satisfactoria la validación mostrará el Formulario de Solicitud, una vez haga clic en “<strong>Seleccionar</strong>”.</p>
<ol start="3" type="1">
<li><p><strong>LLENADO DE FORMULARIO DE SOLICITUD.</strong></p></li>
</ol>
<p><strong>Actor: VUCE</strong></p>
<p><strong>Descripción</strong>: Esta actividad corresponde al llenado del Formulario de Solicitud de Autorización Previa de Importación de Gasolina, Diésel y Petróleo Crudo para Proveedores por parte del usuario acreditado ante el ANH al completar esta acción, la solicitud ingresará al estado BORRADOR, desde el cual podrá ser eliminada por el usuario antes de ser enviada, mediante la opción “Eliminar de Bandeja” disponible en la lista de acciones. Esta opción estará habilitada únicamente cuando la solicitud se encuentre en estado BORRADOR, y no será visible para solicitudes en cualquier otro estado, permitiendo al usuario decidir si desea conservarla o eliminarla.</p>
<p>Al seleccionar dicha opción, el sistema deberá desplegar un mensaje de confirmación con el siguiente texto: "¿Está usted seguro de eliminar esta solicitud?"</p>
<p>El mensaje deberá incluir dos opciones:</p>
<blockquote>
<p>• Sí: la solicitud será eliminada de la bandeja.</p>
<p>• No: la solicitud permanecerá visible en la bandeja.</p>
</blockquote>
<p>El usuario procederá a llenar los datos del Formulario de Solicitud, detallados a continuación, el cual debe contar con los siguientes apartados:</p>
<blockquote>
<p>• Características del Producto.</p>
<p>• Requisitos adjuntos.</p>
</blockquote>
<p>Asimismo, antes de la sección “<strong>Productos</strong>” se deberá habilitar un campo con la denominación “<strong>Identificador de proveedor</strong>” que mostrara en modo lectura la información registrada y asignada por la ANH.</p>
<ol type="a">
<li><p><strong>Registro de Productos.</strong></p></li>
</ol>
<blockquote>
<p>En el Formulario de Solicitud de la AUTORIZACIÓN PREVIA DE IMPORTACIÓN PARA EL PROVEEDOR se deberá habilitar la funcionalidad para la sección “<strong>Productos</strong>”, en la cual se permitirá adicionar más de un producto en la solicitud, al presionar el botón “<strong>Registrar producto</strong>” con los siguientes campos:</p>
</blockquote>
<ol type="1">
<li><p>Producto</p></li>
<li><p>Subpartida relacionada al producto</p></li>
<li><p>Modalidad de transporte</p></li>
<li><p>Volumen aproximado mensual de importación.</p></li>
<li><p>País de procedencia</p></li>
<li><p>Frontera de internación</p></li>
<li><p>Destino Final (Departamento de destino final, localidad de destino final y dirección de destino final)</p></li>
</ol>
<blockquote>
<p>Una vez, se registre un producto o se agregue más de uno, el sistema deberá habilitar una sección que permita copiar, editar y eliminar los registros agregados, conforme a lo siguiente:</p>
</blockquote>
<table>
<colgroup>
<col style="width: 3%" />
<col style="width: 13%" />
<col style="width: 10%" />
<col style="width: 9%" />
<col style="width: 10%" />
<col style="width: 9%" />
<col style="width: 9%" />
<col style="width: 33%" />
</colgroup>
<tbody>
<tr class="odd">
<td><strong>N°</strong></td>
<td><strong>DESCRIPCIÓN DEL CAMPO</strong></td>
<td><strong>TIPO DATO</strong></td>
<td><strong>OBLIGATORIO</strong></td>
<td><strong>PARAMÉTRICA</strong></td>
<td><strong><mark>LONGITUD</mark></strong></td>
<td><strong><mark>ORIGEN</mark></strong></td>
<td><strong>VALIDACIÓN/REGLAS</strong></td>
</tr>
<tr class="even">
<td>1</td>
<td>PRODUCTO</td>
<td>Texto</td>
<td>SI</td>
<td>SI</td>
<td><mark>Ejemplo: 3 - 12</mark></td>
<td><mark>Ejemplo: USUARIO (Selección Unica)</mark></td>
<td><p>Debe desplegar las siguientes opciones con sus respectivas sub partidas arancelarias donde el usuario podrá elegir para que sepa el producto:</p>
<p>2710.12.13.30 Gasolina Premium importada MIN RON 91</p>
<p>2710.12.13.20 Gasolina Especial importada RON 85 a 90</p>
<p>2710.19.21.00 Diésel importado</p>
<p>2709.00.00.00 Petróleo</p>
<p>Paramétrica transmitida por servicio sistema ANH</p></td>
</tr>
<tr class="odd">
<td>2</td>
<td>MODALIDAD DE TRANSPORTE</td>
<td>Texto</td>
<td>SI</td>
<td>SI</td>
<td></td>
<td></td>
<td><p>Debe desplegar las siguientes opciones:</p>
<p>- Camiones cisternas</p>
<p>- Cisternas ferroviarias</p>
<p>- Barcazas</p>
<p>- Otros (cuando se seleccione esta opción debe habilitar un campo especifique)</p>
<p>Paramétrica transmitida por servicio sistema ANH</p></td>
</tr>
<tr class="even">
<td>2.1</td>
<td>Especifique Otros</td>
<td>Texto</td>
<td>SI</td>
<td>SI</td>
<td></td>
<td></td>
<td>Con una longitud de hasta 200 caracteres (solo letras).</td>
</tr>
<tr class="odd">
<td>3</td>
<td>VOLUMEN APROXIMADO MENSUAL DE IMPORTACIÓN.</td>
<td>Numérico</td>
<td>SI</td>
<td>NO</td>
<td></td>
<td></td>
<td>Con una longitud de hasta 20 caracteres (solo números enteros)</td>
</tr>
<tr class="even">
<td>4</td>
<td>PAIS DE PROCEDENCIA</td>
<td>Texto</td>
<td>SI</td>
<td>SI</td>
<td></td>
<td></td>
<td>El usuario podrá seleccionar el país del listado de países consumido del SUMA.</td>
</tr>
<tr class="odd">
<td>5</td>
<td>FRONTERA DE INTERNACION</td>
<td>Texto</td>
<td>SI</td>
<td>SI</td>
<td></td>
<td></td>
<td><p>El usuario podrá seleccionar el despliegue del listado de Administraciones Aduaneras con codificación del SUMA, el listado de debe considerar únicamente las <strong>14 FRONTERAS TERRESTRES</strong> donde existen controles fronterizos se tiene el siguiente detalle:</p>
<p><strong>ARGENTINA</strong>:</p>
<p>1. Villazón, 2.Yacuiba, 3. Bermejo.</p>
<p><strong>PERU:</strong></p>
<p>4. Desaguadero</p>
<p><strong>CHILE:</strong></p>
<p>5. charaña 6.Tambo quemado, 7. Pisiga, 8.Abaroa, 9. Apacheta Hito cajones.</p>
<p><strong>PARAGUAY:</strong></p>
<p>10, Cañada Oruro</p>
<p><strong>BRASIL</strong></p>
<p>11. Puerto Suarez, 12. Arroyo concepción, 13.cobija, 14, Guayaramerin</p></td>
</tr>
<tr class="even">
<td>6</td>
<td>DESTINO FINAL</td>
<td>Texto</td>
<td>SI</td>
<td>NO</td>
<td></td>
<td></td>
<td>Con una longitud de hasta 200 caracteres. (Al lado de campo de llenado se deberá mostrar un texto fijo de ejemplo con la leyenda “Departamento, localidad, dirección de la empresa donde será almacenado el combustible.”)</td>
</tr>
</tbody>
</table>
<ol start="2" type="a">
<li><p><strong>Documentos Requeridos.</strong></p></li>
</ol>
<blockquote>
<p>En la sección Requisitos adjuntos del Formulario, se debe exigir los siguientes documentos:</p>
</blockquote>
<table>
<colgroup>
<col style="width: 2%" />
<col style="width: 30%" />
<col style="width: 12%" />
<col style="width: 10%" />
<col style="width: 21%" />
<col style="width: 22%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>N°</strong></th>
<th><strong>Descripción</strong></th>
<th><blockquote>
<p><strong>Tipo dato</strong></p>
</blockquote></th>
<th><strong>Obligatorio</strong></th>
<th><p><strong>Cargado</strong></p>
<p><strong>Automático/Manual</strong></p></th>
<th><strong>Metadata</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>Nota de solicitud del proveedor</td>
<td><p>Documento</p>
<p>PDF</p></td>
<td>SI</td>
<td>Manual</td>
<td>Sin metada</td>
</tr>
<tr class="even">
<td>2</td>
<td>Documento que acredite la constitución del proveedor en el país de origen.</td>
<td><p>Documento</p>
<p>PDF</p></td>
<td>SI</td>
<td>Manual</td>
<td>Sin metada</td>
</tr>
<tr class="odd">
<td>3</td>
<td>Resolución Administrativa de autorización del depósito transitorio</td>
<td><p>Documento</p>
<p>PDF</p></td>
<td>SI</td>
<td>Manual</td>
<td>Sin metada</td>
</tr>
</tbody>
</table>
<blockquote>
<p>En cada botón “Siguiente”, se debe realizar la validación de los campos obligatorios. El botón “Guardar”, debe permitir guardar la información ingresada hasta ese momento.</p>
</blockquote>
<p><strong>c. Validación de datos ingresados.</strong></p>
<p>Se debe guardar la información registrada hasta el momento, para que la misma sea recuperada los próximos ingresos, mientras la solicitud se encuentre en estado <strong>BORRADOR</strong>.</p>
<p>En cada botón <strong>“Siguiente&gt;”</strong>, se debe realizar la validación de los campos obligatorios conforme Anexo (Diccionario de datos).</p>
<p>Si todos los datos son correctos, antes que el usuario proceda al <u>envío de la solicitud</u> (Botón “Enviar solicitud”), el sistema VUCE, desplegará el siguiente mensaje:</p>
<p><em><strong>“Mensaje ANH: Su solicitud será enviada, para completar este proceso debe revisar el Formulario de Solicitud registrado ¿Está seguro de enviar la Solicitud para revisión de la ANH?”</strong></em></p>
<p>Mensaje ANH: Su solicitud será enviada, para completar este proceso debe firmar de la DDJJ. La información registrada en el Formulario de Solicitud se constituye en una declaración jurada que no podrá ser modificada mientras se realice la evaluación de su trámite ¿Está seguro de enviar la Solicitud para revisión de la ANH??</p>
<p>Una vez adjuntado los documentos en la sección <em>Documentos Adjuntos</em> se debe habilitar el botón <strong>“Enviar solicitud”</strong>.</p>
<p>Una vez elegida la opción “<strong>Enviar solicitud</strong>” se enviara toda la información del Formulario de solicitud a DGSC, para que ellos almacenen esta información, la cual les servirá para procesar el pago.</p>
<p>Posteriormente si la ANH confirma que se procesó con éxito el Servicio Web de transmisión del Formulario de Solicitud se debe cambiar el estado de la solicitud a “<strong>SOLICITADO.</strong></p>
<p>Asimismo, se habilitará en la bandeja “<strong>Mis Solicitudes</strong>” un código para identificar la solicitud para que el usuario realice el seguimiento, el cual deberá ser <strong>notificado al usuario una vez enviada la solicitud.</strong></p>
<ol start="4" type="1">
<li><p><strong>RECEPCIÓN Y REVISIÓN DE LA SOLICITUD.</strong></p></li>
</ol>
<p><strong>Actor:</strong> SIREHIDRO-ANH</p>
<p><strong>Descripción:</strong> En esta actividad, se procede a confirmar que se haya procesado con éxito el Servicio Web de transmisión de la solicitud y documentos adjuntos al sistema de ANH. El sistema SIREL recepciona la solicitud en la bandeja de solicitudes y posteriormente se asigna el trámite a un funcionario (Legal y Técnico), el cual procede a la revisión de la solicitud y la documentación adjunta.</p>
<ol type="a">
<li><p><strong>Observado.</strong></p></li>
</ol>
<p>El trámite asignado al usuario de ANH (del área jurídica), el cual procede a la revisión de la solicitud y la documentación adjunta, verifica y analiza la solicitud, registra las observaciones realizadas y pasa el formulario al área técnica para su revisión; la ANH (del área técnica) procede a la revisión de la solicitud y la documentación adjunta, verifica y analiza la solicitud, registra las observaciones realizadas y notifica las observaciones consignadas por ambas áreas a la VUCE, para que el usuario corrija las observaciones.</p>
<p>Una vez realizada la verificación correspondiente por parte de la ANH, en caso de existir observaciones al trámite, la solicitud será remitida a la VUCE con el estado <strong>“OBSERVADO”</strong> junto con las casillas para la corrección, con las observaciones que la ANH haya identificado en la solicitud, y se verán reflejadas en la bandeja de “<strong>MIS SOLICITUDES”</strong> del usuario, donde se mostrarán las Autorizaciones Previas observadas junto con un espacio habilitado para la justificación técnica y documental de cada observación.</p>
<blockquote>
<p><strong>El sistema debe permitir que el usuario pueda:</strong></p>
</blockquote>
<ul>
<li><p><em>Visualizar el motivo de la observación.</em> Al posicionar simplemente el cursor sobre la pestaña denominada <strong>“Corregir Observaciones”,</strong> en esta acción deberá mostrar el detalle de las observaciones emitidas por la ANH. Esta funcionalidad podrá ser utilizada tantas veces como la ANH lo considere necesario durante el proceso de corrección.</p></li>
</ul>
<ul>
<li><p><em>Corregir la información o documentación observada.</em> Una vez que el usuario acceda a la opción “Corregir Observaciones”, el sistema desplegará el Formulario de Solicitud registrado inicialmente para la subsanación respectiva, asimismo se permitirá adjuntar nuevamente los documentos requeridos si corresponde.</p></li>
</ul>
<ol start="2" type="a">
<li><p><strong>Sin Observaciones.</strong></p></li>
</ol>
<p>En caso de no existir observaciones por parte de la ANH a la solicitud, una vez que hayan verificado que la documentación presentada y la información declarada por el usuario cumplan con todos los requisitos técnicos, normativos y formales, procederá a autorizar la emisión de la Autorización Previa de Importación.</p>
<p>Para tal efecto, estas autorizaciones serán identificadas mediante un número correlativo y único, que permitirá su rastreo, control y validación dentro del sistema VUCE.</p>
<p>En este sentido al momento de autorizar la emisión de la Autorización Previa de Importación se generará de manera automática un Código Único de Autorización, con formato establecido por la ANH.</p>
<ol start="2" type="1">
<li><p><strong>NOTIFICACIÓN OBSERVACIÓN.</strong></p></li>
</ol>
<p><strong>Actor:</strong> ANH - SIREL</p>
<p><strong>Descripción:</strong> Si la solicitud tiene errores o no cuenta con la documentación correcta, los técnicos de ANH asignados al trámite:</p>
<ul>
<li><p>Registrarán las observaciones realizada a la solicitud de Autorización Previa de Importación remitida por el usuario.</p></li>
<li><p>Mediante un Servicio Web notificará a la plataforma VUCE la actualización de estado SOLICITADO a OBSERVADO y las observaciones registradas en el SIREL, a fin de que el usuario realice las correcciones necesarias. En este caso, el proceso retorna a la actividad de llenado de Formulario de Solicitud, manteniendo las características y condiciones establecidas.</p></li>
</ul>
<ol start="3" type="1">
<li><p><strong>RECEPCIÓN OBSERVACIÓN.</strong></p></li>
</ol>
<p><strong>Actor:</strong> VUCE</p>
<p><strong>Descripción:</strong> En esta actividad la VUCE procede a recibir la actualización de estado y los datos de las observaciones para que sean subsanadas por el usuario de ANH.</p>
<p>Una vez recibida la actualización de la observación, notifica en la bandeja del usuario en la opción “<strong>Mis solicitudes</strong>” de la VUCE.</p>
<p>El usuario procederá a corregir los datos de la solicitud, según observación(es), al acercar el cursor a la pestaña corregir debe desplegarse el formulario de Solicitud inicialmente registrado.</p>
<ol start="4" type="1">
<li><p><strong>APROBAR AUTORIZACIÓN PREVIA DE IMPORTACIÓN.</strong></p></li>
</ol>
<p><strong>Actor:</strong> ANH – Usuario</p>
<p><strong>Descripción:</strong> La ANH aprobará la solicitud y garantizará la autenticidad del documento digital mediante la firma digital del certificado emitido.</p>
<p>Paralelamente independientemente de la aprobación del trámite en la VUCE, la ANH procede <strong>con la elaboración de informes técnico, legal y Resolución Administrativa</strong>. El personal técnico y legal de la ANH elaboraran y emitirán los informes correspondientes, el personal del área legal elaborara y emitirá la Resolución Administrativa para la aprobación de la solicitud, jefes de unidad/área y directores (según estructura organizacional vigente), realizarán la revisión y verificación de la documentación generada.</p>
<p>Estas autorizaciones serán identificadas mediante un número correlativo y código de barras, que permitirá su rastreo, control y validación dentro del sistema de la ANH, el funcionario certificante de la ANH procederá a firmar mediante <strong>soft token</strong> la Autorización Previa de Importación.</p>
<ol start="5" type="1">
<li><p><strong>ENVIO DEL ARCHIVO DIGITAL JSON FIRMADO.</strong></p></li>
</ol>
<p><strong>Actor:</strong> ANH – SIREL</p>
<p><strong>Descripción:</strong> Emitida la Resolución Administrativa de Autorización Previa de Importación, el sistema de ANH debe transmitir la data firmada a través de soft token a la VUCE, con la siguiente información:</p>
<ol type="1">
<li><p>Nombre del Certificador de ANH.</p></li>
<li><p>Número de Resolución Administrativa</p></li>
<li><p>Fecha de emisión de la Autorización firmada a través de soft token</p></li>
<li><p>Fecha de vencimiento</p></li>
<li><p>Datos del importador (NIT, Razón Social)</p></li>
<li><p>Vigencia de la RA</p></li>
<li><p>Información del producto:</p></li>
</ol>
<ul>
<li><p>Producto</p></li>
<li><p>Subpartida relacionada al producto</p></li>
<li><p>Modalidad de transporte</p></li>
<li><p>Volumen aproximado mensual de importación.</p></li>
<li><p>País de procedencia</p></li>
<li><p>Frontera de internación</p></li>
<li><p>Destino Final (Departamento de destino final, localidad de destino final y dirección de destino final)</p></li>
</ul>
<ol start="8" type="1">
<li><p>Link para descargar la Resolución Administrativa emitida por la ANH en el visor de “Verificar Documento”.</p></li>
</ol>
<p>Nota: En la bandeja de Mis Certificados, opción Ver, se requiere que en la Resolución Administrativa de Autorización de Importación formato JSON, se añada la siguiente leyenda, a fin de que operador acceda al documento en el formato propio del ente regulador y se notifique con las obligaciones con las que cuenta: <em>“La información detallada corresponde a la Resolución Administrativa de Autorización Previa de Importación de Gasolina, Diésel y Petróleo Crudo para Proveedores emitida por el ente regulador. Para descargar la Resolución el proveedor debe ingresar a la opción Ver Resolución en la bandeja de Mis Certificados de la VUCE, con el fin de dar cumplimiento a las obligaciones establecidas por el Ente Regulador”.</em></p>
<p>Emitida la AP se debe actualizar el estado de la solicitud a estado <strong>EMITIDO</strong>, asimismo, remitirá conjuntamente la Resolución Administrativa en formato PDF firmado conforme normativa vigente de la ANH.</p>
<ol start="6" type="1">
<li><p><strong>RECEPCIÓN DE JSON FIRMADO DIGITALMENTE.</strong></p></li>
</ol>
<p><strong>Actor:</strong> VUCE</p>
<p><strong>Descripción:</strong> La VUCE procede a:</p>
<ul>
<li><p>Validar la estructura del JSON</p></li>
<li><p>Verificar la autenticidad de la firma digital. De no ser válido genera una notificación al sistema SIREL de la ANH.</p></li>
</ul>
<ol start="7" type="1">
<li><p><strong>NOTIFICA LA EMISIÓN DE LA AUTORIZACIÓN DE IMPORTACIÓN.</strong></p></li>
</ol>
<p><strong>Actor:</strong> VUCE</p>
<p><strong>Descripción :</strong> Una vez validada la transmisión de los datos procederá a realizar la notificación al usuario en la VUCE:</p>
<ul>
<li><p>Notifica al importador la emisión de la Autorización Previa de Importación (Resolución Administrativa).</p></li>
<li><p>En la bandeja <strong>“Mis Certificados”,</strong> se despliega la Autorización Previa de Importación de emitida.</p></li>
<li><p>Se habilita la opción <strong>“Ver”</strong>, que permitirá visualizar los datos del AP emitido por ANH.</p></li>
<li><p>El importador podrá realizar la verificación de la integridad del documento mediante el módulo de verificación de la VUCE.</p></li>
</ul>
<ol start="3" type="A">
<li><p><strong>DESCRIPCIÓN DDE ESTADOS SOLICITUD DE AUTORIZACIÓN PREVIA DE IMPORTACIÓN PARA EL PROVEEDOR.</strong></p></li>
</ol>
<p><strong><mark>EJEMPLO: FAVOR DETALLAR ESTADOS EN EL SIGUIENTE CUADRO.</mark></strong></p>
<table>
<colgroup>
<col style="width: 26%" />
<col style="width: 24%" />
<col style="width: 24%" />
<col style="width: 24%" />
</colgroup>
<thead>
<tr class="header">
<th><strong><mark>Estado</mark></strong></th>
<th><strong><mark>Descripción</mark></strong></th>
<th><strong><mark>Quien lo asigna</mark></strong></th>
<th><strong><mark>Transiciones Permitidas</mark></strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><mark>BORRADOR</mark></td>
<td><mark>Usuario llenando formulario</mark></td>
<td><mark>Sistema (autosave)</mark></td>
<td><mark>→ANULADO, POR FIRMAR,</mark></td>
</tr>
<tr class="even">
<td><mark>ENVIADO</mark></td>
<td><mark>Solicitud enviada de VUCE a SENASAG para revisión</mark></td>
<td><mark>VUCE → SENASAG</mark></td>
<td><mark>→RECEPCIONADO, POR FIRMAR</mark></td>
</tr>
<tr class="odd">
<td><mark>RECEPCIONADO</mark></td>
<td><mark>Solicitud recibida en SENASAG; en revisión técnica</mark></td>
<td><mark>VUCE → SENASAG</mark></td>
<td><mark>→OBSERVADO, APROBADO</mark></td>
</tr>
<tr class="even">
<td><mark>OBSERVADO</mark></td>
<td><mark>Devuelto al usuario para subsanación</mark></td>
<td><mark>SENASAG</mark></td>
<td><mark>→SUBSANADO</mark></td>
</tr>
<tr class="odd">
<td><mark>APROBADO</mark></td>
<td><mark>Solicitud aprobada</mark></td>
<td><mark>SENASAG</mark></td>
<td><mark>→SOLICITAR_LIQ</mark></td>
</tr>
<tr class="even">
<td><mark>POR_PAGAR</mark></td>
<td><mark>Solicitud a la espera de pago</mark></td>
<td><mark>SENASAG</mark></td>
<td><mark>→PAGAR</mark></td>
</tr>
</tbody>
</table></td>
</tr>
<tr class="even">
<td colspan="2"><ol start="3" type="1">
<li><p><strong>RESPALDO/JUSTIFICACIÓN DEL REQUERIMIENTO</strong></p></li>
</ol></td>
<td colspan="2"><p>Diagrama de actividades</p>
<p>Diagrama de estados</p>
<p>Diccionario de datos de la solicitud</p></td>
</tr>
<tr class="odd">
<td colspan="2"><ol start="4" type="1">
<li><p><strong>FIRMA Y SELLOS</strong></p></li>
</ol></td>
<td><strong>Elaborado por:</strong></td>
<td><strong>Autorizado por:</strong></td>
</tr>
</tbody>
</table>
