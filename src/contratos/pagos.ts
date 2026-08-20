import { z } from 'zod';
import {
  DineroSchema,
  CreditoIdSchema,
  FechaISOSchema,
  InstanteISOSchema,
} from './comunes.js';

export const MedioDePagoSchema = z
  .enum([
    'efectivo',
    'transferencia',
    'agente_bancario',
    'boleta_banco',
  ])
  .meta({
    description: 'Canal por el cual se recibió el pago',
  });

export const RegistrarPagoRequestSchema = z
  .object({
    monto: DineroSchema,
    fechaPago: FechaISOSchema,
    medio: MedioDePagoSchema,
    referencia: z
      .string()
      .max(40, 'La referencia no puede superar los 40 caracteres')
      .optional()
      .meta({
        description: 'Referencia o comprobante externo del pago',
        examples: ['BOL-88213'],
      }),
  })
  .strict()
  .meta({
    description: 'Información enviada para registrar un pago',
  });

export const AplicacionDelPagoSchema = z
  .object({
    gastos: DineroSchema,
    interesMoratorio: DineroSchema,
    interesCorriente: DineroSchema,
    capital: DineroSchema,
    excedente: DineroSchema,
  })
  .strict()
  .meta({
    description:
      'Desglose según la prelación: gastos, interés moratorio, interés corriente, capital y excedente',
  });

export const TramoMoraSchema = z
  .enum([
    'ninguno',
    'mora_1',
    'mora_2',
    'mora_3',
    'vencido',
  ])
  .meta({
    description: 'Clasificación calculada a partir de los días de atraso',
  });

export const EstadoCreditoSchema = z
  .enum([
    'vigente',
    'en_mora',
    'cancelado',
    'reestructurado',
    'incobrable',
  ])
  .meta({
    description: 'Estado actual del crédito',
  });

export const PagoRegistradoSchema = z
  .object({
    pagoId: z.string().meta({
      examples: ['PG-2026-000731'],
    }),

    creditoId: CreditoIdSchema,

    recibidoEn: InstanteISOSchema,

    montoRecibido: DineroSchema,

    aplicacion: AplicacionDelPagoSchema,

    saldoCapitalDespues: DineroSchema,

    estadoCredito: EstadoCreditoSchema,

    tramoMora: TramoMoraSchema,

    diasAtraso: z.number().int().nonnegative().meta({
      description: 'Cantidad de días de atraso después de aplicar el pago',
      examples: [32],
    }),

    reproducido: z.boolean().meta({
      description:
        'Indica si se devolvió la respuesta de un pago registrado anteriormente',
      examples: [false],
    }),
  })
  .strict()
  .meta({
    description: 'Resultado obtenido después de registrar y aplicar un pago',
  });