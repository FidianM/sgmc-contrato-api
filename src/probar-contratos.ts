import {
  RegistrarPagoRequestSchema,
  PagoRegistradoSchema,
  EstadoCreditoSchema,
} from './contratos/pagos.js';

import {
  CarteraEnRiesgoQuerySchema,
  CarteraEnRiesgoResponseSchema,
} from './contratos/cartera.js';

function verificar(nombre: string, condicion: boolean) {
  if (!condicion) {
    throw new Error(`Falló la prueba: ${nombre}`);
  }

  console.log(`✔ ${nombre}`);
}

const peticionValida = RegistrarPagoRequestSchema.safeParse({
  monto: {
    valor: '1011.88',
    moneda: 'GTQ',
  },
  fechaPago: '2026-08-22',
  medio: 'agente_bancario',
  referencia: 'BOL-88213',
});

verificar(
  'Petición de pago válida aceptada',
  peticionValida.success,
);

const referenciaLarga = RegistrarPagoRequestSchema.safeParse({
  monto: {
    valor: '1011.88',
    moneda: 'GTQ',
  },
  fechaPago: '2026-08-22',
  medio: 'efectivo',
  referencia:
    'ESTA-REFERENCIA-TIENE-MAS-DE-CUARENTA-CARACTERES',
});

verificar(
  'Referencia mayor de 40 caracteres rechazada',
  !referenciaLarga.success,
);

const pagoNegativo = RegistrarPagoRequestSchema.safeParse({
  monto: {
    valor: '-10.00',
    moneda: 'GTQ',
  },
  fechaPago: '2026-08-22',
  medio: 'efectivo',
});

verificar(
  'Monto negativo rechazado',
  !pagoNegativo.success,
);

const pagoCero = RegistrarPagoRequestSchema.safeParse({
  monto: {
    valor: '0.00',
    moneda: 'GTQ',
  },
  fechaPago: '2026-08-22',
  medio: 'efectivo',
});

verificar(
  'Pago de cero rechazado',
  !pagoCero.success,
);

const respuestaPago = PagoRegistradoSchema.safeParse({
  pagoId: 'PG-2026-000731',
  creditoId: 'C-004',
  recibidoEn: '2026-08-22T09:15:00-06:00',

  montoRecibido: {
    valor: '1011.88',
    moneda: 'GTQ',
  },

  aplicacion: {
    gastos: {
      valor: '0.00',
      moneda: 'GTQ',
    },
    interesMoratorio: {
      valor: '7.26',
      moneda: 'GTQ',
    },
    interesCorriente: {
      valor: '278.86',
      moneda: 'GTQ',
    },
    capital: {
      valor: '725.76',
      moneda: 'GTQ',
    },
    excedente: {
      valor: '0.00',
      moneda: 'GTQ',
    },
  },

  destinoExcedente: null,

  saldoCapitalDespues: {
    valor: '8569.62',
    moneda: 'GTQ',
  },

  estadoCredito: 'vigente',
  tramoMora: 'ninguno',
  diasAtraso: 0,
  reproducido: false,
});

verificar(
  'Respuesta de pago completa aceptada',
  respuestaPago.success,
);

const estadosCompletos = [
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
].every(
  (estado) =>
    EstadoCreditoSchema.safeParse(estado).success,
);

verificar(
  'Ciclo de estados completo aceptado',
  estadosCompletos,
);

const consultaSinBandera =
  CarteraEnRiesgoQuerySchema.safeParse({
    fechaCorte: '2026-08-22',
  });

verificar(
  'Consulta usa true como valor predeterminado para reestructurados',
  consultaSinBandera.success &&
    consultaSinBandera.data.incluirReestructurados === true,
);

const consultaQueExcluyeReestructurados =
  CarteraEnRiesgoQuerySchema.safeParse({
    fechaCorte: '2026-08-22',
    incluirReestructurados: false,
  });

verificar(
  'No se permite excluir reestructurados del indicador oficial',
  !consultaQueExcluyeReestructurados.success,
);

const respuestaCartera =
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
      {
        tramo: 'mora_3',
        creditos: 1,
        saldoCapital: {
          valor: '18000.00',
          moneda: 'GTQ',
        },
      },
      {
        tramo: 'vencido',
        creditos: 1,
        saldoCapital: {
          valor: '8000.00',
          moneda: 'GTQ',
        },
      },
    ],

    reestructuradosAlDia: {
      creditos: 1,
      saldoCapital: {
        valor: '6000.00',
        moneda: 'GTQ',
      },
    },
  });

verificar(
  'Respuesta de cartera completa aceptada',
  respuestaCartera.success,
);

console.log(
  'Todas las pruebas del contrato finalizaron correctamente.',
);