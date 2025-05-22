import { z } from "zod";
import { KINDS } from "../lib/nostr";
import {
  eventIdSchema,
  eventTemplateSchema,
  kindSchema,
  reactionSchema,
} from "./miscSchema";

const proposalTemplateFormSchema = z
  .object({
    kind: kindSchema,
    reaction: z.string().optional(),
    content: z.string().optional(),
    refId: eventIdSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      [KINDS.NOTE, KINDS.ARTICLE].includes(data.kind) &&
      (!data.content || data.content === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Content is required",
        path: ["content"],
      });
    }

    if ([KINDS.REPOST, KINDS.REACTION].includes(data.kind) && !data.refId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A reference event is required for this kind of event",
        path: ["refId"],
      });
    }

    if (
      data.kind === KINDS.REACTION &&
      !reactionSchema.safeParse(data.reaction).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A reaction emoji is required",
        path: ["reaction"],
      });
    }

    if (
      ![
        KINDS.NOTE,
        KINDS.REPOST,
        KINDS.GENERIC_REPOST,
        KINDS.REACTION,
        KINDS.ARTICLE,
      ].includes(data.kind)
    ) {
      try {
        const parsed = JSON.parse(data.content!);
        eventTemplateSchema.parse(parsed);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "This is not a valid Nostr event template",
          path: ["content"],
        });
      }
    }
  });

export const proposalFormSchema = z.object({
  taken: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("cashu"),
      amount: z.number({ message: "Payment amount is required" }),
      mint: z
        .string()
        .or(z.array(z.string()).min(1, "At least one mint is required")),
    }),
    z.object({
      type: z.literal("nostr"),
      template: proposalTemplateFormSchema,
    }),
  ]),
  given: z.object({
    type: z.literal("nostr"),
    template: proposalTemplateFormSchema,
  }),
  notify: z.boolean().optional(),
  notifyContent: z.string().min(1).optional(),
});

export type ProposalForm = z.input<typeof proposalFormSchema>;
