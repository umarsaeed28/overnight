import { z } from "zod";
import { MAX_QUANTITY_PER_LINE, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./rules";

export const emailSchema = z.string().email("Enter a valid email");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const addToCartSchema = z.object({
  // Seeded products use readable ids, so this is not a uuid check.
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const shippingAddressSchema = z.object({
  name: z.string().min(1, "Enter a name"),
  line1: z.string().min(1, "Enter an address"),
  city: z.string().min(1, "Enter a city"),
  postcode: z.string().min(3, "Enter a postcode"),
  // Optional: most guests do not want to give a phone number.
  phone: z.string().min(7).optional(),
});

export const guestCheckoutSchema = z.object({
  email: emailSchema,
  shipping: shippingAddressSchema,
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  priceCents: z.number().int().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
