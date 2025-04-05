import { createEffect, createMemo, createSignal, from, Show } from "solid-js";
import KindInput from "./KindInput";
import {
  Field,
  FormStore,
  getError,
  getValue,
  setValue,
} from "@modular-forms/solid";
import EventInput from "./EventInput";
import { CampaignForm } from "../schemas/campaignSchema";
import { TextField, TextFieldTextArea } from "./ui/text-field";
import { eventTemplate } from "../schemas/miscSchema";
import { eventLoader } from "../loaders";
import { queryStore } from "../stores";
import { of } from "rxjs";
import { NostrEvent } from "nostr-tools";
import { LucideLoader } from "lucide-solid";

type KindInputGroupProps = {
  form: FormStore<CampaignForm>;
};

export default function KindInputGroup(props: KindInputGroupProps) {
  const [content, setContent] = createSignal("");

  const contentPlaceholder = createMemo(() => {
    const kind = getValue(props.form, "kind");

    if (kind === 1) {
      return "An optional example of the content to be posted";
    } else if (kind === 6) {
      return "An optional quote suggestion for the repost";
    } else {
      return "An optional json template for the sponsored event";
    }
  });

  return (
    <Field type="number" name="kind" of={props.form}>
      {(field, _) => {
        const showEventInput = createMemo(() => {
          return [6, 7].includes(field.value || 1);
        });

        const eventError = createMemo(() => getError(props.form, "eventId"));

        const reactionError = createMemo(() =>
          getError(props.form, "reaction")
        );

        const contentError = createMemo(() => getError(props.form, "content"));

        createEffect(() => {
          const eventId = getValue(props.form, "eventId");

          if (eventId) {
            eventLoader.next({ id: eventId });
          }
        });

        const nostrEventId = createMemo(() => getValue(props.form, "eventId"));

        const nostrEvent = from<NostrEvent>(
          getValue(props.form, "eventId")
            ? queryStore.event(nostrEventId()!)
            : of(undefined)
        );

        function formatContent(
          kind?: number,
          content?: string
        ): eventTemplate | undefined {
          if (content === undefined) return undefined;

          const eventId = ""; //event() ? event()!.id : undefined;
          // TODO: get relay, pubkey and kind from event
          const relay = "";
          const pubkey = "";
          const eventKind = 1;
          const eventContent = "";
          const nevent = "";

          if (kind === 1) {
            return {
              kind: 1,
              content,
            };
          } else if (kind === 6) {
            if (content === "") {
              // Unquoted repost
              return {
                kind: eventKind === 1 ? 6 : 16,
                content,
                tags: [
                  ["e", eventId!, relay!],
                  ["p", pubkey!],
                  ["k", eventKind.toString()],
                ],
              };
            } else {
              // Quoted repost
              return {
                kind: 1,
                content: eventContent + " nostr:" + nevent,
                tags: [["q", eventId!, relay!, pubkey!]],
              };
            }
          } else if (kind === 7) {
            const reaction = getValue(props.form, "reaction");

            return {
              kind: 7,
              content: reaction,
              tags: [
                ["e", eventId!, relay!],
                ["p", pubkey!],
                ["k", eventKind.toString()],
              ],
            };
          } else if (kind === 30023) {
            return undefined;
          } else {
            try {
              return JSON.parse(content);
            } catch (error) {
              console.error(error);
              return undefined;
            }
          }
        }

        return (
          <>
            <div class="flex flex-col sm:flex-row gap-0">
              <div class={showEventInput() ? "sm:w-1/3" : "w-full"}>
                <KindInput
                  value={field.value}
                  onChange={(value) => setValue(props.form, "kind", value)}
                />
              </div>

              <Show when={showEventInput()}>
                <div class="flex-auto">
                  <Field name="eventId" of={props.form}>
                    {(eventField, _) => (
                      <EventInput
                        kind={field.value!}
                        value={eventField.value}
                        onChange={(value) =>
                          setValue(props.form, "eventId", value)
                        }
                        description=""
                        form={props.form}
                      />
                    )}
                  </Field>
                </div>
              </Show>
            </div>
            <Show when={field.value && ![7, 30023].includes(field.value)}>
              <TextField>
                <TextFieldTextArea
                  class="min-h-[40px] rounded-t-none border-t-0"
                  id="content"
                  value={content()}
                  onInput={(event) =>
                    setContent((event.target as HTMLTextAreaElement).value)
                  }
                  onBlur={() => {
                    const formattedValue = formatContent(
                      field.value,
                      content()
                    );
                    setValue(props.form, "content", formattedValue);
                  }}
                  placeholder={contentPlaceholder()}
                />
                {field.error && (
                  <p class="text-red-500 text-xs ml-0.5">{field.error}</p>
                )}
              </TextField>
            </Show>
            <Show when={nostrEventId()}>
              <div class="border mt-2 py-2 px-4 text-muted-foreground text-sm border-gray-200 rounded-md">
                {nostrEvent() ? (
                  nostrEvent()?.content
                ) : (
                  <LucideLoader class="animate-spin" />
                )}
              </div>
            </Show>
            {field.error && (
              <p class="text-red-500 text-xs ml-0.5 mt-1 w-full">
                {field.error}
              </p>
            )}
            {eventError() && (
              <p class="text-red-500 text-xs ml-0.5 mt-1 w-full">
                {eventError()}
              </p>
            )}
            {reactionError() && (
              <p class="text-red-500 text-xs ml-0.5 mt-1 w-full">
                {reactionError()}
              </p>
            )}
            {contentError() && (
              <p class="text-red-500 text-xs ml-0.5 mt-1 w-full">
                {contentError()}
              </p>
            )}
          </>
        );
      }}
    </Field>
  );
}
