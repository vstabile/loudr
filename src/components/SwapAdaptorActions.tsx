import { LucideHourglass, LucideLoader } from "lucide-solid";
import { createMemo, createSignal, Match, Show, Switch } from "solid-js";
// import { actions } from "../actions/hub";
import { Swap } from "../queries/swap";
// import { SignTakenEvent } from "../actions/signTakenEvent";
import { useAuth } from "../contexts/authContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
// import { GenerateAdaptors } from "../actions/generateAdaptors";

export default function SwapAdaptorActions(props: { swap: Swap }) {
  const { state } = useAuth();
  const [isSendingAdaptor, setIsSendingAdaptor] = createSignal(false);
  const [isPublishing, setIsPublishing] = createSignal(false);
  const [isAdaptorSupportDialogOpen, setIsAdaptorSupportDialogOpen] =
    createSignal(false);

  const isAdaptorDisabled = createMemo(() => {
    return isSendingAdaptor() || state.method !== "nsec";
  });

  async function sendAdaptor() {
    if (isAdaptorDisabled()) return setIsAdaptorSupportDialogOpen(true);

    setIsSendingAdaptor(true);

    try {
      // Make sure we have an nsec
      if (!state.nsec) {
        throw new Error("No nsec available");
      }

      // await actions.run(GenerateAdaptors, props.swap, state.nsec);
    } catch {
    } finally {
      setIsSendingAdaptor(false);
    }
  }

  async function publishTakenEvent() {
    setIsPublishing(true);

    try {
      // await actions.run(SignTakenEvent, props.swap);
    } catch {
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div class="flex text-gray-400 justify-center w-full gap-2 text-sm">
      <Switch>
        <Match when={props.swap.state === "adaptor-pending"}>
          <button
            class={
              (isAdaptorDisabled()
                ? "bg-green-600/60 cursor-default"
                : "bg-gradient-to-br from-green-600 to-green-500 drop-shadow hover:from-green-600 hover:to-green-400") +
              " flex items-center justify-center border-green-700 text-white px-2 py-2 rounded-md w-full"
            }
            onClick={sendAdaptor}
          >
            <Show when={isSendingAdaptor()} fallback="Accept Proposal">
              <LucideLoader class="w-3 h-3 mr-1 animate-spin" /> Accepting
            </Show>
          </button>
          <Dialog
            open={isAdaptorSupportDialogOpen()}
            onOpenChange={setIsAdaptorSupportDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle class="pb-2">
                  Generating Adaptor Signatures is not Supported
                </DialogTitle>
                <DialogDescription>
                  NIP-07 extensions and NIP-46 remote signers still do not
                  support generating adaptor signatures. For now, you need to
                  sign in with an nsec, so that the client code can perform the
                  calculations needed. Note that only one party of the swap
                  needs to do this, by default the one who created the proposal.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </Match>
        <Match when={props.swap.state === "given-pending"}>
          <div class="flex items-center text-xs">
            <LucideHourglass class="w-3 h-3 mr-1" /> Waiting publishing
          </div>
        </Match>
        <Match when={props.swap.state === "taken-pending"}>
          <button
            onClick={publishTakenEvent}
            disabled={isPublishing()}
            class="flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground drop-shadow hover:from-primary/90 hover:to-primary/70 disabled:bg-primary/80 text-white px-2 py-1 rounded-md w-full"
          >
            <Show when={isPublishing()} fallback="Publish GM">
              <LucideLoader class="w-4 h-4 animate-spin" />
              Publishing
            </Show>
          </button>
        </Match>
        <Match when={props.swap.state === "completed"}>
          <div class="flex items-center">Swap completed!</div>
        </Match>
      </Switch>
    </div>
  );
}
