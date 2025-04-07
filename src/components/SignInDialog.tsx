import { createMemo, createSignal, JSX } from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { signIn } from "../lib/signIn";
import { Button } from "./ui/button";
import { accounts } from "../accounts";
import { saveSession } from "../stores/session";
import { TextField, TextFieldInput } from "./ui/text-field";
import { nip19 } from "nostr-tools";
type SignInDialogProps = {
  children: JSX.Element;
};

export default function SignInDialog(props: SignInDialogProps) {
  const [nsec, setNsec] = createSignal<string | null>(null);

  const nsecIsValid = createMemo(() => {
    const value = nsec();
    if (!value) return false;

    try {
      const decoded = nip19.decode(value);
      return decoded.type === "nsec" ? true : false;
    } catch (error) {
      return false;
    }
  });

  const handleSignIn = async (method: "nip07" | "nsec") => {
    if (accounts.active) return;

    const account = await signIn(method, nsec() || undefined);

    if (account) {
      saveSession({
        method: method,
        pubkey: account.pubkey,
        nsec: method === "nsec" ? nsec() : null,
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger>{props.children}</DialogTrigger>
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle class="text-center">Sign In</DialogTitle>
          <div class="flex flex-col gap-2 w-full">
            <Button onClick={() => handleSignIn("nip07")} class="w-full">
              Sign In with NIP-07
            </Button>
            <div class="flex flex-row gap-2 w-full">
              <TextField class="w-full">
                <TextFieldInput
                  class="h-8"
                  placeholder="nsec1..."
                  onInput={(e) => setNsec((e.target as HTMLInputElement).value)}
                />
              </TextField>
              <Button
                size="sm"
                class="h-8"
                onClick={() => handleSignIn("nsec")}
                disabled={!nsecIsValid()}
              >
                Sign In
              </Button>
            </div>
            <p class="text-xs text-muted-foreground text-center">
              At least one of the parties must sign-in using an nsec because
              NIP-07 does not support adaptor signatures yet.
            </p>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
