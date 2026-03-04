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

  // Carga el membrete como base64 (se cachea tras la primera llamada)
  let membreteB64Cache = null;
  async function getMembreteBase64() {
    if (membreteB64Cache) return membreteB64Cache;
    const url = `${import.meta.env.BASE_URL}membrete.png`;
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => { membreteB64Cache = reader.result; resolve(reader.result); };
      reader.readAsDataURL(blob);
    });
  }

  // HTML compartido por PDF y Word — estilo APA 7ª edición
  function generarHTML(membreteB64 = '', esWord = false) {
    const fecha = fechaHoy();
    const lh = esWord ? '1.5' : '2'; // Interlineado más compacto para Word
    const border = esWord ? 'none' : '1.5pt solid #000'; // Sin bordes entre preguntas en Word

    const preguntasHTML = preguntas.map((p, i) => {
      let contenido = '';

      if (p.Tipo_Pregunta === 'Opción Múltiple' || p.Tipo_Pregunta === 'Casos de Uso') {
        const ops = [
          ['a', p.Opcion_A_o_Concepto1],
          ['b', p.Opcion_B_o_Definicion1],
          ['c', p.Opcion_C_o_Concepto2],
          ['d', p.Opcion_D_o_Definicion2],
        ].filter(([, v]) => v);
        contenido = `
          <div style="margin:.4em 0 .4em 1.5em;line-height:${lh};">
            ${ops.map(([l, v]) => `<p style="margin:0;font-size:12pt"><em>${l})</em> ${esc(v)}</p>`).join('')}
          </div>
          ${p.Respuesta_Correcta ? `<p style="font-size:12pt;margin:.2em 0"><em>Respuesta correcta:</em> <strong>${esc(p.Respuesta_Correcta)}</strong></p>` : ''}
        `;
      } else if (p.Tipo_Pregunta === 'Verdadero o Falso') {
        contenido = p.Respuesta_Correcta
          ? `<p style="font-size:12pt;margin:.2em 0"><em>Respuesta:</em> <strong>${esc(p.Respuesta_Correcta)}</strong></p>`
          : '';
      } else if (p.Tipo_Pregunta === 'Unir con Líneas') {
        const pares = [
          [p.Opcion_A_o_Concepto1, p.Opcion_B_o_Definicion1],
          [p.Opcion_C_o_Concepto2, p.Opcion_D_o_Definicion2],
          [p.Concepto3, p.Definicion3],
          [p.Concepto4, p.Definicion4],
        ].filter(([c, d]) => c || d);
        contenido = `
          <table style="width:100%;border-collapse:collapse;margin:.5em 0;border-top:${border};border-bottom:${border};">
            <thead>
              <tr style="border-bottom:${esWord ? '1pt solid #000' : border};">
                <th style="padding:.3em .6em;text-align:left;font-size:12pt;font-weight:bold;">Concepto</th>
                <th style="padding:.3em .6em;text-align:left;font-size:12pt;font-weight:bold;">Definición</th>
              </tr>
            </thead>
            <tbody>
              ${pares.map(([c, d]) => `<tr><td style="padding:.3em .6em;font-size:12pt;">${esc(c) || '—'}</td><td style="padding:.3em .6em;font-size:12pt;">${esc(d) || '—'}</td></tr>`).join('')}
            </tbody>
          </table>
        `;
      }

      const justif = p.Justificacion
        ? `<p style="font-size:12pt;margin:.4em 0 0 0;"><em>Nota.</em> ${esc(p.Justificacion)}</p>`
        : '';

      const esUltima = i === preguntas.length - 1;
      const mb = esUltima ? '0' : '-1pt';

      return `
        <div style="margin-bottom:0;page-break-inside:avoid;border-top:${border};border-bottom:${border};padding:.8em 0;margin-bottom:${mb};">
          <p style="font-size:10pt;color:#444;margin:0 0 .2em 0;line-height:1.2;">
            <strong>${esc(p.Tipo_Pregunta)}</strong> &mdash; ${esc(p.Materia)} &middot; ${esc(p.Tema)}
          </p>
          <p style="font-size:12pt;line-height:${lh};margin:.1em 0;"><strong>${i + 1}.</strong> ${esc(p.Enunciado)}</p>
          ${contenido}
          ${justif}
        </div>
      `;
    }).join('');

    if (esWord) {
      return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <table width="100%" style="border-top:1.5pt solid #000;border-bottom:1.5pt solid #000;padding:.5em 0;margin-bottom:1.5em;">
    <tr>
      <td style="font-size:14pt;font-weight:bold;">Banco de Preguntas</td>
      <td align="right" style="font-size:11pt;">
        <strong>Docente:</strong> ${esc(nombre || email)}<br>
        <strong>Correo:</strong> ${esc(email)}<br>
        <strong>Total:</strong> ${preguntas.length} preguntas &nbsp; <strong>Fecha:</strong> ${fecha}
      </td>
    </tr>
  </table>
  ${preguntasHTML}
</body>
</html>`.trim();
    }

    const imgMembrete = membreteB64
      ? `<img src="${membreteB64}" alt="" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;">`
      : '';

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Banco de Preguntas &mdash; ${esc(nombre || email)}</title><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      line-height: 2;
      padding: 0 2.54cm 0 2.54cm; /* Eliminado padding inferior */
    }
    table { border-collapse: collapse; border-spacing: 0; }
    thead { display: table-header-group; }
    img { display: block; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style></head><body>${imgMembrete}<table width="100%"><thead><tr><td style="height: 5.5cm;"></td></tr></thead><tbody><tr><td><div style="margin-top: -0.3cm;"><table width="100%" style="border-top:1.5pt solid #000;border-bottom:1.5pt solid #000;padding:.5em 0;margin-bottom:1.5em;line-height:1.5;"><tr><td style="font-size:14pt;font-weight:bold;">Banco de Preguntas</td><td align="right" style="font-size:11pt;"><strong>Docente:</strong> ${esc(nombre || email)}<br><strong>Correo:</strong> ${esc(email)}<br><strong>Total:</strong> ${preguntas.length} preguntas &nbsp; <strong>Fecha:</strong> ${fecha}</td></tr></table>${preguntasHTML}</div></td></tr></tbody></table></body></html>`.trim();
  }

  // Abre el HTML como blob URL (evita "about:blank" en el pie del diálogo de impresión)
  async function verPDF() {
    const b64 = await getMembreteBase64();
    const blob = new Blob([generarHTML(b64, false)], { type: 'text/html;charset=utf-8' });
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
  async function descargarWord() {
    const b64 = await getMembreteBase64();
    const blob = new Blob(['\uFEFF' + generarHTML(b64, true)], { type: 'application/msword;charset=utf-8' });
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
