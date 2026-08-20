import { z } from 'zod';
import {
  DineroSchema,
  FechaISOSchema,
} from './comunes.js';
import { TramoMoraSchema } from './pagos.js';

export const IncluirReestructuradosSchema = z
  .boolean()
  .default(false)
  .meta({
    description:
      'Indica si los créditos reestructurados se incluyen en el cálculo',
  });

export const CarteraEnRiesgoQuerySchema = z
  .object({
    fechaCorte: FechaISOSchema,
    incluirReestructurados: IncluirReestructuradosSchema,
  })
  .strict()
  .meta({
    description: 'Parámetros para calcular la cartera en riesgo',
  });

export const DetalleTramoCarteraSchema = z
  .object({
    tramo: TramoMoraSchema,

    creditos: z.number().int().nonnegative().meta({
      description: 'Cantidad de créditos clasificados en el tramo',
    }),

    saldoCapital: DineroSchema,
  })
  .strict();

export const CarteraEnRiesgoResponseSchema = z
  .object({
    fechaCorte: FechaISOSchema,

    carteraActiva: DineroSchema,

    saldoEnRiesgo: DineroSchema,

    porcentajeEnRiesgo: z.number().min(0).max(1).meta({
      description:
        'Proporción de la cartera activa que se encuentra en riesgo',
      examples: [0.07],
    }),

    dadoPorIncobrableEnElPeriodo: DineroSchema,

    porTramo: z.array(DetalleTramoCarteraSchema),
  })
  .strict()
  .meta({
    description: 'Resultado del cálculo de cartera en riesgo',
  });