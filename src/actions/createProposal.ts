import { Action } from "applesauce-actions";
import { NostrEvent, EventTemplate } from "nostr-tools";
import { KINDS } from "../lib/nostr";
import { ProposalForm } from "../schemas/proposalSchema";
import { getTagValue } from "applesauce-core/helpers";
import { PartialEventTemplate } from "../schemas/miscSchema";
import { from } from "solid-js";
import { accounts } from "../lib/accounts";

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
  campaign: NostrEvent,
  ref?: NostrEvent,
  refRelay?: string
): Action {
  return async function* ({ factory }) {
    const account = from(accounts.active$);
    if (!account()) throw new Error("No active account");

    const created_at = Math.floor(Date.now() / 1000);

    const campaignContent = JSON.parse(campaign.content);
    console.log("campaignContent", campaignContent);

    const givenKind = form.given.template.kind;

    let givenTemplate: PartialEventTemplate = {
      kind: givenKind,
      created_at: campaignContent.take.template.created_at || created_at,
      tags: [],
    };

    console.log("givenTemplate", givenTemplate);

    if (givenKind === KINDS.NOTE) {
      givenTemplate.content = form.given.template.content;
    } else if (givenKind === KINDS.REPOST) {
      if (form.given.template.content === "") {
        // Unquoted repost
        givenTemplate = {
          ...givenTemplate,
          kind: givenKind === KINDS.NOTE ? KINDS.REPOST : KINDS.GENERIC_REPOST,
          content: JSON.stringify(ref),
          tags: [
            ["e", ref!.id, refRelay || ""],
            ["p", ref!.pubkey],
            ["k", ref!.kind.toString()],
          ],
        };
      } else {
        // Quoted repost
        givenTemplate = {
          ...givenTemplate,
          kind: KINDS.NOTE,
          content: form.given.template.content,
          tags: [["q", ref!.id, refRelay || "", ref!.pubkey!]],
        };
      }
      // Reaction to an event
    } else if (givenKind === KINDS.REACTION) {
      givenTemplate = {
        ...givenTemplate,
        content: form.given.template.reaction,
        tags: [
          ["e", ref!.id, refRelay || ""],
          ["p", ref!.pubkey!],
          ["k", ref!.kind.toString()],
        ],
      };
    }

    const proposal = {
      give: {
        type: form.given.type,
        template: givenTemplate,
      },
      take: {
        type: "cashu" as const,
        // @ts-ignore
        amount: form.taken.amount,
        // @ts-ignore
        mint: form.taken.mint,
      },
    };

    console.log("action proposal", proposal);

    const draft = await factory.build({
      kind: KINDS.PROPOSAL,
      content: JSON.stringify(proposal),
      created_at,
      tags: [
        [
          "a",
          `${KINDS.CAMPAIGN}:${campaign.pubkey}:${getTagValue(campaign, "d")}`,
        ],
        ["p", campaign.pubkey],
      ],
    });

    console.log("action draft", draft);

    yield await factory.sign(draft);

    if (form.notify && form.notifyContent) {
      const notifyDraft = await factory.build({
        kind: KINDS.DIRECT_MESSAGE,
        content: await account()!.nip04!.encrypt(
          campaign.pubkey,
          form.notifyContent
        ),
        tags: [["p", campaign.pubkey]],
        created_at,
      });

      yield await factory.sign(notifyDraft);
    }
  };
}
