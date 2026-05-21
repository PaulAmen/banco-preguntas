// ============================================================
// Revisores.gs — Configuración y validación de revisores
// Banco de Preguntas UNESUM
//
// Cada revisor tiene un email y una lista de materias.
// Si materias contiene '*', el revisor tiene acceso a TODAS.
//
// Ejemplo:
//   { email: 'paul.amen@unesum.edu.ec', materias: ['*'] }
//   { email: 'coordinador@unesum.edu.ec', materias: ['Didáctica General'] }
// ============================================================

const REVISORES = [
  {
    email: 'paul.amen@unesum.edu.ec',
    materias: ['*'],
  },
];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function getRevisor(email) {
  const normalized = normalizeEmail(email);
  return REVISORES.find(r => normalizeEmail(r.email) === normalized) || null;
}

function puedeRevisar(email) {
  return getRevisor(email) !== null;
}

function puedeRevisarMateria(email, materia) {
  const revisor = getRevisor(email);
  if (!revisor) return false;
  if (revisor.materias.includes('*')) return true;
  const normalizada = String(materia || '').trim().toLowerCase();
  return revisor.materias.some(m => String(m).trim().toLowerCase() === normalizada);
}

function materiasDelRevisor(email) {
  const revisor = getRevisor(email);
  if (!revisor) return [];
  if (revisor.materias.includes('*')) return ['*'];
  return revisor.materias;
}

// ------------------------------------------------------------------
// Endpoint expuesto al frontend: ?email=docente@unesum.edu.ec
// Devuelve { esRevisor: true/false, materias: [...] }
// ------------------------------------------------------------------

function getRevisorInfo(email) {
  const revisor = getRevisor(email);
  if (!revisor) {
    return { esRevisor: false, materias: [] };
  }
  return {
    esRevisor: true,
    materias: revisor.materias,
  };
}
