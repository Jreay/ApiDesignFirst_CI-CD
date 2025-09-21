import json
import utils
import os
from datetime import datetime
from generar_PDF import GenerarPDF

# ---------------------------
# Configuración de rutas
# ---------------------------
idioma_entrada = "en"
idioma_salida = "es"

input_resultado = "./resultados/"
espectral_path = f"{input_resultado}resultadoEspectral.json"
ruta_grafico_espectral = f"{input_resultado}grafico_resultados_espectral.png"
compare_path = f"{input_resultado}resultadoCompare.json"
sonar_path = f"{input_resultado}resultadoSonar.json"
k6_path = f"{input_resultado}resultadoK6.json"

# Salida PDF
fecha_hora = os.getenv('REPORT_TIMESTAMP', datetime.now().strftime("%Y%m%d_%H%M"))
output_filename = f"./reportes/reporte_{fecha_hora}.pdf"


def cargar_json_con_codificacion(path):
    try:
        enc = utils.detectar_codificacion(path)
        with open(path, "r", encoding=enc) as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARN] No se pudo procesar {path}: {e}")
        return None


# --------------------------------------
# (1) PROCESAR - resultado.json (Spectral)
# --------------------------------------
encoding = utils.detectar_codificacion(espectral_path)

with open(espectral_path, "r", encoding=encoding) as f:
    data = json.load(f)

# Procesar datos Spectrum/Spectral
archivos = utils.agrupar_por_archivo(data)
resumen, count_errors, count_warnings, count_infos, count_hints = utils.generar_resumen(data)
utils.generar_grafico_pastel(ruta_grafico_espectral, count_errors, count_warnings, count_infos, count_hints)

# Crear PDF
pdf = GenerarPDF()
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=15)

# Sección 1: Validación de Contrato (Spectral)
archivo, resultados = next(iter(archivos.items()))
pdf.agregar_separador()
pdf.agregar_titulo("Validación de Contrato")
pdf.agregar_resumen(archivo, resumen)
pdf.agregar_leyenda_resumen(37, pdf.get_y(), count_errors, count_warnings, count_infos, count_hints)
pdf.insertar_grafico(ruta_grafico_espectral)
pdf.agregar_tabla(resultados, 1)
pdf.ln(5)

compare_data = cargar_json_con_codificacion(compare_path)
if compare_data:
    pdf.add_page()
    pdf.agregar_separador()
    pdf.agregar_titulo("Comparación de Contratos (Original vs Generado)")
    pdf.agregar_tabla_comparacion(compare_data)
    pdf.ln(5)

sonar_json = cargar_json_con_codificacion(sonar_path)
if sonar_json and "component" in sonar_json and "measures" in sonar_json["component"]:
    measures = {m.get("metric"): m.get("value") for m in sonar_json["component"].get("measures", [])}
    sonar_compacto = {
        "coverage": measures.get("coverage"),
        "bugs": measures.get("bugs"),
        "vulnerabilities": measures.get("vulnerabilities"),
        "code_smells": measures.get("code_smells"),
        "duplicated_lines_density": measures.get("duplicated_lines_density"),
        "ncloc": measures.get("ncloc"),
    }
    pdf.add_page()
    pdf.agregar_separador()
    pdf.agregar_titulo("Calidad de Código (SonarQube)")
    pdf.agregar_tabla_sonar(sonar_compacto)
    pdf.ln(5)

else:
    if sonar_json is None:
        print(f"[WARN] Saltando sección SonarQube: no se pudo leer {sonar_path}")
    else:
        print("[WARN] Saltando sección SonarQube: formato inesperado en JSON")

k6_json = cargar_json_con_codificacion(k6_path)
if k6_json:
    sm = k6_json.get("summary_metrics", {})
    ei = k6_json.get("execution_info", {})

    k6_compacto = {
        "http_req_duration_avg": sm.get("http_req_duration", {}).get("avg"),
        "http_req_duration_p95": sm.get("http_req_duration", {}).get("p95"),
        "ttfb_avg": sm.get("ttfb", {}).get("avg"),
        "ttfb_p95": sm.get("ttfb", {}).get("p95"),
        "http_req_failed_rate": sm.get("http_req_failed", {}).get("rate"),
        "checks_rate": sm.get("checks", {}).get("rate"),
        "total_requests": ei.get("total_requests"),
        "total_time_ms": ei.get("total_time_ms"),
        "iterations_completed": ei.get("iterations_completed"),
    }

    pdf.add_page()
    pdf.agregar_separador()
    pdf.agregar_titulo("Rendimiento (k6)")
    pdf.agregar_tabla_k6(k6_compacto)
    pdf.ln(5)

else:
    print(f"[WARN] Saltando sección k6: no se pudo leer {k6_path}")

# Guardar y finalizar
pdf.output(output_filename)

print(f"✅ PDF generado: {output_filename}")
