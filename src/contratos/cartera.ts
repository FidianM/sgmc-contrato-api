import { z } from 'zod';
import { DineroSchema, FechaISOSchema } from './comunes.js';
import { TramoMoraSchema } from './pagos.js';

export const CarteraEnRiesgoQuerySchema = z.object({
  fechaCorte: FechaISOSchema,
  incluirReestructurados: z.enum(['true', 'false']).optional(),
});

export const DetalleTramoCarteraSchema = z.object({
  tramo: TramoMoraSchema,
  creditos: z.number().int().nonnegative(),
  saldoCapital: DineroSchema,
});

export const CarteraEnRiesgoResponseSchema = z.object({
  fechaCorte: FechaISOSchema,
  carteraActiva: DineroSchema,
  saldoEnRiesgo: DineroSchema,
  porcentajeEnRiesgo: z.number().min(0).max(1),
  dadoPorIncobrableEnElPeriodo: DineroSchema,
  porTramo: z.array(DetalleTramoCarteraSchema).optional(),
});
