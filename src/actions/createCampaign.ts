import { Action } from "applesauce-actions";
import { CampaignContent, CampaignForm } from "../schemas/campaignSchema";
import { KINDS } from "../lib/nostr";
import {
  eventTemplate,
  eventTemplateSchema,
  PartialEventTemplate,
} from "../schemas/miscSchema";
import { NostrEvent } from "nostr-tools";
import { campaignUrl } from "../lib/utils";

// An action that creates a new kind 30050 campaign event
export function CreateCampaign(
  pubkey: string,
  form: CampaignForm,
  ref?: NostrEvent,
  refRelay?: string
): Action {
  return async function* ({ factory }) {
    const created_at = Math.floor(Date.now() / 1000);
    const dTag = form.d || created_at.toString();
    let examples: eventTemplate[] = [];

    // TODO: When repost, check the kind of the reposted event because
    // it can the template kind can be 1 (quoted), 6 (note) or 16 (generic)
    let template: PartialEventTemplate = { kind: form.template.kind };

    if (form.template.kind === KINDS.NOTE) {
      if (form.template.content && form.template.content !== "") {
        examples = [
          {
            kind: KINDS.NOTE,
            content: form.template.content,
            created_at: created_at,
            tags: [],
          },
        ];
      }
      // Reposting an event
    } else if (form.template.kind === KINDS.REPOST) {
      if (form.template.content === "") {
        // Unquoted repost
        template = {
          kind: ref!.kind === KINDS.NOTE ? KINDS.REPOST : KINDS.GENERIC_REPOST,
          content: JSON.stringify(ref),
          tags: [
            ["e", ref!.id, refRelay || ""],
            ["p", ref!.pubkey],
            ["k", ref!.kind.toString()],
          ],
        };
      } else {
        // Quoted repost
        template = {
          kind: KINDS.NOTE,
          content: form.template.content,
          tags: [["q", ref!.id, refRelay || "", ref!.pubkey!]],
        };
      }
      // Reaction to an event
    } else if (form.template.kind === KINDS.REACTION) {
      template = {
        ...template,
        content: form.template.reaction,
        tags: [
          ["e", ref!.id, refRelay || ""],
          ["p", ref!.pubkey!],
          ["k", ref!.kind.toString()],
        ],
      };

      // TODO: include the p tag and k tag of the event being reacted to
      const coordinates = form.template.refId!.split(":");
      if (coordinates && coordinates.length === 3) {
        template = {
          ...template,
          // TODO: also include the e tag of the event being reacted to
          tags: [["a", form.template.refId!]],
        };
      } else {
        template = {
          ...template,
          tags: [["e", form.template.refId!]],
        };
      }
    } else if (form.template.kind !== KINDS.ARTICLE) {
      let content;
      try {
        content = JSON.parse(form.template.content!);
        eventTemplateSchema.parse(content);
      } catch (error) {
        throw new Error("Nostr event is invalid");
      }

      template = content;
    }

    let content: CampaignContent = {
      description: form.description,
      give: {
        type: "cashu",
        ...(form.mints && form.mints.length > 0 ? { mint: form.mints } : {}),
      },
      take: {
        type: "nostr",
        template,
      },
      ...(examples.length > 0 ? { examples } : {}),
    };

    const draft = await factory.build({
      kind: KINDS.CAMPAIGN,
      content: JSON.stringify(content),
      created_at,
      tags: [
        ["d", dTag],
        ...(form.title ? [["title", form.title]] : []),
        ["k", form.template.kind.toString()],
        ...form.topics.map((topic) => ["t", topic]),
        ["s", "open"],
      ],
    });

    yield await factory.sign(draft);

    if (form.share) {
      const shareDraft = await factory.build({
        kind: KINDS.NOTE,
        content: form.shareContent,
        created_at,
        tags: [
          ["r", campaignUrl(pubkey, dTag)],
          ["e", `${KINDS.CAMPAIGN}:${pubkey}:${dTag}`],
        ],
      });

      yield await factory.sign(shareDraft);
    }
  };
}
