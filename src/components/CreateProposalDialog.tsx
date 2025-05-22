import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { from } from "solid-js";
import { accounts } from "../lib/accounts";
import { useAuth } from "../contexts/authContext";
import { ProposalForm, proposalFormSchema } from "../schemas/proposalSchema";
import {
  createForm,
  getValue,
  reset,
  setValue,
  SubmitHandler,
  zodForm,
} from "@modular-forms/solid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { LucideLoader } from "lucide-solid";
import { TextField, TextFieldTextArea } from "./ui/text-field";
import { NumberField, NumberFieldInput } from "./ui/number-field";
import { NostrEvent } from "nostr-tools";
import KindLabel from "./KindLabel";
import EventPreview from "./EventPreview";
import { getTagValue } from "applesauce-core/helpers";
import CampaignDescription from "./CampaignDescription";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { KINDS } from "../lib/nostr";
import NostrEventFields from "./NostrEventFields";
import { queryStore } from "../stores/queryStore";
import { campaignUrl, profileName } from "../lib/utils";
import { MintsInput } from "./MintsInput";
import { DEFAULT_MINT } from "../lib/cashu";
import { actions } from "../actions/hub";
import { CreateProposal as CreateProposalAction } from "../actions/createProposal";
import { eventStore } from "../stores/eventStore";

type SigType = "cashu" | "nostr";

type CreateProposalDialogProps = {
  campaign: NostrEvent;
};

export default function CreateProposalDialog(props: CreateProposalDialogProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const account = from(accounts.active$);
  const { setDialogIsOpen } = useAuth();
  const campaignContent = JSON.parse(props.campaign.content);
  const givenKind =
    campaignContent.take.template &&
    campaignContent.take.template.tags &&
    getTagValue(campaignContent.take.template, "q")
      ? 6
      : campaignContent.take.template.kind;
  const campaignRefId = campaignContent.take.template.tags?.find(
    (t: string[]) => ["e", "q"].includes(t[0])
  )?.[1];

  const [form, { Form, Field }] = createForm<ProposalForm>({
    validate: zodForm(proposalFormSchema),
    initialValues: {
      taken: {
        type: campaignContent.give.type,
        amount: undefined,
        mint: [DEFAULT_MINT],
      },
      given: {
        type: campaignContent.take.type,
        template: {
          kind: givenKind,
          content: "",
          reaction:
            givenKind === KINDS.REACTION
              ? campaignContent.take.template.content
              : undefined,
          refId: campaignRefId,
        },
      },
      notify: false,
      notifyContent: "",
    },
  });

  function isTakenTypeDisabled(sigType: SigType) {
    const taken = JSON.parse(props.campaign.content).give;
    return taken.type !== sigType && !taken.type.includes(sigType);
  }

  const defaultTakenType = createMemo(() => {
    const taken = JSON.parse(props.campaign.content).give;
    return taken.type
      ? typeof taken.type === "string"
        ? taken.type
        : taken.type[0]
      : undefined;
  });

  const takenTypeOptions = [
    {
      label: "Cashu Payment",
      value: "cashu",
      disabled: isTakenTypeDisabled("cashu"),
    },
    { label: "Nostr", value: "nostr", disabled: isTakenTypeDisabled("nostr") },
  ];

  const proposer = from(queryStore.profile(props.campaign.pubkey));

  const handleSubmit: SubmitHandler<ProposalForm> = async (values) => {
    setIsSubmitting(true);

    let ref: NostrEvent | undefined;
    if (values.given.template.refId) {
      const split = values.given.template.refId.split(":");

      if (split.length === 3) {
        ref = eventStore.getReplaceable(parseInt(split[0]), split[1], split[2]);
      } else {
        ref = eventStore.getEvent(values.given.template.refId);
      }
    }

    console.log("ref", ref);

    await actions.run(CreateProposalAction, values, props.campaign, ref);
    setIsSubmitting(false);

    reset(form);
    setIsOpen(false);
  };

  const handleOpen = () => {
    if (!account()) {
      // If user is not signed in, open the sign-in dialog
      setDialogIsOpen(true);
      return;
    }

    // Otherwise open the proposal dialog
    setIsOpen(true);
  };

  const given = createMemo(() => {
    return JSON.parse(props.campaign.content).take;
  });

  const givenEventId = createMemo(() => {
    if (!given().template.tags) return;
    return (
      getTagValue(given().template, "e") || getTagValue(given().template, "q")
    );
  });

  const description = createMemo(() => {
    return JSON.parse(props.campaign.content).description;
  });

  createEffect(() => {
    const dTag = props.campaign.tags.find((tag) => tag[0] === "d")?.[1];
    const pubkey = account()?.pubkey;
    const url = campaignUrl(pubkey!, dTag!);

    const notifyContent = `I've made you a proposal on Loudr. To accept, go to: ${url}`;
    setValue(form, "notifyContent", notifyContent);
  });

  const kindLabels = {
    [KINDS.NOTE]: "Text Note",
    [KINDS.REPOST]: "Repost Quote",
    [KINDS.GENERIC_REPOST]: "Repost Quote",
    [KINDS.ARTICLE]: "Article",
  };

  const givenContentPlaceholder = createMemo(() => {
    let kind = given().template.kind;
    if (given().template.tags && getTagValue(given().template, "q"))
      kind = KINDS.REPOST;
    let label = kindLabels[kind] || "Event";

    return `Content of the ${label} you're willing to publish`;
  });

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <Button size="sm" onClick={handleOpen} disabled={isSubmitting()}>
        Send a Proposal
      </Button>
      <DialogContent>
        <Form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send a Proposal</DialogTitle>
            <div class="flex flex-col">
              <p class="text-sm mb-2">I want to receive...</p>
              <Field name="taken.type">
                {(takenTypeField) => (
                  // @ts-ignore
                  <Field name="taken.amount" type="number">
                    {(amountField, amountProps) => (
                      <div class="flex flex-col gap-1">
                        <div class="flex flex-row gap-2">
                          <div class="flex flex-col gap-2 w-full">
                            <Select
                              onChange={(option) => {
                                if (!option) return;

                                setValue(
                                  form,
                                  "taken.type",
                                  option.value as SigType
                                );
                              }}
                              options={takenTypeOptions}
                              optionValue="value"
                              optionTextValue="label"
                              optionDisabled="disabled"
                              defaultValue={takenTypeOptions.find(
                                (o) => o.value === defaultTakenType()
                              )}
                              placeholder="Select your reward"
                              itemComponent={(props: any) => (
                                <SelectItem item={props.item}>
                                  {props.item.rawValue.label}
                                </SelectItem>
                              )}
                              class="w-full"
                            >
                              <SelectTrigger
                                aria-label="Select Reward Type"
                                id="takenType"
                              >
                                <SelectValue>
                                  {(state: any) =>
                                    state.selectedOption()?.label
                                  }
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent />
                            </Select>
                          </div>
                          <Show when={takenTypeField.value === "cashu"}>
                            <div class="flex flex-col gap-2">
                              <NumberField class="flex flex-row" format={false}>
                                <NumberFieldInput
                                  type="number"
                                  {...amountProps}
                                  value={amountField.value}
                                  error={amountField.error}
                                  placeholder="Amount"
                                  class="rounded-r-none"
                                />
                                <div class="text-xs bg-muted text-muted-foreground rounded-r-md border px-2 border-l-0 items-center flex">
                                  sats
                                </div>
                              </NumberField>
                            </div>
                          </Show>
                        </div>
                        <Show when={takenTypeField.value === "cashu"}>
                          <Field name="taken.mint">
                            {(mintField, mintProps) => (
                              <MintsInput
                                {...mintProps}
                                value={mintField.value}
                                error={mintField.error}
                                setValue={(value: string[]) =>
                                  // @ts-ignore
                                  setValue(form, "taken.mint", value)
                                }
                              />
                            )}
                          </Field>
                        </Show>
                        {takenTypeField.error && (
                          <p class="text-red-500 text-xs ml-0.5">
                            {takenTypeField.error}
                          </p>
                        )}
                        {amountField.error && (
                          <p class="text-red-500 text-xs ml-0.5">
                            {amountField.error}
                          </p>
                        )}
                      </div>
                    )}
                  </Field>
                )}
              </Field>
              <Show when={getValue(form, "taken.type") === "nostr"}>
                <div class="mt-2 gap-2">
                  <NostrEventFields form={form} name="taken.template" />
                </div>
              </Show>
              <p class="text-sm mt-4 mb-2">In exchange for...</p>
              <Field name="given.type">
                {(field, _) => (
                  <input type="hidden" name="given.type" value={field.value} />
                )}
              </Field>

              <Field name="given.template.kind" type="number">
                {(field, _) => (
                  <input
                    type="hidden"
                    name="given.template.kind"
                    value={field.value}
                  />
                )}
              </Field>
              <Field name="given.template.reaction" type="string">
                {(field, _) => (
                  <input
                    type="hidden"
                    name="given.template.reaction"
                    value={field.value}
                  />
                )}
              </Field>
              <Field name="given.template.refId" type="string">
                {(field, _) => (
                  <input
                    type="hidden"
                    name="given.template.refId"
                    value={field.value}
                  />
                )}
              </Field>
              <div>
                <KindLabel template={given().template} />
                <div class="pt-2 text-muted-foreground">
                  <CampaignDescription description={description()} />
                </div>
                <Show when={given().template.kind !== KINDS.REACTION}>
                  <Field name="given.template.content">
                    {(field, props) => (
                      <div class="flex flex-col my-2 gap-1">
                        <TextField>
                          <TextFieldTextArea
                            {...props}
                            value={field.value}
                            placeholder={givenContentPlaceholder()}
                          />
                        </TextField>
                        {field.error && (
                          <p class="text-red-500 text-xs ml-0.5">
                            {field.error}
                          </p>
                        )}
                      </div>
                    )}
                  </Field>
                </Show>
                <Show when={givenEventId()}>
                  <div class="mt-2 mb-4">
                    <EventPreview id={givenEventId()} />
                  </div>
                </Show>
              </div>

              <Field name="notify" type="boolean">
                {(notifyField) => (
                  <div class="flex flex-col gap-2">
                    <div class="flex flex-row gap-2 items-center mt-2">
                      <div class="flex space-x-2 items-center cursor-pointer">
                        <Checkbox
                          id="notify"
                          checked={notifyField.value}
                          onChange={(value) => setValue(form, "notify", value)}
                        />
                        <Label
                          for="notify-input"
                          class="font-normal cursor-pointer text-muted-foreground"
                        >
                          Notify{" "}
                          {profileName(proposer(), props.campaign.pubkey)} with
                          NIP-04 direct message
                        </Label>
                      </div>
                    </div>
                    <Show when={notifyField.value}>
                      <Field name="notifyContent">
                        {(field, props) => (
                          <div class="flex flex-col gap-1">
                            <TextField>
                              <TextFieldTextArea
                                {...props}
                                value={field.value}
                                error={field.error}
                              />
                            </TextField>
                            {field.error && (
                              <p class="text-red-500 text-xs ml-0.5">
                                {field.error}
                              </p>
                            )}
                          </div>
                        )}
                      </Field>
                    </Show>
                  </div>
                )}
              </Field>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button type="submit" class="w-full mt-4" disabled={isSubmitting()}>
              <Show when={isSubmitting()} fallback="Send a Proposal">
                <LucideLoader class="animate-spin" /> Sending...
              </Show>
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
