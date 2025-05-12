import { LucideClipboardCopy, LucideLoader } from "lucide-solid";
import { Button } from "./ui/button";
import { TextField, TextFieldInput } from "./ui/text-field";
import { DialogTitle } from "./ui/dialog";
import { createEffect, createSignal, onMount } from "solid-js";
import { useAuth } from "../contexts/authContext";
import QRCode from "./QRCode";
import { nip19, generateSecretKey } from "nostr-tools";
import { NIP46_RELAY } from "../lib/nostr";

interface RemoteSignerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function RemoteSignerDialog(props: RemoteSignerDialogProps) {
  const [bunkerUri, setBunkerUri] = createSignal("");
  const [relayUrl, setRelayUrl] = createSignal(NIP46_RELAY);
  const [bunkerIsLoading, setBunkerIsLoading] = createSignal(false);
  const [isCopied, setIsCopied] = createSignal(false);
  const nsec = nip19.nsecEncode(generateSecretKey());

  const {
    signIn,
    nostrConnectUri,
    setOnSignInSuccess,
    closeNip46Signer,
    remoteSignerRelay,
    setRemoteSignerRelay,
    connectWithBunker,
  } = useAuth();

  const handleBunkerConnect = () => {
    if (bunkerUri()) {
      connectWithBunker(bunkerUri());
      setBunkerIsLoading(true);
    }
  };

  const handleRelayChange = (newRelay: string) => {
    setIsCopied(false);
    setRemoteSignerRelay(newRelay);
    closeNip46Signer();
    signIn("nip46", nsec, undefined, remoteSignerRelay());
  };

  onMount(() => {
    setOnSignInSuccess(() => {
      setBunkerIsLoading(false);
      setBunkerUri("");
      props.onOpenChange(false);
    });
  });

  createEffect(() => {
    if (props.isOpen) signIn("nip46", nsec, undefined, remoteSignerRelay());
  });

  return (
    <>
      <DialogTitle class="text-center">Sign In with Remote Signer</DialogTitle>
      <div class="flex flex-col items-center">
        <QRCode data={nostrConnectUri() || ""} width={240} height={240} />
        <div class="flex flex-row w-[240px] pt-2 gap-2">
          <TextField class="flex w-full">
            <TextFieldInput
              type="text"
              class="h-8"
              placeholder="wss://relay.example.com/"
              value={relayUrl()}
              autocomplete="off"
              onInput={(e) => setRelayUrl((e.target as HTMLInputElement).value)}
            />
          </TextField>
          <Button
            class="flex p-3 h-8"
            variant="outline"
            onClick={() => handleRelayChange(relayUrl())}
            disabled={relayUrl() === remoteSignerRelay()}
          >
            Set
          </Button>
        </div>
        <div class="mt-4 text-xs text-gray-500 break-all max-w-full overflow-hidden flex items-center gap-2">
          <span class="flex-1">{nostrConnectUri()}</span>
        </div>
        <button
          class="flex text-xs items-center gap-1 p-1.5 hover:bg-gray-100 rounded-md transition-colors mt-1"
          onClick={() => {
            if (nostrConnectUri()) {
              navigator.clipboard.writeText(nostrConnectUri()!);
              setIsCopied(true);
            }
          }}
          title="Copy to clipboard"
        >
          <LucideClipboardCopy class="w-3 h-3" />{" "}
          {isCopied() ? "Copied" : "Copy"}
        </button>

        <div class="flex items-center w-full my-4">
          <div class="flex-grow h-px bg-gray-300"></div>
          <span class="mx-4 text-gray-500 text-sm">OR</span>
          <div class="flex-grow h-px bg-gray-300"></div>
        </div>

        <p class="mb-4 text-center">
          Paste a bunker URI from your remote signer.
        </p>
        <div class="flex gap-2 w-full">
          <TextField class="w-full">
            <TextFieldInput
              type="text"
              placeholder="bunker://..."
              value={bunkerUri()}
              autocomplete="off"
              onInput={(e) =>
                setBunkerUri((e.target as HTMLInputElement).value)
              }
            />
          </TextField>
          <Button
            onClick={handleBunkerConnect}
            disabled={
              !bunkerUri().trim().startsWith("bunker://") || bunkerIsLoading()
            }
          >
            {bunkerIsLoading() ? (
              <LucideLoader class="animate-spin" />
            ) : (
              "Connect"
            )}
          </Button>
        </div>
        <Button
          onClick={() => props.onOpenChange(false)}
          variant="link"
          class="h-auto pb-0 pt-4"
        >
          Back
        </Button>
      </div>
    </>
  );
}
