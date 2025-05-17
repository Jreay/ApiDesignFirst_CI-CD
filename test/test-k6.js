import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // usuarios virtuales simultáneos
  duration: '10s', // tiempo total de la prueba
};

export default function () {
  const res = http.get('http://localhost:3000/api/usuarios');

  check(res, {
    'status es 200': (r) => r.status === 200,
    'respuesta contiene usuarios': (r) => r.body.includes('nombre'),
  });

  sleep(1);
}
