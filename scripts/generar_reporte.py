import sys
from fpdf import FPDF

input_path = sys.argv[1] if len(sys.argv) > 1 else "reports/resultado_spectral.txt"
output_filename = sys.argv[2] if len(sys.argv) > 2 else "reporte_default.pdf"

with open(input_path, "r", encoding="utf-8") as f:
    contenido = f.read()

# Reemplazar símbolos problemáticos (✖, ⚠️, ✔, etc.)
contenido = contenido.encode('ascii', 'ignore').decode('ascii')

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.multi_cell(0, 10, contenido)

pdf.output(output_filename)
print(f"✅ PDF generado: {output_filename}")