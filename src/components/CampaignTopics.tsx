import { NostrEvent } from "nostr-tools";
import { For, Show } from "solid-js";
import { Badge } from "./ui/badge";

export default function CampaignTopics(props: { campaign: NostrEvent }) {
  return (
    <Show when={props.campaign.tags.find((tag) => tag[0] === "t")?.length}>
      <div class="flex flex-row items-center gap-1">
        <For each={props.campaign.tags.filter((tag) => tag[0] === "t")}>
          {(topic, _) => <Badge variant="secondary">{topic[1]}</Badge>}
        </For>
      </div>
    </Show>
  );
}
