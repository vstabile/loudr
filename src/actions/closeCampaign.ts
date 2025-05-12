import { Action } from "applesauce-actions";
import { NostrEvent } from "nostr-tools";

export function CloseCampaign(campaign: NostrEvent): Action {
  return async function* ({ factory }) {
    const created_at = Math.floor(Date.now() / 1000);

    const updatedTags = campaign.tags.map((tag) =>
      tag[0] === "s" ? ["s", "closed"] : tag
    );

    const draft = { ...campaign, created_at, tags: updatedTags };

    yield await factory.sign(draft);
  };
}
