const fs = require('fs');
const readline = require('readline');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

(async () => {
  const input = fs.createReadStream('resultado-k6.json');
  const rl = readline.createInterface({ input });

  const labels = [];
  const durations = [];

  for await (const line of rl) {
    try {
      const json = JSON.parse(line);
      if (json.metric === 'http_req_duration') {
        durations.push(json.data.value);
        labels.push(durations.length);
      }
    } catch (e) {
      console.error('Línea inválida:', line);
    }
  }

  const config = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Duración de solicitudes HTTP (ms)',
        data: durations,
        fill: false,
        borderWidth: 2
      }]
    }
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  fs.writeFileSync('grafico-k6.png', buffer);
})();
