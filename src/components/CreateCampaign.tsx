import { createSignal } from "solid-js";
import {
  createForm,
  zodForm,
  SubmitHandler,
  setValue,
  reset,
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
import KindInputGroup from "./KindInputGroup";
import { LucideLoader } from "lucide-solid";

export default function CreateCampaign() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [form, { Form, Field }] = createForm<CampaignForm>({
    validate: zodForm(campaignSchema),
    initialValues: {
      title: "",
      description: "",
      kind: undefined,
      eventId: undefined,
      reaction: "+",
      content: undefined,
      topics: [],
      mints: ["https://mint.refugio.com.br"],
    },
  });

  const handleSubmit: SubmitHandler<CampaignForm> = async (values) => {
    await actions.run(CreateCampaignAction, values);

    reset(form);
    setIsOpen(false);
  };

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
                <KindInputGroup form={form} />
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
          </DialogHeader>
          <DialogFooter>
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
