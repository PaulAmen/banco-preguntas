// ============================================================
// bloom.config.js — Configuración de requerimientos Bloom
// ============================================================

// Materias con requerimientos especiales de Bloom
export const MATERIAS_ESPECIALES = [
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

// Requerimientos estándar (20 preguntas)
export const BLOOM_ESTANDAR = {
  'Comprensión': { cantidad: 3, porcentaje: '15%' },
  'Análisis':    { cantidad: 4, porcentaje: '20%' },
  'Aplicación':  { cantidad: 5, porcentaje: '25%' },
  'Evaluación':  { cantidad: 3, porcentaje: '15%' },
  'Síntesis':    { cantidad: 5, porcentaje: '25%' },
};

// Requerimientos especiales (20 preguntas, sin Aplicación ni Síntesis)
export const BLOOM_ESPECIAL = {
  'Comprensión': { cantidad: 7, porcentaje: '35%' },
  'Análisis':    { cantidad: 7, porcentaje: '35%' },
  'Evaluación':  { cantidad: 6, porcentaje: '30%' },
};

export const META_ESTANDAR = 20;
export const META_ESPECIAL = 20;

// Niveles que cuentan para cada tipo de materia
export const NIVELES_VALIDOS_ESTANDAR = ['Comprensión', 'Análisis', 'Aplicación', 'Evaluación', 'Síntesis'];
export const NIVELES_VALIDOS_ESPECIAL = ['Comprensión', 'Análisis', 'Evaluación'];

/**
 * Verifica si una materia tiene requerimientos especiales.
 */
export function esMateriaEspecial(materia) {
  const normalizada = String(materia || '').trim().toLowerCase();
  return MATERIAS_ESPECIALES.some(m => String(m).trim().toLowerCase() === normalizada);
}

/**
 * Obtiene la configuración Bloom para una materia dada.
 */
export function getBloomConfig(materia) {
  if (esMateriaEspecial(materia)) {
    return {
      requerimientos: BLOOM_ESPECIAL,
      meta: META_ESPECIAL,
      nivelesValidos: NIVELES_VALIDOS_ESPECIAL,
      esEspecial: true,
    };
  }
  return {
    requerimientos: BLOOM_ESTANDAR,
    meta: META_ESTANDAR,
    nivelesValidos: NIVELES_VALIDOS_ESTANDAR,
    esEspecial: false,
  };
}

/**
 * Cuenta preguntas por nivel Bloom para una materia específica,
 * considerando solo los niveles válidos según el tipo de materia.
 */
export function contarBloom(preguntas, email, materia) {
  const config = getBloomConfig(materia);
  const counts = {};
  config.nivelesValidos.forEach(n => { counts[n] = 0; });

  preguntas.forEach(p => {
    const pEmail = String(p.Email_Docente || '').trim().toLowerCase();
    const pMateria = String(p.Materia || '').trim().toLowerCase();
    if (pEmail === String(email || '').trim().toLowerCase() &&
        pMateria === String(materia || '').trim().toLowerCase() &&
        config.nivelesValidos.includes(p.Nivel_Bloom)) {
      counts[p.Nivel_Bloom] = (counts[p.Nivel_Bloom] || 0) + 1;
    }
  });

  return { counts, config };
}
