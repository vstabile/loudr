import { For, JSX, mergeProps } from "solid-js";
import { Badge } from "./ui/badge";
import {
  TextField,
  TextFieldDescription,
  TextFieldInput,
  TextFieldLabel,
} from "./ui/text-field";
import { mintSchema, cleanUrlForDisplay } from "../schemas/mintSchema";
import { LucideNut } from "lucide-solid";

type MintInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  label?: JSX.Element | string;
  description?: string;
};

const defaultProps = {
  label: (
    <div class="flex items-center gap-1">
      <LucideNut class="w-4 h-4" /> Trusted Mints
    </div>
  ),
  description: "Mints you trust that correctly implement NIP-07 and NIP-11.",
};

export function MintsInput(props: MintInputProps) {
  props = mergeProps(defaultProps, props);

  const addMint = (url: string) => {
    if (
      url &&
      mintSchema.safeParse(url).success &&
      !props.value.includes(url)
    ) {
      props.onChange([...props.value, url]);
      return true;
    }
    return false;
  };

  const removeMint = (index: number) => {
    props.onChange(props.value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <TextField>
        <TextFieldLabel class="mb-1">{props.label}</TextFieldLabel>
        <div class="relative">
          <div class="absolute left-2 top-1/2 -translate-y-1/2 flex flex-wrap gap-1 max-w-[calc(100%-6rem)] items-center">
            <For each={props.value}>
              {(mint, index) => (
                <Badge variant="secondary" class="h-5 gap-1 pr-1">
                  {cleanUrlForDisplay(mint)}
                  <button
                    type="button"
                    class="hover:text-red-500 transition-colors"
                    onClick={() => removeMint(index())}
                  >
                    ×
                  </button>
                </Badge>
              )}
            </For>
          </div>
          <TextFieldInput
            placeholder={props.value.length ? "" : "https://mint.example.com"}
            class="pl-2"
            style={{
              "padding-left": props.value.length
                ? "calc(0.5rem + " +
                  props.value.reduce(
                    (acc, url) =>
                      acc + cleanUrlForDisplay(url).length * 0.4 + 2,
                    0
                  ) +
                  "rem)"
                : "0.5rem",
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const value = e.currentTarget.value.trim();
                if (addMint(value)) {
                  e.currentTarget.value = "";
                }
              }
            }}
            onBlur={(e) => {
              const value = e.currentTarget.value.trim();
              if (addMint(value)) {
                e.currentTarget.value = "";
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
