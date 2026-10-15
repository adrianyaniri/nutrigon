import { z } from "zod";

/**
 * Common schema validators for the application.
 */
export const commonSchemas = {
  id: z.string().uuid("Invalid unique identifier"),
  branchCode: z.enum(["sucursal-1", "sucursal-2", "sucursal-3"]),
  positiveNumber: z.number().positive("Value must be greater than zero"),
  nonNegativeNumber: z.number().min(0, "Value cannot be negative"),
};
