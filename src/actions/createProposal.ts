import { Action } from "applesauce-actions";
import { KINDS } from "../lib/nostr";
import { EventTemplate } from "applesauce-accounts";
import { ProposalForm } from "../schemas/proposalSchema";
import { NostrEvent } from "nostr-tools";

export type SwapProposal = {
  give: SignatureTemplate;
  take: SignatureTemplate;
  listing?: string;
  description?: string;
};

export type SignatureTemplate = NostrSignatureTemplate | CashuSignatureTemplate;

type NostrSignatureTemplate = {
  type: "nostr";
  template: EventTemplate;
};

type CashuSignatureTemplate = {
  type: "cashu";
  amount: number;
  mint: string | string[];
};

// An action that creates a new kind 30050 campaign event
export function CreateProposal(
  form: ProposalForm,
  campaign: NostrEvent
): Action {
  return async function* ({ factory }) {
    const created_at = Math.floor(Date.now() / 1000);

    const draft = await factory.build({
      kind: KINDS.PROPOSAL,
      content: JSON.stringify(""),
      created_at,
      tags: [["p", campaign.pubkey]],
    });

    yield await factory.sign(draft);

    if (form.notify) {
      const notifyDraft = await factory.build({
        kind: KINDS.DIRECT_MESSAGE,
        content: form.notifyContent,
        tags: [["p", campaign.pubkey]],
        created_at,
      });

      yield await factory.sign(notifyDraft);
    }
  };
}
