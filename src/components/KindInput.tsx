import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
} from "./ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { createMemo, createSignal, JSX, mergeProps } from "solid-js";

type KindInputProps = {
  value?: number;
  onChange: (value: number) => void;
  error?: string;
  label?: JSX.Element | string;
  description?: string;
};

const defaultProps = {
  label: "",
  description: "The kind of the event being sponsored",
};

const list: [string, number | undefined][] = [
  ["Text Note (1)", 1],
  ["Repost (6)", 6],
  ["Reaction (7)", 7],
  ["Long-form Content (30023)", 30023],
  ["Other kind", undefined],
];

export default function KindInput(props: KindInputProps) {
  props = mergeProps(defaultProps, props);
  const [showNumberField, setShowNumberField] = createSignal(false);

  const labelFromValue = createMemo(() => {
    return props.value
      ? list.find(([_, kind]) => kind === props.value)?.[0] || list.at(-1)?.[0]
      : undefined;
  });

  function valueFromLabel(label: string | undefined) {
    return list.find(([l, _]) => l === label)?.[1];
  }

  function selectValue(label: string | null) {
    if (!label) {
      return;
    }

    const kind = valueFromLabel(label);

    if (kind) {
      props.onChange(kind);
      setShowNumberField(false);
    } else {
      props.onChange(20);
      setShowNumberField(true);
    }
  }

  const triggerClass = createMemo(() => {
    if (!props.value) return "";
    let c = ![7, 30023].includes(props.value) ? "rounded-b-none" : "";

    if (![1, 30023].includes(props.value)) {
      c += " rounded-r-none";
    }

    return c;
  });

  return (
    <>
      <div class="flex flex-row w-full">
        <Select
          value={labelFromValue()}
          onChange={selectValue}
          options={list.map(([label, _]) => label)}
          placeholder="Kind of the sponsored event"
          itemComponent={(props: any) => (
            <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
          )}
          class="w-full"
        >
          <SelectTrigger aria-label="Event Kind" class={triggerClass()}>
            <SelectValue>{(state: any) => state.selectedOption()}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <NumberField
          value={props.value}
          onChange={(value: string) => {
            const num = Number(value);

            if (!isNaN(num)) {
              props.onChange(num);
              if (labelFromValue() !== "Other kind") {
                setShowNumberField(false);
              }
            } else {
              props.onChange(20);
            }
          }}
          validationState={props.error ? "invalid" : "valid"}
          class={showNumberField() ? "" : "hidden"}
          minValue={0}
          maxValue={65535}
        >
          <NumberFieldGroup>
            <NumberFieldInput
              id="kind"
              class="rounded-l-none rounded-b-none border-l-0"
            />
            <NumberFieldIncrementTrigger />
            <NumberFieldDecrementTrigger />
          </NumberFieldGroup>
        </NumberField>
      </div>
    </>
  );
}
