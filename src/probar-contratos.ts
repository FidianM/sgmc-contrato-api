import {
  RegistrarPagoRequestSchema,
  PagoRegistradoSchema,
} from './contratos/pagos.js';

import {
  CarteraEnRiesgoQuerySchema,
  CarteraEnRiesgoResponseSchema,
} from './contratos/cartera.js';

function mostrarResultado(
  nombre: string,
  resultado: {
    success: boolean;
    error?: unknown;
  },
) {
  console.log(
    `${resultado.success ? '✔' : '✘'} ${nombre}`,
  );

  if (!resultado.success) {
    console.dir(resultado.error, {
      depth: null,
    });
  }
}

mostrarResultado(
  'Petición de pago válida',
  RegistrarPagoRequestSchema.safeParse({
    monto: {
      valor: '1011.88',
      moneda: 'GTQ',
    },
    fechaPago: '2026-08-22',
    medio: 'agente_bancario',
    referencia: 'BOL-88213',
  }),
);

mostrarResultado(
  'Referencia mayor de 40 caracteres rechazada',
  RegistrarPagoRequestSchema.safeParse({
    monto: {
      valor: '1011.88',
      moneda: 'GTQ',
    },
    fechaPago: '2026-08-22',
    medio: 'efectivo',
    referencia:
      'ESTA-REFERENCIA-TIENE-MAS-DE-CUARENTA-CARACTERES',
  }),
);

mostrarResultado(
  'Respuesta de pago completa',
  PagoRegistradoSchema.safeParse({
    pagoId: 'PG-2026-000731',
    creditoId: 'C-004',
    recibidoEn: '2026-08-22T09:15:00-06:00',
    montoRecibido: {
      valor: '1011.88',
      moneda: 'GTQ',
    },
    aplicacion: {
      gastos: {
        valor: '25.00',
        moneda: 'GTQ',
      },
      interesMoratorio: {
        valor: '40.12',
        moneda: 'GTQ',
      },
      interesCorriente: {
        valor: '220.00',
        moneda: 'GTQ',
      },
      capital: {
        valor: '725.76',
        moneda: 'GTQ',
      },
      excedente: {
        valor: '1.00',
        moneda: 'GTQ',
      },
    },
    saldoCapitalDespues: {
      valor: '9274.24',
      moneda: 'GTQ',
    },
    estadoCredito: 'en_mora',
    tramoMora: 'mora_2',
    diasAtraso: 32,
    reproducido: false,
  }),
);

mostrarResultado(
  'Consulta con false predeterminado',
  CarteraEnRiesgoQuerySchema.safeParse({
    fechaCorte: '2026-08-22',
  }),
);

mostrarResultado(
  'Respuesta de cartera completa',
  CarteraEnRiesgoResponseSchema.safeParse({
    fechaCorte: '2026-08-22',
    carteraActiva: {
      valor: '800000.00',
      moneda: 'GTQ',
    },
    saldoEnRiesgo: {
      valor: '56000.00',
      moneda: 'GTQ',
    },
    porcentajeEnRiesgo: 0.07,
    dadoPorIncobrableEnElPeriodo: {
      valor: '15000.00',
      moneda: 'GTQ',
    },
    porTramo: [
      {
        tramo: 'mora_2',
        creditos: 1,
        saldoCapital: {
          valor: '24000.00',
          moneda: 'GTQ',
        },
      },
    ],
  }),
);