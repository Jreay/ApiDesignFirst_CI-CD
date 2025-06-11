import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
};

const BASE_URL = 'https://openapi-09h0.onrender.com/api/movimientos';

const endpoints = [
  {
    name: 'ahorro',
    url: `${BASE_URL}/ahorro`,
    headers: { 'X-Numero-Cuenta': 'AHO-123456' },
  },
  {
    name: 'ahorro_detalle',
    url: `${BASE_URL}/ahorro/detalle`,
    headers: {
      'X-Numero-Cuenta': 'AHO-123456',
      'X-Movimiento-Id': 'mov-123',
    },
  },
];

export default function () {
  for (const endpoint of endpoints) {
    const res = http.get(endpoint.url, { headers: endpoint.headers, timeout: '10s' });

    check(res, {
      [`[${endpoint.name}] status es 200`]: (r) => r.status === 200,
      [`[${endpoint.name}] contiene contenido`]: (r) => {
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
