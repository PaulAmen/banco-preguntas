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
   {
      email: 'ronny.avila@unesum.edu.ec',
      materias: [
         'Taller de Escritura del Plan de Investigación',
         'Proyectos Educativos',
         'Técnicas de Estudio e Investigación Científica Educativa',
         'Realidad Socioeconómica Cultural y Ecológica del Ecuador',
      ],
   },
   {
      email: 'geomayra.cevallos@unesum.edu.ec',
      materias: ['Emprendimiento e Innovación', 'Titulación I'],
   },
   {
      email: 'stalin.leon@unesum.edu.ec',
      materias: [
         'Filosofía de la Educación',
         'Lenguaje y Comunicación',
         'Pedagogía',
         'Ética Pedagógica',
      ],
   },
   {
      email: 'melissa.canarte@unesum.edu.ec',
      materias: [
         'Gestión Educativa',
         'Metodología de la Investigación Educativa',
         'Psicología Educativa',
         'Desarrollo Humano',
      ],
   },
   {
      email: 'shirley.zambrano@unesum.edu.ec',
      materias: [
         'Creatividad en la Educación',
         'Didáctica de la Lengua y Literatura',
         'Elaboración y Aplicación de Medios de Enseñanza',
         'Inglés I y II',
      ],
   },
   {
      email: 'victoria.ayon@unesum.edu.ec',
      materias: [
         'Neurociencia en el Aprendizaje',
         'Didáctica General',
         'Diagnóstico Pedagógico',
         'Informática Aplicada a la Educación',
      ],
   },
   {
      email: 'henry.guerrero@unesum.edu.ec',
      materias: [
         'Diseño Curricular',
         'Metodología de Enseñanza de la Matemática',
         'Educación Inclusiva',
         'Educación para la identidad, sexualidad y convivencia',
      ],
   },
   {
      email: 'jahiry.molineros@unesum.edu.ec',
      materias: [
         'Inglés III y IV',
         'Educación Ambiental',
         'Didáctica de las Ciencias Sociales',
         'Saberes y Lenguas Ancestrales del Ecuador',
      ],
   },
   {
      email: 'fernanda.quijije@unesum.edu.ec',
      materias: [
         'Estadística Aplicada a la Investigación Educativa',
         'Didáctica de las Ciencias Naturales',
         'Evaluación Educativa',
         'Didáctica de las Ciencias Exactas',
      ],
   },
   {
      email: 'laura.hidalgo@unesum.edu.ec',
      materias: [
         'Emprendimiento e Innovación',
         'Titulación I',
         'Redacción Científica y Normas APA',
         'Titulación II',
      ],
   },
   {
      email: 'brenda.alvarez@unesum.edu.ec',
      materias: [
         'Metodología de la Enseñanza de la Química',
         'Relación Institución y Comunidad',
         'Didáctica de la Educación Cultural y Artística',
         'Didáctica de la Educación Física',
      ],
   },
]

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
