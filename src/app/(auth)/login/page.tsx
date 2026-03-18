// src/app/login/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@/schemas/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Récupérer l'URL de redirection (si présente)
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
      toast.success('Connexion réussie !');
      
      // Rediriger vers la page d'origine ou dashboard
      router.push(redirectTo);
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.response?.data?.message || 'Identifiants invalides',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-campus-gray-100 to-white">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            <span className="text-campus-blue">Campus</span>
            <span className="text-campus-orange">Hub</span>
          </h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="votre.email@exemple.fr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-campus-blue hover:bg-campus-blue-600" disabled={isLoggingIn}>
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Pas encore de compte ?{' '}
          <a href="/register" className="text-campus-blue hover:underline font-semibold">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}