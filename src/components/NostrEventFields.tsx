import { Show } from "solid-js";
import KindInput from "./KindInput";
import { Field, FormStore } from "@modular-forms/solid";
import EventInput, { toEventId } from "./EventInput";
import { TextField, TextFieldTextArea } from "./ui/text-field";
import EventPreview from "./EventPreview";
import { LucideRepeat2 } from "lucide-solid";
import EmojiPicker from "./EmojiPicker";
import { KINDS } from "../lib/nostr";

export type EventCoordinates = {
  kind: number;
  pubkey: string;
  identifier: string;
};

export default function NostrEventFields(props: {
  form: FormStore<any>;
  name: string;
}) {
  function contentPlaceholder(kind: number) {
    if (kind === 1) {
      return "An optional example of the content to be posted";
    } else if (kind === 6) {
      return "An optional quote suggestion for the repost";
    } else {
      return "An optional json template for the sponsored event";
    }
  }

  return (
    <Field<any, undefined, any>
      type="number"
      name={`${props.name}.kind`}
      of={props.form}
    >
      {(kindField, kindProps) => (
        <Field<any, undefined, any>
          name={`${props.name}.refId`}
          type="string"
          transform={toEventId()}
          of={props.form}
        >
          {(refEventField, refEventProps) => (
            <div class="flex flex-col gap-0">
              <div class="flex flex-col sm:flex-row gap-0">
                <div
                  class={
                    [KINDS.REPOST, KINDS.REACTION].includes(kindField.value)
                      ? "w-full sm:w-1/3"
                      : "w-full"
                  }
                >
                  <KindInput
                    {...kindProps}
                    value={kindField.value}
                    error={kindField.error}
                  />
                </div>

                <Show
                  when={[KINDS.REPOST, KINDS.REACTION].includes(
                    kindField.value
                  )}
                >
                  <div class="flex-auto">
                    <div class="flex items-center gap-2 relative">
                      <Show when={kindField.value === KINDS.REPOST}>
                        <LucideRepeat2 class="h-5 w-5 absolute left-3 text-muted-foreground" />
                      </Show>
                      <Show when={kindField.value === KINDS.REACTION}>
                        <div class="absolute left-3 items-center flex text-lg">
                          <Field<any, undefined, "template.reaction">
                            name="template.reaction"
                            type="string"
                            of={props.form}
                          >
                            {(reactionField, reactionProps) => (
                              <>
                                <EmojiPicker
                                  {...reactionProps}
                                  value={reactionField.value}
                                  error={reactionField.error}
                                />
                                {reactionField.error && (
                                  <p class="text-red-500 text-xs ml-0.5 mt-1 w-full">
                                    {reactionField.error}
                                  </p>
                                )}
                              </>
                            )}
                          </Field>
                        </div>
                      </Show>
                      <EventInput
                        {...refEventProps}
                        value={refEventField.value}
                        class={
                          (kindField.value === 6 ? "rounded-b-none " : "") +
                          "pl-10 rounded-l-none border-l-0"
                        }
                      />
                    </div>
                  </div>
                </Show>
              </div>
              <Show
                when={
                  kindField.value &&
                  ![KINDS.REACTION, KINDS.ARTICLE].includes(kindField.value)
                }
              >
                <Field<any, undefined, any>
                  name={`${props.name}.content`}
                  type="string"
                  of={props.form}
                >
                  {(contentField, contentProps) => (
                    <TextField>
                      <TextFieldTextArea
                        {...contentProps}
                        value={contentField.value}
                        class="min-h-[40px] rounded-t-none border-t-0"
                        id="content"
                        placeholder={contentPlaceholder(kindField.value)}
                      />
                      {contentField.error && (
                        <p class="text-red-500 text-xs ml-0.5">
                          {contentField.error}
                        </p>
                      )}
                    </TextField>
                  )}
                </Field>
              </Show>
              <Show when={refEventField.value}>
                <div class="mt-2">
                  <EventPreview id={refEventField.value} />
                </div>
              </Show>

              {kindField.error && (
                <p class="text-red-500 text-xs ml-0.5 mt-1 w-full">
                  {kindField.error}
                </p>
              )}
              {refEventField.error && (
                <p class="text-red-500 text-xs ml-0.5 mt-1 w-full">
                  {refEventField.error}
                </p>
              )}
            </div>
          )}
        </Field>
      )}
    </Field>
  );
}
