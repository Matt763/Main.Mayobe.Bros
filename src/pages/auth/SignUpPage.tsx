import { useEffect } from 'react';
import AuthLayout from './AuthLayout';
import AuthForm from './AuthForm';

export default function SignUpPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Create your account · Mayobe Bros';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <AuthLayout mode="signup">
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
