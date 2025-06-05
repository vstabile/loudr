import { Action } from "applesauce-actions";
import { computeAdaptors } from "../lib/ass";
import { KINDS } from "../lib/nostr";
import { Swap } from "../queries/swap";
import { getEncodedTokenV4, Proof } from "@cashu/cashu-ts";
import { from } from "solid-js";
import { accounts } from "../lib/accounts";
import { bytesToHex } from "@noble/hashes/utils";
import { getPublicKey } from "nostr-tools";

export function AcceptProposal(
  swap: Swap,
  mint: string,
  proofs: Proof[],
  key: Uint8Array
): Action {
  return async function* ({ factory }) {
    const account = from(accounts.active$);
    if (!account()) throw new Error("No active account");

    const created_at = Math.floor(Date.now() / 1000);
    const nonce = swap.nonce;
    const enc_key = await account()!.nip04!.encrypt(
      account()!.pubkey,
      bytesToHex(key)
    );

    if (!nonce) throw new Error("No nonce found");

    const content = {
      adaptors: computeAdaptors(swap.proposal, proofs, nonce, key),
      cashu: getEncodedTokenV4({ mint, proofs }),
      pubkey: getPublicKey(key),
      enc_key,
    };

    const draft = await factory.build({
      kind: KINDS.ADAPTOR,
      content: JSON.stringify(content),
      created_at,
      tags: [
        ["e", swap.id],
        ["p", swap.noncePubkey],
      ],
    });

    yield await factory.sign(draft);
  };
}
