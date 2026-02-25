// Stores globales para estado compartido entre componentes.
import { writable } from 'svelte/store';

export const user       = writable(null);   // { email, name, picture }
export const preguntas  = writable([]);     // Array de objetos pregunta
export const cargando   = writable(false);
export const mensaje    = writable(null);   // { tipo: 'ok'|'err', texto: '' }
