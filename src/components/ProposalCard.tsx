import { NostrEvent } from "nostr-tools";
import { createEffect, from } from "solid-js";
import { replaceableLoader } from "../lib/loaders";
import { queryStore } from "../stores/queryStore";
import { truncatedNpub } from "../lib/utils";
import ProfilePicture from "./ProfilePicture";
import { Card, CardContent } from "./ui/card";

export function ProposalCard(props: { proposal: NostrEvent }) {
  // const content = createMemo(() => {
  //   try {
  //     return JSON.parse(props.proposal.content);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // });

  const proposer = from(queryStore.profile(props.proposal.pubkey));

  createEffect(async () => {
    replaceableLoader.next({
      pubkey: props.proposal.pubkey,
      kind: 0,
    });
  });

  return (
    <Card class="flex flex-col h-full">
      <CardContent class="flex-grow py-4">
        <div class="flex flex-row items-center mb-2 gap-2">
          <div class="w-6 h-6 rounded-full overflow-hidden">
            <ProfilePicture profile={proposer} pubkey={props.proposal.pubkey} />
          </div>
          <p>
            {proposer()
              ? proposer()?.name
              : truncatedNpub(props.proposal.pubkey)}
          </p>
          <p class="text-gray-400 ml-2 text-sm truncate">
            {proposer() && proposer()?.nip05}
          </p>
        </div>
        <p class="text-xs">{props.proposal.content}</p>
      </CardContent>
    </Card>
  );
}
