import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase auxiliar, con persistSession/autoRefreshToken desactivados,
 * usado ÚNICAMENTE para dar de alta nuevos usuarios (signUp) desde la pantalla
 * Usuarios. Si se usara el cliente principal (`supabaseClient.ts`) para eso,
 * signUp() reemplazaría la sesión activa del administrador que está creando
 * el usuario, desconectándolo. Este cliente nunca guarda ni reutiliza sesión.
 */
export const supabaseSignup = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'rudosbarber-signup-aux',
  },
});
