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
import { Card, CardContent, CardFooter } from "./ui/card";
import { CashuSigSpec, NostrSigSpec, ProposalContent } from "../schema";
import EventPreview from "./EventPreview";
import { accounts } from "../lib/accounts";
import { Button } from "./ui/button";
import { ProfilePreview } from "./ProfilePreview";

export function ProposalCard(props: {
  proposal: NostrEvent;
  campaign: NostrEvent;
}) {
  const account = from(accounts.active$);
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
        <div class="mb-2">
          <ProfilePreview profile={proposer} pubkey={props.proposal.pubkey} />
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
                <div class="mt-2">
                  <EventPreview
                    event={{
                      ...nostrSpec.template,
                      pubkey: props.proposal.pubkey,
                    }}
                  />
                </div>
              );
            })()}
          </Match>
        </Switch>
      </CardContent>
      <CardFooter>
        <Switch>
          <Match
            when={account() && props.proposal.pubkey === account()!.pubkey}
          >
            <Button variant="outline" class="text-red-600 border-red-600">
              Cancel
            </Button>
          </Match>
          <Match
            when={account() && props.campaign.pubkey === account()!.pubkey}
          >
            <div class="flex gap-2 justify-between w-full">
              <Button variant="outline" class="text-red-600 border-red-600">
                Deny
              </Button>
              <Button>Accept</Button>
            </div>
          </Match>
        </Switch>
      </CardFooter>
    </Card>
  );
}
