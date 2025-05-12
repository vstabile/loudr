import {
  createMemo,
  createSignal,
  JSX,
  Match,
  onMount,
  Switch,
} from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "./ui/button";
import { TextField, TextFieldInput } from "./ui/text-field";
import { nip19 } from "nostr-tools";
import { useAuth } from "../contexts/authContext";
import { AuthMethod } from "../lib/signIn";
import { waitForNip07 } from "../lib/utils";
import RemoteSignerDialog from "./RemoteSignerDialog";

type SignInDialogProps = {
  children: JSX.Element;
};

export default function SignInDialog(props: SignInDialogProps) {
  const { signIn } = useAuth();

  const [nsec, setNsec] = createSignal<string | null>(null);
  const [nip07Available, setNip07Available] = createSignal(false);
  const [remoteSignerDialogIsOpen, setRemoteSignerDialogIsOpen] =
    createSignal(false);

  const nsecIsValid = createMemo(() => {
    if (!nsec()) return false;

    try {
      const decoded = nip19.decode(nsec()!);
      return decoded.type === "nsec";
    } catch {
      return false;
    }
  });

  const handleSignIn = async (method: AuthMethod) => {
    await signIn(method, nsec() || undefined);
  };

  onMount(async () => {
    waitForNip07().then((available) => {
      setNip07Available(available);
    });
  });

  return (
    <Dialog>
      <DialogTrigger>{props.children}</DialogTrigger>
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <Switch>
            <Match when={!remoteSignerDialogIsOpen()}>
              <DialogTitle class="text-center">Sign In</DialogTitle>
              <div class="flex flex-col gap-1 w-full">
                <Button
                  onClick={() => handleSignIn("nip07")}
                  disabled={!nip07Available()}
                  class="w-full"
                >
                  Sign In with Extension
                </Button>
                <Button
                  onClick={() => setRemoteSignerDialogIsOpen(true)}
                  class="flex w-full max-w-sm"
                  variant="secondary"
                >
                  Sign In with Remote Signer
                </Button>
                <div class="flex flex-row gap-2 w-full my-1">
                  <TextField class="w-full">
                    <TextFieldInput
                      class="h-8"
                      placeholder="nsec1..."
                      onInput={(e) =>
                        setNsec((e.target as HTMLInputElement).value)
                      }
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
            </Match>
            <Match when={remoteSignerDialogIsOpen()}>
              <RemoteSignerDialog
                isOpen={remoteSignerDialogIsOpen()}
                onOpenChange={(isOpen) => setRemoteSignerDialogIsOpen(isOpen)}
              />
            </Match>
          </Switch>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
