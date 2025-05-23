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
import { useParams } from "@solidjs/router";
import { replaceableLoader } from "../lib/loaders.ts";
import { ProposalCard } from "../components/ProposalCard.tsx";
import { Button } from "../components/ui/button.tsx";
import CampaignDescription from "../components/CampaignDescription.tsx";
import KindLabel from "../components/KindLabel.tsx";
import { CampaignContent as CampaignContentType } from "../schemas/campaignSchema.ts";
import { NostrSigSpec } from "../schema.ts";
import EventPreview from "../components/EventPreview.tsx";
import CampaignTopics from "../components/CampaignTopics.tsx";

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

  const proposals = from(
    queryStore.timeline({ kinds: [KINDS.PROPOSAL], "#a": [aTag] })
  );

  const nostrEventId = createMemo(() => {
    if (!campaign() || !(campaign()?.take as NostrSigSpec).template.tags)
      return;
    return (
      getTagValue((campaign()!.take as any).template, "e") ||
      getTagValue((campaign()!.take as any).template, "q")
    );
  });

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
        "#d": [dTag],
      },
      {
        kinds: [KINDS.PROPOSAL],
        "#a": [aTag],
      },
      {
        kinds: [KINDS.DELETION],
        "#k": [KINDS.PROPOSAL.toString()],
        "#a": [aTag],
      },
    ]);
  });

  return (
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-4 lg:py-6">
        <Show when={campaign()}>
          <div class="flex flex-col sm:flex-row gap-4 justify-between">
            <div class="flex flex-col gap-2 w-full">
              <h1 class="text-2xl font-bold mb-2">{title()}</h1>
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
              <Switch>
                <Match when={campaignEvent()?.pubkey === account()?.pubkey}>
                  {getTagValue(campaignEvent()!, "s") === "active" && (
                    <Button>Close Campaign</Button>
                  )}
                  <Button>Delete Campaign</Button>
                </Match>
              </Switch>
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
          <h2 class="text-lg font-bold mt-6 mb-2">Proposals</h2>
          <Switch>
            <Match when={proposals()?.length !== 0}>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <For each={proposals() || []}>
                  {(proposal) => <ProposalCard proposal={proposal} />}
                </For>
              </div>
            </Match>
            <Match when={proposals()?.length === 0}>
              <p class="text-sm text-muted-foreground">No proposals yet</p>
            </Match>
          </Switch>
        </Show>
      </main>
      <SignInDialog />
    </div>
  );
}

export default Campaign;
