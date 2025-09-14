import utils
from fpdf import FPDF
from datetime import datetime

class GenerarPDF(FPDF):

    def header(self):
        # Color de fondo del header
        self.set_fill_color(1, 46, 74)  # #012E4A
        self.rect(0, 0, 210, 25, 'F')   # Rectángulo azul en el top (A4 es 210 mm de ancho)

        # Texto en blanco centrado
        self.set_text_color(255, 255, 255)
        self.set_font("Arial", "B", 16)
        self.set_y(8)
        self.cell(0, 10, "REPORTE DEL PIPELINE", 0, 1, "C")

        # Fecha justo debajo del título
        self.set_font("Arial", "", 10)
        self.cell(0, 10, f"Generado el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 0, 0, "C")
        self.ln(15)

    def footer(self):
        # Posición desde abajo
        self.set_y(-15)

        # Fondo del footer
        self.set_fill_color(1, 46, 74)  # #012E4A
        self.rect(0, self.get_y(), 210, 15, 'F')  # Rectángulo inferior

        # Texto de página en blanco
        self.set_text_color(255, 255, 255)
        self.set_font("Arial", "I", 9)
        self.cell(0, 10, f"Página {self.page_no()}", 0, 0, "C")

    def agregar_separador(self):
        self.set_draw_color(129, 190, 206)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 200, self.get_y())

    def agregar_titulo(self, texto):
        self.ln(4)  # Espacio antes del título
        self.set_fill_color(55, 139, 164)
        self.set_text_color(255, 255, 255)
        self.set_font("Arial", "B", 12)

        ancho_caja = 130  # ancho limitado (no de borde a borde)
        x_inicio = (210 - ancho_caja) / 2  # centrar

        self.set_x(x_inicio)
        self.cell(ancho_caja, 10, texto, 0, 1, 'C', fill=True)
        self.ln(4)  # Espacio después

    def insertar_grafico(self, ruta_img):
        self.ln(4)
        self.image(ruta_img, x=50, w=100)
    
    def agregar_leyenda_resumen(self, x, y, count_errors, count_warnings, count_infos, count_hints):
        self.ln(5)
        self.set_xy(x, y)
        self.set_font("Arial", "", 10)

        categorias = [
            ("Errores", count_errors, (244, 67, 54)),
            ("Advertencias", count_warnings, (245, 135, 0)),
            ("Informativos", count_infos, (33, 150, 243)),
            ("Sugerencias", count_hints, (139, 195, 74))
        ]

        cuadro_tam = 4  # tamaño del cuadrado
        espacio_texto = 2  # espacio entre cuadro y texto
        espacio_item = 35  # espacio horizontal entre bloques

        for i, (nombre, cantidad, color) in enumerate(categorias):
            self.set_fill_color(*color)
            self.rect(self.get_x(), self.get_y(), cuadro_tam, cuadro_tam, 'F')
            self.set_x(self.get_x() + cuadro_tam + espacio_texto)
            self.cell(0, cuadro_tam, f"{cantidad} {nombre}", ln=0)
            self.set_x(x + (i + 1) * espacio_item)

    def agregar_resumen(self, archivo, resumen):
        self.set_text_color(0, 0, 0)
        self.set_font("Arial", "B", 10)
        self.cell(self.get_string_width("Contrato: "), 6, "Contrato: ", ln=0)
        self.set_font("Arial", "", 10)
        self.multi_cell(0, 6, archivo)

        self.set_font("Arial", "B", 10)
        self.cell(self.get_string_width("Resultado: "), 6, "Resultado: ", ln=0)
        self.set_font("Arial", "", 10)
        self.cell(0, 6, resumen, ln=1)
        self.ln(1)

    def agregar_tabla(self, resultado, opcion):
        espacio = 2 
        alto_fila = 10
        col1, col2, col3, col4 = 25, 30, 130, 93
        start_x = 10
        colores_severidad = {
        "error": (244, 67, 54),
        "advertencia": (245, 135, 0),
        "informativo": (33, 150, 243),
        "sugerencia": (139, 195, 74)
        }

        self.set_x(start_x)

        # Encabezado
        self.set_font("Arial", "B", 10)
        self.set_draw_color(129, 190, 206) 
        self.set_fill_color(3, 98, 128)
        self.set_text_color(255, 255, 255)
        
        if opcion == 1:
            self.cell(col1, alto_fila, "Línea", 0, 0, "C", fill=True)
            self.cell(espacio, alto_fila, "", 0, 0) 
            self.cell(col2, alto_fila, "Tipo", 0, 0, "C", fill=True)
            self.cell(espacio, alto_fila, "", 0, 0)
            self.cell(col3, alto_fila, "Mensaje", 0, 1, "C", fill=True)
        elif opcion == 2:
            self.cell(col4, alto_fila, "Validación", 0, 0, "C", fill=True)
            self.cell(espacio, alto_fila, "", 0, 0) 
            self.cell(col4, alto_fila, "Estado", 0, 1, "C", fill=True)
        else:
            self.cell(col4, alto_fila, "Métrica", 0, 0, "C", fill=True)
            self.cell(espacio, alto_fila, "", 0, 0) 
            self.cell(col4, alto_fila, "Valor", 0, 1, "C", fill=True)

        # Contenido
        self.set_font("Arial", "", 9)
        self.set_text_color(0, 0, 0)

        for i, row in enumerate(resultado):
            if i % 2 == 0:
                self.set_fill_color(240, 246, 248)
                fill = True
            else:
                self.set_fill_color(255, 255, 255)
                fill = False

            if opcion == 1:
                _, issue = row

                self.cell(col1 + col2 + col3 + espacio * 2, 2, "", 0, 1, fill=False)
                linea = f"{issue['range']['start']['line']}:{issue['range']['start']['character']}"
                severidad = {0: "error", 1: "advertencia", 2: "informativo", 3: "sugerencia"}.get(issue["severity"], "desconocido")
                mensaje = utils.limpiar(issue["message"])
                
                self.cell(col1, alto_fila, linea, 1, 0, "C", fill=fill)
                self.cell(espacio, alto_fila, "", 0, 0)

                color_texto = colores_severidad.get(severidad, (0, 0, 0))
                self.set_text_color(*color_texto)
                self.set_font("Arial", "B", 9)
                self.cell(col2, alto_fila, severidad, 1, 0, "C", fill=fill)
                self.set_font("Arial", "", 9)
                self.set_text_color(0, 0, 0)

                self.cell(espacio, alto_fila, "", 0, 0)
                self.cell(col3, alto_fila, mensaje, 1, 1, "L", fill=fill)
            else:
                self.cell((col4 * 2) + (espacio + 1) * 2, 2, "", 0, 1, fill=False)

                self.cell(col4, alto_fila, str(row[0]), 1, 0, "L", fill=fill)
                self.cell(espacio, alto_fila, "", 0, 0)
                self.cell(col4, alto_fila, str(row[1]), 1, 1, "C", fill=fill)

    def agregar_tabla_comparacion(self, compare_data):
        # compare_data = {"Validación de Contratos": bool, "Validaciones": [{...}, {...}]}
        filas = []
        for item in compare_data.get("Validaciones", []):
            # Cada ítem es { "Nombre validación": true/false }
            [(nombre, valor)] = item.items()
            filas.append([nombre, "OK" if valor else "FALLA"])
        # self._tabla_simple(filas, ["Validación", "Estado"])
        self.agregar_tabla(filas, 2)

    def agregar_tabla_sonar(self, sonar_dict):
        # sonar_dict: {coverage, bugs, vulnerabilities, code_smells, duplicated_lines_density, ncloc}
        filas = [
            ["Cobertura de pruebas (%)", sonar_dict.get("coverage", "—")],
            ["Errores (Bugs)", sonar_dict.get("bugs", "—")],
            ["Vulnerabilidades de seguridad", sonar_dict.get("vulnerabilities", "—")],
            ["Problemas de mantenibilidad (Code Smells)", sonar_dict.get("code_smells", "—")],
            ["Código duplicado (%)", sonar_dict.get("duplicated_lines_density", "—")],
            ["Líneas de código (NCLOC)", sonar_dict.get("ncloc", "—")],
        ]
        self.agregar_tabla(filas, 3)

    def agregar_tabla_k6(self, k6):
        filas = [
            ["Tiempo de respuesta promedio (ms)", utils.format_ms(k6.get("http_req_duration_avg", "-"))],
            ["Tiempo de respuesta p95 (ms)", utils.format_ms(k6.get("http_req_duration_p95", "-"))],
            ["Latencia promedio TTFB (ms)", utils.format_ms(k6.get("ttfb_avg", "-"))],
            ["Latencia p95 TTFB (ms)", utils.format_ms(k6.get("ttfb_p95", "-"))],
            ["Porcentaje de errores (%)", utils.format_percent(k6.get("http_req_failed_rate", "-"))],
            ["Porcentaje de validaciones superadas (%)", utils.format_percent(k6.get("checks_rate", "-"))],
            ["Total de peticiones realizadas", k6.get("total_requests", "-")],
            ["Duración total de la prueba (ms)", utils.format_ms(k6.get("total_time_ms", "-"))],
            ["Iteraciones completadas", k6.get("iterations_completed", "-")],
        ]
        self.agregar_tabla(filas, 3)