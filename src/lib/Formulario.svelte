<script>
  // ============================================================
  // Formulario.svelte — Formulario dinámico de pregunta
  // ============================================================

  import { untrack } from 'svelte';

  /** @type {{
   *   email: string,
   *   preguntaEnEdicion: any | null,
   *   cargando: boolean,
   *   onguardar: (p: any) => void,
   *   oncancelar: () => void
   * }} */
  let { email, preguntaEnEdicion, cargando, onguardar, oncancelar } = $props();

  // ── Catálogos ──────────────────────────────────────────────
  const MATERIAS = [
    "Filosofía de la Educación", "Pedagogía", "Ética Pedagógica",
    "Proyectos Educativos", "Lenguaje y Comunicación", "Psicología Educativa",
    "Desarrollo Humano", "Metodología de la Investigación Educativa",
    "Realidad Socioeconómica Cultural y Ecológica del Ecuador", "Inglés I y II",
    "Neurociencia en el Aprendizaje", "Didáctica General", "Diagnóstico Pedagógico",
    "Informática Aplicada a la Educación", "Inglés III y IV", "Diseño Curricular",
    "Metodología de Enseñanza de la Matemática",
    "Metodología de la Enseñanza de la Química", "Creatividad en la Educación",
    "Educación Inclusiva", "Didáctica de la Lengua y Literatura",
    "Didáctica de las Ciencias Sociales",
    "Saberes y Lenguas Ancestrales del Ecuador",
    "Elaboración y Aplicación de Medios de Enseñanza",
    "Educación para la identidad, sexualidad y convivencia",
    "Relación Institución y Comunidad", "Educación Ambiental",
    "Didáctica de las Ciencias Naturales",
    "Didáctica de la Educación Cultural y Artística", "Evaluación Educativa",
    "Didáctica de la Educación Física", "Didáctica de las Ciencias Exactas",
    "Emprendimiento e Innovación", "Gestión Educativa", "Titulación I",
    "Redacción Científica y Normas APA",
    "Técnicas de Estudio e Investigación Científica Educativa",
    "Estadística Aplicada a la Investigación Educativa", "Titulación II",
    "Taller de Escritura del Plan de Investigación",
  ];

  const TIPOS = ['Opción Múltiple', 'Verdadero o Falso', 'Unir con Líneas', 'Casos de Uso'];

  // ── Estado del formulario ───────────────────────────────────
  function vacío() {
    return {
      ID_Pregunta: '',
      Fecha: '',
      Email_Docente: email,
      Materia: '',
      Tema: '',
      Tipo_Pregunta: '',
      Enunciado: '',
      Opcion_A_o_Concepto1: '',
      Opcion_B_o_Definicion1: '',
      Opcion_C_o_Concepto2: '',
      Opcion_D_o_Definicion2: '',
      Concepto3: '',
      Definicion3: '',
      Concepto4: '',
      Definicion4: '',
      Respuesta_Correcta: '',
      Justificacion: '',
    };
  }

  let form = $state(vacío());
  let modoEdicion = $derived(!!preguntaEnEdicion);

  // Mutar el proxy existente (nunca reemplazarlo) para que bind:value
  // siempre apunte al mismo objeto y el tracking del template no se rompa.
  $effect(() => {
    if (preguntaEnEdicion) {
      Object.assign(form, preguntaEnEdicion);
    } else {
      const mat = untrack(() => form.Materia);
      Object.assign(form, vacío());
      form.Materia = mat;
    }
  });

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.ID_Pregunta) {
      payload.ID_Pregunta = crypto.randomUUID();
    }
    payload.Fecha         = new Date().toISOString().split('T')[0];
    payload.Email_Docente = email;

    const exito = await onguardar(payload);

    // Limpiar formulario tras guardado exitoso (conservar Materia).
    // El caso de edición también resetea vía $effect cuando
    // preguntaEnEdicion → null, pero para creación el $effect no dispara.
    if (exito) {
      const mat = form.Materia;
      Object.assign(form, vacío());
      form.Materia = mat;
    }
  }
</script>

<div class="panel-titulo">
  {modoEdicion ? `Editando pregunta` : 'Nueva Pregunta'}
</div>

{#if modoEdicion}
  <div class="alerta alerta-ok" style="margin-bottom:.75rem; font-size:12px">
    Modo edición — ID: <code style="font-size:11px">{form.ID_Pregunta?.slice(0,8)}…</code>
  </div>
{/if}

<form onsubmit={handleSubmit}>

  <!-- Materia -->
  <div class="form-group">
    <label for="materia">Materia</label>
    <select id="materia" bind:value={form.Materia} required disabled={cargando}>
      <option value="">— Seleccione una materia —</option>
      {#each MATERIAS as m}
        <option value={m}>{m}</option>
      {/each}
    </select>
  </div>

  <!-- Tema -->
  <div class="form-group">
    <label for="tema">Tema</label>
    <input id="tema" type="text" bind:value={form.Tema}
           placeholder="Ej. Modelos pedagógicos contemporáneos"
           required disabled={cargando} />
  </div>

  <!-- Tipo de pregunta -->
  <div class="form-group">
    <label for="tipo">Tipo de Pregunta</label>
    <select id="tipo" bind:value={form.Tipo_Pregunta} required disabled={cargando}>
      <option value="">— Seleccione un tipo —</option>
      {#each TIPOS as t}
        <option value={t}>{t}</option>
      {/each}
    </select>
  </div>

  <!-- ── Campos dinámicos según tipo ── -->

  {#if form.Tipo_Pregunta}

    <!-- Enunciado (siempre presente) -->
    <div class="form-group">
      <label for="enunciado">
        {#if form.Tipo_Pregunta === 'Casos de Uso'}Caso / Situación{:else}Enunciado de la pregunta{/if}
      </label>
      <textarea id="enunciado" bind:value={form.Enunciado}
                rows={form.Tipo_Pregunta === 'Casos de Uso' ? 5 : 3}
                placeholder={form.Tipo_Pregunta === 'Casos de Uso'
                  ? 'Describe la situación o caso práctico…'
                  : 'Escribe la pregunta completa…'}
                required disabled={cargando}></textarea>
    </div>

    <!-- ── Opción Múltiple / Casos de Uso ── -->
    {#if form.Tipo_Pregunta === 'Opción Múltiple' || form.Tipo_Pregunta === 'Casos de Uso'}
      <div class="seccion-label">Opciones de respuesta</div>
      {#each [
        ['Opcion_A_o_Concepto1', 'A'],
        ['Opcion_B_o_Definicion1', 'B'],
        ['Opcion_C_o_Concepto2', 'C'],
        ['Opcion_D_o_Definicion2', 'D'],
      ] as [campo, letra]}
        <div class="form-group">
          <label for="op-{letra}">Opción {letra}</label>
          <input id="op-{letra}" type="text" bind:value={form[campo]}
                 placeholder="Opción {letra}…" required disabled={cargando} />
        </div>
      {/each}
      <div class="form-group">
        <label for="resp-om">Respuesta Correcta</label>
        <select id="resp-om" bind:value={form.Respuesta_Correcta} required disabled={cargando}>
          <option value="">— Seleccione —</option>
          {#each ['A', 'B', 'C', 'D'] as op}
            <option value={op}>Opción {op}</option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- ── Verdadero o Falso ── -->
    {#if form.Tipo_Pregunta === 'Verdadero o Falso'}
      <div class="form-group">
        <label for="resp-vf">Respuesta Correcta</label>
        <select id="resp-vf" bind:value={form.Respuesta_Correcta} required disabled={cargando}>
          <option value="">— Seleccione —</option>
          <option value="Verdadero">Verdadero</option>
          <option value="Falso">Falso</option>
        </select>
      </div>
    {/if}

    <!-- ── Unir con Líneas ── -->
    {#if form.Tipo_Pregunta === 'Unir con Líneas'}
      <div class="seccion-label">Pares Concepto — Definición</div>
      {#each [
        ['Opcion_A_o_Concepto1',  'Opcion_B_o_Definicion1',  1],
        ['Opcion_C_o_Concepto2',  'Opcion_D_o_Definicion2',  2],
        ['Concepto3',             'Definicion3',             3],
        ['Concepto4',             'Definicion4',             4],
      ] as [cc, cd, n]}
        <div class="par-campos" style="margin-bottom:.5rem">
          <div class="form-group" style="margin:0">
            <label for="c{n}">Concepto {n}</label>
            <input id="c{n}" type="text" bind:value={form[cc]}
                   placeholder="Concepto {n}…" required disabled={cargando} />
          </div>
          <div class="form-group" style="margin:0">
            <label for="d{n}">Definición {n}</label>
            <input id="d{n}" type="text" bind:value={form[cd]}
                   placeholder="Definición {n}…" required disabled={cargando} />
          </div>
        </div>
      {/each}
    {/if}

    <!-- Justificación (siempre presente) -->
    <div class="form-group">
      <label for="justif">Justificación</label>
      <textarea id="justif" bind:value={form.Justificacion}
                rows="3"
                placeholder="Explica por qué la respuesta es correcta…"
                required disabled={cargando}></textarea>
    </div>

  {/if}

  <!-- Acciones -->
  <div class="acciones">
    <button type="submit" class="btn-primary" disabled={cargando || !form.Tipo_Pregunta}>
      {#if cargando}<span class="spinner"></span>{/if}
      {modoEdicion ? 'Actualizar' : 'Guardar Nueva'}
    </button>
    {#if modoEdicion}
      <button type="button" class="btn-secondary" onclick={oncancelar} disabled={cargando}>
        Cancelar
      </button>
    {/if}
  </div>

</form>
