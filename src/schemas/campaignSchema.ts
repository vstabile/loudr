import { z } from "zod";
import {
  reactionSchema,
  eventIdSchema,
  eventTemplateSchema,
} from "./miscSchema";

const hashtagRegex = /^[a-z0-9]+$/;

export const topicSchema = z
  .string()
  .min(1, "Topic cannot be empty")
  .max(20, "Topic is too long (max 20 characters)")
  .regex(hashtagRegex, "Topics can only contain lowercase letters and numbers");

export const campaignSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().min(1, "Brief is required"),
    kind: z
      .number({
        required_error: "The sponsored event kind is required",
      })
      .int()
      .min(0, "Kind must be a positive number"),
    topics: z.array(topicSchema),
    eventId: eventIdSchema.optional(),
    reaction: reactionSchema.optional(),
    content: eventTemplateSchema.optional(),
    mints: z
      .array(z.string().url("Must be a valid URL"))
      .min(1, "At least one mint is required"),
  })
  .superRefine((data, ctx) => {
    // Validate eventId is required for kinds 6 and 7
    if ([6, 7].includes(data.kind) && !data.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Event ID is required for this kind of event",
        path: ["eventId"],
      });
    }

    // Validate reaction is required for kind 7
    if (data.kind === 7 && !data.reaction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A reaction emoji is required",
        path: ["reaction"],
      });
    }
  });

export type CampaignForm = z.input<typeof campaignSchema>;
