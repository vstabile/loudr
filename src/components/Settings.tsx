import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "./ui/button";
import { MintsInput } from "./MintsInput";
import {
  createForm,
  setValue,
  SubmitHandler,
  zodForm,
} from "@modular-forms/solid";
import { TopicsInput } from "./TopicsInput";
import { SettingsForm, settingsSchema } from "../schemas/settingsSchema";
import { IgnoredCampaigns } from "./IgnoredCampaigns";
import { LucideNut } from "lucide-solid";

export default function Settings(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, { Form, Field }] = createForm<SettingsForm>({
    validate: zodForm(settingsSchema),
    initialValues: {
      topics: [],
      mints: [],
    },
  });

  const handleSubmit: SubmitHandler<SettingsForm> = async (values) => {
    // await actions.exec(Settings, values).forEach((event: NostrEvent) => {
    //   eventStore.add(event);
    //   rxNostr.send(event);
    // });

    console.log(values);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <Form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              <Field type="string[]" name="mints">
                {(field, props) => (
                  <div class="mb-4">
                    <MintsInput
                      {...props}
                      value={field.value || []}
                      label={
                        <div class="flex items-center gap-1">
                          <LucideNut class="w-4 h-4" /> Trusted Mints
                        </div>
                      }
                      setValue={(value: string[]) =>
                        setValue(form, "mints", value)
                      }
                      error={field.error}
                    />
                  </div>
                )}
              </Field>
              <Field type="string[]" name="topics">
                {(field, _) => (
                  <div class="mb-4">
                    <TopicsInput
                      value={field.value || []}
                      onChange={(value) => setValue(form, "topics", value)}
                      error={field.error}
                      description="Select which topics you're interested in promoting"
                    />
                  </div>
                )}
              </Field>

              <IgnoredCampaigns />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="submit" class="w-full">
              Save
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
