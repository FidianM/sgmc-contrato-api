import { z } from 'zod';
import { DineroSchema, CreditoIdSchema, FechaISOSchema } from './comunes.js';

export const MedioDePagoSchema = z.enum([
  'efectivo',
  'transferencia',
  'agente_bancario',
  'boleta_banco',
]);

export const RegistrarPagoRequestSchema = z.object({
  monto: DineroSchema,
  fechaPago: FechaISOSchema,
  medio: MedioDePagoSchema,
  referencia: z.string().optional(),
});

export const AplicacionDelPagoSchema = z.object({
  gastos: DineroSchema,
  interesMoratorio: DineroSchema,
  interesCorriente: DineroSchema,
  capital: DineroSchema,
  excedente: DineroSchema,
});

export const TramoMoraSchema = z.enum([
  'al_dia',
  'mora_1',
  'mora_2',
  'mora_3',
  'vencido',
  'ninguno',
]);

export const EstadoCreditoSchema = z.enum([
  'vigente',
  'en_mora',
  'cancelado',
  'reestructurado',
  'incobrable',
]);

export const PagoRegistradoSchema = z.object({
  pagoId: z.string(),
  creditoId: CreditoIdSchema,
  recibidoEn: z.string(),
  montoRecibido: DineroSchema,
  aplicacion: AplicacionDelPagoSchema,
  reproducido: z.boolean().default(false),
});
