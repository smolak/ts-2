import { z } from "zod";

const trimmedStringSchema = z.string().trim();
const urlAddressSchema = z.url().trim();

const authorSchema = trimmedStringSchema;
const dateSchema = z.iso.datetime().trim();
const descriptionSchema = trimmedStringSchema;
const faviconUrlSchema = urlAddressSchema;
const imageUrlSchema = urlAddressSchema;
const languageSchema = trimmedStringSchema;
const logoUrlSchema = urlAddressSchema;
const publisherSchema = trimmedStringSchema;
const titleSchema = trimmedStringSchema;
const urlSchema = urlAddressSchema;

export const metadataSchema = z.object({
  author: authorSchema.optional(),
  contentType: trimmedStringSchema,
  date: dateSchema.optional(),
  description: descriptionSchema.optional(),
  faviconUrl: faviconUrlSchema.optional(),
  imageUrl: imageUrlSchema.optional(),
  lang: languageSchema.optional(),
  logoUrl: logoUrlSchema.optional(),
  publisher: publisherSchema.optional(),
  title: titleSchema.optional(),
  url: urlSchema,
});

export type Metadata = z.infer<typeof metadataSchema>;
