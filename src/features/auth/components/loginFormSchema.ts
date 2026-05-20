import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Ingresa tu correo electronico')
    .email('Ingresa un correo electronico valido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const loginFormResolver = zodResolver(loginFormSchema);

export const loginFormDefaults: LoginFormValues = {
  email: '',
  password: '',
};
