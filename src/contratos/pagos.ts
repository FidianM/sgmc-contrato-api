import { z } from 'zod';
import {
  DineroSchema,
  DineroPositivoSchema,
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
    description:
      'Canal institucional por el cual se recibió el pago. Es un catálogo cerrado definido por Crédito Vecino.',
  });

export const RegistrarPagoRequestSchema = z
  .object({
    monto: DineroPositivoSchema,
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
    description:
      'Información enviada para registrar un pago. El monto debe ser mayor que cero.',
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

export const DestinoExcedenteSchema = z
  .enum(['amortizacion_capital', 'cuotas_futuras'])
  .meta({
    description:
      'Política aplicada al dinero recibido por encima de lo adeudado',
  });

export const TramoMoraSchema = z
  .enum(['ninguno', 'mora_1', 'mora_2', 'mora_3', 'vencido'])
  .meta({
    description:
      'Clasificación derivada de los días de atraso: ninguno (0), mora_1 (1-30), mora_2 (31-60), mora_3 (61-90) y vencido (91-120)',
  });

export const EstadoCreditoSchema = z
  .enum([
    'solicitado',
    'aprobado',
    'desembolsado',
    'vigente',
    'en_mora',
    'reestructurado',
    'rechazado',
    'anulado',
    'cancelado',
    'incobrable',
  ])
  .meta({
    description: 'Estado dentro del ciclo de vida completo del crédito',
  });

export const EstadoCreditoDespuesDePagoSchema = z
  .enum(['vigente', 'en_mora', 'reestructurado', 'cancelado'])
  .meta({
    description:
      'Estados válidos como resultado de aplicar un pago a un crédito que admite cobros',
  });

export const PagoRegistradoSchema = z
  .object({
    pagoId: z.string().meta({
      examples: ['PG-2026-000731'],
    }),

    creditoId: CreditoIdSchema,

    recibidoEn: InstanteISOSchema,

    montoRecibido: DineroPositivoSchema,

    aplicacion: AplicacionDelPagoSchema,

    destinoExcedente: DestinoExcedenteSchema.nullable().meta({
      description:
        'Destino del excedente. Es null cuando el pago no produjo excedente.',
      examples: [null],
    }),

    saldoCapitalDespues: DineroSchema,

    estadoCredito: EstadoCreditoDespuesDePagoSchema,

    tramoMora: TramoMoraSchema,

    diasAtraso: z.number().int().nonnegative().meta({
      description: 'Cantidad de días de atraso después de aplicar el pago',
      examples: [0],
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