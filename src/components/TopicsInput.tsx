import { createSignal, For, JSX, mergeProps } from "solid-js";
import { Badge } from "./ui/badge";
import {
  TextField,
  TextFieldDescription,
  TextFieldInput,
  TextFieldLabel,
} from "./ui/text-field";
import { topicSchema } from "../schemas/campaignSchema";
import { LucideTag } from "lucide-solid";

type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  label?: JSX.Element | string;
  description?: string;
};

const defaultProps = {
  label: (
    <div class="flex items-center gap-1">
      <LucideTag class="w-4 h-4" /> Topic Tags
    </div>
  ),
  description: "",
};

export function TopicsInput(props: TagInputProps) {
  props = mergeProps(defaultProps, props);

  const [currentTopic, setCurrentTopic] = createSignal("");

  const addTopic = (topic: string) => {
    if (
      topic &&
      topicSchema.safeParse(topic).success &&
      !props.value.includes(topic)
    ) {
      props.onChange([...props.value, topic]);
      setCurrentTopic("");
    }
  };

  const removeTag = (index: number) => {
    props.onChange(props.value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <TextField>
        <TextFieldLabel class="mb-1">{props.label}</TextFieldLabel>
        <div class="relative">
          <div class="absolute left-2 top-1/2 -translate-y-1/2 flex flex-wrap gap-1 max-w-[calc(100%-6rem)] items-center">
            <For each={props.value}>
              {(topic, index) => (
                <Badge variant="secondary" class="h-5 gap-1 pr-1">
                  {topic}
                  <button
                    type="button"
                    class="hover:text-red-500 transition-colors"
                    onClick={() => removeTag(index())}
                  >
                    ×
                  </button>
                </Badge>
              )}
            </For>
          </div>
          <TextFieldInput
            placeholder={
              props.value.length ? "" : "podcast, meetup, foss, etc."
            }
            value={currentTopic()}
            class="pl-2"
            style={{
              "padding-left": props.value.length
                ? "calc(0.5rem + " +
                  props.value.reduce(
                    (acc, topic) => acc + topic.length * 0.42 + 2,
                    0
                  ) +
                  "rem)"
                : "0.5rem",
            }}
            onInput={(e) =>
              setCurrentTopic(e.currentTarget.value.toLowerCase())
            }
            onBlur={() => {
              const topic = currentTopic().trim();
              if (topic) {
                const result = topicSchema.safeParse(topic);
                if (result.success && !props.value.includes(topic)) {
                  addTopic(topic);
                }
              }
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const topic = currentTopic().trim();
                if (topic) {
                  addTopic(topic);
                }
              }
            }}
          />
        </div>

        {props.description ? (
          <TextFieldDescription class="text-xs">
            {props.description}
          </TextFieldDescription>
        ) : (
          ""
        )}
      </TextField>
      {props.error && <p class="text-red-500 text-xs mt-1">{props.error}</p>}
    </div>
  );
}
