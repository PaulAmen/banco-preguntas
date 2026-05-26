<script>
  // ============================================================
  // App.svelte — Raíz de la aplicación
  // ============================================================
  import Login          from './lib/Login.svelte';
  import Formulario     from './lib/Formulario.svelte';
  import ListaPreguntas from './lib/ListaPreguntas.svelte';
  import ReviewPreguntas from './lib/ReviewPreguntas.svelte';
  import { fetchPreguntas, guardarPregunta } from './lib/api.js';
  import { getBloomConfig } from './lib/bloom.config.js';
  import logo           from './assets/logo.png';

  // ── Estado global ───────────────────────────────────────────
  let user              = $state(null);  // { email, name, picture }
  let preguntas         = $state([]);
  let sharedSubjects    = $state([]);
  let preguntaEnEdicion = $state(null);
  let cargando          = $state(false);
  let mensaje           = $state(null);  // { tipo:'ok'|'err', texto:'' }
  let mostrandoRevision = $state(false);
  let esRevisor         = $state(false);
  let materiasRevision  = $state([]);

  // Preguntas que el revisor puede revisar (viene marcado por el GAS)
  let preguntasRevision = $derived(
    esRevisor ? preguntas.filter(p => p.Puede_Revisar) : []
  );

  $effect(() => {
    const syncRuta = () => {
      const quiereRevision = window.location.hash === '#/revision';
      if (quiereRevision && !esRevisor) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
        mostrandoRevision = false;
      } else {
        mostrandoRevision = quiereRevision;
      }
    };

    syncRuta();
    window.addEventListener('hashchange', syncRuta);

    return () => window.removeEventListener('hashchange', syncRuta);
  });

  // ── Login ────────────────────────────────────────────────────
  async function handleLogin(userData) {
    user = userData;
    await cargarPreguntas();
  }

  function handleLogout() {
    google.accounts.id.disableAutoSelect();
    user              = null;
    preguntas         = [];
    sharedSubjects    = [];
    preguntaEnEdicion = null;
    mensaje           = null;
    esRevisor         = false;
    materiasRevision  = [];
  }

  // ── Caché sessionStorage ─────────────────────────────────────
  const cacheKey = () => `bp_${user.email}`;

  function leerCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey()) || 'null');
      if (Array.isArray(cached)) return { preguntas: cached, sharedSubjects: [] };
      return cached;
    }
    catch { return null; }
  }

  function escribirCache(data) {
    try { sessionStorage.setItem(cacheKey(), JSON.stringify(data)); }
    catch { /* cuota excedida: ignorar */ }
  }

  // ── Preguntas ────────────────────────────────────────────────
  async function cargarPreguntas() {
    // 1. Mostrar caché inmediatamente si existe
    const cached = leerCache();
    if (cached) {
      preguntas = cached.preguntas || [];
      sharedSubjects = cached.sharedSubjects || [];
      esRevisor = cached.esRevisor || false;
      materiasRevision = cached.materiasRevision || [];
    } else {
      cargando = true;  // spinner solo cuando no hay caché
    }

    // 2. Fetch en segundo plano
    try {
      const data = await fetchPreguntas(user.email);
      preguntas = data.preguntas;
      sharedSubjects = data.sharedSubjects;
      esRevisor = data.esRevisor || false;
      materiasRevision = data.materiasRevision || [];
      escribirCache(data);
    } catch (e) {
      if (!cached) mostrarMensaje('err', 'No se pudieron cargar las preguntas: ' + e.message);
    } finally {
      cargando = false;
    }
  }

  async function handleGuardar(pregunta) {
    cargando = true;
    mensaje  = null;
    try {
      const esRevision =
        pregunta.Puede_Revisar &&
        String(pregunta.Email_Docente || '').trim().toLowerCase() !== String(user.email || '').trim().toLowerCase();

      if (!esRevision) {
        const bloomConfig = getBloomConfig(pregunta.Materia);
        const bloomMeta = bloomConfig.requerimientos;

        // Contar solo preguntas del mismo docente, misma materia, y nivel válido
        const actual = preguntas.filter(p =>
          p.ID_Pregunta !== pregunta.ID_Pregunta &&
          p.Nivel_Bloom === pregunta.Nivel_Bloom &&
          String(p.Email_Docente || '').toLowerCase() === String(pregunta.Email_Docente || '').toLowerCase() &&
          String(p.Materia || '').trim().toLowerCase() === String(pregunta.Materia || '').trim().toLowerCase()
        ).length;

        if (!bloomMeta[pregunta.Nivel_Bloom]) {
          throw new Error('Seleccione un nivel Bloom válido para esta materia.');
        }
        if (actual + 1 > bloomMeta[pregunta.Nivel_Bloom].cantidad) {
          throw new Error(`Ya alcanzó el máximo de ${bloomMeta[pregunta.Nivel_Bloom].cantidad} preguntas para ${pregunta.Nivel_Bloom}.`);
        }
      }

      await guardarPregunta({
        ...pregunta,
        Solicitante_Email: user.email,
      });

      // Actualizar array local sin re-fetch a GAS
      const idx = preguntas.findIndex(p => p.ID_Pregunta === pregunta.ID_Pregunta);
      if (idx >= 0) {
        preguntas[idx] = pregunta;
        mostrarMensaje('ok', esRevision ? 'Revisión registrada.' : 'Pregunta actualizada.');
      } else {
        preguntas.push(pregunta);
        mostrarMensaje('ok', 'Pregunta guardada.');
      }
      escribirCache({ preguntas, sharedSubjects, esRevisor, materiasRevision });

      preguntaEnEdicion = null;
      return true;
    } catch (e) {
      mostrarMensaje('err', 'Error al guardar: ' + e.message);
      return false;
    } finally {
      cargando = false;
    }
  }

  function handleEditar(p) {
    preguntaEnEdicion = { ...p };
    document.querySelector('.col-izq')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleCancelar() {
    preguntaEnEdicion = null;
  }

  function abrirRevision() {
    window.location.hash = '#/revision';
    mostrandoRevision = true;
  }

  function cerrarRevision() {
    if (window.location.hash === '#/revision') {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    mostrandoRevision = false;
  }

  function mostrarMensaje(tipo, texto) {
    mensaje = { tipo, texto };
    if (tipo === 'ok') setTimeout(() => { mensaje = null; }, 4000);
  }
</script>

{#if !user}
  <Login onlogin={handleLogin} />
{:else}
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <h1>
        <img src={logo} alt="logo" class="logo-header" />
        <span class="full-title">Carrera Educación &bull; Banco de Preguntas</span>
        <span class="short-title">Carrera Educación</span>
      </h1>
      <div style="display:flex; align-items:center; gap:.75rem">
        {#if esRevisor}
          <button class="btn-secondary btn-sm" onclick={abrirRevision} disabled={preguntasRevision.length === 0}>
            Revisión
          </button>
        {/if}
        <span class="usuario">{user.name || user.email}</span>
        {#if user.picture}
          <img src={user.picture} alt="avatar"
               style="width:32px;height:32px;border-radius:50%;border:1px solid var(--borde)" />
        {/if}
        <button class="btn-secondary btn-sm" onclick={handleLogout}>Salir</button>
      </div>
    </header>

    <main class="app-main">
      <!-- Alerta global flotante -->
      {#if mensaje}
        <div style="max-width: 1400px; margin: 1rem auto 0; padding: 0 1.5rem;">
          <div class="alerta alerta-{mensaje.tipo}">
            <span>{mensaje.tipo === 'ok' ? '✅' : '❌'}</span>
            {mensaje.texto}
          </div>
        </div>
      {/if}

      <!-- Dos columnas -->
      <div class="app-grid">
        <section class="panel col-izq">
          <Formulario
            email={user.email}
            preguntaEnEdicion={preguntaEnEdicion}
            {cargando}
            onguardar={handleGuardar}
            oncancelar={handleCancelar}
          />
        </section>

        <section class="panel col-der">
          <ListaPreguntas
            {preguntas}
            {cargando}
            oneditar={handleEditar}
            email={user.email}
            nombre={user.name}
            {sharedSubjects}
          />
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p>by: <a href="mailto:paul.amen@unesum.edu.ec">paul.amen@unesum.edu.ec</a></p>
    </footer>

    {#if mostrandoRevision && esRevisor}
      <ReviewPreguntas
        preguntas={preguntasRevision}
        onguardar={handleGuardar}
        oncerrar={cerrarRevision}
      />
    {/if}
  </div>
{/if}
