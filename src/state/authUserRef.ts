// Neutralni koordinacijski modul između useAuth.ts i useProgress.ts - oba
// ovise O OVOME, ne jedno o drugom, da izbjegnemo cirkularni import.

let currentUserId: string | null = null;
type LoginHandler = (userId: string) => void;
type LogoutHandler = () => void;
let onLoginHandler: LoginHandler | null = null;
let onLogoutHandler: LogoutHandler | null = null;

export function getCurrentUserId(): string | null {
  return currentUserId;
}

/** useProgress.ts ovdje registrira svoj merge-on-login handler pri učitavanju modula. */
export function registerOnLogin(handler: LoginHandler): void {
  onLoginHandler = handler;
}

/** useProgress.ts ovdje registrira čišćenje napretka pri odjavi. */
export function registerOnLogout(handler: LogoutHandler): void {
  onLogoutHandler = handler;
}

/** useAuth.ts zove ovo iz svog onAuthStateChange listenera. */
export function setCurrentUserId(nextUserId: string | null): void {
  const previous = currentUserId;
  currentUserId = nextUserId;

  if (nextUserId && nextUserId !== previous) {
    onLoginHandler?.(nextUserId);
    return;
  }

  // Odjava MORA očistiti lokalni napredak. Inače na dijeljenom uređaju
  // napredak korisnika A ostaje u memoriji i localStorageu, pa ga
  // mergeAndSyncOnLogin pri prijavi korisnika B upiše u B-ov cloud red -
  // tiho i nepovratno, jer je merge max-based.
  if (!nextUserId && previous) {
    onLogoutHandler?.();
  }
}
