// ============================================================
// Revisores.gs — Configuración y validación de revisores
// Banco de Preguntas UNESUM
//
// Cada revisor se configura por correo con una lista de materias.
// Si materias contiene '*', el revisor tiene acceso a TODAS.
//
// Ejemplo:
//   'paul.amen@unesum.edu.ec': ['*']
//   'coordinador@unesum.edu.ec': ['Didáctica General']
// ============================================================

const REVISORES_CONFIG = {
   'paul.amen@unesum.edu.ec': ['*'],
   'ronny.avila@unesum.edu.ec': [
      'Taller de Escritura del Plan de Investigación',
      'Proyectos Educativos',
      'Técnicas de Estudio e Investigación Científica Educativa',
      'Realidad Socioeconómica Cultural y Ecológica del Ecuador',
   ],
   'geomayra.cevallos@unesum.edu.ec': [
      'Emprendimiento e Innovación',
      'Titulación I',
   ],
   'stalin.leon@unesum.edu.ec': [
      'Filosofía de la Educación',
      'Lenguaje y Comunicación',
      'Pedagogía',
      'Ética Pedagógica',
   ],
   'melissa.canarte@unesum.edu.ec': [
      'Gestión Educativa',
      'Metodología de la Investigación Educativa',
      'Psicología Educativa',
      'Desarrollo Humano',
   ],
   'shirley.zambrano@unesum.edu.ec': [
      'Creatividad en la Educación',
      'Didáctica de la Lengua y Literatura',
      'Elaboración y Aplicación de Medios de Enseñanza',
      'Inglés I y II',
   ],
   'victoria.ayon@unesum.edu.ec': [
      'Neurociencia en el Aprendizaje',
      'Didáctica General',
      'Diagnóstico Pedagógico',
      'Informática Aplicada a la Educación',
   ],
   'henry.guerrero@unesum.edu.ec': [
      'Diseño Curricular',
      'Metodología de Enseñanza de la Matemática',
      'Educación Inclusiva',
      'Educación para la identidad, sexualidad y convivencia',
   ],
   'jahiry.molineros@unesum.edu.ec': [
      'Inglés III y IV',
      'Educación Ambiental',
      'Didáctica de las Ciencias Sociales',
      'Saberes y Lenguas Ancestrales del Ecuador',
   ],
   'fernanda.quijije@unesum.edu.ec': [
      'Estadística Aplicada a la Investigación Educativa',
      'Didáctica de las Ciencias Naturales',
      'Evaluación Educativa',
      'Didáctica de las Ciencias Exactas',
   ],
   'laura.hidalgo@unesum.edu.ec': [
      'Redacción Científica y Normas APA',
      'Titulación II',
   ],
   'brenda.alvarez@unesum.edu.ec': [
      'Metodología de la Enseñanza de la Química',
      'Relación Institución y Comunidad',
      'Didáctica de la Educación Cultural y Artística',
      'Didáctica de la Educación Física',
   ],
}

const REVISORES = Object.entries(REVISORES_CONFIG).map(([email, materias]) => ({
   email,
   materias,
}))

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function getRevisor(email) {
   const normalized = normalizeEmail(email)
   return REVISORES.find((r) => normalizeEmail(r.email) === normalized) || null
}

function puedeRevisar(email) {
   return getRevisor(email) !== null
}

function puedeRevisarMateria(email, materia) {
   const revisor = getRevisor(email)
   if (!revisor) return false
   if (revisor.materias.includes('*')) return true
   const normalizada = String(materia || '')
      .trim()
      .toLowerCase()
   return revisor.materias.some(
      (m) => String(m).trim().toLowerCase() === normalizada,
   )
}

function materiasDelRevisor(email) {
   const revisor = getRevisor(email)
   if (!revisor) return []
   if (revisor.materias.includes('*')) return ['*']
   return revisor.materias
}

// ------------------------------------------------------------------
// Endpoint expuesto al frontend: ?email=docente@unesum.edu.ec
// Devuelve { esRevisor: true/false, materias: [...] }
// ------------------------------------------------------------------

function getRevisorInfo(email) {
   const revisor = getRevisor(email)
   if (!revisor) {
      return { esRevisor: false, materias: [] }
   }
   return {
      esRevisor: true,
      materias: revisor.materias,
   }
}
