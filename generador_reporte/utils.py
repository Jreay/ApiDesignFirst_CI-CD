import matplotlib.pyplot as plt
from charset_normalizer import from_path
from collections import defaultdict

def limpiar(text):
    return text.encode("ascii", "ignore").decode("ascii")

def detectar_codificacion(ruta_archivo):
    resultado = from_path(ruta_archivo).best()
    if resultado:
        return resultado.encoding
    return "utf-8" 

def agrupar_por_archivo(data):
    agrupados = defaultdict(list)
    for i, issue in enumerate(data):
        agrupados[issue["source"]].append((i + 1, issue))
    return agrupados

def generar_resumen(data):
    count_errors = sum(1 for i in data if i['severity'] == 0)
    count_warnings = sum(1 for i in data if i['severity'] == 1)
    count_infos = sum(1 for i in data if i['severity'] == 2)
    count_hints = sum(1 for i in data if i['severity'] == 3)
    total = len(data)
    resumen = f"{total}"
    return resumen, count_errors, count_warnings, count_infos, count_hints

def generar_grafico_pastel(nombre_archivo, errores, advertencias, informativos, sugerencias):
    valores = [errores, advertencias, informativos, sugerencias]
    colores = ['#F44336', '#F58700', '#2196F3', '#8BC34A']

    valores_filtrados = []
    colores_filtrados = []
    explode = []

    for valor, color in zip(valores, colores):
        if valor > 0:
            valores_filtrados.append(valor)
            colores_filtrados.append(color)
            explode.append(0.05)

    plt.figure(figsize=(4, 4))
    wedges, texts, autotexts = plt.pie(
        valores_filtrados,
        colors=colores_filtrados,
        explode=explode,
        autopct='%1.1f%%',
        startangle=90,
        shadow=True
    )

    for w in wedges:
        w.set_edgecolor('white')
        w.set_linewidth(1)

    plt.axis('equal')
    plt.tight_layout()
    plt.savefig(nombre_archivo, dpi=100)
    plt.close()

def format_ms(value):
    try:
        return f"{float(value):.2f} ms"
    except:
        return str(value)

def format_percent(value):
    try:
        return f"{float(value) * 100:.2f}%"
    except:
        return str(value)