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
  'Respuesta_Correcta', 'Justificacion', 'Nivel_Bloom', 'Mala'
];
const CODIGOS_REVISION = ['', 'e', 'c'];
const BLOOM_REQUIREMENTS = {
  'Comprensión': 3,
  'Análisis': 4,
  'Aplicación': 5,
  'Evaluación': 3,
  'Síntesis': 5
};

const MATERIAS_ESPECIALES = [
  'Diseño Curricular',
  'Metodología de Enseñanza de la Matemática',
  'Metodología de la Enseñanza de la Química',
  'Creatividad en la Educación',
  'Educación Inclusiva',
  'Redacción Científica y Normas APA',
  'Técnicas de Estudio e Investigación Científica Educativa',
  'Estadística Aplicada a la Investigación Educativa',
  'Titulación II',
  'Taller de Escritura del Plan de Investigación',
];

const BLOOM_ESPECIAL = {
  'Comprensión': 7,
  'Análisis': 7,
  'Evaluación': 6,
};

const NIVELES_VALIDOS_ESPECIAL = ['Comprensión', 'Análisis', 'Evaluación'];

function esMateriaEspecial(materia) {
  const normalizada = normalizeSubject(materia).toLowerCase();
  return MATERIAS_ESPECIALES.some(m => normalizeSubject(m).toLowerCase() === normalizada);
}

function getBloomRequirements(materia) {
  if (esMateriaEspecial(materia)) return BLOOM_ESPECIAL;
  return BLOOM_REQUIREMENTS;
}

function getNivelesValidos(materia) {
  if (esMateriaEspecial(materia)) return NIVELES_VALIDOS_ESPECIAL;
  return Object.keys(BLOOM_REQUIREMENTS);
}

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
    const malaCol = HEADERS.indexOf('Mala') + 1;
    const malaNotes = sheet
      .getRange(2, malaCol, lastRow - 1, 1)
      .getNotes()
      .map(row => row[0] || '');

    const sharedSubjects = getSharedEditableSubjects(values, email);
    const revisorInfo = safeGetRevisorInfo(email);

    // Set de materias que el revisor puede revisar (normalizadas)
    const materiasRevSet = {};
    if (revisorInfo.esRevisor) {
      revisorInfo.materias.forEach(m => {
        materiasRevSet[normalizeSubject(m).toLowerCase()] = true;
      });
    }

    const preguntas = values
      .map((row, index) => ({ row, comentarioRevision: malaNotes[index] }))
      .filter(({ row }) => {
        const rowEmail = normalizeEmail(row[2]);
        const rowSubject = normalizeSubject(row[3]);
        const rowSubjectNorm = rowSubject.toLowerCase();
        if (row[0] === '') return false;
        // Siempre incluir propias
        if (rowEmail === email) return true;
        // Incluir materias compartidas por threshold
        if (sharedSubjects[rowSubject]) return true;
        // Si es revisor con '*', incluir todo lo ajeno
        if (revisorInfo.esRevisor && revisorInfo.materias.includes('*')) return true;
        // Si es revisor con materias específicas, incluir las que correspondan
        if (revisorInfo.esRevisor && materiasRevSet[rowSubjectNorm]) return true;
        return false;
      })
      .map(({ row, comentarioRevision }) => {
        const obj = {};
        HEADERS.forEach((h, i) => { obj[h] = row[i]; });
        const rowEmail = normalizeEmail(row[2]);
        const rowSubject = normalizeSubject(row[3]);
        const rowSubjectNorm = rowSubject.toLowerCase();
        const isOwn = rowEmail === email;
        const isShared = !isOwn && !!sharedSubjects[rowSubject];
        const isRevisable = !isOwn && revisorInfo.esRevisor &&
          (revisorInfo.materias.includes('*') || materiasRevSet[rowSubjectNorm]);

        obj.Puede_Editar = isOwn;
        obj.Edicion_Compartida = isShared;
        obj.Puede_Revisar = isRevisable;
        obj.Comentario_Revision = comentarioRevision;
        return obj;
      });

    return buildResponse({
      success: true,
      data: preguntas,
      sharedSubjects: Object.keys(sharedSubjects),
      esRevisor: revisorInfo.esRevisor,
      materiasRevision: revisorInfo.materias,
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

    // Buscar si el ID ya existe
    const lastRow = sheet.getLastRow();
    let targetRow = -1;
    let rows = [];
    let existingRow = null;
    let ownerEmail = requestEmail;
    let existingMateria = '';

    if (lastRow > 1) {
      rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
      const idx = rows.findIndex(row => String(row[0]).trim() === id);
      if (idx !== -1) {
        existingRow = rows[idx];
        ownerEmail = normalizeEmail(existingRow[2]);
        existingMateria = normalizeSubject(existingRow[3]);
        targetRow = idx + 2; // +2: fila de cabecera + índice 0
      } else {
        ownerEmail = requestEmail;
      }
    }

    const isRevisor = safePuedeRevisar(requestEmail);
    const isOwner = ownerEmail === requestEmail;

    // ── Flujo de REVISOR (modificar Mala en preguntas ajenas) ────
    if (isRevisor && !isOwner && targetRow > 0) {
      if (!safePuedeRevisarMateria(requestEmail, existingMateria)) {
        return buildResponse({
          success: false,
          error: 'No tiene permiso para revisar esta materia.'
        });
      }

      const valorMala = String(payload.Mala || '').trim().toLowerCase();
      if (!CODIGOS_REVISION.includes(valorMala)) {
        return buildResponse({
          success: false,
          error: 'Código de revisión no válido.'
        });
      }

      const notaRevision = valorMala ? String(payload.Comentario_Revision || '').trim() : '';
      const malaCol = HEADERS.indexOf('Mala') + 1;
      const malaCell = sheet.getRange(targetRow, malaCol);
      malaCell.setValue(valorMala);
      if (notaRevision) {
        malaCell.setNote(notaRevision);
      } else {
        malaCell.clearNote();
      }
      return buildResponse({ success: true, action: 'updated-mala', id });
    }

    // ── Flujo normal (dueño o nueva pregunta) ────────────────────
    if (!isOwner && targetRow > 0) {
      return buildResponse({
        success: false,
        error: 'No puede modificar una pregunta registrada por otro docente.'
      });
    }

    payload.Email_Docente = ownerEmail;

    const nivelBloom = String(payload.Nivel_Bloom || '').trim();
    const materiaPayload = String(payload.Materia || '').trim();
    const bloomReqs = getBloomRequirements(materiaPayload);
    if (!bloomReqs[nivelBloom]) {
      return buildResponse({ success: false, error: 'Nivel Bloom requerido o no válido para esta materia.' });
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

    const errorDistribucion = validateBloomDistribution(rows, ownerEmail, id, nivelBloom, materiaPayload);
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

function validateBloomDistribution(rows, email, id, nivelBloom, materia) {
  const bloomReqs = getBloomRequirements(materia);
  const nivelesValidos = getNivelesValidos(materia);
  const counts = {};
  nivelesValidos.forEach(nivel => { counts[nivel] = 0; });

  rows.forEach(row => {
    const rowId = String(row[0] || '').trim();
    const rowEmail = normalizeEmail(row[2]);
    const rowMateria = normalizeSubject(row[3]);
    const rowNivel = String(row[17] || '').trim();
    // Solo contar preguntas del mismo docente, misma materia, y nivel válido
    if (rowEmail === email && rowId !== id &&
        rowMateria.toLowerCase() === normalizeSubject(materia).toLowerCase() &&
        counts[rowNivel] != null) {
      counts[rowNivel] += 1;
    }
  });

  if ((counts[nivelBloom] + 1) > bloomReqs[nivelBloom]) {
    return `Ya alcanzó el máximo de ${bloomReqs[nivelBloom]} preguntas para ${nivelBloom}.`;
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

// ------------------------------------------------------------------
// Wrappers seguros para funciones de Revisores.gs
// Si Revisores.gs no está desplegado aún, no falla.
// ------------------------------------------------------------------
function safeGetRevisorInfo(email) {
  try {
    if (typeof getRevisorInfo === 'function') {
      return getRevisorInfo(email);
    }
  } catch (e) { /* ignorar */ }
  return { esRevisor: false, materias: [] };
}

function safePuedeRevisar(email) {
  try {
    if (typeof puedeRevisar === 'function') {
      return puedeRevisar(email);
    }
  } catch (e) { /* ignorar */ }
  return false;
}

function safePuedeRevisarMateria(email, materia) {
  try {
    if (typeof puedeRevisarMateria === 'function') {
      return puedeRevisarMateria(email, materia);
    }
  } catch (e) { /* ignorar */ }
  return false;
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
