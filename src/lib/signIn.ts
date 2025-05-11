import { ExtensionAccount, SimpleAccount } from "applesauce-accounts/accounts";
import {
  ExtensionSigner,
  NostrConnectSigner,
  SimpleSigner,
} from "applesauce-signers";
import { generateSecretKey, nip19 } from "nostr-tools";
import { accounts } from "./accounts";
import { KINDS, NIP46_RELAY, rxNostr } from "./nostr";
import { createRxForwardReq } from "rx-nostr";
import { map } from "rxjs";
import { BaseAccount } from "applesauce-accounts";

export type AuthMethod = "nip07" | "nsec" | "nip46";

export const NIP46_PERMISSIONS = [
  `sign_event:${KINDS.SEARCH_REQUEST}`,
  `sign_event:${KINDS.PROPOSAL}`,
  `sign_event:${KINDS.NONCE}`,
  `sign_event:${KINDS.ADAPTOR}`,
  `sign_event:${KINDS.DELETION}`,
  `nip04_encrypt`,
];

/**
 * Authenticate a user with one of the supported methods
 * @param method The authentication method to use
 * @param nsec The nsec value if the method is 'nsec'
 * @param remoteRelay Optional custom NIP-46 relay URL for remote signing
 * @returns The account or signer instance
 */
export async function signIn(
  method: AuthMethod,
  nsec?: string,
  pubkey?: string,
  remoteRelay?: string
) {
  let account: BaseAccount<any, any, any> | undefined;

  if (method === "nip07" && window.nostr) {
    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();
    account = new ExtensionAccount(pubkey, signer);
  } else if ("nsec" === method && nsec) {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== "nsec") throw new Error("Invalid nsec");

    const key = decoded.data;
    const signer = new SimpleSigner(key);
    const pubkey = await signer.getPublicKey();
    account = new SimpleAccount(pubkey, signer);
  } else if (method === "nip46") {
    let key = nsec
      ? (nip19.decode(nsec).data as Uint8Array<ArrayBufferLike>)
      : generateSecretKey();
    const simpleSigner = new SimpleSigner(key);

    const signer = new NostrConnectSigner({
      pubkey,
      relays: [remoteRelay || NIP46_RELAY],
      signer: simpleSigner,
      subscriptionMethod: (relays, filters) => {
        const rxReq = createRxForwardReq();

        queueMicrotask(() => {
          rxReq.emit(filters);
        });

        return rxNostr
          .use(rxReq, { on: { relays } })
          .pipe(map((packet) => packet.event));
      },
      publishMethod: (relays, event) => {
        rxNostr.send(event, { on: { relays } });
      },
    });

    return signer;
  }

  if (account) {
    accounts.addAccount(account);
    accounts.setActive(account);
  }

  return account;
}
