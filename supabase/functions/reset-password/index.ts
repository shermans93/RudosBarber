// Edge Function: permite que un usuario con rol "Administrador" cambie la contraseña de
// cualquier otro usuario. Usa la service_role key (solo disponible en este entorno de servidor,
// nunca en el cliente) para llamar a la Admin API de Supabase Auth.
//
// Despliegue: ver instrucciones en el chat / BITACORA.md — se sube pegando este código en
// Supabase Dashboard > Edge Functions, no requiere Supabase CLI.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Falta autenticación.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Cliente "como el que llama", solo para confirmar quién es y su rol.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await callerClient.auth.getUser(bearerToken);
  if (userError || !userData.user) {
    return json({ error: 'Sesión inválida.' }, 401);
  }

  const { data: callerProfile, error: profileError } = await callerClient
    .from('profiles')
    .select('rol')
    .eq('id', userData.user.id)
    .single();

  if (profileError || callerProfile?.rol !== 'Administrador') {
    return json({ error: 'No autorizado.' }, 403);
  }

  let body: { user_id?: string; new_password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo de la solicitud inválido.' }, 400);
  }

  const { user_id, new_password } = body;
  if (!user_id || !new_password || new_password.length < 6) {
    return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, {
    password: new_password,
  });

  if (updateError) {
    return json({ error: updateError.message }, 400);
  }

  return json({ ok: true }, 200);
});
