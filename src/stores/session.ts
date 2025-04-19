import { createStore } from "solid-js/store";
import { signIn } from "../lib/signIn";
import { waitForNip07 } from "../lib/utils";

type Session = {
  method: "nip07" | "nsec" | null;
  pubkey: string | null;
  nsec: string | null;
};

const defaultSession: Session = {
  method: null,
  pubkey: null,
  nsec: null,
};

const [session, setSession] = createStore<Session>(defaultSession);

const saveSession = (data: Session) => {
  setSession(data);
  localStorage.setItem("session", JSON.stringify(data));
};

const clearSession = () => {
  setSession(defaultSession);
  localStorage.removeItem("session");
};

const loadSession = (): Session => {
  const stored = localStorage.getItem("session");

  if (stored) return JSON.parse(stored);

  return defaultSession;
};

const restoreSession = async () => {
  const storedSession = loadSession();
  if (!storedSession.method) return;

  if (storedSession.method === "nip07") {
    const nostrAvailable = await waitForNip07();
    if (!nostrAvailable) {
      console.warn("NIP-07 extension not available");
      return;
    }
  }
  console.log(storedSession);

  await signIn(storedSession.method, storedSession.nsec || undefined);
};

restoreSession();

export { session, saveSession, clearSession, restoreSession };
