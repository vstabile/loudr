import { switchMap } from "rxjs";
import { accounts } from "./lib/accounts";
import "./App.css";
import Navbar from "./components/Navbar";
import { For, createMemo, from, onMount } from "solid-js";
import { KINDS, rxNostr } from "./lib/nostr";
import { createRxForwardReq } from "rx-nostr";
import CampaignCard from "./components/CampaignCard";
import { eventStore } from "./stores/eventStore";
import { queryStore } from "./stores/queryStore";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./lib/theme.tsx";
import { ignoredCampaignsStore } from "./stores/ignoredCampaignsStore";
import { getTagValue } from "applesauce-core/helpers";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  // subscribe to the active account, then subscribe to the active campaigns or undefined
  const allCampaigns = from(
    accounts.active$.pipe(
      switchMap((account) =>
        account
          ? // TODO: Use the user's  WoT
            queryStore.timeline({ kinds: [KINDS.CAMPAIGN] })
          : // TODO: Use the project's WoT
            queryStore.timeline({ kinds: [KINDS.CAMPAIGN] })
      )
    )
  );

  // Filter out ignored campaigns
  const campaigns = createMemo(() => {
    return allCampaigns()?.filter((campaign) => {
      const identifier = getTagValue(campaign, "d");
      return identifier ? !ignoredCampaignsStore.isIgnored(identifier) : true;
    });
  });

  onMount(async () => {
    // Subscribe to campaign events
    const rxReq = createRxForwardReq();

    rxNostr.use(rxReq).subscribe(({ event }) => {
      try {
        eventStore.add(event);
      } catch {}
    });

    rxReq.emit([
      { kinds: [KINDS.CAMPAIGN], "#s": ["open"] },
      { kinds: [KINDS.DELETION], "#k": [KINDS.CAMPAIGN.toString()] },
    ]);
  });

  return (
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <For each={campaigns()}>
            {(campaign) => <CampaignCard campaign={campaign} />}
          </For>
        </div>
      </main>
    </div>
  );
}

export default App;
