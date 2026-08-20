import { z } from 'zod';
import { DineroSchema, FechaISOSchema } from './comunes.js';
import { TramoMoraSchema } from './pagos.js';

export const IncluirReestructuradosSchema = z
  .literal(true)
  .default(true)
  .meta({
    description:
      'El indicador oficial siempre incluye los créditos reestructurados, aunque estén al día',
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

export const ReestructuradosAlDiaSchema = z
  .object({
    creditos: z.number().int().nonnegative().meta({
      description:
        'Cantidad de créditos reestructurados que se encuentran al día',
    }),

    saldoCapital: DineroSchema,
  })
  .strict()
  .meta({
    description:
      'Créditos que cuentan como cartera en riesgo por estar reestructurados, aunque no tengan atraso',
  });

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

    reestructuradosAlDia: ReestructuradosAlDiaSchema,
  })
  .strict()
  .meta({
    description:
      'Resultado del cálculo de cartera en riesgo. El saldo en riesgo incluye los tramos con más de 30 días y los créditos reestructurados.',
  });