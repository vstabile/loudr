import { NumberField, NumberFieldInput } from "./ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { createMemo, createSignal, JSX, splitProps } from "solid-js";
import { KINDS } from "../lib/nostr";

type KindInputProps = {
  name: string;
  label?: string;
  placeholder?: string;
  value: number;
  error: string;
  required?: boolean;
  ref: (element: HTMLInputElement) => void;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLInputElement, Event>;
  onBlur: JSX.EventHandler<HTMLInputElement, FocusEvent>;
  excludeKinds?: number[];
};

const defaultOptions = [
  { label: "Text Note", value: KINDS.NOTE },
  { label: "Repost", value: KINDS.REPOST },
  { label: "Reaction", value: KINDS.REACTION },
  { label: "Long-form Content", value: KINDS.ARTICLE },
  { label: "Other kind", value: KINDS.PICTURE },
];

export default function KindInput(props: KindInputProps) {
  const [, inputProps] = splitProps(props, ["value", "label", "error", "ref"]);
  const options = defaultOptions.filter(
    (o) => !props.excludeKinds?.includes(o.value)
  );
  const startingValue = options.find((o) => o.value === props.value);
  const [selectedOption, setSelectedOption] = createSignal(startingValue);

  let kindInputRef: HTMLInputElement | undefined;

  const triggerClass = createMemo(() => {
    if (!selectedOption()) return "";
    let c = ![KINDS.REACTION, KINDS.ARTICLE]
      .filter((k) => !props.excludeKinds?.includes(k))
      .includes(selectedOption()!.value)
      ? "rounded-b-none"
      : "";

    if (
      ![KINDS.NOTE, KINDS.ARTICLE]
        .filter((k) => !props.excludeKinds?.includes(k))
        .includes(selectedOption()!.value)
    ) {
      c += " rounded-r-none";
    }

    return c;
  });

  const hideNumberField = createMemo(() => {
    if (selectedOption()?.value === undefined) return true;
    if (
      [KINDS.NOTE, KINDS.REPOST, KINDS.ARTICLE, KINDS.REACTION]
        .filter((k) => !props.excludeKinds?.includes(k))
        .includes(selectedOption()!.value)
    ) {
      return true;
    }
    return false;
  });

  return (
    <div class="flex flex-row w-full">
      <Select
        value={selectedOption()}
        onChange={(option) => {
          if (!option) return;
          setSelectedOption(option);

          if (kindInputRef) {
            kindInputRef.value = String(option.value);
            kindInputRef.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }}
        options={options}
        optionValue="value"
        optionTextValue="label"
        placeholder="Select event kind"
        itemComponent={(props: any) => (
          <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
        )}
        class="w-full"
      >
        <SelectTrigger aria-label="Event Kind" class={triggerClass()}>
          <SelectValue>
            {(state: any) => state.selectedOption()?.label || "Other kind"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>

      <NumberField
        value={props.value}
        onChange={(value: string) => {
          const num = Number(value);

          if (!isNaN(num)) {
            const option = options.find((o) => o.value === num);
            setSelectedOption(option || { label: "Other kind", value: num });
          }
        }}
        validationState={props.error ? "invalid" : "valid"}
        minValue={KINDS.MIN}
        maxValue={KINDS.MAX}
        format={false}
        hidden={hideNumberField()}
      >
        <NumberFieldInput
          ref={(el: HTMLInputElement) => {
            kindInputRef = el;
            props.ref?.(el);
          }}
          type="number"
          {...inputProps}
          id="kind"
          class="rounded-l-none rounded-b-none border-l-0"
        />
      </NumberField>
    </div>
  );
}
