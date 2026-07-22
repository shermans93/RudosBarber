import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, usuarioToEmail } from '../lib/supabaseClient';
import { supabaseSignup } from '../lib/supabaseSignupClient';
import type { Profile } from '../types/database.types';

export const PROFILES_KEY = ['profiles'] as const;

export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export interface NewUserInput {
  nombre: string;
  usuario: string;
  rol: string;
  clave: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewUserInput) => {
      const { error } = await supabaseSignup.auth.signUp({
        email: usuarioToEmail(input.usuario),
        password: input.clave,
        options: {
          data: { usuario: input.usuario.trim().toLowerCase(), nombre: input.nombre, rol: input.rol },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });
}
