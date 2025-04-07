import { createSignal, JSX, mergeProps } from "solid-js";
import { TextField, TextFieldInput } from "./ui/text-field";
import {
  Maybe,
  MaybeValue,
  toCustom,
  TransformField,
} from "@modular-forms/solid";
import { nip19 } from "nostr-tools";
import { eventIdSchema, eventUrlSchema } from "../schemas/miscSchema";

type EventInputProps = {
  value?: string;
  label?: JSX.Element | string;
  description?: string;
  placeholder?: string;
  class?: string;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
};

const defaultProps = {
  label: "",
  description: "",
  placeholder: "Event ID, nevent or URL",
};

function parseEventId(value: string): string | undefined {
  try {
    // Case 1: Direct event ID
    if (eventIdSchema.safeParse(value).success) {
      return value;
    }

    // Case 2: nevent string
    if (value.startsWith("nevent1")) {
      const decoded = nip19.decode(value);
      if (decoded.type !== "nevent") return;

      const eventId = decoded.data.id;
      if (eventIdSchema.safeParse(eventId).success) {
        return decoded.data.id;
      }
    }

    // Case 3: URL containing event ID or nevent
    if (value.startsWith("http")) {
      const urlResult = eventUrlSchema.safeParse(value);
      if (urlResult.success) {
        const url = new URL(value);
        const pathSegments = url.pathname.split("/");
        const lastSegment = pathSegments[pathSegments.length - 1];

        if (eventIdSchema.safeParse(lastSegment).success) {
          return lastSegment;
        }

        if (lastSegment.startsWith("nevent1")) {
          const decoded = nip19.decode(lastSegment);
          if (decoded.type !== "nevent") return;

          const eventId = decoded.data.id;
          if (eventIdSchema.safeParse(eventId).success) {
            return decoded.data.id;
          }
        }
      }
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

export function toEventId<
  TValue extends MaybeValue<string>
>(): TransformField<TValue> {
  return toCustom<TValue>(
    (value) => parseEventId(value ?? "") as Maybe<TValue>,
    {
      on: "input",
    }
  );
}

export default function EventInput(props: EventInputProps) {
  props = mergeProps(defaultProps, props);
  const [displayValue, setDisplayValue] = createSignal(props.value);

  return (
    <TextField class="w-full">
      <TextFieldInput
        {...props}
        placeholder={props.placeholder}
        value={displayValue()}
        onInput={(e) => {
          setDisplayValue(e.currentTarget.value);
          props.onInput?.(e);
        }}
      />
    </TextField>
  );
}
