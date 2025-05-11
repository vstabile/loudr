import { Action } from "applesauce-actions";
import { accounts } from "../lib/accounts";
import { KINDS } from "../lib/nostr";
import { from } from "solid-js";

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
