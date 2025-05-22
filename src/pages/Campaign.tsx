import { accounts } from "../lib/accounts";
import "../App.css";
import Navbar from "../components/Navbar";
import {
  For,
  Match,
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

  const campaign = createMemo(() => {
    return campaignEvent() ? JSON.parse(campaignEvent()!.content) : undefined;
  });

  const proposals = from(
    queryStore.timeline({ kinds: [KINDS.PROPOSAL], "#a": [aTag] })
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
      <main class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
        <h1>{title()}</h1>
        <p>{campaign()?.description}</p>
        <Switch>
          <Match when={campaign()?.pubkey === account()?.pubkey}>
            {campaign()?.status === "active" && <Button>Close Campaign</Button>}
            <Button>Delete Campaign</Button>
          </Match>
        </Switch>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <For each={proposals() || []}>
            {(proposal) => <ProposalCard proposal={proposal} />}
          </For>
        </div>
      </main>
      <SignInDialog />
    </div>
  );
}

export default Campaign;
