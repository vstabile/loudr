import { z } from "zod";

export const eventIdSchema = z
  .string()
  .length(64, "Event ID must be 64 characters long")
  .regex(/^[0-9a-f]+$/i, "Event ID must be a valid hexadecimal string");
export const pubkeySchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]+$/, "Pubkey must be a valid hex string");
export const timestampSchema = z.number().int().min(0).max(2147483647);
export const kindSchema = z.number().int().min(0).max(65535);
export const tagSchema = z.array(z.string());
export const tagsSchema = z.array(tagSchema);

export const neventSchema = z
  .string()
  .regex(
    /^nevent1[023456789acdefghjklmnpqrstuvwxyz]+$/,
    "Must be a valid bech32 nevent string"
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

export const eventTemplateSchema = z
  .object({
    pubkey: pubkeySchema.optional(),
    created_at: timestampSchema.optional(),
    kind: kindSchema.optional(),
    tags: tagsSchema.optional(),
    content: z.string().optional(),
  })
  .strict("Event template is invalid");

export type eventTemplate = z.infer<typeof eventTemplateSchema>;
