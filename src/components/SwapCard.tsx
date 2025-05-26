import { NostrEvent } from "nostr-tools";
import {
  createEffect,
  createMemo,
  createSignal,
  from,
  Match,
  Switch,
} from "solid-js";
import { replaceableLoader } from "../lib/loaders";
import { Card, CardContent, CardFooter } from "./ui/card";
import { CashuSigSpec, NostrSigSpec } from "../schema";
import EventPreview from "./EventPreview";
import { accounts } from "../lib/accounts";
import { formatAmount } from "../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Swap } from "../queries/swap";
import SwapNonceActions from "./SwapNonceActions";
import SwapAdaptorActions from "./SwapAdaptorActions";

export function SwapCard(props: { swap: Swap; campaign: NostrEvent }) {
  const account = from(accounts.active$);
  const [mint, setMint] = createSignal<string | undefined>(undefined);

  const taken = createMemo(() => {
    return JSON.parse(props.swap.proposal.content).take;
  });

  const given = createMemo(() => {
    return JSON.parse(props.swap.proposal.content).give;
  });

  createEffect(async () => {
    replaceableLoader.next({
      pubkey: props.swap.proposer,
      kind: 0,
    });
  });

  return (
    <Card class="flex flex-col h-full">
      <CardContent class="flex-grow py-4">
        <Switch>
          <Match when={taken()?.type === "cashu"}>
            {(() => {
              const cashuSpec = taken() as CashuSigSpec;
              const mintOptions =
                typeof cashuSpec.mint === "string"
                  ? [cashuSpec.mint]
                  : cashuSpec.mint;
              setMint(mintOptions[0]);

              return (
                <div class="flex flex-row gap-2 justify-between mb-4 items-center">
                  <div class="flex flex-row items-end gap-2 text-lg">
                    <div class="text-3xl font-bold">
                      {formatAmount(cashuSpec.amount)}
                    </div>
                    <div>sats</div>
                  </div>
                  <Select
                    value={mint()}
                    onChange={setMint}
                    options={mintOptions}
                    placeholder="Select a mint..."
                    itemComponent={(props: any) => (
                      <SelectItem item={props.item}>
                        {props.item.rawValue.replace("https://", "")}
                      </SelectItem>
                    )}
                  >
                    <SelectTrigger aria-label="Fruit" class="w-[180px]">
                      <SelectValue class="overflow-hidden text-ellipsis">
                        {(state: any) =>
                          state.selectedOption().replace("https://", "")
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
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
                      pubkey: props.swap.proposer,
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
            when={account() && account()!.pubkey === props.swap.noncePubkey}
          >
            <SwapNonceActions swap={props.swap} />
          </Match>
          <Match
            when={account() && account()!.pubkey !== props.swap.noncePubkey}
          >
            <SwapAdaptorActions swap={props.swap} />
          </Match>
        </Switch>
      </CardFooter>
    </Card>
  );
}
