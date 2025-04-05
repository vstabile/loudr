import { ExtensionSigner } from "applesauce-signers";
import { accounts } from "../accounts";
import { ExtensionAccount } from "applesauce-accounts/accounts";
import { from } from "solid-js";
import User from "./User";
import { Button } from "./ui/button";
import CreateCampaign from "./CreateCampaign";

export default function Navbar() {
  const account = from(accounts.active$);

  const signin = async () => {
    // do nothing if the user is already signed in
    if (accounts.active) return;

    // create a new nip-07 signer and try to get the pubkey
    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();

    // create a new extension account, add it, and make it the active account
    const account = new ExtensionAccount(pubkey, signer);
    accounts.addAccount(account);
    accounts.setActive(account);
  };

  return (
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-12 items-center">
          <div class="flex justify-start items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-gray-800 mr-4">Loudr</h1>
            </div>
            <div class="flex gap-4">
              {account() !== undefined ? <CreateCampaign /> : ""}
            </div>
          </div>
          <div>
            {account() === undefined ? (
              <Button variant="default" size="sm" onClick={signin}>
                Sign In
              </Button>
            ) : (
              <div class="flex items-center gap-4">
                <User />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
