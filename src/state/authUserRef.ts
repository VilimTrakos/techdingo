// Neutralni koordinacijski modul između useAuth.ts i useProgress.ts - oba
// ovise O OVOME, ne jedno o drugom, da izbjegnemo cirkularni import.

let currentUserId: string | null = null;
type LoginHandler = (userId: string) => void;
let onLoginHandler: LoginHandler | null = null;

export function getCurrentUserId(): string | null {
  return currentUserId;
}

/** useProgress.ts ovdje registrira svoj merge-on-login handler pri učitavanju modula. */
export function registerOnLogin(handler: LoginHandler): void {
  onLoginHandler = handler;
}

/** useAuth.ts zove ovo iz svog onAuthStateChange listenera. */
export function setCurrentUserId(nextUserId: string | null): void {
  const previous = currentUserId;
  currentUserId = nextUserId;
  if (nextUserId && nextUserId !== previous) {
    onLoginHandler?.(nextUserId);
  }
}
