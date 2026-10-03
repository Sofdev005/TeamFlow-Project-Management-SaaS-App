// Auth lives in AuthContext (login/register persist the session).
// Re-exported here so callers have a single service layer to import from.
export { useAuth } from '@/context/AuthContext';
