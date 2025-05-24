import { NostrEvent } from "nostr-tools";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { createEffect, createMemo, from, Match, Show, Switch } from "solid-js";
import { ProfileQuery } from "applesauce-core/queries";
import { replaceableLoader } from "../lib/loaders";
import { accounts } from "../lib/accounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LucideCirclePause, LucideEllipsis, LucideTrash } from "lucide-solid";
import { actions } from "../actions/hub";
import { DeleteCampaign } from "../actions/deleteCampaign";
import { CloseCampaign } from "../actions/closeCampaign";
import EventPreview from "./EventPreview";
import { Button } from "./ui/button";
import { queryStore } from "../stores/queryStore";
import { getTagValue } from "applesauce-core/helpers";
import { IgnoreCampaign } from "../actions/ignoreCampaign";
import { useAuth } from "../contexts/authContext";
import CreateProposalDialog from "./CreateProposalDialog";
import CampaignDescription from "./CampaignDescription";
import KindLabel from "./KindLabel";
import { KINDS } from "../lib/nostr";
import CampaignTopics from "./CampaignTopics";
import { ProfilePreview } from "./ProfilePreview";

export default function CampaignCard(props: { campaign: NostrEvent }) {
  const account = from(accounts.active$);
  const { setDialogIsOpen } = useAuth();

  const sponsor = from(
    queryStore.createQuery(ProfileQuery, props.campaign.pubkey)
  );

  const content = createMemo(() => {
    try {
      return JSON.parse(props.campaign.content);
    } catch (error) {
      console.error(error);
    }
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

    await actions.run(DeleteCampaign, identifier);
  };

  const closeCampaign = async () => {
    const identifier = props.campaign.tags.find((t) => t[0] === "d")?.[1];
    if (!identifier) return;

    await actions.run(CloseCampaign, props.campaign);
  };

  const ignoreCampaign = async () => {
    if (!account()) return setDialogIsOpen(true);
    const identifier = props.campaign.tags.find((t) => t[0] === "d")?.[1];
    if (!identifier) return;

    await actions.run(IgnoreCampaign, identifier);
  };

  const nostrEventId = createMemo(() => {
    if (!content().take.template.tags) return;
    return (
      getTagValue(content().take.template, "e") ||
      getTagValue(content().take.template, "q")
    );
  });

  const title = createMemo(() => {
    const title = props.campaign.tags.find((tag) => tag[0] === "title")?.[1];
    if (!title) return "Campaign";

    return title;
  });

  return (
    <Card class="flex flex-col h-full">
      <CardHeader class="pb-4">
        <CardTitle class="flex flex-row items-center justify-between">
          <a
            href={`c/${props.campaign.pubkey}/${getTagValue(
              props.campaign,
              "d"
            )}`}
          >
            {title()}
          </a>
          <Show when={props.campaign.pubkey === account()?.pubkey}>
            <DropdownMenu placement="bottom-end">
              <DropdownMenuTrigger>
                <LucideEllipsis class="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="bg-white">
                <DropdownMenuItem onClick={closeCampaign}>
                  <LucideCirclePause class="w-4 h-4" />
                  Close Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={deleteCampaign} class="text-red-600">
                  <LucideTrash class="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
        </CardTitle>
      </CardHeader>
      <CardContent class="flex-grow pb-4">
        <div class="mb-3">
          <ProfilePreview
            profile={sponsor}
            pubkey={props.campaign.pubkey}
            size="sm"
          />
        </div>
        <div class="mb-4">
          <CampaignDescription description={content().description} />
        </div>
        <KindLabel template={content().take.template} />
        <Show
          when={
            ![
              KINDS.NOTE,
              KINDS.REPOST,
              KINDS.GENERIC_REPOST,
              KINDS.REACTION,
              KINDS.ARTICLE,
            ].includes(content().take.template.kind)
          }
        >
          <div class="mt-2 p-4 bg-muted rounded-md">
            <pre class="whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(content().take.template, null, 2)}
            </pre>
          </div>
        </Show>
        <Show when={nostrEventId()}>
          <div class="mt-2">
            <EventPreview id={nostrEventId()} />
          </div>
        </Show>
        <div class="mt-4">
          <CampaignTopics campaign={props.campaign} />
        </div>
      </CardContent>
      <CardFooter class="flex flex-row justify-between pb-4">
        <div>
          {props.campaign.pubkey !== account()?.pubkey && (
            <Button variant="link" size="sm" onClick={ignoreCampaign}>
              Ignore
            </Button>
          )}
        </div>
        <Switch>
          <Match when={props.campaign.pubkey !== account()?.pubkey}>
            <CreateProposalDialog campaign={props.campaign} />
          </Match>
          <Match when={props.campaign.pubkey === account()?.pubkey}>
            <a
              href={`c/${props.campaign.pubkey}/${getTagValue(
                props.campaign,
                "d"
              )}`}
            >
              <Button size="sm">View Proposals</Button>
            </a>
          </Match>
        </Switch>
      </CardFooter>
    </Card>
  );
}
