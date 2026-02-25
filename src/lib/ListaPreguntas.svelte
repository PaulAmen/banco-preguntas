<script>
  // ============================================================
  // ListaPreguntas.svelte — Columna derecha: listado y progreso
  // ============================================================

  /** @type {{ preguntas: any[], cargando: boolean, oneditar: (p:any)=>void }} */
  let { preguntas, cargando, oneditar } = $props();

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
</script>

<div class="panel-titulo">Mis Preguntas</div>

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
