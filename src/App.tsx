import { switchMap } from "rxjs";
import { accounts } from "./lib/accounts";
import "./App.css";
import Navbar from "./components/Navbar";
import { For, from, onMount } from "solid-js";
import { KINDS, rxNostr } from "./nostr";
import { createRxForwardReq } from "rx-nostr";
import CampaignCard from "./components/CampaignCard";
import { restoreSession } from "./stores/session";
import { eventStore } from "./stores/eventStore";
import { queryStore } from "./stores/queryStore";
import { AuthProvider } from "./components/AuthProvider";

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  // subscribe to the active account, then subscribe to the active campaigns or undefined
  const campaigns = from(
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

  onMount(async () => {
    await restoreSession();
    // Subscribe to campaign events
    const rxReq = createRxForwardReq();

    rxNostr.use(rxReq).subscribe(({ event }) => {
      eventStore.add(event);
    });

    rxReq.emit([
      { kinds: [KINDS.CAMPAIGN], since: 1744366398 },
      { kinds: [KINDS.DELETION], "#k": [KINDS.CAMPAIGN.toString()] },
    ]);
  });

  return (
    <div class="min-h-screen bg-gray-100">
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
