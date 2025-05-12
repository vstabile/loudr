import { createSignal, createEffect } from "solid-js";
import { ignoredCampaignsStore } from "../stores/ignoredCampaignsStore";
import { LucideTrash } from "lucide-solid";

export function IgnoredCampaigns() {
  const [ignoredCampaigns, setIgnoredCampaigns] = createSignal<string[]>([]);

  // Reload the list when component mounts
  createEffect(() => {
    setIgnoredCampaigns(ignoredCampaignsStore.get());
  });

  const handleClearAll = () => {
    ignoredCampaignsStore.clear();
    setIgnoredCampaigns([]);
  };

  return (
    <div class="my-4">
      <h3 class="flex justify-between text-sm font-medium mb-2">
        <div>
          <span class="mr-2 text-xs bg-secondary text-secondary-foreground rounded-full py-1 px-2">
            {ignoredCampaigns().length}
          </span>
          Ignored Campaigns
        </div>
        <button
          onClick={handleClearAll}
          class="flex items-center gap-1 text-xs disabled:opacity-60"
          disabled={ignoredCampaigns().length === 0}
        >
          <LucideTrash class="h-3 w-3" />
          Clear All
        </button>
      </h3>
    </div>
  );
}
