// ============================================================
// Code.gs — Google Apps Script Backend
// Banco de Preguntas UNESUM
// Desplegar como: "Ejecutar como: Yo" + "Acceso: Cualquiera"
// ============================================================

const SHEET_NAME    = 'BancoPreguntas';
const ALLOWED_DOMAIN = '@unesum.edu.ec';
const SHARED_EDIT_THRESHOLD = 7;
const HEADERS = [
  'ID_Pregunta', 'Fecha', 'Email_Docente', 'Materia', 'Tema', 'Tipo_Pregunta',
  'Enunciado', 'Opcion_A_o_Concepto1', 'Opcion_B_o_Definicion1',
  'Opcion_C_o_Concepto2', 'Opcion_D_o_Definicion2',
  'Concepto3', 'Definicion3', 'Concepto4', 'Definicion4',
  'Respuesta_Correcta', 'Justificacion', 'Nivel_Bloom'
];
const BLOOM_REQUIREMENTS = {
  'Comprensión': 3,
  'Análisis': 4,
  'Aplicación': 5,
  'Evaluación': 3,
  'Síntesis': 5
};

// Crea la hoja si no existe; devuelve siempre el objeto Sheet.
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 200);
  } else {
    ensureHeaders(sheet);
  }
  return sheet;
}

function ensureHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const missing = HEADERS.filter(h => !current.includes(h));
  if (missing.length > 0) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    sheet.setColumnWidths(current.length + 1, missing.length, 200);
  }
}

// ------------------------------------------------------------------
// GET  ?email=docente@unesum.edu.ec
// Retorna las filas del docente y las de materias habilitadas para visualización compartida.
// ------------------------------------------------------------------
function doGet(e) {
  try {
    const email = normalizeEmail(e.parameter.email);

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

    const sharedSubjects = getSharedEditableSubjects(values, email);
    const preguntas = values
      .filter(row => {
        const rowEmail = normalizeEmail(row[2]);
        const rowSubject = normalizeSubject(row[3]);
        return row[0] !== '' && (rowEmail === email || sharedSubjects[rowSubject]);
      })
      .map(row => {
        const obj = {};
        HEADERS.forEach((h, i) => { obj[h] = row[i]; });
        const rowEmail = normalizeEmail(row[2]);
        const rowSubject = normalizeSubject(row[3]);
        obj.Puede_Editar = rowEmail === email;
        obj.Edicion_Compartida = rowEmail !== email && !!sharedSubjects[rowSubject];
        return obj;
      });

    return buildResponse({
      success: true,
      data: preguntas,
      sharedSubjects: Object.keys(sharedSubjects)
    });

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
    const requestEmail = normalizeEmail(payload.Solicitante_Email || payload.Email_Docente);

    if (!requestEmail.endsWith(ALLOWED_DOMAIN)) {
      return buildResponse({ success: false, error: 'Dominio no autorizado.' });
    }

    const id = String(payload.ID_Pregunta || '').trim();
    if (!id) {
      return buildResponse({ success: false, error: 'ID_Pregunta requerido.' });
    }

    const sheet = initSheet();
    const nivelBloom = String(payload.Nivel_Bloom || '').trim();
    if (!BLOOM_REQUIREMENTS[nivelBloom]) {
      return buildResponse({ success: false, error: 'Nivel Bloom requerido o no válido.' });
    }
    if (
      String(payload.Tipo_Pregunta || '').trim() === 'Verdadero o Falso' &&
      String(payload.Respuesta_Correcta || '').trim() === 'Falso' &&
      !String(payload.Justificacion || '').trim()
    ) {
      return buildResponse({
        success: false,
        error: 'Si la respuesta es Falso, debe justificar por qué la afirmación es incorrecta.'
      });
    }

    // Buscar si el ID ya existe
    const lastRow = sheet.getLastRow();
    let targetRow = -1;
    let rows = [];
    let ownerEmail = requestEmail;

    if (lastRow > 1) {
      rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
      const idx = rows.findIndex(row => String(row[0]).trim() === id);
      if (idx !== -1) {
        const existingEmail = normalizeEmail(rows[idx][2]);
        const isSharedEdit = existingEmail !== requestEmail;
        if (isSharedEdit) {
          return buildResponse({
            success: false,
            error: 'No puede modificar una pregunta registrada por otro docente.'
          });
        }
        ownerEmail = existingEmail;
        targetRow = idx + 2; // +2: fila de cabecera + índice 0
      } else {
        ownerEmail = requestEmail;
      }
    }

    payload.Email_Docente = ownerEmail;

    const errorDistribucion = validateBloomDistribution(rows, ownerEmail, id, nivelBloom);
    if (errorDistribucion) {
      return buildResponse({ success: false, error: errorDistribucion });
    }

    const row = HEADERS.map(h => (payload[h] != null ? String(payload[h]) : ''));

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

function validateBloomDistribution(rows, email, id, nivelBloom) {
  const counts = {};
  Object.keys(BLOOM_REQUIREMENTS).forEach(nivel => { counts[nivel] = 0; });

  rows.forEach(row => {
    const rowId = String(row[0] || '').trim();
    const rowEmail = normalizeEmail(row[2]);
    const rowNivel = String(row[17] || '').trim();
    if (rowEmail === email && rowId !== id && counts[rowNivel] != null) {
      counts[rowNivel] += 1;
    }
  });

  if ((counts[nivelBloom] + 1) > BLOOM_REQUIREMENTS[nivelBloom]) {
    return `Ya alcanzó el máximo de ${BLOOM_REQUIREMENTS[nivelBloom]} preguntas para ${nivelBloom}.`;
  }
  return '';
}

function getSharedEditableSubjects(rows, email) {
  const counts = {};
  rows.forEach(row => {
    const rowId = String(row[0] || '').trim();
    const rowEmail = normalizeEmail(row[2]);
    const rowSubject = normalizeSubject(row[3]);
    if (rowId && rowEmail === email && rowSubject) {
      counts[rowSubject] = (counts[rowSubject] || 0) + 1;
    }
  });

  const subjects = {};
  Object.keys(counts).forEach(subject => {
    if (counts[subject] > SHARED_EDIT_THRESHOLD) {
      subjects[subject] = true;
    }
  });
  return subjects;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSubject(value) {
  return String(value || '').trim();
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
