import { Action } from "applesauce-actions";
import { KINDS } from "../lib/nostr";

export function CancelProposal(id: string): Action {
  return async function* ({ factory }) {
    const created_at = Math.floor(Date.now() / 1000);

    const draft = await factory.build({
      kind: KINDS.DELETION,
      content: "",
      created_at,
      tags: [
        ["e", id],
        ["k", KINDS.PROPOSAL.toString()],
      ],
    });

    yield await factory.sign(draft);
  };
}
