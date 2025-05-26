import {
  createSignal,
  Show,
  createEffect,
  Accessor,
  createMemo,
} from "solid-js";
import { queryStore } from "../stores/queryStore";
import { Skeleton } from "./ui/skeleton";
import { formatDate, fromReactive, formatNoteContent, cn } from "../lib/utils";
import { eventLoader, replaceableLoader } from "../lib/loaders";
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideRepeat2,
} from "lucide-solid";
import { EMPTY } from "rxjs";
import { KINDS, RELAYS } from "../lib/nostr";
import { getTagValue } from "applesauce-core/helpers";
import { UnsignedEvent } from "nostr-tools";
import { ProfilePreview } from "./ProfilePreview";

const MENTION_TAGS = ["e", "E", "q"];

type MaybeUnsignedEvent = UnsignedEvent & { id?: string };

export default function EventPreview(props: {
  id?: string;
  event?: MaybeUnsignedEvent;
  depth?: number;
}) {
  const [isCollapsed, setIsCollapsed] = createSignal(true);
  const [needsExpansion, setNeedsExpansion] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;

  const eventFromId = fromReactive(() => {
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

  const nostrEvent = createMemo(() => props.event || eventFromId());

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
    setTimeout(() => {
      setNeedsExpansion(contentRef.scrollHeight >= 160);
    }, 0);
  });

  const mentions: Accessor<string[][]> = createMemo(() => {
    if (!nostrEvent()) return [];

    const event = nostrEvent()!;
    const tags = event.tags.filter((tag) => MENTION_TAGS.includes(tag[0]));

    return tags;
  });

  return (
    <div class="bg-background flex flex-col border py-4 px-4 text-muted-foreground text-sm border-gray-200 rounded-md gap-3 w-full dark:bg-gray-800 dark:border-gray-700">
      <div class="flex flex-col justify-between">
        <Show when={nostrEvent()?.kind === KINDS.ARTICLE}>
          <div class="font-bold mb-3">
            {getTagValue(nostrEvent()!, "title")}
          </div>
        </Show>
        <div class="flex justify-between">
          <div class="flex gap-2 items-center">
            <Show
              when={
                nostrEvent() &&
                [KINDS.REPOST, KINDS.GENERIC_REPOST].includes(
                  nostrEvent()!.kind
                )
              }
            >
              <div class="flex items-center">
                <LucideRepeat2 class="w-5 h-5" />
              </div>
            </Show>
            <Show when={profile()}>
              <ProfilePreview
                profile={profile}
                pubkey={nostrEvent()!.pubkey}
                size="sm"
              />
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
      </div>
      <Show
        when={[KINDS.NOTE, KINDS.ARTICLE].includes(nostrEvent()?.kind || 0)}
      >
        <div class="relative">
          <div
            class={
              isCollapsed() ? cn("max-h-32 overflow-clip") : "relative pb-6"
            }
          >
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
          </div>
          <Show
            when={nostrEvent() && nostrEvent()!.kind === 1 && needsExpansion()}
          >
            <div
              class="absolute text-primary mb-[-0.5rem] left-0 bottom-0 bg-gradient-to-b from-transparent via-background/80 to-background dark:via-gray-800 dark:to-gray-800 w-full flex justify-center items-center cursor-pointer rounded-md pt-2"
              onClick={() => setIsCollapsed(!isCollapsed())}
            >
              {isCollapsed() ? (
                <LucideChevronDown class="h-4" />
              ) : (
                <LucideChevronUp class="h-4" />
              )}
            </div>
          </Show>
          <Show
            when={nostrEvent() && nostrEvent()!.kind !== 1 && nostrEvent()?.id}
          >
            <a
              href={"https://njump.me/" + nostrEvent()!.id}
              target="_blank"
              class="absolute text-xs text-primary mb-[-0.2rem] bottom-0 bg-gradient-to-b from-transparent via-background/80 to-background dark:via-gray-800/80 dark:to-gray-800 w-full flex justify-start items-center cursor-pointer rounded-md pt-6"
            >
              Read more
            </a>
          </Show>
        </div>
      </Show>
      <Show when={!props.depth && mentions().length > 0}>
        <div class="flex flex-col gap-2 mx-[-0.5rem] mb-[-0.5rem]">
          <EventPreview id={mentions()[0][1]} depth={1} />
        </div>
      </Show>
    </div>
  );
}
