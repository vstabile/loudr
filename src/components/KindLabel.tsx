import { LucideNewspaper, LucideRepeat2, LucideStickyNote } from "lucide-solid";
import { Match, Switch } from "solid-js";
import { PartialEventTemplate } from "../schemas/miscSchema";

export default function KindLabel(props: { template: PartialEventTemplate }) {
  const qTag = props.template.tags?.find((tag) => tag[0] === "q");

  return (
    <Switch>
      <Match when={props.template.kind === 1 && !qTag}>
        <div class="flex flex-row items-center gap-1">
          <LucideStickyNote class="w-5 h-5 mr-1" /> Text Note
        </div>
      </Match>
      <Match when={props.template.kind === 30023}>
        <div class="flex flex-row items-center gap-1">
          <LucideNewspaper class="w-5 h-5 mr-1" /> Article
        </div>
      </Match>
      <Match when={[6, 16].includes(props.template.kind!) || qTag}>
        <div class="flex flex-row items-center gap-1">
          <LucideRepeat2 class="w-5 h-5 mr-1" /> Repost
        </div>
      </Match>
      <Match when={props.template.kind === 7}>
        <div class="flex flex-row items-center gap-1">
          <span class="text-xl mr-1">{props.template.content}</span> React
        </div>
      </Match>
    </Switch>
  );
}
