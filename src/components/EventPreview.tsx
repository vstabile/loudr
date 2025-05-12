import { createEffect, createSignal, Show } from "solid-js";
import { queryStore } from "../stores/queryStore";
import { Skeleton } from "./ui/skeleton";
import {
  truncatedNpub,
  formatDate,
  fromReactive,
  formatNoteContent,
} from "../lib/utils";
import { eventLoader, replaceableLoader } from "../lib/loaders";
import { LucideChevronDown, LucideChevronUp } from "lucide-solid";
import { EMPTY } from "rxjs";
import { RELAYS } from "../lib/nostr";

export default function EventPreview(props: { id?: string }) {
  const [isCollapsed, setIsCollapsed] = createSignal(true);
  const [needsExpansion, setNeedsExpansion] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;

  const nostrEvent = fromReactive(() => {
    if (!props.id) return EMPTY;
    const coordinates = props.id.split(":");

    if (coordinates.length === 3) {
      replaceableLoader.next({
        kind: parseInt(coordinates[0]),
        pubkey: coordinates[1],
        identifier: coordinates[2],
      });

      return queryStore.replaceable(
        parseInt(coordinates[0]),
        coordinates[1],
        coordinates[2]
      );
    } else {
      eventLoader.next({ id: props.id, relays: RELAYS });

      return queryStore.event(props.id);
    }
  });

  const profile = fromReactive(() =>
    nostrEvent() ? queryStore.profile(nostrEvent()!.pubkey) : EMPTY
  );

  // Load event author profile
  createEffect(() => {
    if (!nostrEvent()) return;

    replaceableLoader.next({
      pubkey: nostrEvent()!.pubkey,
      kind: 0,
    });
  });

  // Check if content needs expansion button
  createEffect(() => {
    if (!nostrEvent() || !contentRef) return;
    setNeedsExpansion(contentRef.scrollHeight > 45);
  });

  return (
    <div
      class={
        (isCollapsed() ? "max-h-40 overflow-hidden" : "") +
        " relative flex flex-col border mt-2 py-4 px-4 text-muted-foreground text-sm border-gray-200 rounded-md gap-3 w-full dark:bg-gray-800 dark:border-gray-700"
      }
    >
      <div class="flex justify-between">
        <div class="flex gap-3 justify-between items-center">
          <Show when={profile()}>
            <img
              src={
                profile()!.picture ||
                "https://robohash.org/" + nostrEvent()!.pubkey
              }
              class="h-5 w-5 rounded-full"
            />
            <span class="truncate">
              {profile()!.display_name ||
                profile()!.name ||
                truncatedNpub(nostrEvent()!.pubkey)}
            </span>
          </Show>
          <Show when={!profile()}>
            <Skeleton class="flex" height={16} width={16} radius={10} />
            <Skeleton class="flex" height={16} width={150} radius={10} />
          </Show>
        </div>
        <div class="flex text-xs text-gray-400">
          {nostrEvent() ? (
            formatDate(nostrEvent()!.created_at)
          ) : (
            <Skeleton class="flex" height={16} width={32} radius={10} />
          )}
        </div>
      </div>
      <div class="flex flex-col gap-2 text-xs w-full" ref={contentRef}>
        {nostrEvent() ? (
          <div
            innerHTML={formatNoteContent(nostrEvent()!)}
            class="w-full break-words overflow-hidden whitespace-pre-wrap max-w-full overflow-wrap-anywhere"
            style="word-break: break-word;"
          />
        ) : (
          <Skeleton class="flex w-full" height={48} radius={10} />
        )}
      </div>

      <Show when={nostrEvent() && needsExpansion()}>
        <div
          class="absolute text-gray-400 left-0 bottom-0 bg-gradient-to-b from-transparent via-background to-background dark:via-gray-800 dark:to-gray-800 w-full flex justify-center items-center cursor-pointer rounded-md pb-1"
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
