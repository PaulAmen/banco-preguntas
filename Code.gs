// ============================================================
// Code.gs — Google Apps Script Backend
// Banco de Preguntas UNESUM
// Desplegar como: "Ejecutar como: Yo" + "Acceso: Cualquiera"
// ============================================================

const SHEET_NAME    = 'BancoPreguntas';
const ALLOWED_DOMAIN = '@unesum.edu.ec';
const HEADERS = [
  'ID_Pregunta', 'Fecha', 'Email_Docente', 'Materia', 'Tema', 'Tipo_Pregunta',
  'Enunciado', 'Opcion_A_o_Concepto1', 'Opcion_B_o_Definicion1',
  'Opcion_C_o_Concepto2', 'Opcion_D_o_Definicion2',
  'Concepto3', 'Definicion3', 'Concepto4', 'Definicion4',
  'Respuesta_Correcta', 'Justificacion'
];

// Crea la hoja si no existe; devuelve siempre el objeto Sheet.
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 200);
  }
  return sheet;
}

// ------------------------------------------------------------------
// GET  ?email=docente@unesum.edu.ec
// Retorna todas las filas que corresponden al docente.
// ------------------------------------------------------------------
function doGet(e) {
  try {
    const email = String(e.parameter.email || '').trim();

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      return buildResponse({ success: false, error: 'Dominio no autorizado.' });
    }

    const sheet   = initSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return buildResponse({ success: true, data: [] });
    }

    const values = sheet
      .getRange(2, 1, lastRow - 1, HEADERS.length)
      .getValues();

    const preguntas = values
      .filter(row => String(row[2]).trim() === email && row[0] !== '')
      .map(row => {
        const obj = {};
        HEADERS.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });

    return buildResponse({ success: true, data: preguntas });

  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

// ------------------------------------------------------------------
// POST  body: JSON string con los campos de HEADERS
// Crea una fila nueva o actualiza la existente según ID_Pregunta.
//
// NOTA CORS: El frontend envía Content-Type: text/plain para evitar
// el preflight (OPTION) que GAS no maneja. El body sigue siendo JSON.
// ------------------------------------------------------------------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const email   = String(payload.Email_Docente || '').trim();

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      return buildResponse({ success: false, error: 'Dominio no autorizado.' });
    }

    const id = String(payload.ID_Pregunta || '').trim();
    if (!id) {
      return buildResponse({ success: false, error: 'ID_Pregunta requerido.' });
    }

    const sheet = initSheet();
    const row   = HEADERS.map(h => (payload[h] != null ? String(payload[h]) : ''));

    // Buscar si el ID ya existe
    const lastRow = sheet.getLastRow();
    let targetRow = -1;

    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const idx = ids.findIndex(v => String(v).trim() === id);
      if (idx !== -1) targetRow = idx + 2; // +2: fila de cabecera + índice 0
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([row]);
      return buildResponse({ success: true, action: 'updated', id });
    } else {
      sheet.appendRow(row);
      return buildResponse({ success: true, action: 'created', id });
    }

  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
