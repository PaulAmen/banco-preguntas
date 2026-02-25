<script>
  // = :::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Login.svelte — Pantalla de inicio de sesión con Google GIS
  // = :::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  import logo from '../assets/logo.png';

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
    <div class="logo-container">
      <img src={logo} alt="Logo Carrera Educación" class="logo" />
    </div>
    <h2>Banco de Preguntas</h2>
    <p>Carrera Educación &bull; UNESUM</p>

    {#if error}
      <div class="alerta alerta-err" style="margin-bottom:1rem">
        <span>⚠️</span> {error}
      </div>
    {/if}

    <!-- El SDK de GIS renderiza el botón aquí -->
    <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
      <div bind:this={contenedor}></div>
    </div>

    <p style="font-size:13px; color:var(--texto-sub)">
      Acceso exclusivo con cuenta institucional<br/>
      <strong>@{DOMINIO}</strong>
    </p>
  </div>
  <div style="text-align:center; color:rgba(255,255,255,0.8); font-size:14px; display: flex; flex-direction: column; gap: 0.5rem;">
    <p>UNESUM &bull; Carrera Educación &bull; Jipijapa, Manabí</p>
    <p style="font-size: 13px; opacity: 0.9;">by: <a href="mailto:paul.amen@unesum.edu.ec" style="color:white; font-weight: 600;">paul.amen@unesum.edu.ec</a></p>
  </div>
</div>
