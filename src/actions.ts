import { EventFactory } from "applesauce-factory";
import { Action, ActionHub } from "applesauce-actions";
import { eventStore } from "./stores";
import { accounts } from "./accounts";
import { CampaignForm } from "./schemas/campaignSchema";
import { KINDS } from "./nostr";
import { from } from "solid-js";

type PartialTemplate = {
  kind: number;
  content?: string;
  tags?: string[][];
  created_at?: number;
};

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

    // TODO: When repost, check the kind of the reposted event because
    // it can the template kind can be 1 (quoted), 6 (note) or 16 (generic)
    let template: PartialTemplate = {
      kind: form.kind,
    };

    // Reposting an event
    if (form.kind === 6) {
      // TODO: include the stringified reposted event and p tag
      template = { ...template, tags: [["e", form.eventId!]] };
      // Reaction to an event
    } else if (form.kind === 7) {
      template.content = form.reaction;

      // TODO: include the p tag and k tag of the event being reacted to
      const coordinates = form.eventId!.split(":");
      if (coordinates && coordinates.length === 3) {
        template = {
          ...template,
          // TODO: also include the e tag of the event being reacted to
          tags: [["a", form.eventId!]],
        };
      } else {
        template = {
          ...template,
          tags: [["e", form.eventId!]],
        };
      }
    }

    // TODO: Add content examples to the campaign

    const draft = await factory.build({
      kind: KINDS.CAMPAIGN,
      content: JSON.stringify({
        description: form.description,
        give: {
          type: "cashu",
          ...(form.mints && form.mints.length > 0 ? { mint: form.mints } : {}),
        },
        take: {
          type: "nostr",
          template,
        },
      }),
      created_at,
      tags: [
        ["d", created_at.toString()],
        ...(form.title ? [["title", form.title]] : []),
        ["k", form.kind.toString()],
        ...form.topics.map((topic) => ["t", topic]),
        ["s", "open"],
      ],
    });

    yield await factory.sign(draft);
  };
}

// Delete a campaign
export function DeleteCampaign(identifier: string): Action {
  const account = from(accounts.active$);

  return async function* ({ factory }) {
    const created_at = Math.floor(Date.now() / 1000);
    const a = `${KINDS.CAMPAIGN}:${account()?.pubkey}:${identifier}`;

    const draft = await factory.build({
      kind: KINDS.DELETION,
      content: "",
      created_at,
      tags: [
        ["a", a],
        ["k", KINDS.CAMPAIGN.toString()],
      ],
    });

    yield await factory.sign(draft);
  };
}
