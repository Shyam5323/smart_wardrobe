// app/(auth)/login/page.tsx
'use client';
import { AuthForm } from '@/components/forms/AuthForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthForm variant="login" />
    </div>
  );
}