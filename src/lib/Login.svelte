<script>
  // ============================================================
  // Login.svelte — Pantalla de inicio de sesión con Google GIS
  // ============================================================

  /** @type {{ onlogin: (u: {email:string, name:string, picture:string}) => void }} */
  let { onlogin } = $props();

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const DOMINIO   = 'unesum.edu.ec';

  let error = $state('');
  let contenedor;

  // Decodifica el JWT de Google sin librería externa.
  function decodeJwt(token) {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(
      atob(b64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    ));
  }

  function handleCredential(response) {
    error = '';
    try {
      const payload = decodeJwt(response.credential);

      // Validar dominio
      if (!payload.email?.endsWith('@' + DOMINIO)) {
        error = `Acceso restringido al dominio @${DOMINIO}`;
        google.accounts.id.disableAutoSelect();
        return;
      }

      onlogin({
        email:   payload.email,
        name:    payload.name,
        picture: payload.picture,
      });
    } catch (e) {
      error = 'Error al procesar credenciales. Intente de nuevo.';
    }
  }

  // Inicializar GIS una vez que el DOM esté listo y el script cargado.
  $effect(() => {
    const init = () => {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        hd:        DOMINIO,          // filtra selector al dominio
        callback:  handleCredential,
        auto_select: false,
      });
      google.accounts.id.renderButton(contenedor, {
        type:  'standard',
        theme: 'outline',
        size:  'large',
        text:  'signin_with',
        locale: 'es',
        width: '280',
      });
    };

    // El script de GIS puede cargar después del mount
    if (typeof google !== 'undefined') {
      init();
    } else {
      const script = document.querySelector('script[src*="gsi/client"]');
      script?.addEventListener('load', init);
    }
  });
</script>

<div class="login-page">
  <div class="login-card">
    <div class="escudo">🎓</div>
    <h2>Banco de Preguntas</h2>
    <p>Universidad Estatal del Sur de Manabí</p>

    {#if error}
      <div class="alerta alerta-err" style="margin-bottom:1rem">{error}</div>
    {/if}

    <!-- El SDK de GIS renderiza el botón aquí -->
    <div bind:this={contenedor}></div>

    <p style="margin-top:1rem; font-size:12px; color:#5f6368">
      Solo cuentas <strong>@{DOMINIO}</strong>
    </p>
  </div>
  <p class="login-aviso">UNESUM – Carrera de Educación Básica</p>
</div>
