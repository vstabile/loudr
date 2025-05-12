import { Action } from "applesauce-actions";
import { ignoredCampaignsStore } from "../stores/ignoredCampaignsStore";

export function IgnoreCampaign(identifier: string): Action {
  return async function* () {
    // TODO: Save as a Nostr event
    ignoredCampaignsStore.ignore(identifier);
    return;
  };
}
