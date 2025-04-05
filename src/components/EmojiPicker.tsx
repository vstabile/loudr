import { createSignal, For, createMemo } from "solid-js";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TextField, TextFieldInput } from "./ui/text-field";
import emojiData from "unicode-emoji-json/data-by-group.json";

type EmojiPickerProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};

type EmojiData = {
  name: string;
  slug: string;
  emojis: {
    emoji: string;
    name: string;
    slug: string;
    skin_tone_support: boolean;
    unicode_version: string;
    emoji_version: string;
  }[];
}[];

export default function EmojiPicker(props: EmojiPickerProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");

  const filteredEmojis = createMemo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return emojiData;

    const filtered: EmojiData = [];

    for (const category of emojiData) {
      const matchedEmojis = category.emojis.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.emoji.toLowerCase().includes(query) ||
          item.slug.toLowerCase().includes(query)
      );

      if (matchedEmojis.length > 0) {
        filtered.push({
          name: category.name,
          slug: category.slug,
          emojis: matchedEmojis,
        });
      }
    }

    return filtered;
  });

  const selectEmoji = (emoji: string) => {
    props.onChange(emoji === "👍" ? "+" : emoji === "👎" ? "-" : emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen()} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger>
        <span>
          {props.value === "+"
            ? "👍"
            : props.value === "-"
            ? "👎"
            : props.value}
        </span>
      </PopoverTrigger>
      <PopoverContent class="w-[350px] p-2 pb-4">
        <div>
          <TextField class="mb-2">
            <TextFieldInput
              placeholder="Search emoji..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full h-8"
            />
          </TextField>

          <div class="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <For each={filteredEmojis()}>
              {({ name, emojis }) => (
                <div class="mb-4">
                  <h3 class="text-xs text-gray-500 mb-2 ml-1">{name}</h3>
                  <div class="grid grid-cols-12 gap-1">
                    <For each={emojis}>
                      {(item) => (
                        <button
                          class="hover:bg-gray-100 rounded flex text-lg h-6 w-6 items-center justify-center"
                          onClick={() => selectEmoji(item.emoji)}
                          title={item.name}
                        >
                          {item.emoji}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
