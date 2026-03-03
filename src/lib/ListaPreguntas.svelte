<script>
  // ============================================================
  // ListaPreguntas.svelte — Columna derecha: listado y progreso
  // ============================================================

  /** @type {{ preguntas: any[], cargando: boolean, oneditar: (p:any)=>void, email?: string, nombre?: string }} */
  let { preguntas, cargando, oneditar, email = '', nombre = '' } = $props();

  const META = 20;

  const TIPO_CLASE = {
    'Opción Múltiple': 'tipo-om',
    'Verdadero o Falso': 'tipo-vf',
    'Unir con Líneas': 'tipo-ul',
    'Casos de Uso': 'tipo-cu',
  };

  // Trunca texto largo para mostrar en tabla
  function cortar(txt, n = 70) {
    if (!txt) return '—';
    return txt.length > n ? txt.slice(0, n) + '…' : txt;
  }

  function fechaHoy() {
    return new Date().toLocaleDateString('es-EC', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // Escapa caracteres HTML para inserción segura
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // HTML compartido por PDF y Word — usa tablas (compatible con Word)
  function generarHTML() {
    const fecha = fechaHoy();

    const TIPO_COLOR = {
      'tipo-om': 'background:#dbeafe;color:#1e40af',
      'tipo-vf': 'background:#fee2e2;color:#991b1b',
      'tipo-ul': 'background:#d1fae5;color:#065f46',
      'tipo-cu': 'background:#fef3c7;color:#92400e',
    };

    const preguntasHTML = preguntas.map((p, i) => {
      const tipoCss  = TIPO_CLASE[p.Tipo_Pregunta] || '';
      const tipoEstilo = TIPO_COLOR[tipoCss] || '';
      let contenido = '';

      if (p.Tipo_Pregunta === 'Opción Múltiple' || p.Tipo_Pregunta === 'Casos de Uso') {
        const ops = [
          ['A', p.Opcion_A_o_Concepto1],
          ['B', p.Opcion_B_o_Definicion1],
          ['C', p.Opcion_C_o_Concepto2],
          ['D', p.Opcion_D_o_Definicion2],
        ].filter(([, v]) => v);
        contenido = `
          <table width="100%" style="margin:.4em 0 .4em .5em;font-size:12px;border-collapse:collapse;">
            <tr>
              ${ops.slice(0, 2).map(([l, v]) => `<td width="50%" style="padding:.1em 0"><b>${l})</b> ${esc(v)}</td>`).join('')}
            </tr>
            ${ops.length > 2 ? `<tr>${ops.slice(2).map(([l, v]) => `<td style="padding:.1em 0"><b>${l})</b> ${esc(v)}</td>`).join('')}</tr>` : ''}
          </table>
          ${p.Respuesta_Correcta ? `<p style="font-size:12px;color:#059669;font-weight:bold;margin:.3em 0">&#10003; Respuesta correcta: ${esc(p.Respuesta_Correcta)}</p>` : ''}
        `;
      } else if (p.Tipo_Pregunta === 'Verdadero o Falso') {
        contenido = p.Respuesta_Correcta
          ? `<p style="font-size:12px;color:#059669;font-weight:bold;margin:.3em 0">&#10003; Respuesta: ${esc(p.Respuesta_Correcta)}</p>`
          : '';
      } else if (p.Tipo_Pregunta === 'Unir con Líneas') {
        const pares = [
          [p.Opcion_A_o_Concepto1, p.Opcion_B_o_Definicion1],
          [p.Opcion_C_o_Concepto2, p.Opcion_D_o_Definicion2],
          [p.Concepto3, p.Definicion3],
          [p.Concepto4, p.Definicion4],
        ].filter(([c, d]) => c || d);
        contenido = `
          <table style="width:70%;border-collapse:collapse;margin:.45em 0;font-size:12px;">
            <thead><tr>
              <th style="border:1px solid #e2e8f0;padding:.3em .55em;background:#eff6ff;color:#1e40af;text-align:left">Concepto</th>
              <th style="border:1px solid #e2e8f0;padding:.3em .55em;background:#eff6ff;color:#1e40af;text-align:left">Definición</th>
            </tr></thead>
            <tbody>
              ${pares.map(([c, d]) => `<tr><td style="border:1px solid #e2e8f0;padding:.3em .55em">${esc(c) || '—'}</td><td style="border:1px solid #e2e8f0;padding:.3em .55em">${esc(d) || '—'}</td></tr>`).join('')}
            </tbody>
          </table>
        `;
      }

      const justif = p.Justificacion
        ? `<p style="font-size:11px;color:#64748b;margin:.35em 0;border-top:1px dotted #cbd5e1;padding-top:.3em"><b>Justificación:</b> ${esc(p.Justificacion)}</p>`
        : '';

      return `
        <div style="border:1px solid #e2e8f0;border-radius:6px;padding:.7em .9em;margin-bottom:.8em;page-break-inside:avoid">
          <table width="100%" style="margin-bottom:.35em;border-collapse:collapse"><tr>
            <td style="font-weight:800;font-size:14px;color:#1e40af;width:1.8em;vertical-align:middle">${i + 1}.</td>
            <td style="vertical-align:middle;padding-right:.5em">
              <span style="display:inline-block;padding:.15em .5em;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;${tipoEstilo}">${esc(p.Tipo_Pregunta)}</span>
            </td>
            <td style="font-size:11px;color:#64748b;vertical-align:middle">${esc(p.Materia)} &middot; ${esc(p.Tema)}</td>
          </tr></table>
          <p style="font-size:13px;line-height:1.5;margin:.3em 0">${esc(p.Enunciado)}</p>
          ${contenido}
          ${justif}
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Banco de Preguntas &mdash; ${esc(nombre || email)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 1.5cm 2cm; }
    @page { size: A4; margin: 1.5cm 2cm; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <table width="100%" style="border-bottom:2px solid #1e40af;padding-bottom:.9em;margin-bottom:1.4em;border-collapse:collapse">
    <tr>
      <td style="vertical-align:top">
        <p style="font-size:14px;font-weight:bold;color:#1e40af;margin-bottom:3px">UNIVERSIDAD ESTATAL DEL SUR DE MANABÍ &mdash; Carrera de Educación</p>
        <p style="font-size:12px;color:#64748b">Banco de Preguntas</p>
      </td>
      <td align="right" style="font-size:12px;color:#475569;line-height:1.8;vertical-align:top">
        <p><b>Docente:</b> ${esc(nombre || email)}</p>
        <p><b>Correo:</b> ${esc(email)}</p>
        <p><b>Total:</b> ${preguntas.length} preguntas</p>
        <p><b>Fecha:</b> ${fecha}</p>
      </td>
    </tr>
  </table>
  ${preguntasHTML}
</body>
</html>`;
  }

  // Abre el HTML como blob URL (evita "about:blank" en el pie del diálogo de impresión)
  function verPDF() {
    const blob = new Blob([generarHTML()], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const ventana = window.open(url, '_blank');
    if (!ventana) {
      alert('Activa las ventanas emergentes para generar el PDF.');
      URL.revokeObjectURL(url);
      return;
    }
    ventana.onload = () => {
      setTimeout(() => ventana.print(), 100);
    };
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // Descarga como .doc — Word lo abre y es completamente editable
  function descargarWord() {
    const blob = new Blob(['\uFEFF' + generarHTML()], { type: 'application/msword;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `banco-preguntas-${email || 'docente'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="panel-titulo-fila">
  <div class="panel-titulo">Mis Preguntas</div>
  {#if preguntas.length > 0}
    <div class="btn-grupo-export">
      <button class="btn-imprimir btn-sm" onclick={verPDF} title="Ver e imprimir / guardar como PDF">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
          <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
        </svg>
        PDF
      </button>
      <button class="btn-imprimir btn-sm" onclick={descargarWord} title="Descargar como documento Word editable">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Word
      </button>
    </div>
  {/if}
</div>

<!-- Contador de progreso -->
<div class="progreso">
  {preguntas.length} <span>/ {META} preguntas registradas</span>
</div>

<!-- Barra de progreso visual -->
<div style="height:12px; background:var(--azul-tenue); border-radius:999px; margin-bottom:1.5rem; overflow:hidden; border: 1px solid var(--borde)">
  <div style="
    height:100%;
    width:{Math.min(preguntas.length / META * 100, 100)}%;
    background: {preguntas.length >= META ? 'var(--ok)' : 'var(--azul)'};
    transition: width .6s cubic-bezier(0.34, 1.56, 0.64, 1);
  "></div>
</div>

{#if preguntas.length >= META}
  <div class="alerta alerta-ok" style="margin-bottom:1.5rem">
    <span>✨</span> ¡Banco completo! Has registrado las {META} preguntas requeridas.
  </div>
{/if}

{#if cargando}
  <div class="vacio"><span class="spinner"></span> Cargando preguntas…</div>
{:else if preguntas.length === 0}
  <div class="vacio">
    Aún no has registrado preguntas.<br>
    Usa el formulario de la izquierda para comenzar.
  </div>
{:else}
  <div class="tabla-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Materia</th>
          <th>Tema</th>
          <th>Tipo</th>
          <th>Enunciado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each preguntas as p, i}
          <tr>
            <td>{i + 1}</td>
            <td style="max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis"
                title={p.Materia}>{cortar(p.Materia, 25)}</td>
            <td>{cortar(p.Tema, 30)}</td>
            <td>
              <span class="tipo-badge {TIPO_CLASE[p.Tipo_Pregunta] || ''}">{p.Tipo_Pregunta}</span>
            </td>
            <td>{cortar(p.Enunciado, 60)}</td>
            <td>
              <button class="btn-editar" onclick={() => oneditar(p)}>Editar</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
