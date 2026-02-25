<script>
  // ============================================================
  // App.svelte — Raíz de la aplicación
  // ============================================================
  import Login          from './lib/Login.svelte';
  import Formulario     from './lib/Formulario.svelte';
  import ListaPreguntas from './lib/ListaPreguntas.svelte';
  import { fetchPreguntas, guardarPregunta } from './lib/api.js';
  import logo           from './assets/logo.png';

  // ── Estado global ───────────────────────────────────────────
  let user              = $state(null);  // { email, name, picture }
  let preguntas         = $state([]);
  let preguntaEnEdicion = $state(null);
  let cargando          = $state(false);
  let mensaje           = $state(null);  // { tipo:'ok'|'err', texto:'' }

  // ── Login ────────────────────────────────────────────────────
  async function handleLogin(userData) {
    user = userData;
    await cargarPreguntas();
  }

  function handleLogout() {
    google.accounts.id.disableAutoSelect();
    user              = null;
    preguntas         = [];
    preguntaEnEdicion = null;
    mensaje           = null;
  }

  // ── Caché sessionStorage ─────────────────────────────────────
  const cacheKey = () => `bp_${user.email}`;

  function leerCache() {
    try { return JSON.parse(sessionStorage.getItem(cacheKey()) || 'null'); }
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
      preguntas = cached;
    } else {
      cargando = true;  // spinner solo cuando no hay caché
    }

    // 2. Fetch en segundo plano
    try {
      const data = await fetchPreguntas(user.email);
      preguntas = data;
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
      await guardarPregunta(pregunta);

      // Actualizar array local sin re-fetch a GAS
      const idx = preguntas.findIndex(p => p.ID_Pregunta === pregunta.ID_Pregunta);
      if (idx >= 0) {
        preguntas[idx] = pregunta;
        mostrarMensaje('ok', 'Pregunta actualizada.');
      } else {
        preguntas.push(pregunta);
        mostrarMensaje('ok', 'Pregunta guardada.');
      }
      escribirCache(preguntas);

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
          />
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p>by: <a href="mailto:paul.amen@unesum.edu.ec">paul.amen@unesum.edu.ec</a></p>
    </footer>
  </div>
{/if}
