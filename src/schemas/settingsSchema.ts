import { z } from "zod";
import { topicSchema } from "./campaignSchema";

export const settingsSchema = z.object({
  topics: z.array(topicSchema),
  mints: z.array(z.string().url("Must be a valid URL")),
});

export type SettingsForm = z.input<typeof settingsSchema>;
