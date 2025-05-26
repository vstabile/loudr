import { accounts } from "../lib/accounts";
import "../App.css";
import Navbar from "../components/Navbar";
import {
  Accessor,
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  from,
  onMount,
} from "solid-js";
import { KINDS, RELAYS, rxNostr } from "../lib/nostr";
import { createRxForwardReq } from "rx-nostr";
import { eventStore } from "../stores/eventStore";
import { queryStore } from "../stores/queryStore";
import { AuthProvider } from "../components/AuthProvider";
import { ThemeProvider } from "../lib/theme.tsx";
import { getTagValue } from "applesauce-core/helpers";
import SignInDialog from "../components/SignInDialog.tsx";
import { useNavigate, useParams } from "@solidjs/router";
import { replaceableLoader } from "../lib/loaders.ts";
import CampaignDescription from "../components/CampaignDescription.tsx";
import KindLabel from "../components/KindLabel.tsx";
import { CampaignContent as CampaignContentType } from "../schemas/campaignSchema.ts";
import { NostrSigSpec } from "../schema.ts";
import EventPreview from "../components/EventPreview.tsx";
import CampaignTopics from "../components/CampaignTopics.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu.tsx";
import { LucideCirclePause, LucideEllipsis, LucideTrash } from "lucide-solid";
import CreateProposalDialog from "../components/CreateProposalDialog.tsx";
import { DeleteCampaign } from "../actions/deleteCampaign.ts";
import { actions } from "../actions/hub.ts";
import { CloseCampaign } from "../actions/closeCampaign.ts";
import { EMPTY } from "rxjs";
import { fromReactive } from "../lib/utils.ts";
import { ProfilePreview } from "../components/ProfilePreview.tsx";
import { Badge } from "../components/ui/badge.tsx";
import { showToast, Toaster } from "../components/ui/toast.tsx";
import { CampaignSwaps } from "../queries/swap.ts";
import { SwapCard } from "../components/SwapCard.tsx";

function Campaign() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CampaignContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function CampaignContent() {
  const { pubkey, dTag } = useParams();
  const account = from(accounts.active$);
  const aTag = `${KINDS.CAMPAIGN}:${pubkey}:${dTag}`;
  const navigate = useNavigate();

  const campaignEvent = from(
    queryStore.replaceable(KINDS.CAMPAIGN, pubkey, dTag)
  );

  const title = createMemo(() => {
    if (!campaignEvent()) return;
    return getTagValue(campaignEvent()!, "title") || "Campaign";
  });

  const campaign: Accessor<CampaignContentType | undefined> = createMemo(() => {
    return campaignEvent() ? JSON.parse(campaignEvent()!.content) : undefined;
  });

  const status = createMemo(() => {
    if (!campaign()) return;
    return getTagValue(campaignEvent()!, "s");
  });

  const proposals = from(
    queryStore.timeline({ kinds: [KINDS.PROPOSAL], "#a": [aTag] })
  );

  const swaps = from(queryStore.createQuery(CampaignSwaps, aTag));

  const nostrEventId = createMemo(() => {
    if (!campaign() || !(campaign()?.take as NostrSigSpec).template.tags)
      return;
    return (
      getTagValue((campaign()!.take as any).template, "e") ||
      getTagValue((campaign()!.take as any).template, "q")
    );
  });

  const campaignAuthor = fromReactive(() =>
    campaignEvent() ? queryStore.profile(campaignEvent()!.pubkey) : EMPTY
  );

  createEffect(() => {
    if (!campaign()) return;

    replaceableLoader.next({
      pubkey: campaignEvent()!.pubkey,
      kind: 0,
      relays: RELAYS,
    });
  });

  onMount(async () => {
    const rxReq = createRxForwardReq();

    rxNostr.use(rxReq).subscribe(({ event }) => {
      try {
        eventStore.add(event);
      } catch {}
    });

    rxReq.emit([
      { kinds: [KINDS.CAMPAIGN], authors: [pubkey], "#d": [dTag] },
      {
        kinds: [KINDS.DELETION],
        authors: [pubkey],
        "#k": [KINDS.CAMPAIGN.toString()],
        "#a": [aTag],
      },
      {
        kinds: [KINDS.PROPOSAL],
        "#a": [aTag],
      },
    ]);

    setTimeout(() => {
      if (!campaignEvent()) {
        showToast({
          title: "Campaign not found.",
        });
        navigate("/", { replace: true });
      }
    }, 2000);
  });

  const deleteCampaign = async () => {
    await actions.run(DeleteCampaign, dTag);
    showToast({
      title: "Campaign deleted.",
      variant: "destructive",
    });
    navigate("/", { replace: true });
  };

  const closeCampaign = async () => {
    const identifier = campaignEvent()!.tags.find((t) => t[0] === "d")?.[1];
    if (!identifier) return;

    await actions.run(CloseCampaign, campaignEvent()!);
  };
  return (
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-4 lg:py-6">
        <Show when={campaign()}>
          <div class="flex flex-col sm:flex-row gap-4 justify-between">
            <div class="flex flex-col gap-2 w-full">
              <div class="flex flex-row items-center gap-2 justify-between mb-1">
                <div class="flex flex-row items-center gap-2">
                  <h1 class="text-2xl font-bold">{title()}</h1>
                  <Show when={status() !== "open"}>
                    <Badge>{status()}</Badge>
                  </Show>
                </div>
                <DropdownMenu placement="bottom-end">
                  <DropdownMenuTrigger>
                    <LucideEllipsis class="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent class="bg-white">
                    <DropdownMenuItem onClick={closeCampaign}>
                      <LucideCirclePause class="w-4 h-4" />
                      Close Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={deleteCampaign}
                      class="text-red-600"
                    >
                      <LucideTrash class="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div class="mb-2">
                <ProfilePreview
                  profile={campaignAuthor}
                  pubkey={campaignEvent()!.pubkey}
                />
              </div>
              <Show when={!nostrEventId()}>
                <KindLabel
                  template={(campaign()?.take as NostrSigSpec).template}
                />
              </Show>
              <div class="bg-background rounded-md p-4 border border-gray-200 dark:border-gray-700">
                <CampaignDescription description={campaign()?.description!} />
              </div>
              <Show when={campaignEvent()?.tags.find((tag) => tag[0] === "t")}>
                <div class="hidden sm:block mt-2">
                  <CampaignTopics campaign={campaignEvent()!} />
                </div>
              </Show>
              <Show when={campaignEvent()?.pubkey !== account()?.pubkey}>
                <div class="mt-2">
                  <CreateProposalDialog campaign={campaignEvent()!} />
                </div>
              </Show>
            </div>
            <Show when={nostrEventId()}>
              <div class="flex flex-col sm:max-w-[300px] md:max-w-[400px]">
                <KindLabel
                  template={(campaign()?.take as NostrSigSpec).template}
                />
                <Show
                  when={
                    ![
                      KINDS.NOTE,
                      KINDS.REPOST,
                      KINDS.GENERIC_REPOST,
                      KINDS.REACTION,
                      KINDS.ARTICLE,
                    ].includes((campaign()!.take as NostrSigSpec).template.kind)
                  }
                >
                  <div class="mt-2 p-4 bg-muted rounded-md">
                    <pre class="whitespace-pre-wrap break-words text-xs">
                      {JSON.stringify(
                        (campaign()!.take as NostrSigSpec).template,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </Show>
                <Show when={nostrEventId()}>
                  <div class="mt-2 w-full">
                    <EventPreview id={nostrEventId()} />
                  </div>
                </Show>

                <div class="sm:hidden mt-4">
                  <CampaignTopics campaign={campaignEvent()!} />
                </div>
              </div>
            </Show>
          </div>
          <h2 class="text-lg font-bold mt-6 mb-4">Proposals</h2>
          <Switch>
            <Match when={proposals()?.length !== 0}>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <For each={swaps()}>
                  {(swap) => (
                    <SwapCard swap={swap} campaign={campaignEvent()!} />
                  )}
                </For>
                {/* <For each={proposals() || []}>
                  {(proposal) => (
                    <ProposalCard
                      proposal={proposal}
                      campaign={campaignEvent()!}
                    />
                  )}
                </For> */}
              </div>
            </Match>
            <Match when={proposals()?.length === 0}>
              <p class="text-sm text-muted-foreground">No proposals yet</p>
            </Match>
          </Switch>
        </Show>
      </main>
      <SignInDialog />
      <Toaster />
    </div>
  );
}

export default Campaign;
