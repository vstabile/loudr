import { EventFactory } from "applesauce-factory";
import { Action, ActionHub } from "applesauce-actions";
import { eventStore } from "./stores";
import { accounts } from "./accounts";
import { CampaignForm } from "./schemas/campaignSchema";
import { KINDS } from "./nostr";

// The event factory is used to build and modify nostr events
export const factory = new EventFactory({
  // accounts.signer is a NIP-07 signer that signs with the currently active account
  signer: accounts.signer,
});

// The action hub is used to run Actions against the event store
export const actions = new ActionHub(eventStore, factory);

// An action that creates a new kind 30050 campaign event
export function Campaign(form: CampaignForm): Action {
  return async function* ({ factory }) {
    const created_at = Math.floor(Date.now() / 1000);

    const draft = await factory.build({
      kind: KINDS.CAMPAIGN,
      content: "",
      created_at,
      tags: [
        ["d", created_at.toString()],
        ...(form.title ? [["title", form.title]] : []),
        ["brief", form.brief],
        ["k", form.kind.toString()],
        ["paymentMethod", "cashu"],
        ...form.mints.map((mint) => ["mint", mint]),
        ...form.topics.map((topic) => ["t", topic]),
        ["status", "active"],
      ],
    });

    yield await factory.sign(draft);
  };
}
