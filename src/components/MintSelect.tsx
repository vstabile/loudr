import { For, JSX } from "solid-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { LucideX } from "lucide-solid";

type MintSelectProps = {
  name: string;
  label?: JSX.Element | string;
  placeholder?: string;
  options: string | string[];
  value: string[] | undefined;
  error: string;
  required?: boolean;
  ref: (element: HTMLInputElement) => void;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  onChange: JSX.EventHandler<HTMLInputElement, Event>;
  onBlur: JSX.EventHandler<HTMLInputElement, FocusEvent>;
  setValue: (value: string[]) => void;
};

export default function MintSelect(props: MintSelectProps) {
  const options =
    typeof props.options === "string" ? [props.options] : props.options;

  return (
    <>
      <Select<string>
        multiple
        value={props.value}
        onChange={props.setValue}
        options={options}
        placeholder="Acceptable mints..."
        itemComponent={(props: any) => (
          <SelectItem item={props.item}>
            {props.item.rawValue.replace("https://", "")}
          </SelectItem>
        )}
      >
        <SelectTrigger aria-label="Mint" class="w-full p-1.5 h-auto">
          <SelectValue class="text-xs overflow-hidden text-ellipsis w-full">
            {/* {(state: any) => state.selectedOption().replace("https://", "")} */}
            {(state: any) => (
              <div class="flex flex-row gap-1 overflow-hidden justify-between">
                <div class="flex flex-wrap gap-1">
                  <For each={state.selectedOptions()}>
                    {(option) => (
                      <span
                        class="flex gap-1 bg-muted rounded-md px-1 py-1"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {(() => {
                          try {
                            return new URL(option).host;
                          } catch {
                            return option.replace("https://", "");
                          }
                        })()}
                        <button onClick={() => state.remove(option)}>
                          <LucideX class="size-3" />
                        </button>
                      </span>
                    )}
                  </For>
                </div>
                <button
                  class="flex items-center justify-center"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={state.clear}
                >
                  <LucideX class="size-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
      <p class="text-xs text-muted-foreground">
        Ensure the mints you trust correctly implement NIP-07 and NIP-11.
      </p>
    </>
  );
}
