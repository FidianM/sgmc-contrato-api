import { z } from 'zod';

import {
  DineroSchema,
  ErrorDetalleSchema,
  ProblemDetailsSchema,
  FechaISOSchema,
  InstanteISOSchema,
  CreditoIdSchema,
  IdempotencyKeySchema,
} from './contratos/comunes.js';

import {
  MedioDePagoSchema,
  RegistrarPagoRequestSchema,
  AplicacionDelPagoSchema,
  TramoMoraSchema,
  EstadoCreditoSchema,
  PagoRegistradoSchema,
} from './contratos/pagos.js';

import {
  IncluirReestructuradosSchema,
  CarteraEnRiesgoQuerySchema,
  DetalleTramoCarteraSchema,
  CarteraEnRiesgoResponseSchema,
} from './contratos/cartera.js';

function convertirAOpenAPI(
  schema: z.ZodType,
  io: 'input' | 'output' = 'output',
) {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io,
  });

  const {
    $schema: esquemaJSONEliminado,
    ...esquemaOpenAPI
  } = jsonSchema;

  void esquemaJSONEliminado;

  return esquemaOpenAPI;
}


export const documentoOpenAPI = {
  openapi: '3.1.0',
  info: {
    title: 'SGMC · API de Crédito Vecino, S. A.',
    version: '1.0.0',
    description:
      'Contrato del Sistema de Gestión de Microcrédito. Los esquemas se generan desde Zod: el contrato y la validación en ejecución son el mismo artefacto.',
    contact: { name: 'Análisis de Sistemas II (037) — UMG' },
    license: { name: 'Uso académico' },
  },
  servers: [
    { url: 'https://api.creditovecino.gt/v1', description: 'Producción (ficticia)' },
  ],
  tags: [
    { name: 'Cartera y cobros', description: 'Registro de pagos y saldos' },
    { name: 'Cierres e indicadores', description: 'Cartera en riesgo y cierres' },
  ],
  paths: {
    '/creditos/{creditoId}/pagos': {
      post: {
        tags: ['Cartera y cobros'],
        operationId: 'registrarPago',
        summary: 'Registra un pago sobre un crédito',
        description:
          'Aplica el pago en el orden de prelación (gastos → interés moratorio → interés corriente → capital) y devuelve el desglose. Operación NO idempotente por método: la idempotencia se obtiene con la cabecera Idempotency-Key.',
        parameters: [
          {
            name: 'creditoId',
            in: 'path',
            required: true,
            description: 'Identificador del crédito',
            schema: convertirAOpenAPI(
              CreditoIdSchema,
              'input',
            ),
          },
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: true,
            description:
              'Clave generada por el cliente. Si se reintenta el mismo pago con la misma clave y el mismo cuerpo, se devuelve la respuesta original (200) sin volver a cobrar.',
            schema: convertirAOpenAPI(
              IdempotencyKeySchema,
              'input',
            ),
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegistrarPagoRequest' },
              examples: {
                pagoExacto: {
                  summary: 'Pago exacto de la cuota 2 vencida (caso de referencia 6.6.3)',
                  value: {
                    monto: { valor: '1011.88', moneda: 'GTQ' },
                    fechaPago: '2026-08-22',
                    medio: 'agente_bancario',
                    referencia: 'BOL-88213',
                  },
                },
                pagoParcial: {
                  summary: 'Pago de menos (caso de referencia 6.6.4)',
                  value: {
                    monto: { valor: '500.00', moneda: 'GTQ' },
                    fechaPago: '2026-08-22',
                    medio: 'efectivo',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description:
              'Reintento con la misma clave y el mismo contenido: se reproduce la respuesta original (reproducido = true). No se cobró de nuevo.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PagoRegistrado' },
              },
            },
          },
          '201': {
            description: 'Pago registrado por primera vez',
            headers: { Location: { description: 'URI del pago creado', schema: { type: 'string' } } },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PagoRegistrado' },
              },
            },
          },
          '404': {
            description: 'El crédito no existe',
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' },
                examples: {
                  caso: {
                    summary: 'El crédito no existe',
                    value: {
                      type: 'https://api.creditovecino.gt/problemas/credito-no-encontrado',
                      title: 'El crédito no existe',
                      status: 404,
                      detail: "No existe ningún crédito con el identificador 'C-999'.",
                      instance: '/creditos/C-999/pagos',
                      traceId: '01J9Z4T900',
                    },
                  },
                },
              },
            },
          },
          '409': {
            description:
              'Conflicto: la clave de idempotencia se reutilizó con un contenido distinto, o el estado del crédito no admite pagos (p. ej. solicitado).',
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' },
                examples: {
                  caso: {
                    summary: 'Conflicto: clave reutilizada',
                    value: {
                      type: 'https://api.creditovecino.gt/problemas/clave-idempotencia-reutilizada',
                      title: 'Clave de idempotencia reutilizada con otro contenido',
                      status: 409,
                      detail: 'La clave 5b0b9e2e… se usó antes con un monto distinto.',
                      instance: '/creditos/C-004/pagos',
                      traceId: '01J9Z4T8Q2',
                    },
                  },
                },
              },
            },
          },
          '422': {
            description: 'El cuerpo es sintácticamente válido pero viola una regla del contrato o del dominio',
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' },
                examples: {
                  caso: {
                    summary: 'Estado no admite pagos',
                    value: {
                      type: 'https://api.creditovecino.gt/problemas/estado-no-admite-pago',
                      title: 'El crédito no admite pagos en su estado actual',
                      status: 422,
                      detail: "El crédito 'C-010' está en estado 'solicitado': aún no fue desembolsado.",
                      instance: '/creditos/C-010/pagos',
                      traceId: '01J9Z4T9K1',
                    },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Demasiadas solicitudes',
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' },
                examples: {
                  caso: {
                    summary: 'Demasiadas solicitudes',
                    value: {
                      type: 'https://api.creditovecino.gt/problemas/limite-excedido',
                      title: 'Demasiadas solicitudes en poco tiempo',
                      status: 429,
                      detail: 'Se superó el límite de 60 solicitudes por minuto. Reintente tras Retry-After.',
                      instance: '/creditos/C-004/pagos',
                      traceId: '01J9Z4T9X7',
                    },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Error no previsto del servidor',
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' },
                examples: {
                  caso: {
                    summary: 'Error interno',
                    value: {
                      type: 'https://api.creditovecino.gt/problemas/error-servidor',
                      title: 'Error no previsto del servidor',
                      status: 500,
                      detail: 'Ocurrió un error inesperado al procesar el pago. Consulte el traceId.',
                      instance: '/creditos/C-004/pagos',
                      traceId: '01J9Z4TA02',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/cartera-riesgo': {
      get: {
        tags: ['Cierres e indicadores'],
        operationId: 'consultarCarteraEnRiesgo',
        summary: 'Consulta el indicador de cartera en riesgo a una fecha de corte',
        description:
          'Operación segura e idempotente. Devuelve siempre, junto al porcentaje, lo dado por incobrable en el período.',
        parameters: [
          {
            name: 'fechaCorte',
            in: 'query',
            required: true,
            schema: convertirAOpenAPI(
              FechaISOSchema,
              'input',
            ),
          },
          {
            name: 'incluirReestructurados',
            in: 'query',
            required: false,
            schema: convertirAOpenAPI(
              IncluirReestructuradosSchema,
              'input',
            ),
          },
        ],
        responses: {
          '200': {
            description: 'Indicador calculado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CarteraEnRiesgoResponse' },
                examples: {
                  casoDeReferencia: {
                    summary: 'Caso de referencia 6.8.1 del Proyecto 1 (7.00 %)',
                    value: {
                      fechaCorte: '2026-08-22',
                      carteraActiva: { valor: '800000.00', moneda: 'GTQ' },
                      saldoEnRiesgo: { valor: '56000.00', moneda: 'GTQ' },
                      porcentajeEnRiesgo: 0.07,
                      dadoPorIncobrableEnElPeriodo: { valor: '15000.00', moneda: 'GTQ' },
                      porTramo: [
                        { tramo: 'mora_2', creditos: 1, saldoCapital: { valor: '24000.00', moneda: 'GTQ' } },
                        { tramo: 'mora_3', creditos: 1, saldoCapital: { valor: '18000.00', moneda: 'GTQ' } },
                        { tramo: 'vencido', creditos: 1, saldoCapital: { valor: '8000.00', moneda: 'GTQ' } },
                      ],
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Parámetros de consulta inválidos',
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' },
                examples: {
                  caso: {
                    summary: 'Parámetros inválidos',
                    value: {
                      type: 'https://api.creditovecino.gt/problemas/validacion',
                      title: 'Parámetros de consulta inválidos',
                      status: 400,
                      detail: "El parámetro 'fechaCorte' no cumple el formato AAAA-MM-DD.",
                      instance: '/cartera-riesgo',
                      traceId: '01J9Z4TB14',
                      errores: [{ campo: 'fechaCorte', mensaje: "Formato esperado: AAAA-MM-DD, p. ej. '2026-08-22'." }],
                    },
                  },
                },
              },
            },
          },
          '422': {
            description: 'Fecha de corte fuera del rango permitido',
            content: {
              'application/problem+json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' },
                examples: {
                  caso: {
                    summary: 'Fecha fuera de rango',
                    value: {
                      type: 'https://api.creditovecino.gt/problemas/fecha-fuera-de-rango',
                      title: 'Fecha de corte fuera del rango permitido',
                      status: 422,
                      detail: 'La fecha de corte no puede ser posterior a la fecha del día ni anterior al 01/01/2025.',
                      instance: '/cartera-riesgo',
                      traceId: '01J9Z4TBZ3',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
    components: {
    schemas: {
      Dinero: convertirAOpenAPI(
        DineroSchema,
      ),

      ErrorDetalle: convertirAOpenAPI(
        ErrorDetalleSchema,
      ),

      ProblemDetails: convertirAOpenAPI(
        ProblemDetailsSchema,
      ),

      FechaISO: convertirAOpenAPI(
        FechaISOSchema,
      ),

      InstanteISO: convertirAOpenAPI(
        InstanteISOSchema,
      ),

      CreditoId: convertirAOpenAPI(
        CreditoIdSchema,
      ),

      IdempotencyKey: convertirAOpenAPI(
        IdempotencyKeySchema,
      ),

      MedioDePago: convertirAOpenAPI(
        MedioDePagoSchema,
      ),

      RegistrarPagoRequest: convertirAOpenAPI(
        RegistrarPagoRequestSchema,
        'input',
      ),

      AplicacionDelPago: convertirAOpenAPI(
        AplicacionDelPagoSchema,
      ),

      TramoMora: convertirAOpenAPI(
        TramoMoraSchema,
      ),

      EstadoCredito: convertirAOpenAPI(
        EstadoCreditoSchema,
      ),

      PagoRegistrado: convertirAOpenAPI(
        PagoRegistradoSchema,
      ),

      IncluirReestructurados: convertirAOpenAPI(
        IncluirReestructuradosSchema,
        'input',
      ),

      CarteraEnRiesgoQuery: convertirAOpenAPI(
        CarteraEnRiesgoQuerySchema,
        'input',
      ),

      DetalleTramoCartera: convertirAOpenAPI(
        DetalleTramoCarteraSchema,
      ),

      CarteraEnRiesgoResponse: convertirAOpenAPI(
        CarteraEnRiesgoResponseSchema,
      ),
    },
  },
};