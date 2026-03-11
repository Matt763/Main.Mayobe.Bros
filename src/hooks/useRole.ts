import { useAuth, AdminRole } from '../contexts/AuthContext';

export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const isCEO = role === 'ceo';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  const canAccess = (...allowed: AdminRole[]) => role !== null && allowed.includes(role);

  return { role, isCEO, isAdmin, isStaff, canAccess };
}
