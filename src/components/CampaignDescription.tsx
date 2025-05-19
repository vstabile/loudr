import { createEffect, createSignal, Show } from "solid-js";

export default function CampaignDescription(props: { description: string }) {
  const [isCollapsed, setIsCollapsed] = createSignal(true);
  const [needsExpansion, setNeedsExpansion] = createSignal(false);
  let descriptionRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!descriptionRef) return;
    setNeedsExpansion(descriptionRef.scrollHeight > 50);
  });

  return (
    <div
      ref={descriptionRef}
      class={
        (isCollapsed() ? "max-h-20 overflow-hidden truncate" : "pb-5") +
        " relative flex flex-col text-sm break-words whitespace-pre-wrap"
      }
    >
      {props.description}

      <Show when={needsExpansion()}>
        <div class="absolute bottom-0 left-0 w-full">
          <button
            class="flex text-primary w-full hover:underline pt-2 text-xs bg-gradient-to-b from-transparent via-background/90 to-background"
            onClick={() => setIsCollapsed(!isCollapsed())}
          >
            {isCollapsed() ? "Show more" : "Show less"}
          </button>
        </div>
      </Show>
    </div>
  );
}
