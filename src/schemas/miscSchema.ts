import { z } from "zod";
import { KINDS } from "../lib/nostr";

export const pubkeySchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]+$/, "Pubkey must be a valid hex string");
export const timestampSchema = z.number().int().min(0).max(2147483647);
export const kindSchema = z.number().int().min(0).max(65535);
export const tagSchema = z.array(z.string());
export const tagsSchema = z.array(tagSchema);

export const eventCoordinateSchema = z.string().refine(
  (value) => {
    const parts = value.split(":");
    if (parts.length !== 3) return false;

    const [kind, pubkey, identifier] = parts;
    return (
      kindSchema.safeParse(parseInt(kind)).success &&
      pubkeySchema.safeParse(pubkey).success &&
      identifier.length > 0
    );
  },
  {
    message: "Must be in the format <kind>:<pubkey>:<identifier>",
  }
);

export const eventIdSchema = z.union([
  z
    .string()
    .length(64, "Event ID must be 64 characters long")
    .regex(/^[0-9a-f]+$/i, "Event ID must be a valid hexadecimal string"),
  eventCoordinateSchema,
]);

export const neventSchema = z
  .string()
  .regex(
    /^nevent1[023456789acdefghjklmnpqrstuvwxyz]+$/,
    "Must be a valid bech32 nevent string"
  );

export const naddrSchema = z
  .string()
  .regex(
    /^naddr1[023456789acdefghjklmnpqrstuvwxyz]+$/,
    "Must be a valid bech32 naddr string"
  );

export const eventUrlSchema = z.string().refine(
  (value) => {
    // Try to extract event ID or nevent from the URL
    try {
      const url = new URL(value);
      const pathSegments = url.pathname.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];

      // Check if it's a hex event ID
      if (eventIdSchema.safeParse(lastSegment).success) {
        return true;
      }

      // Check if it's a bech32 nevent
      if (neventSchema.safeParse(lastSegment).success) {
        return true;
      }

      // Check if it's a bech32 naddr
      if (naddrSchema.safeParse(lastSegment).success) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  },
  {
    message:
      "Must be a valid URL containing either an event ID or nevent string",
  }
);

export const emojiSchema = z
  .string()
  .regex(
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u,
    "Must be a valid emoji"
  );

export const reactionSchema = z.union(
  [z.string().regex(/^[+\-]$/), emojiSchema],
  {
    errorMap: () => ({ message: "Reaction is invalid" }),
  }
);

export const eventPartialTemplateSchema = z
  .object({
    created_at: timestampSchema.optional(),
    kind: kindSchema.optional(),
    tags: tagsSchema.optional(),
    content: z.string().optional(),
  })
  .strict("Event partial template is invalid");

export type PartialEventTemplate = z.infer<typeof eventPartialTemplateSchema>;

export const eventTemplateSchema = z
  .object({
    created_at: timestampSchema,
    kind: kindSchema,
    tags: tagsSchema,
    content: z.string(),
  })
  .strict("Event template is invalid");

export type eventTemplate = z.infer<typeof eventTemplateSchema>;

export const templateFormSchema = z
  .object({
    kind: kindSchema,
    reaction: z.string().optional(),
    content: z.string().optional(),
    refId: eventIdSchema.optional(),
  })
  .superRefine((data, ctx) => {
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
      ![KINDS.NOTE, KINDS.REPOST, KINDS.REACTION, KINDS.ARTICLE].includes(
        data.kind
      )
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

export type TemplateFormType = z.infer<typeof templateFormSchema>;
