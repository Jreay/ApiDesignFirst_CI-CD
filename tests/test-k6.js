import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Tendencias personalizadas
const responseTimeTrend = new Trend('response_time');
const ttfbTrend = new Trend('ttfb');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],        // Menos del 10% de errores permitidos
    http_req_duration: ['p(95)<700'],      // 95% de las respuestas deben ser < 700 ms
    ttfb: ['p(95)<300'],                   // TTFB también debe mantenerse rápido
  },
};

const BASE_URL = 'https://openapi-09h0.onrender.com/api/movimientos';

const endpoints = [
  {
    name: 'ahorro',
    url: `${BASE_URL}/ahorro`,
    headers: { 'X-Numero-Cuenta': 'AHO-123456' },
  },
  {
    name: 'corriente',
    url: `${BASE_URL}/corriente`,
    headers: { 'X-Numero-Cuenta': 'COR-654321' },
  },
  {
    name: 'tarjetas',
    url: `${BASE_URL}/tarjetas`,
    headers: { 'X-Numero-Tarjeta': 'TARJ-4567890123' },
  },
  {
    name: 'ahorro_detalle',
    url: `${BASE_URL}/ahorro/detalle`,
    headers: {
      'X-Numero-Cuenta': 'AHO-123456',
      'X-Movimiento-Id': 'mov-123',
    },
  },
  {
    name: 'corriente_detalle',
    url: `${BASE_URL}/corriente/detalle`,
    headers: {
      'X-Numero-Cuenta': 'COR-654321',
      'X-Movimiento-Id': 'mov-456',
    },
  },
  {
    name: 'tarjetas_detalle',
    url: `${BASE_URL}/tarjetas/detalle`,
    headers: {
      'X-Numero-Tarjeta': 'TARJ-4567890123',
      'X-Movimiento-Id': 'mov-789',
    },
  },
];

export default function () {
  for (const endpoint of endpoints) {
    const res = http.get(endpoint.url, {
      headers: endpoint.headers,
      timeout: '10s',
    });

    // Guardar métricas
    responseTimeTrend.add(res.timings.duration);
    ttfbTrend.add(res.timings.waiting); // TTFB: Time to first byte

    // Validaciones básicas
    check(res, {
      [`[${endpoint.name}] status es 200`]: (r) => r.status === 200,
      [`[${endpoint.name}] respuesta no vacía`]: (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && (Array.isArray(body) ? body.length > 0 : body.id);
        } catch (e) {
          return false;
        }
      },
    });

    sleep(1);
  }
}
