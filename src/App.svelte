<script>
  // ============================================================
  // App.svelte — Raíz de la aplicación
  // ============================================================
  import Login          from './lib/Login.svelte';
  import Formulario     from './lib/Formulario.svelte';
  import ListaPreguntas from './lib/ListaPreguntas.svelte';
  import { fetchPreguntas, guardarPregunta } from './lib/api.js';

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
  <!-- Header -->
  <header class="app-header">
    <h1>Banco de Preguntas · UNESUM</h1>
    <div style="display:flex; align-items:center; gap:.75rem">
      {#if user.picture}
        <img src={user.picture} alt="avatar"
             style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.4)" />
      {/if}
      <span class="usuario">{user.email}</span>
      <button class="btn-secondary btn-sm" onclick={handleLogout}>Salir</button>
    </div>
  </header>

  <!-- Alerta global flotante -->
  {#if mensaje}
    <div class="alerta alerta-{mensaje.tipo}" style="margin:.5rem 1rem 0">
      {mensaje.texto}
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
{/if}
