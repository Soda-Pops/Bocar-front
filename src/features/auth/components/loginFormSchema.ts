import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your email address')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const loginFormResolver = zodResolver(loginFormSchema);

export const loginFormDefaults: LoginFormValues = {
  email: '',
  password: '',
};
