import { createEffect, createSignal, JSX, mergeProps, Show } from "solid-js";
import { TextField, TextFieldInput } from "./ui/text-field";
import { LucideRepeat2 } from "lucide-solid";
import { Field, FormStore, setValue } from "@modular-forms/solid";
import { CampaignForm } from "../schemas/campaignSchema";
import EmojiPicker from "./EmojiPicker";
import { nip19 } from "nostr-tools";
import { eventIdSchema, eventUrlSchema } from "../schemas/miscSchema";

type EventInputProps = {
  value: string | undefined;
  kind: number;
  onChange: (value: string) => void;
  label?: JSX.Element | string;
  description?: string;
  placeholder?: string;
  form: FormStore<CampaignForm>;
};

const defaultProps = {
  label: "",
  description: "Insert the event ID, nevent or a sharable URL",
  placeholder: "Event ID, nevent or URL",
};

export default function EventInput(props: EventInputProps) {
  props = mergeProps(defaultProps, props);
  const [currentValue, setCurrentValue] = createSignal(props.value);

  createEffect(() => console.log("currentValue", currentValue()));

  const handleInput = (value: string) => {
    setCurrentValue(value);

    try {
      // Case 1: Direct event ID
      if (eventIdSchema.safeParse(value).success) {
        props.onChange(value);
        return;
      }

      // Case 2: nevent string
      if (value.startsWith("nevent1")) {
        try {
          const decoded = nip19.decode(value);
          if (decoded.type === "note") {
            props.onChange(decoded.data);
            return;
          }
        } catch {}
      }

      // Case 3: URL containing event ID or nevent
      if (value.startsWith("http")) {
        const urlResult = eventUrlSchema.safeParse(value);
        if (urlResult.success) {
          const url = new URL(value);
          const pathSegments = url.pathname.split("/");
          const lastSegment = pathSegments[pathSegments.length - 1];

          if (eventIdSchema.safeParse(lastSegment).success) {
            props.onChange(lastSegment);
            return;
          }

          if (lastSegment.startsWith("nevent1")) {
            try {
              const decoded = nip19.decode(lastSegment);
              if (decoded.type === "nevent") {
                props.onChange(decoded.data.id);
              }
              return;
            } catch {}
          }
        }
      }

      // If we get here, the input wasn't valid
      props.onChange(value);
    } catch (error) {
      props.onChange(value);
    }
  };

  return (
    <TextField value={currentValue()} onChange={handleInput} class="w-full">
      <div class="flex items-center gap-2 relative">
        <Show when={props.kind === 6}>
          <LucideRepeat2 class="h-5 w-5 absolute left-3 text-muted-foreground" />
        </Show>
        <Show when={props.kind === 7}>
          <div class="absolute left-3 items-center flex text-lg">
            <Field name="reaction" of={props.form}>
              {(reactionField, _) => (
                <EmojiPicker
                  value={reactionField.value}
                  onChange={(value) => setValue(props.form, "reaction", value)}
                />
              )}
            </Field>
          </div>
        </Show>
        <TextFieldInput
          placeholder={props.placeholder}
          class={
            (props.kind === 6 ? "rounded-b-none " : "") +
            "pl-10 rounded-l-none border-l-0"
          }
          onInput={(e) => handleInput(e.currentTarget.value)}
        />
      </div>
    </TextField>
  );
}
