import { createStore } from "solid-js/store";

const LOCAL_STORAGE_KEY = "ignoredCampaigns";

// Load initial state from localStorage
const loadIgnoredCampaigns = (): string[] => {
  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : [];
};

// Initialize the store
const [state, setState] = createStore({
  ignoredCampaigns: loadIgnoredCampaigns(),
});

// Persist changes to localStorage
const persistIgnoredCampaigns = (campaigns: string[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(campaigns));
};

// Public API
export const ignoredCampaignsStore = {
  // Getter for the full list
  get: () => state.ignoredCampaigns,

  // Check if a campaign is ignored
  isIgnored: (identifier: string) =>
    state.ignoredCampaigns.includes(identifier),

  // Add a campaign to ignored list
  ignore: (identifier: string) => {
    if (!state.ignoredCampaigns.includes(identifier)) {
      const updated = [...state.ignoredCampaigns, identifier];
      setState("ignoredCampaigns", updated);
      persistIgnoredCampaigns(updated);
    }
  },

  // Remove a campaign from ignored list
  unignore: (identifier: string) => {
    const updated = state.ignoredCampaigns.filter((id) => id !== identifier);
    if (updated.length !== state.ignoredCampaigns.length) {
      setState("ignoredCampaigns", updated);
      persistIgnoredCampaigns(updated);
    }
  },

  // Clear all ignored campaigns
  clear: () => {
    setState("ignoredCampaigns", []);
    persistIgnoredCampaigns([]);
  },
};
