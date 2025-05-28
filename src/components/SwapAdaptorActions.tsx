import { LucideHourglass, LucideLoader } from "lucide-solid";
import { createSignal, Match, Show, Switch } from "solid-js";
// import { actions } from "../actions/hub";
import { Swap } from "../queries/swap";
// import { SignTakenEvent } from "../actions/signTakenEvent";
import { AcceptProposalDialog } from "./AcceptProposalDialog";
// import { GenerateAdaptors } from "../actions/generateAdaptors";

export default function SwapAdaptorActions(props: {
  swap: Swap;
  mint: string;
}) {
  const [isPublishing, setIsPublishing] = createSignal(false);

  const amount = JSON.parse(props.swap.proposal.content).take.amount;

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
          <AcceptProposalDialog mint={props.mint} amount={amount} />
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
