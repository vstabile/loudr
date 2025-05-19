import { z } from "zod";
import {
  eventPartialTemplateSchema,
  eventTemplateSchema,
  templateFormSchema,
} from "./miscSchema";

const hashtagRegex = /^[a-z0-9]+$/;

export const topicSchema = z
  .string()
  .min(1, "Topic cannot be empty")
  .max(20, "Topic is too long (max 20 characters)")
  .regex(hashtagRegex, "Topics can only contain lowercase letters and numbers");

export const campaignSchema = z.object({
  d: z.string().optional(),
  title: z.string().optional(),
  description: z.string().min(1, "Brief is required"),
  topics: z.array(topicSchema),
  template: templateFormSchema,
  mints: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one mint is required"),
  share: z.boolean().optional(),
  shareContent: z.string().optional(),
});

export type CampaignForm = z.input<typeof campaignSchema>;

export const giveOrTakeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cashu"),
    amount: z.number().optional(),
    mint: z.array(z.string().url()).optional(),
  }),
  z.object({
    type: z.literal("nostr"),
    template: eventPartialTemplateSchema,
  }),
]);

export const campaignContentSchema = z.object({
  description: z.string().min(1, "Brief is required"),
  give: giveOrTakeSchema,
  take: giveOrTakeSchema,
  examples: z.array(eventTemplateSchema).optional(),
});

export type CampaignContent = z.infer<typeof campaignContentSchema>;
