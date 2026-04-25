import { useEffect } from 'react';
import AuthLayout from './AuthLayout';
import AuthForm from './AuthForm';

export default function SignInPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Sign in · Mayobe Bros';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <AuthLayout mode="signin">
      <AuthForm mode="signin" />
    </AuthLayout>
  );
}
