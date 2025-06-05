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

  async function publishGivenEvent() {
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
          <AcceptProposalDialog
            swap={props.swap}
            mint={props.mint}
            amount={amount}
          />
        </Match>
        <Match when={props.swap.state === "given-pending"}>
          <button
            onClick={publishGivenEvent}
            disabled={isPublishing()}
            class={
              (isPublishing()
                ? "bg-green-600/60 cursor-default"
                : "bg-gradient-to-br from-green-600 to-green-500 drop-shadow hover:from-green-600 hover:to-green-400") +
              " flex items-center justify-center border-green-700 text-white px-2 py-2 rounded-md w-full"
            }
          >
            <Show when={isPublishing()} fallback="Publish Event">
              <LucideLoader class="w-4 h-4 animate-spin" />
              Publishing
            </Show>
          </button>
        </Match>
        <Match when={props.swap.state === "taken-pending"}>
          <div class="flex items-center text-xs mt-2">
            <LucideHourglass class="w-3 h-3 mr-1" /> Waiting payment claim
          </div>
        </Match>
        <Match when={props.swap.state === "completed"}>
          <div class="flex items-center mt-2">Swap completed!</div>
        </Match>
      </Switch>
    </div>
  );
}
