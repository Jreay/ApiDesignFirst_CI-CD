import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

// Definición de métricas personalizadas para mayor granularidad
const responseTimeTrend = new Trend("response_time");
const ttfbTrend = new Trend("ttfb");

// Configuración de las opciones de la prueba (stages, umbrales)
export const options = {
  // Simula un "load test" con carga gradual
  stages: [
    { duration: "30s", target: 10 }, // Calentamiento con 10 usuarios
    { duration: "1m", target: 10 },  // Mantener 10 usuarios por 1 minuto
    { duration: "30s", target: 0 }   // Bajada gradual de usuarios
  ],
  // Umbrales de calidad del servicio (SLAs)
  thresholds: {
    // La tasa de fallos HTTP debe ser menor al 10%
    http_req_failed: ["rate<0.10"],
    // El 95% de las respuestas deben ser más rápidas que 700ms
    http_req_duration: ["p(95)<700"],
    // El 95% del "Time to First Byte" (latencia) debe ser menor a 300ms
    ttfb: ["p(95)<1000"]
  },
};

const BASE_URL = "https://openapi-09h0.onrender.com/api/movimientos";

// Endpoints a ser probados
const endpoints = [
  {
    name: "ahorro",
    url: `${BASE_URL}/ahorro`,
    headers: { "x_numero_cuenta": "AHO-123456" },
  },
  {
    name: "corriente",
    url: `${BASE_URL}/corriente`,
    headers: { "x_numero_cuenta": "COR-654321" },
  },
  {
    name: "tarjetas",
    url: `${BASE_URL}/tarjetas`,
    headers: { "x_numero_tarjeta": "TARJ-4567890123" },
  },
  {
    name: "ahorro_detalle",
    url: `${BASE_URL}/ahorro/detalle`,
    headers: {
      "x_numero_cuenta": "AHO-123456",
      "x_movimiento_id": "mov-123",
    },
  },
  {
    name: "corriente_detalle",
    url: `${BASE_URL}/corriente/detalle`,
    headers: {
      "x_numero_cuenta": "COR-654321",
      "x_movimiento_id": "mov-456",
    },
  },
  {
    name: "tarjetas_detalle",
    url: `${BASE_URL}/tarjetas/detalle`,
    headers: {
      "x_numero_tarjeta": "TARJ-4567890123",
      "x_movimiento_id": "mov-789",
    },
  },
];

export default function () {
  for (const endpoint of endpoints) {
    const res = http.get(endpoint.url, {
      headers: endpoint.headers,
      timeout: "10s",
    });

    // Agregar datos a las métricas personalizadas
    responseTimeTrend.add(res.timings.duration);
    ttfbTrend.add(res.timings.waiting);

    // Chequeos para validar la respuesta
    check(res, {
      [`[${endpoint.name}] status es 200`]: (r) => r.status === 200,
    });
    
    // Validar que la respuesta sea un JSON válido y no esté vacío
    try {
        const body = JSON.parse(res.body);
        check(body, {
            [`[${endpoint.name}] respuesta no vacía`]: (b) => {
                if (Array.isArray(b)) {
                    // Si es un array, que no esté vacío
                    return b.length > 0;
                } else if (typeof b === 'object' && b !== null) {
                    // Si es un objeto, que tenga la propiedad 'id'
                    return b.id !== undefined;
                }
                return false; // Si no es ni array ni objeto, falla el chequeo
            },
        });
    } catch (e) {
        // En caso de que el JSON no sea válido, marcar el chequeo como fallido
        check(res, {
            [`[${endpoint.name}] respuesta es JSON válido`]: (r) => false,
        });
    }

    // Pausa entre cada solicitud para simular un comportamiento de usuario real
    sleep(1);
  }
}

export function handleSummary(data) {
  // Extrae los valores que te interesan del objeto 'data'
  const finalReport = {
    // Umbrales de la prueba (Pasa/Falla)
    thresholds_status: data.root_group.thresholds,
    // Métricas clave y sus valores finales
    summary_metrics: {
      http_req_duration: {
        avg: data.metrics.http_req_duration.values.avg,
        p95: data.metrics.http_req_duration.values["p(95)"],
      },
      ttfb: {
        avg: data.metrics.ttfb.values.avg,
        p95: data.metrics.ttfb.values["p(95)"],
      },
      http_req_failed: {
        rate: data.metrics.http_req_failed.values.rate,
      },
      checks: {
        rate: data.metrics.checks.values.rate,
      },
    },
    // Información general de la ejecución
    execution_info: {
      total_requests: data.metrics.http_reqs.values.count,
      total_time_ms: data.state.testRunDurationMs,
      iterations_completed: data.metrics.iterations.values.count,
    }
  };

  // Retorna un objeto que K6 usará para escribir en el archivo 'reporte_resumido.json'
  return {
    './resultados/resultadoK6.json': JSON.stringify(finalReport, null, 2),
  };
}