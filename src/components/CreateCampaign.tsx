import { createMemo, createSignal, from, Show } from "solid-js";
import {
  createForm,
  zodForm,
  SubmitHandler,
  setValue,
  reset,
  getValue,
} from "@modular-forms/solid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { TextField, TextFieldInput, TextFieldTextArea } from "./ui/text-field";
import { CampaignForm, campaignSchema } from "../schemas/campaignSchema";
import { actions } from "../actions/hub";
import { CreateCampaign as CreateCampaignAction } from "../actions/createCampaign";
import { TopicsInput } from "./TopicsInput";
import { MintsInput } from "./MintsInput";
import NostrEventFields from "./NostrEventFields";
import { LucideLoader } from "lucide-solid";
import { eventStore } from "../stores/eventStore";
import { NostrEvent } from "nostr-tools";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { KINDS } from "../lib/nostr";
import { accounts } from "../lib/accounts";
import { campaignUrl } from "../lib/utils";

export default function CreateCampaign() {
  const account = from(accounts.active$);
  const [isOpen, setIsOpen] = createSignal(false);
  const [form, { Form, Field }] = createForm<CampaignForm>({
    validate: zodForm(campaignSchema),
    initialValues: {
      d: Math.floor(Date.now() / 1000).toString(),
      title: "",
      description: "",
      template: {
        kind: undefined,
        content: "",
        reaction: "+",
      },
      topics: [],
      mints: ["https://mint.refugio.com.br"],
      share: false,
      shareContent: "",
    },
  });

  const kindLabels = {
    [KINDS.NOTE]: "Text Notes",
    [KINDS.REPOST]: "Reposts",
    [KINDS.GENERIC_REPOST]: "Reposts",
    [KINDS.REACTION]: "Reactions",
    [KINDS.ARTICLE]: "Articles",
  };

  const handleSubmit: SubmitHandler<CampaignForm> = async (values) => {
    let ref: NostrEvent | undefined;
    if (values.template.refId) {
      const split = values.template.refId.split(":");

      if (split.length === 3) {
        ref = eventStore.getReplaceable(parseInt(split[0]), split[1], split[2]);
      } else {
        ref = eventStore.getEvent(values.template.refId);
      }
    }

    actions.run(CreateCampaignAction, account()?.pubkey!, values, ref);

    reset(form);
    setIsOpen(false);
  };

  const defaultShareContent = createMemo(() => {
    const dTag = getValue(form, "d");
    const pubkey = account()?.pubkey;
    const kind = getValue(form, "template.kind");
    let kindLabel = kind ? kindLabels[kind] : "";
    if (!kindLabel) kindLabel = `kind:${kind} events`;

    return `I'm sponsoring ${kindLabel} on Loudr. To earn some sats, go to: ${campaignUrl(
      pubkey!,
      dTag!
    )}`;
  });

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button variant="link">Create Campaign</Button>
      </DialogTrigger>
      <DialogContent>
        <Form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription>
              <p class="mb-2">Announce your event sponsorship campaign.</p>
            </DialogDescription>

            <div>
              <Field name="d">
                {(field, _) => (
                  <input type="hidden" name="d" value={field.value} />
                )}
              </Field>
              <Field name="title">
                {(field, props) => (
                  <div class="mb-2">
                    <TextField>
                      <TextFieldInput
                        {...props}
                        id="title"
                        value={field.value || ""}
                        placeholder="Title of the campaign (optional)"
                      />
                      {field.error && (
                        <p class="text-red-500 text-xs ml-0.5">{field.error}</p>
                      )}
                    </TextField>
                  </div>
                )}
              </Field>

              <Field name="description">
                {(field, props) => (
                  <div class="mb-2">
                    <TextField>
                      <TextFieldTextArea
                        {...props}
                        id="description"
                        value={field.value || ""}
                        placeholder="A brief of the campaign outlining the goals, target audience, and any specific requirements"
                      />
                      {field.error && (
                        <p class="text-red-500 text-xs ml-0.5">{field.error}</p>
                      )}
                    </TextField>
                  </div>
                )}
              </Field>

              <div class="mb-4">
                <NostrEventFields form={form} name="template" />
              </div>

              <div class="mt-4">
                <Field type="string[]" name="topics">
                  {(field, _) => (
                    <div class="mb-4">
                      <TopicsInput
                        value={field.value || []}
                        onChange={(value) => setValue(form, "topics", value)}
                        error={field.error}
                        description="Help the right people find your campaign."
                      />
                    </div>
                  )}
                </Field>
              </div>

              <div class="mb-4">
                <Field type="string[]" name="mints">
                  {(field, _) => (
                    <MintsInput
                      value={field.value || []}
                      onChange={(value) => setValue(form, "mints", value)}
                      error={field.error}
                    />
                  )}
                </Field>
              </div>
            </div>

            <Field name="share" type="boolean">
              {(shareField) => (
                <div class="flex flex-col gap-2">
                  <div class="flex flex-row gap-2 items-center pb-1">
                    <div class="flex space-x-2 items-center cursor-pointer">
                      <Checkbox
                        id="share"
                        checked={shareField.value}
                        onChange={(value) => setValue(form, "share", value)}
                      />
                      <Label
                        for="share-input"
                        class="font-normal cursor-pointer text-muted-foreground"
                      >
                        Share campaign as a NIP-01 text note
                      </Label>
                    </div>
                  </div>
                  <Show when={shareField.value}>
                    <Field name="shareContent">
                      {(field, props) => (
                        <TextField>
                          <TextFieldTextArea
                            {...props}
                            value={field.value || defaultShareContent()}
                            error={field.error}
                          />
                        </TextField>
                      )}
                    </Field>
                  </Show>
                </div>
              )}
            </Field>
          </DialogHeader>
          <DialogFooter class="mt-4">
            <Button type="submit" class="w-full" disabled={form.submitting}>
              {!form.submitting ? (
                "Publish Campaign"
              ) : (
                <LucideLoader class="animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
