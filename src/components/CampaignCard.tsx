import { NostrEvent } from "nostr-tools";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { createEffect, createMemo, For, from, Show } from "solid-js";
import { ProfileQuery } from "applesauce-core/queries";
import { truncatedNpub } from "../lib/utils";
import { eventLoader, replaceableLoader } from "../lib/loaders";
import { Badge } from "./ui/badge";
import { accounts } from "../lib/accounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LucideEllipsis, LucideRepeat2, LucideTrash } from "lucide-solid";
import { actions } from "../actions/hub";
import { DeleteCampaign } from "../actions/deleteCampaign";
import { rxNostr } from "../nostr";
import EventPreview from "./EventPreview";
import { EventCoordinates } from "./KindInputGroup";
import { of } from "rxjs";
import { Button } from "./ui/button";
import { createSignal } from "solid-js";
import { queryStore } from "../stores/queryStore";
import { eventStore } from "../stores/eventStore";

export default function CampaignCard(props: { campaign: NostrEvent }) {
  const account = from(accounts.active$);

  const sponsor = from(
    queryStore.createQuery(ProfileQuery, props.campaign.pubkey)
  );

  const content = createMemo(() => JSON.parse(props.campaign.content));

  const [isCollapsed, setIsCollapsed] = createSignal(true);
  const [needsExpansion, setNeedsExpansion] = createSignal(false);
  let descriptionRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!descriptionRef) return;
    setNeedsExpansion(descriptionRef.scrollHeight > 50);
  });

  createEffect(async () => {
    replaceableLoader.next({
      pubkey: props.campaign.pubkey,
      kind: 0,
    });
  });

  const deleteCampaign = async () => {
    const identifier = props.campaign.tags.find((t) => t[0] === "d")?.[1];
    if (!identifier) return;
    console.log("deleteCampaign", identifier);
    await actions
      .exec(DeleteCampaign, identifier)
      .forEach((event: NostrEvent) => {
        eventStore.add(event);
        rxNostr.send(event);
      });
  };

  createEffect(() => {
    const eventId = content().take.template.tags.find(
      (t: string[]) => t[0] === "e"
    )?.[1];
    if (!eventId) return;

    const coordinates = eventId?.split(":");

    if (coordinates && coordinates.length === 3) {
      replaceableLoader.next({
        kind: parseInt(coordinates[0]),
        pubkey: coordinates[1],
        identifier: coordinates[2],
      });
    } else {
      eventLoader.next({ id: eventId });
    }
  });

  const nostrEventId = createMemo(() => {
    const eventId = content().take.template.tags.find(
      (t: string[]) => t[0] === "e"
    )?.[1];
    const coordinates = eventId?.split(":");
    if (coordinates && coordinates.length === 3) {
      return {
        kind: parseInt(coordinates[0]),
        pubkey: coordinates[1],
        identifier: coordinates[2],
      };
    }
    return eventId;
  });

  const nostrEvent = from<NostrEvent>(
    nostrEventId()
      ? typeof nostrEventId() === "string"
        ? queryStore.event(nostrEventId() as string)
        : queryStore.replaceable(
            (nostrEventId() as EventCoordinates).kind,
            (nostrEventId() as EventCoordinates).pubkey,
            (nostrEventId() as EventCoordinates).identifier
          )
      : of(undefined)
  );

  const title = createMemo(() => {
    const title = props.campaign.tags.find((tag) => tag[0] === "title")?.[1];
    if (!title) return "Campaign";

    return title;
  });

  return (
    <Card class="flex flex-col h-full">
      <CardHeader class="pb-4">
        <CardTitle class="flex flex-row items-center justify-between">
          <span>{title()}</span>
          <Show when={props.campaign.pubkey === account()?.pubkey}>
            <DropdownMenu placement="bottom-end">
              <DropdownMenuTrigger>
                <LucideEllipsis class="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="bg-white">
                <DropdownMenuItem onClick={deleteCampaign} class="text-red-600">
                  <LucideTrash class="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
        </CardTitle>
      </CardHeader>
      <CardContent class="flex-grow">
        <div class="flex flex-row items-center mb-2">
          <img
            src={
              sponsor()?.picture ||
              "https://robohash.org/" + props.campaign.pubkey
            }
            class="h-5 w-5 rounded-full mr-2"
          />
          <p>
            {sponsor() ? sponsor()?.name : truncatedNpub(props.campaign.pubkey)}
          </p>
          <p class="text-gray-400 ml-2 text-sm truncate">
            {sponsor() && sponsor()?.nip05}
          </p>
        </div>
        <div
          ref={descriptionRef}
          class={
            (isCollapsed() ? "max-h-20 overflow-hidden truncate" : "") +
            " relative flex flex-col text-sm break-words whitespace-pre-wrap"
          }
        >
          {content().description}

          <Show when={needsExpansion()}>
            <div class="absolute bottom-0 left-0 w-full flex bg-gradient-to-b from-transparent via-background to-background">
              <button
                class="text-primary hover:underline mt-2 text-xs"
                onClick={() => setIsCollapsed(!isCollapsed())}
              >
                {isCollapsed() ? "Show more" : "Show less"}
              </button>
            </div>
          </Show>
        </div>
        <Show when={content().take.template.kind === 6}>
          <div class="flex flex-row items-center gap-1 mt-4">
            <LucideRepeat2 class="w-5 h-5 mr-2" /> Repost
          </div>
        </Show>
        <Show when={content().take.template.kind === 7}>
          <div class="flex flex-row items-center gap-1 mt-4">
            <span class="text-xl mr-2">{content().take.template.content}</span>{" "}
            React
          </div>
        </Show>
        <div>
          <EventPreview event={nostrEvent()} />
        </div>
        <div class="flex flex-row items-center gap-1 mt-4">
          <For each={props.campaign.tags.filter((tag) => tag[0] === "t")}>
            {(topic, _) => <Badge variant="secondary">{topic[1]}</Badge>}
          </For>
        </div>
      </CardContent>
      <CardFooter class="flex flex-row justify-between">
        <Button variant="link" size="sm">
          Ignore
        </Button>
        <Button size="sm">Send a Proposal</Button>
      </CardFooter>
    </Card>
  );
}
