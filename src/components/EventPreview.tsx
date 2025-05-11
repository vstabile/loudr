import { createEffect, createSignal, Show } from "solid-js";
import { queryStore } from "../stores/queryStore";
import { Skeleton } from "./ui/skeleton";
import { NostrEvent } from "nostr-tools";
import { truncatedNpub, formatDate, fromReactive } from "../lib/utils";
import { replaceableLoader } from "../lib/loaders";
import { LucideChevronDown, LucideChevronUp } from "lucide-solid";
import { EMPTY } from "rxjs";
type EventPreviewProps = {
  event: NostrEvent | undefined;
};

function formatNoteContent(note: NostrEvent) {
  return (
    note.content
      // Handle line breaks
      .replace(/\n/g, "<br />")
      // Handle URLs - limit display length to 40 chars
      .replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline max-w-full inline-block text-ellipsis overflow-hidden">${url}</a>`;
      })
      // Handle nostr:<bech32> references
      .replace(
        /nostr:([a-z0-9]+1[023456789acdefghjklmnpqrstuvwxyz]+)/g,
        (match, bech32) => {
          return `<a href="https://njump.me/${bech32}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${match}</a>`;
        }
      )
      // Handle hashtags
      .replace(
        /#[\w\u0590-\u05ff]+/g,
        (tag) => `<span class="text-primary">${tag}</span>`
      )
  );
}

export default function EventPreview(props: EventPreviewProps) {
  console.log(props.event);
  const [isCollapsed, setIsCollapsed] = createSignal(true);
  const [needsExpansion, setNeedsExpansion] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;

  const profile = fromReactive(() =>
    props.event ? queryStore.profile(props.event.pubkey) : EMPTY
  );

  createEffect(() => {
    if (!props.event) return;

    replaceableLoader.next({
      pubkey: props.event.pubkey,
      kind: 0,
    });
  });

  // Check if content needs expansion button
  createEffect(() => {
    if (!props.event || !contentRef) return;
    setNeedsExpansion(contentRef.scrollHeight > 160);
  });

  return (
    <div
      class={
        (isCollapsed() ? "max-h-40 overflow-hidden" : "") +
        " relative flex flex-col border mt-2 py-4 px-4 text-muted-foreground text-sm border-gray-200 rounded-md gap-3 w-full"
      }
    >
      <div class="flex justify-between">
        <div class="flex gap-3 justify-between items-center">
          <Show when={profile()}>
            <img
              src={
                profile()!.picture ||
                "https://robohash.org/" + props.event!.pubkey
              }
              class="h-5 w-5 rounded-full"
            />
            <span class="truncate">
              {profile()!.display_name ||
                profile()!.name ||
                truncatedNpub(props.event!.pubkey)}
            </span>
          </Show>
          <Show when={!profile()}>
            <Skeleton class="flex" height={16} width={16} radius={10} />
            <Skeleton class="flex" height={16} width={150} radius={10} />
          </Show>
        </div>
        <div class="flex text-xs text-gray-400">
          {props.event ? (
            formatDate(props.event.created_at)
          ) : (
            <Skeleton class="flex" height={16} width={32} radius={10} />
          )}
        </div>
      </div>
      <div class="flex flex-col gap-2 text-xs w-full" ref={contentRef}>
        {props.event ? (
          <div
            innerHTML={formatNoteContent(props.event)}
            class="w-full break-words overflow-hidden whitespace-pre-wrap max-w-full overflow-wrap-anywhere"
            style="word-break: break-word;"
          />
        ) : (
          <Skeleton class="flex w-full" height={48} radius={10} />
        )}
      </div>

      <Show when={props.event && needsExpansion()}>
        <div
          class="absolute text-gray-400 left-0 bottom-0 bg-gradient-to-b from-transparent via-background to-background w-full flex justify-center items-center cursor-pointer rounded-md pb-1"
          onClick={() => setIsCollapsed(!isCollapsed())}
        >
          {isCollapsed() ? (
            <LucideChevronDown class="h-5" />
          ) : (
            <LucideChevronUp class="h-5" />
          )}
        </div>
      </Show>
    </div>
  );
}
