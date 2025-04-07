import { ExtensionAccount, SimpleAccount } from "applesauce-accounts/accounts";
import { ExtensionSigner, SimpleSigner } from "applesauce-signers";
import { nip19 } from "nostr-tools";
import { accounts } from "../accounts";

export type AuthMethod = "nip07" | "nsec";

export async function signIn(method: AuthMethod, nsec?: string) {
  let account;

  if (method === "nip07" && window.nostr) {
    console.log("signing in with nip07");
    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();
    account = new ExtensionAccount(pubkey, signer);
  } else if (method === "nsec" && nsec) {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== "nsec") throw new Error("Invalid nsec");

    const key = decoded.data;
    const signer = new SimpleSigner(key);
    const pubkey = await signer.getPublicKey();
    account = new SimpleAccount(pubkey, signer);
  }

  if (account) {
    accounts.addAccount(account);
    accounts.setActive(account);
  }

  return account;
}
