const USER_KEY = 'elisi:session';
const FLAG_KEY = 'elisi:authed';

export const readCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.user || null;
  } catch {
    return null;
  }
};

export const hasCachedSession = () => {
  try {
    return localStorage.getItem(FLAG_KEY) === '1' || Boolean(readCachedUser());
  } catch {
    return false;
  }
};

export const persistSession = (user) => {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(FLAG_KEY);
      return;
    }
    localStorage.setItem(FLAG_KEY, '1');
    localStorage.setItem(USER_KEY, JSON.stringify({ user }));
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
};

export const clearSession = () => persistSession(null);
