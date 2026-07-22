import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia app/.env.example a app/.env.local y completa las credenciales de tu proyecto Supabase.'
  );
}

// Cliente principal: persiste la sesión del usuario logueado en localStorage.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/** Dominio sintético usado para loguear por "usuario" corto en vez de email real. */
export const USUARIO_EMAIL_DOMAIN = 'rudosbarber.local';

export function usuarioToEmail(usuario: string): string {
  return `${usuario.trim().toLowerCase()}@${USUARIO_EMAIL_DOMAIN}`;
}
