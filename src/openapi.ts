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
            schema: {
              type: 'string',
              pattern: '^C-\\d{3,8}$',
              description: 'Identificador del crédito',
              examples: ['C-004'],
            },
          },
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: true,
            description:
              'Clave generada por el cliente. Si se reintenta el mismo pago con la misma clave y el mismo cuerpo, se devuelve la respuesta original (200) sin volver a cobrar.',
            schema: {
              type: 'string',
              format: 'uuid',
              pattern:
                '^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$',
              examples: ['5b0b9e2e-6a1f-4a5c-9c1e-0d6d1a1f0b3a'],
            },
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
            schema: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'Fecha calendario en formato AAAA-MM-DD',
              examples: ['2026-08-22'],
            },
          },
          {
            name: 'incluirReestructurados',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['true', 'false'] },
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
      Dinero: {
        type: 'object',
        properties: {
          valor: {
            type: 'string',
            pattern: '^-?\\d{1,13}\\.\\d{2}$',
            description: 'Importe como cadena decimal con 2 decimales exactos',
            examples: ['1004.62'],
          },
          moneda: {
            type: 'string',
            const: 'GTQ',
            description: 'Código ISO 4217. El Sistema opera únicamente en quetzales.',
            examples: ['GTQ'],
          },
        },
        required: ['valor', 'moneda'],
        additionalProperties: false,
        description: 'Objeto de Valor monetario en quetzales.',
      },
      ProblemDetails: {
        type: 'object',
        properties: {
          type: { type: 'string', format: 'uri', examples: ['https://api.creditovecino.gt/problemas/clave-idempotencia-reutilizada'] },
          title: { type: 'string', examples: ['Clave de idempotencia reutilizada con otro contenido'] },
          status: { type: 'integer', minimum: 400, maximum: 599, examples: [409] },
          detail: { type: 'string', examples: ['La clave 5b0b9e2e… se usó antes con un monto distinto.'] },
          instance: { type: 'string', examples: ['/creditos/C-004/pagos'] },
          traceId: { type: 'string', examples: ['01J9Z4T8Q2'] },
          errores: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                campo: { type: 'string', examples: ['monto.valor'] },
                mensaje: { type: 'string', examples: ['Debe ser decimal de punto fijo con 2 decimales'] },
              },
              required: ['campo', 'mensaje'],
              additionalProperties: false,
            },
          },
        },
        required: ['type', 'title', 'status'],
        additionalProperties: false,
        description: 'Cuerpo de error uniforme del Sistema, conforme a RFC 9457.',
      },
      Paginacion: {
        type: 'object',
        properties: {
          limite: { default: 50, type: 'integer', minimum: 1, maximum: 200 },
          cursor: { type: 'string' },
        },
        required: ['limite'],
        additionalProperties: false,
      },
      CarteraEnRiesgoQuery: {
        type: 'object',
        properties: {
          fechaCorte: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', examples: ['2026-08-22'] },
        },
        required: ['fechaCorte'],
        additionalProperties: false,
      },
      CarteraEnRiesgoResponse: {
        type: 'object',
        properties: {
          fechaCorte: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', examples: ['2026-08-22'] },
          carteraActiva: { $ref: '#/components/schemas/Dinero' },
          saldoEnRiesgo: { $ref: '#/components/schemas/Dinero' },
          porcentajeEnRiesgo: { type: 'number', minimum: 0, maximum: 1, examples: [0.07] },
          dadoPorIncobrableEnElPeriodo: { $ref: '#/components/schemas/Dinero' },
        },
        required: ['fechaCorte', 'carteraActiva', 'saldoEnRiesgo', 'porcentajeEnRiesgo', 'dadoPorIncobrableEnElPeriodo'],
        additionalProperties: false,
      },
      MedioDePago: {
        type: 'string',
        enum: ['efectivo', 'transferencia', 'agente_bancario', 'boleta_banco'],
      },
      RegistrarPagoRequest: {
        type: 'object',
        properties: {
          monto: { $ref: '#/components/schemas/Dinero' },
          fechaPago: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', examples: ['2026-08-22'] },
          medio: { $ref: '#/components/schemas/MedioDePago' },
          referencia: { type: 'string', examples: ['BOL-88213'] },
        },
        required: ['monto', 'fechaPago', 'medio'],
        additionalProperties: false,
      },
      AplicacionDelPago: {
        type: 'object',
        properties: {
          gastos: { $ref: '#/components/schemas/Dinero' },
          interesMoratorio: { $ref: '#/components/schemas/Dinero' },
          interesCorriente: { $ref: '#/components/schemas/Dinero' },
          capital: { $ref: '#/components/schemas/Dinero' },
          excedente: { $ref: '#/components/schemas/Dinero' },
        },
        required: ['gastos', 'interesMoratorio', 'interesCorriente', 'capital', 'excedente'],
        additionalProperties: false,
      },
      EstadoCredito: {
        type: 'string',
        enum: ['vigente', 'en_mora', 'cancelado', 'reestructurado', 'incobrable'],
      },
      TramoMora: {
        type: 'string',
        enum: ['al_dia', 'mora_1', 'mora_2', 'mora_3', 'vencido', 'ninguno'],
      },
      PagoRegistrado: {
        type: 'object',
        properties: {
          pagoId: { type: 'string', examples: ['PG-2026-000731'] },
          creditoId: { type: 'string', pattern: '^C-\\d{3,8}$', examples: ['C-004'] },
          recibidoEn: { type: 'string', examples: ['2026-08-22T09:15:00-06:00'] },
          montoRecibido: { $ref: '#/components/schemas/Dinero' },
          aplicacion: { $ref: '#/components/schemas/AplicacionDelPago' },
          reproducido: { type: 'boolean', examples: [false] },
        },
        required: ['pagoId', 'creditoId', 'recibidoEn', 'montoRecibido', 'aplicacion', 'reproducido'],
        additionalProperties: false,
      },
    },
  },
};
