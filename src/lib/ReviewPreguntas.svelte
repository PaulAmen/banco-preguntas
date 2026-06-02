<script>
   // ============================================================
   // ReviewPreguntas.svelte — Modo revisión uno a uno
   // ============================================================

   /** @type {{ preguntas: any[], storageKey?: string, onguardar: (p:any)=>Promise<boolean>, oncerrar: ()=>void }} */
   let { preguntas, storageKey = 'bp_revision_index', onguardar, oncerrar } = $props()

   let index = $state(0)
   let guardando = $state(false)
   let comentario = $state('')
   let indiceRestaurado = $state(false)

   const total = $derived(preguntas.length)
   const p = $derived(preguntas[index])

   /** @param {'' | 'e' | 'c'} valor */
   async function marcarRevision(valor) {
      if (!p || guardando) return
      guardando = true
      try {
         const preguntaActualizada = {
            ...p,
            Mala: valor,
            Comentario_Revision: valor ? comentario.trim() : '',
         }
         const ok = await onguardar(preguntaActualizada)
         if (ok) siguiente()
      } finally {
         guardando = false
      }
   }

   const marcarBien = () => marcarRevision('')
   const marcarEstructura = () => marcarRevision('e')
   const marcarContenido = () => marcarRevision('c')

   function siguiente() {
      if (index < total - 1) {
         index++
      } else {
         alert('Has llegado al final de las preguntas.')
      }
   }

   function anterior() {
      if (index > 0) index--
   }

   function restaurarIndice() {
      if (indiceRestaurado || total === 0) return
      indiceRestaurado = true

      try {
         const guardado = Number(localStorage.getItem(storageKey))
         if (Number.isInteger(guardado)) {
            index = Math.min(Math.max(guardado, 0), total - 1)
         }
      } catch {
         /* localStorage no disponible: iniciar desde la primera pregunta */
      }
   }

   $effect(() => {
      restaurarIndice()

      if (total > 0 && index > total - 1) {
         index = total - 1
      }
   })

   $effect(() => {
      if (!indiceRestaurado || total === 0) return

      try {
         localStorage.setItem(storageKey, String(index))
      } catch {
         /* localStorage no disponible: solo mantener estado en memoria */
      }
   })

   $effect(() => {
      comentario = p?.Comentario_Revision || ''
   })

   $effect(() => {
      /** @param {KeyboardEvent} event */
      const handleKeydown = (event) => {
         if (!p) return
         if (
            event.target instanceof Element &&
            event.target.closest('input, textarea, select')
         )
            return
         if (event.key === '1') marcarBien()
         if (event.key === '2') marcarEstructura()
         if (event.key === '3') marcarContenido()
      }

      window.addEventListener('keydown', handleKeydown)
      return () => window.removeEventListener('keydown', handleKeydown)
   })

   /** @param {string} valor */
   function etiquetaMala(valor) {
      if (valor === 'e') return 'Estructura'
      if (valor === 'c') return 'Contenido'
      if (valor === 'm') return 'Mala'
      return ''
   }
</script>

<div class="review-overlay">
   <div class="review-card">
      <header class="review-header">
         <h2>Revisión de Preguntas ({index + 1} / {total})</h2>
         <button class="btn-close" onclick={oncerrar} title="Cerrar"
            >&times;</button
         >
      </header>

      {#if p}
         <div class="review-body">
            <div class="meta-info">
               <span><strong>Docente:</strong> {p.Email_Docente}</span>
               <span><strong>Materia:</strong> {p.Materia}</span>
               <span><strong>Tema:</strong> {p.Tema}</span>
               <span><strong>Tipo:</strong> {p.Tipo_Pregunta}</span>
               {#if etiquetaMala(p.Mala)}
                  <span class="badge-mala">{etiquetaMala(p.Mala)}</span>
               {/if}
            </div>

            <div class="question-content">
               <p class="enunciado">
                  <strong>{index + 1}. {p.Enunciado}</strong>
               </p>

               {#if p.Tipo_Pregunta === 'Opción Múltiple' || p.Tipo_Pregunta === 'Estudio de Caso'}
                  <ul class="opciones">
                     {#if p.Opcion_A_o_Concepto1}<li>
                           <em>a)</em>
                           {p.Opcion_A_o_Concepto1}
                        </li>{/if}
                     {#if p.Opcion_B_o_Definicion1}<li>
                           <em>b)</em>
                           {p.Opcion_B_o_Definicion1}
                        </li>{/if}
                     {#if p.Opcion_C_o_Concepto2}<li>
                           <em>c)</em>
                           {p.Opcion_C_o_Concepto2}
                        </li>{/if}
                     {#if p.Opcion_D_o_Definicion2}<li>
                           <em>d)</em>
                           {p.Opcion_D_o_Definicion2}
                        </li>{/if}
                  </ul>
                  <p>
                     <strong>Respuesta Correcta:</strong>
                     {p.Respuesta_Correcta}
                  </p>
               {:else if p.Tipo_Pregunta === 'Verdadero o Falso'}
                  <p><strong>Respuesta:</strong> {p.Respuesta_Correcta}</p>
               {:else if p.Tipo_Pregunta === 'Unir con Líneas'}
                  <table class="tabla-unir">
                     <thead><tr><th>Concepto</th><th>Definición</th></tr></thead
                     >
                     <tbody>
                        {#if p.Opcion_A_o_Concepto1 || p.Opcion_B_o_Definicion1}<tr
                              ><td>{p.Opcion_A_o_Concepto1}</td><td
                                 >{p.Opcion_B_o_Definicion1}</td
                              ></tr
                           >{/if}
                        {#if p.Opcion_C_o_Concepto2 || p.Opcion_D_o_Definicion2}<tr
                              ><td>{p.Opcion_C_o_Concepto2}</td><td
                                 >{p.Opcion_D_o_Definicion2}</td
                              ></tr
                           >{/if}
                        {#if p.Concepto3 || p.Definicion3}<tr
                              ><td>{p.Concepto3}</td><td>{p.Definicion3}</td
                              ></tr
                           >{/if}
                        {#if p.Concepto4 || p.Definicion4}<tr
                              ><td>{p.Concepto4}</td><td>{p.Definicion4}</td
                              ></tr
                           >{/if}
                     </tbody>
                  </table>
               {/if}

               {#if p.Justificacion}
                  <div class="justificacion">
                     <strong>Justificación:</strong>
                     {p.Justificacion}
                  </div>
               {/if}

               <div class="comentario-revision">
                  <label for="comentario-revision"
                     >Observación del revisor <span>opcional</span></label
                  >
                  <textarea
                     id="comentario-revision"
                     bind:value={comentario}
                     rows="3"
                     placeholder="Escriba una observación si desea dejar contexto para esta revisión."
                     disabled={guardando}
                  ></textarea>
               </div>
            </div>
         </div>

         <footer class="review-footer">
            <div class="nav-btns">
               <button
                  class="btn-secondary btn-sm"
                  onclick={anterior}
                  disabled={index === 0}
                  title="Pregunta anterior"
               >
                  ⬅️ Anterior
               </button>
               <button
                  class="btn-secondary btn-sm"
                  onclick={siguiente}
                  disabled={index >= total - 1}
                  title="Pregunta siguiente"
               >
                  Siguiente ➡️
               </button>
            </div>
            <div class="action-btns">
               <button
                  class="btn-ok"
                  onclick={marcarBien}
                  disabled={guardando}
                  title="Pregunta correcta"
               >
                  1 Bien
               </button>
               <button
                  class="btn-danger"
                  onclick={marcarEstructura}
                  disabled={guardando}
                  title="Mal planteada en estructura"
               >
                  2 Estructura
               </button>
               <button
                  class="btn-danger"
                  onclick={marcarContenido}
                  disabled={guardando}
                  title="Mal planteada en contenido"
               >
                  3 Contenido
               </button>
            </div>
         </footer>
      {:else}
         <div class="vacio">No hay preguntas para revisar.</div>
      {/if}
   </div>
</div>

<style>
   .review-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
   }
   .review-card {
      background: white;
      width: 100%;
      max-width: 1100px;
      height: 95vh;
      max-height: 1000px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--sombra-lg);
      overflow: hidden;
      border: 1px solid var(--borde);
   }
   .review-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--borde);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--azul);
      color: white;
   }
   .review-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
   }
   .btn-close {
      background: none;
      border: none;
      color: white;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
   }
   .btn-close:hover {
      background: rgba(255, 255, 255, 0.2);
   }

   .review-body {
      padding: 1.5rem 2rem;
      overflow-y: auto;
      flex: 1;
   }
   .meta-info {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.85rem;
      color: var(--texto-sub);
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--azul-tenue);
      text-transform: uppercase;
      letter-spacing: 0.05em;
   }
   .badge-mala {
      background: var(--err);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 800;
   }
   .enunciado {
      font-size: 1.35rem;
      margin-bottom: 1.25rem;
      line-height: 1.3;
      color: var(--azul-oscuro);
   }
   .opciones {
      list-style: none;
      padding-left: 0;
      margin-bottom: 1.25rem;
   }
   .opciones li {
      margin-bottom: 0.5rem;
      padding: 0.6rem 1rem;
      background: var(--gris-bg);
      border-radius: 8px;
      border: 1px solid var(--borde);
      font-size: 1.05rem;
   }
   .tabla-unir {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.25rem;
      font-size: 0.95rem;
   }
   .tabla-unir th,
   .tabla-unir td {
      border: 1px solid var(--borde);
      padding: 0.6rem;
      text-align: left;
   }
   .tabla-unir th {
      background: var(--azul-tenue);
      color: var(--azul-oscuro);
   }

   .justificacion {
      margin-top: 1.5rem;
      padding: 1rem 1.5rem;
      background: var(--bg-ok);
      border-radius: 10px;
      border: 1px solid #d1fae5;
      font-size: 1rem;
      color: var(--ok);
   }
   .comentario-revision {
      margin-top: 1.5rem;
      padding: 1rem;
      border: 1px solid #f59e0b;
      border-left: 5px solid #d97706;
      border-radius: 8px;
      background: #fffbeb;
   }
   .comentario-revision label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
      font-size: 0.9rem;
      font-weight: 800;
      color: #92400e;
   }
   .comentario-revision label span {
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      background: #fef3c7;
      color: #b45309;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
   }
   .comentario-revision textarea {
      width: 100%;
      resize: vertical;
      min-height: 82px;
      padding: 0.75rem 0.9rem;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      font: inherit;
      color: var(--texto);
      background: white;
   }
   .comentario-revision textarea:focus {
      outline: 2px solid #fde68a;
      border-color: #d97706;
   }
   .review-footer {
      padding: 1rem 2rem;
      border-top: 1px solid var(--borde);
      display: flex;
      justify-content: space-between;
      background: var(--gris-bg);
   }
   .nav-btns,
   .action-btns {
      display: flex;
      gap: 0.75rem;
   }
   .btn-ok {
      background: var(--ok);
      color: white;
      padding: 0.6rem 1.5rem;
      font-size: 1rem;
   }
   .btn-ok:hover {
      background: #047857;
      transform: translateY(-1px);
   }
   .btn-danger {
      background: var(--err);
      color: white;
      padding: 0.6rem 1.5rem;
      font-size: 1rem;
   }
   .btn-danger:hover {
      background: #b91c1c;
      transform: translateY(-1px);
   }

   @media (max-width: 640px) {
      .review-body {
         padding: 1rem;
      }
      .review-footer {
         padding: 1rem;
         flex-direction: column;
         gap: 1rem;
      }
      .action-btns button {
         flex: 1;
      }
   }
</style>
