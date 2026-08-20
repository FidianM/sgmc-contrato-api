import { z } from 'zod';

export const DineroSchema = z.object({
  valor: z.string().regex(/^-?\d{1,13}\.\d{2}$/, 'Debe ser una cadena decimal con 2 decimales exactos'),
  moneda: z.literal('GTQ'),
});

export const ErrorDetalleSchema = z.object({
  campo: z.string(),
  mensaje: z.string(),
});

export const ProblemDetailsSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  traceId: z.string().optional(),
  errores: z.array(ErrorDetalleSchema).optional(),
});

export const FechaISOSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato AAAA-MM-DD');
export const CreditoIdSchema = z.string().regex(/^C-\d{3,8}$/, 'Formato C-004');
export const IdempotencyKeySchema = z.string().uuid();
