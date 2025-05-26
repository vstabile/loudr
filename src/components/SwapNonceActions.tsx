import { LucideHourglass, LucideLoader } from "lucide-solid";
import { createSignal, Match, Show, Switch } from "solid-js";
import { actions } from "../actions/hub";
// import { signGivenEvent } from "../actions/signGivenEvent";
import { Swap } from "../queries/swap";
import { Button } from "./ui/button";
import { showToast } from "./ui/toast";
import { CancelProposal } from "../actions/cancelProposal";

export default function SwapNonceActions(props: { swap: Swap }) {
  const [isCancelling, setIsCancelling] = createSignal(false);
  const [isPublishing, setIsPublishing] = createSignal(false);

  async function publishGivenEvent() {
    setIsPublishing(true);

    try {
      // await actions.run(signGivenEvent, props.swap);
    } catch {
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleCancel() {
    setIsCancelling(true);
    await actions.run(CancelProposal, props.swap.id);
    setIsCancelling(false);
    showToast({
      title: "Proposal cancelled.",
      variant: "destructive",
    });
  }

  return (
    <div class="flex text-gray-400 justify-center w-full text-sm">
      <Switch>
        <Match when={props.swap.state === "adaptor-pending"}>
          <div class="flex flex-row gap-2 justify-between w-full">
            <Button
              variant="outline"
              class="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
              onClick={() => handleCancel()}
              disabled={isCancelling()}
            >
              <Show when={isCancelling()} fallback="Cancel">
                <LucideLoader class="w-4 h-4 animate-spin" /> Canceling...
              </Show>
            </Button>

            <div class="flex items-center text-xs">
              <LucideHourglass class="w-3 h-3 mr-1" /> Waiting adaptor
            </div>
          </div>
        </Match>
        <Match when={props.swap.state === "given-pending"}>
          <button
            onClick={publishGivenEvent}
            disabled={isPublishing()}
            class="flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground drop-shadow text-white px-2 py-1 rounded-md w-full"
          >
            <Show when={isPublishing()} fallback="Publish GM">
              <LucideLoader class="w-4 h-4 animate-spin" />
              Publishing
            </Show>
          </button>
        </Match>
        <Match when={props.swap.state === "taken-pending"}>
          <div class="flex items-center text-xs">
            <LucideHourglass class="w-3 h-3 mr-1" /> Pending publishing
          </div>
        </Match>
        <Match when={props.swap.state === "completed"}>
          <div class="flex items-center">Swap completed!</div>
        </Match>
      </Switch>
    </div>
  );
}
