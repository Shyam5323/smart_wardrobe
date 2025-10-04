// app/(auth)/signup/page.tsx
'use client';
import { AuthForm } from '@/components/forms/AuthForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthForm variant="signup" />
    </div>
  );
}