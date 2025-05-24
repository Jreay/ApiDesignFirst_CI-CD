import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const responseTimeTrend = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  // Cambio principal: Usar 'localhost' en lugar de 'api' 
  const url = 'http://localhost:3000/api/usuarios';  // ← Cambiado!
  const params = {
    timeout: '10s',
    tags: {
      endpoint: 'get_usuarios',
    },
  };

  try {
    const res = http.get(url, params);
    
    responseTimeTrend.add(res.timings.duration);
    
    check(res, {
      'status es 200': (r) => r.status === 200,
      'respuesta contiene usuarios': (r) => {
        try {
          return JSON.parse(r.body).some(u => u.nombre);
        } catch (e) {
          return false;
        }
      },
    });
  } catch (e) {
    console.error(`Error en request: ${e.message}`);
  }

  sleep(1);
}