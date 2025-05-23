import { NostrEvent } from "nostr-tools";
import {
  Accessor,
  createEffect,
  createMemo,
  For,
  from,
  Match,
  Switch,
} from "solid-js";
import { replaceableLoader } from "../lib/loaders";
import { queryStore } from "../stores/queryStore";
import { truncatedNpub } from "../lib/utils";
import ProfilePicture from "./ProfilePicture";
import { Card, CardContent } from "./ui/card";
import { CashuSigSpec, NostrSigSpec, ProposalContent } from "../schema";

export function ProposalCard(props: { proposal: NostrEvent }) {
  const content: Accessor<ProposalContent | undefined> = createMemo(() => {
    try {
      return JSON.parse(props.proposal.content);
    } catch (error) {
      console.error(error);
    }
  });

  const taken = createMemo(() => {
    return content()?.take;
  });

  const given = createMemo(() => {
    return content()?.give;
  });

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
        <p>is asking for</p>
        <Switch>
          <Match when={taken()?.type === "cashu"}>
            {(() => {
              const cashuSpec = taken() as CashuSigSpec;
              return (
                <>
                  <p>{cashuSpec.amount} sats</p>
                  <For
                    each={
                      typeof cashuSpec.mint === "string"
                        ? [cashuSpec.mint]
                        : cashuSpec.mint
                    }
                  >
                    {(mint: string) => <p>{mint}</p>}
                  </For>
                </>
              );
            })()}
          </Match>
        </Switch>
        <p>in exchange for</p>
        <Switch>
          <Match when={given()?.type === "nostr"}>
            {(() => {
              const nostrSpec = given() as NostrSigSpec;
              return (
                <>
                  <p>{nostrSpec.template.content}</p>
                </>
              );
            })()}
          </Match>
        </Switch>
      </CardContent>
    </Card>
  );
}
