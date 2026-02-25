// ============================================================
// api.js — Comunicación con el backend (Google Apps Script)
// ============================================================

const GAS_URL = import.meta.env.VITE_GAS_URL;

/**
 * Trae todas las preguntas del docente desde Google Sheets.
 * Usa fetch normal (GET simple → CORS permitido por GAS).
 */
export async function fetchPreguntas(email) {
  const res = await fetch(`${GAS_URL}?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al obtener preguntas');
  return data.data;
}

/**
 * Guarda o actualiza una pregunta.
 *
 * CORS: El POST se envía con Content-Type: text/plain para evitar el
 * preflight OPTIONS que GAS no maneja. El body es un JSON válido.
 * GAS lo parsea con JSON.parse(e.postData.contents).
 *
 * Si el servidor responde y `success` es false, lanza un error.
 * Si hay un error de red / CORS opaco, relanza para que el llamador lo maneje.
 */
export async function guardarPregunta(payload) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  // GAS puede responder con un redirect; fetch lo sigue automáticamente.
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al guardar');
  return data;
}
