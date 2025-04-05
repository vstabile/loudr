import { NostrEvent } from "nostr-tools";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { createEffect, from } from "solid-js";
import { queryStore } from "../stores";
import { ProfileQuery } from "applesauce-core/queries";
import { truncatedNpub } from "../lib/utils";
import { replaceableLoader } from "../loaders";

export default function CampaignCard(props: { campaign: NostrEvent }) {
  const sponsor = from(
    queryStore.createQuery(ProfileQuery, props.campaign.pubkey)
  );

  createEffect(async () => {
    replaceableLoader.next({
      pubkey: props.campaign.pubkey,
      kind: 0,
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {props.campaign.tags.find((tag) => tag[0] === "title")?.[1]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{props.campaign.tags.find((tag) => tag[0] === "brief")?.[1]}</p>
      </CardContent>
      <CardFooter>
        <div class="flex flex-row items-center">
          <img
            src={
              sponsor()?.picture ||
              "https://robohash.org/" + props.campaign.pubkey
            }
            class="h-8 w-8 rounded-full mr-2"
          />
          <p>
            {sponsor() ? sponsor()?.name : truncatedNpub(props.campaign.pubkey)}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
