"""Interfaz gráfica minimalista construida únicamente con Tkinter/ttk."""

import tkinter as tk
from tkinter import messagebox, ttk

from algebra_lineal import resolver_sistema
from formato_matematico import (
    formatear_ecuacion,
    formatear_expresion_parametrica,
    formatear_lista_ecuaciones,
    formatear_matriz,
    formatear_numero,
    parsear_numero,
    subindice,
)


COLORES = {
    "fondo": "#F4F7FB",
    "tarjeta": "#FFFFFF",
    "texto": "#172033",
    "secundario": "#5F6B7A",
    "borde": "#DCE3EC",
    "azul": "#2563EB",
    "azul_suave": "#EAF1FF",
    "verde": "#16835B",
    "verde_suave": "#E8F7F1",
    "ambar": "#A15C00",
    "ambar_suave": "#FFF5DD",
    "rojo": "#C63E46",
    "rojo_suave": "#FDECEE",
    "codigo": "#101827",
}


EJEMPLOS = {
    "Solución única": {
        "A": [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]],
        "b": [8, -11, -3],
    },
    "Infinitas soluciones": {
        "A": [[1, 1, 1], [2, 2, 2], [1, -1, 1]],
        "b": [3, 6, 1],
    },
    "Sistema sin solución": {
        "A": [[1, 1, 1], [2, 2, 2], [1, -1, 1]],
        "b": [3, 7, 1],
    },
}


class MarcoDesplazable(ttk.Frame):
    """Contenedor vertical con desplazamiento para pantallas pequeñas."""

    def __init__(self, padre, fondo):
        super().__init__(padre)
        self.canvas = tk.Canvas(
            self, background=fondo, highlightthickness=0, borderwidth=0
        )
        self.barra = ttk.Scrollbar(
            self, orient="vertical", command=self.canvas.yview
        )
        self.interior = tk.Frame(self.canvas, background=fondo)
        self.ventana = self.canvas.create_window(
            (0, 0), window=self.interior, anchor="nw"
        )
        self.canvas.configure(yscrollcommand=self.barra.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.barra.pack(side="right", fill="y")
        self.interior.bind("<Configure>", self._actualizar_region)
        self.canvas.bind("<Configure>", self._ajustar_ancho)

    def _actualizar_region(self, _evento=None):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _ajustar_ancho(self, evento):
        self.canvas.itemconfigure(self.ventana, width=evento.width)


class AplicacionAlgebraLineal:
    """Calculadora visual para sistemas de ecuaciones lineales."""

    def __init__(self, raiz):
        self.raiz = raiz
        self.entradas_A = []
        self.entradas_b = []
        self.ultimo_resultado_texto = ""

        self._configurar_ventana()
        self._configurar_estilos()
        self._crear_encabezado()
        self._crear_contenido()
        self.crear_matriz()
        self.cargar_ejemplo("Solución única")

    def _configurar_ventana(self):
        self.raiz.title("Calculadora de Álgebra Lineal · Eliminación por Filas")
        self.raiz.geometry("1280x820")
        self.raiz.minsize(1050, 700)
        self.raiz.configure(background=COLORES["fondo"])
        try:
            self.raiz.tk.call("tk", "scaling", 1.15)
        except tk.TclError:
            pass

    def _configurar_estilos(self):
        estilo = ttk.Style()
        if "clam" in estilo.theme_names():
            estilo.theme_use("clam")

        estilo.configure("TFrame", background=COLORES["fondo"])
        estilo.configure("Card.TFrame", background=COLORES["tarjeta"])
        estilo.configure(
            "TLabel",
            background=COLORES["fondo"],
            foreground=COLORES["texto"],
            font=("Segoe UI", 10),
        )
        estilo.configure(
            "Card.TLabel", background=COLORES["tarjeta"], foreground=COLORES["texto"]
        )
        estilo.configure(
            "Section.TLabel",
            background=COLORES["tarjeta"],
            foreground=COLORES["texto"],
            font=("Segoe UI Semibold", 12),
        )
        estilo.configure(
            "Muted.TLabel",
            background=COLORES["tarjeta"],
            foreground=COLORES["secundario"],
            font=("Segoe UI", 9),
        )
        estilo.configure(
            "Primary.TButton",
            background=COLORES["azul"],
            foreground="#FFFFFF",
            font=("Segoe UI Semibold", 10),
            padding=(16, 10),
            borderwidth=0,
        )
        estilo.map(
            "Primary.TButton",
            background=[("active", "#1D4ED8"), ("pressed", "#1E40AF")],
        )
        estilo.configure(
            "Secondary.TButton",
            background=COLORES["azul_suave"],
            foreground=COLORES["azul"],
            font=("Segoe UI Semibold", 9),
            padding=(11, 8),
            borderwidth=0,
        )
        estilo.map("Secondary.TButton", background=[("active", "#DDE9FF")])
        estilo.configure(
            "TNotebook", background=COLORES["fondo"], borderwidth=0, tabmargins=(0, 0, 0, 0)
        )
        estilo.configure(
            "TNotebook.Tab",
            background="#E8EDF4",
            foreground=COLORES["secundario"],
            font=("Segoe UI Semibold", 10),
            padding=(18, 10),
            borderwidth=0,
        )
        estilo.map(
            "TNotebook.Tab",
            background=[("selected", COLORES["tarjeta"])],
            foreground=[("selected", COLORES["azul"])],
        )
        estilo.configure("TEntry", padding=7, fieldbackground="#FBFCFE")
        estilo.configure("TCombobox", padding=7, fieldbackground="#FBFCFE")

    def _crear_encabezado(self):
        encabezado = tk.Frame(self.raiz, background=COLORES["tarjeta"], height=92)
        encabezado.pack(fill="x")
        encabezado.pack_propagate(False)

        marca = tk.Frame(encabezado, background=COLORES["azul"], width=8)
        marca.pack(side="left", fill="y")

        textos = tk.Frame(encabezado, background=COLORES["tarjeta"])
        textos.pack(side="left", fill="both", expand=True, padx=24, pady=15)
        tk.Label(
            textos,
            text="Calculadora de Álgebra Lineal",
            background=COLORES["tarjeta"],
            foreground=COLORES["texto"],
            font=("Segoe UI Semibold", 20),
        ).pack(anchor="w")
        tk.Label(
            textos,
            text="Sistemas Ax = b · Eliminación por filas · Clasificación y verificación",
            background=COLORES["tarjeta"],
            foreground=COLORES["secundario"],
            font=("Segoe UI", 10),
        ).pack(anchor="w", pady=(3, 0))

        insignia = tk.Label(
            encabezado,
            text="PYTHON ESTÁNDAR",
            background=COLORES["azul_suave"],
            foreground=COLORES["azul"],
            font=("Segoe UI Semibold", 9),
            padx=14,
            pady=7,
        )
        insignia.pack(side="right", padx=24)

    def _crear_contenido(self):
        contenido = ttk.Frame(self.raiz)
        contenido.pack(fill="both", expand=True, padx=18, pady=18)
        contenido.columnconfigure(0, weight=0, minsize=390)
        contenido.columnconfigure(1, weight=1)
        contenido.rowconfigure(0, weight=1)

        self.panel_entrada = MarcoDesplazable(contenido, COLORES["fondo"])
        self.panel_entrada.grid(row=0, column=0, sticky="nsew", padx=(0, 14))
        self._crear_panel_entrada(self.panel_entrada.interior)

        self.cuaderno = ttk.Notebook(contenido)
        self.cuaderno.grid(row=0, column=1, sticky="nsew")
        self._crear_pestana_resultado()
        self._crear_pestana_pasos()
        self._crear_pestana_ayuda()

    def _crear_tarjeta(self, padre, titulo, subtitulo=None):
        tarjeta = ttk.Frame(padre, style="Card.TFrame", padding=18)
        tarjeta.pack(fill="x", pady=(0, 12))
        ttk.Label(tarjeta, text=titulo, style="Section.TLabel").pack(anchor="w")
        if subtitulo:
            ttk.Label(
                tarjeta,
                text=subtitulo,
                style="Muted.TLabel",
                wraplength=325,
                justify="left",
            ).pack(anchor="w", pady=(3, 12))
        return tarjeta

    def _crear_panel_entrada(self, padre):
        tarjeta_dimension = self._crear_tarjeta(
            padre,
            "1. Dimensiones",
            "Elija entre 1 y 6 ecuaciones y variables.",
        )
        fila_dimension = ttk.Frame(tarjeta_dimension, style="Card.TFrame")
        fila_dimension.pack(fill="x")

        self.variable_m = tk.StringVar(value="3")
        self.variable_n = tk.StringVar(value="3")
        valores = [str(i) for i in range(1, 7)]

        ttk.Label(fila_dimension, text="Ecuaciones (m)", style="Card.TLabel").grid(
            row=0, column=0, sticky="w", padx=(0, 8)
        )
        ttk.Label(fila_dimension, text="Variables (n)", style="Card.TLabel").grid(
            row=0, column=1, sticky="w", padx=(8, 0)
        )
        ttk.Combobox(
            fila_dimension,
            textvariable=self.variable_m,
            values=valores,
            state="readonly",
            width=13,
        ).grid(row=1, column=0, sticky="ew", padx=(0, 8), pady=(5, 0))
        ttk.Combobox(
            fila_dimension,
            textvariable=self.variable_n,
            values=valores,
            state="readonly",
            width=13,
        ).grid(row=1, column=1, sticky="ew", padx=(8, 0), pady=(5, 0))
        fila_dimension.columnconfigure(0, weight=1)
        fila_dimension.columnconfigure(1, weight=1)
        ttk.Button(
            tarjeta_dimension,
            text="Crear matriz",
            style="Secondary.TButton",
            command=self.crear_matriz,
        ).pack(fill="x", pady=(12, 0))

        tarjeta_ejemplo = self._crear_tarjeta(
            padre, "2. Caso de prueba", "Puede cargar uno de los tres casos exigidos."
        )
        self.variable_ejemplo = tk.StringVar(value="Solución única")
        ttk.Combobox(
            tarjeta_ejemplo,
            textvariable=self.variable_ejemplo,
            values=list(EJEMPLOS.keys()),
            state="readonly",
        ).pack(fill="x")
        ttk.Button(
            tarjeta_ejemplo,
            text="Cargar ejemplo",
            style="Secondary.TButton",
            command=lambda: self.cargar_ejemplo(self.variable_ejemplo.get()),
        ).pack(fill="x", pady=(10, 0))

        self.tarjeta_matriz = self._crear_tarjeta(
            padre,
            "3. Matriz aumentada [A|b]",
            "Admite enteros, decimales y fracciones como 3/4.",
        )
        self.marco_matriz = ttk.Frame(self.tarjeta_matriz, style="Card.TFrame")
        self.marco_matriz.pack(fill="x")

        tarjeta_acciones = self._crear_tarjeta(padre, "4. Resolver")
        ttk.Button(
            tarjeta_acciones,
            text="Resolver sistema",
            style="Primary.TButton",
            command=self.resolver,
        ).pack(fill="x")
        ttk.Button(
            tarjeta_acciones,
            text="Limpiar datos",
            style="Secondary.TButton",
            command=self.limpiar_datos,
        ).pack(fill="x", pady=(9, 0))

    def _crear_pestana_resultado(self):
        pestana = tk.Frame(self.cuaderno, background=COLORES["tarjeta"])
        self.cuaderno.add(pestana, text="Resultado")

        superior = tk.Frame(pestana, background=COLORES["tarjeta"])
        superior.pack(fill="x", padx=22, pady=(20, 8))
        self.etiqueta_estado = tk.Label(
            superior,
            text="LISTO PARA RESOLVER",
            background=COLORES["azul_suave"],
            foreground=COLORES["azul"],
            font=("Segoe UI Semibold", 9),
            padx=12,
            pady=7,
        )
        self.etiqueta_estado.pack(side="left")
        ttk.Button(
            superior,
            text="Copiar resultado",
            style="Secondary.TButton",
            command=self.copiar_resultado,
        ).pack(side="right")

        self.texto_resultado = tk.Text(
            pestana,
            background=COLORES["tarjeta"],
            foreground=COLORES["texto"],
            insertbackground=COLORES["texto"],
            relief="flat",
            borderwidth=0,
            font=("Cascadia Code", 10),
            wrap="word",
            padx=24,
            pady=14,
            spacing1=2,
            spacing3=5,
        )
        barra = ttk.Scrollbar(pestana, orient="vertical", command=self.texto_resultado.yview)
        self.texto_resultado.configure(yscrollcommand=barra.set)
        barra.pack(side="right", fill="y")
        self.texto_resultado.pack(fill="both", expand=True)
        self._configurar_etiquetas_texto(self.texto_resultado)
        self._mostrar_bienvenida()

    def _crear_pestana_pasos(self):
        pestana = tk.Frame(self.cuaderno, background=COLORES["tarjeta"])
        self.cuaderno.add(pestana, text="Procedimiento por filas")
        self.texto_pasos = tk.Text(
            pestana,
            background=COLORES["codigo"],
            foreground="#DCE7F7",
            selectbackground="#334155",
            relief="flat",
            borderwidth=0,
            font=("Cascadia Code", 10),
            wrap="none",
            padx=24,
            pady=20,
            spacing3=4,
        )
        barra_y = ttk.Scrollbar(pestana, orient="vertical", command=self.texto_pasos.yview)
        barra_x = ttk.Scrollbar(pestana, orient="horizontal", command=self.texto_pasos.xview)
        self.texto_pasos.configure(
            yscrollcommand=barra_y.set, xscrollcommand=barra_x.set
        )
        barra_y.pack(side="right", fill="y")
        barra_x.pack(side="bottom", fill="x")
        self.texto_pasos.pack(fill="both", expand=True)
        self.texto_pasos.tag_configure(
            "fase", foreground="#93C5FD", font=("Cascadia Code Bold", 11)
        )
        self.texto_pasos.tag_configure("operacion", foreground="#FDE68A")
        self.texto_pasos.configure(state="disabled")

    def _crear_pestana_ayuda(self):
        pestana = tk.Frame(self.cuaderno, background=COLORES["tarjeta"])
        self.cuaderno.add(pestana, text="Método y ayuda")
        contenido = tk.Text(
            pestana,
            background=COLORES["tarjeta"],
            foreground=COLORES["texto"],
            relief="flat",
            borderwidth=0,
            font=("Segoe UI", 11),
            wrap="word",
            padx=32,
            pady=28,
            spacing1=2,
            spacing3=8,
        )
        contenido.pack(fill="both", expand=True)
        contenido.tag_configure(
            "titulo", font=("Segoe UI Semibold", 18), foreground=COLORES["texto"]
        )
        contenido.tag_configure(
            "subtitulo", font=("Segoe UI Semibold", 12), foreground=COLORES["azul"]
        )
        contenido.insert("end", "Cómo trabaja el programa\n", "titulo")
        contenido.insert(
            "end",
            "El sistema Ax = b se transforma en la matriz aumentada [A|b]. "
            "Después se selecciona un pivote y se crean ceros debajo mediante "
            "operaciones elementales por filas.\n\n",
        )
        contenido.insert("end", "Operaciones permitidas\n", "subtitulo")
        contenido.insert(
            "end",
            "1. Intercambiar dos filas: Fi ↔ Fj.\n"
            "2. Multiplicar una fila por un número no nulo: Fi ← kFi.\n"
            "3. Sumar a una fila un múltiplo de otra: Fi ← Fi + kFj.\n\n",
        )
        contenido.insert("end", "Criterio de clasificación\n", "subtitulo")
        contenido.insert(
            "end",
            "• rango(A) = rango([A|b]) = n: solución única.\n"
            "• rango(A) = rango([A|b]) < n: infinitas soluciones.\n"
            "• rango(A) < rango([A|b]): sistema inconsistente.\n\n",
        )
        contenido.insert("end", "Cumplimiento técnico\n", "subtitulo")
        contenido.insert(
            "end",
            "El cálculo utiliza listas anidadas, bucles, condicionales y funciones. "
            "No emplea NumPy, SciPy ni funciones de álgebra lineal.",
        )
        contenido.configure(state="disabled")

    def _configurar_etiquetas_texto(self, widget):
        widget.tag_configure(
            "titulo", font=("Segoe UI Semibold", 17), foreground=COLORES["texto"], spacing3=10
        )
        widget.tag_configure(
            "subtitulo", font=("Segoe UI Semibold", 11), foreground=COLORES["azul"], spacing1=8
        )
        widget.tag_configure("matriz", font=("Cascadia Code", 11), foreground="#1E3A8A")
        widget.tag_configure("correcto", foreground=COLORES["verde"])
        widget.tag_configure("alerta", foreground=COLORES["rojo"])
        widget.tag_configure("muted", foreground=COLORES["secundario"])

    def crear_matriz(self):
        try:
            m = int(self.variable_m.get())
            n = int(self.variable_n.get())
        except ValueError:
            messagebox.showerror("Dimensiones inválidas", "Seleccione valores enteros.")
            return

        # Al cambiar dimensiones se reemplaza por completo la cuadrícula y su
        # vista previa, evitando controles duplicados en la interfaz.
        if hasattr(self, "separador_matriz") and self.separador_matriz.winfo_exists():
            self.separador_matriz.destroy()
        if hasattr(self, "vista_ecuaciones") and self.vista_ecuaciones.winfo_exists():
            self.vista_ecuaciones.destroy()

        for widget in self.marco_matriz.winfo_children():
            widget.destroy()

        self.entradas_A = []
        self.entradas_b = []

        ttk.Label(self.marco_matriz, text="", style="Card.TLabel").grid(row=0, column=0)
        for j in range(n):
            ttk.Label(
                self.marco_matriz,
                text=f"x{subindice(j + 1)}",
                style="Card.TLabel",
                anchor="center",
            ).grid(row=0, column=j + 1, padx=3, pady=(0, 5))
        ttk.Label(
            self.marco_matriz, text="b", style="Card.TLabel", anchor="center"
        ).grid(row=0, column=n + 1, padx=(10, 3), pady=(0, 5))

        for i in range(m):
            ttk.Label(
                self.marco_matriz,
                text=f"E{i + 1}",
                style="Muted.TLabel",
                width=3,
            ).grid(row=i + 1, column=0, padx=(0, 4), pady=3)

            fila_entradas = []
            for j in range(n):
                entrada = ttk.Entry(self.marco_matriz, width=6, justify="center")
                entrada.grid(row=i + 1, column=j + 1, padx=3, pady=3, sticky="ew")
                entrada.insert(0, "0")
                entrada.bind("<FocusOut>", lambda _e: self.actualizar_vista_ecuaciones())
                fila_entradas.append(entrada)
            self.entradas_A.append(fila_entradas)

            entrada_b = ttk.Entry(self.marco_matriz, width=6, justify="center")
            entrada_b.grid(row=i + 1, column=n + 1, padx=(10, 3), pady=3, sticky="ew")
            entrada_b.insert(0, "0")
            entrada_b.bind("<FocusOut>", lambda _e: self.actualizar_vista_ecuaciones())
            self.entradas_b.append(entrada_b)

        self.separador_matriz = ttk.Separator(self.tarjeta_matriz)
        self.separador_matriz.pack(fill="x", pady=12)
        self.vista_ecuaciones = tk.Label(
            self.tarjeta_matriz,
            text="",
            background=COLORES["azul_suave"],
            foreground="#1E3A8A",
            font=("Cascadia Code", 9),
            justify="left",
            anchor="w",
            padx=12,
            pady=10,
        )
        self.vista_ecuaciones.pack(fill="x")
        self.actualizar_vista_ecuaciones()

    def _leer_datos(self):
        A = []
        b = []
        for i, fila_entradas in enumerate(self.entradas_A):
            fila = []
            for j, entrada in enumerate(fila_entradas):
                try:
                    fila.append(parsear_numero(entrada.get()))
                except ValueError as error:
                    raise ValueError(f"Error en E{i + 1}, x{j + 1}: {error}") from error
            A.append(fila)

            try:
                b.append(parsear_numero(self.entradas_b[i].get()))
            except ValueError as error:
                raise ValueError(f"Error en E{i + 1}, término b: {error}") from error
        return A, b

    def actualizar_vista_ecuaciones(self):
        try:
            A, b = self._leer_datos()
            lineas = []
            for i in range(len(A)):
                lineas.append(formatear_ecuacion(A[i], b[i]))
            self.vista_ecuaciones.configure(text="\n".join(lineas))
        except (ValueError, AttributeError):
            if hasattr(self, "vista_ecuaciones"):
                self.vista_ecuaciones.configure(text="Complete todas las celdas para ver Ax = b.")

    def cargar_ejemplo(self, nombre):
        ejemplo = EJEMPLOS[nombre]
        m = len(ejemplo["A"])
        n = len(ejemplo["A"][0])
        self.variable_m.set(str(m))
        self.variable_n.set(str(n))
        self.crear_matriz()

        for i in range(m):
            for j in range(n):
                self.entradas_A[i][j].delete(0, "end")
                self.entradas_A[i][j].insert(0, str(ejemplo["A"][i][j]))
            self.entradas_b[i].delete(0, "end")
            self.entradas_b[i].insert(0, str(ejemplo["b"][i]))
        self.actualizar_vista_ecuaciones()

    def limpiar_datos(self):
        for fila in self.entradas_A:
            for entrada in fila:
                entrada.delete(0, "end")
                entrada.insert(0, "0")
        for entrada in self.entradas_b:
            entrada.delete(0, "end")
            entrada.insert(0, "0")
        self.actualizar_vista_ecuaciones()
        self._mostrar_bienvenida()
        self._limpiar_widget(self.texto_pasos)

    def resolver(self):
        try:
            A, b = self._leer_datos()
            resultado = resolver_sistema(A, b)
        except ValueError as error:
            messagebox.showerror("No se puede resolver", str(error))
            return

        self.actualizar_vista_ecuaciones()
        self._mostrar_resultado(A, b, resultado)
        self._mostrar_pasos(resultado)
        self.cuaderno.select(0)

    def _limpiar_widget(self, widget):
        widget.configure(state="normal")
        widget.delete("1.0", "end")
        widget.configure(state="disabled")

    def _mostrar_bienvenida(self):
        self.texto_resultado.configure(state="normal")
        self.texto_resultado.delete("1.0", "end")
        self.texto_resultado.insert("end", "Resuelva un sistema lineal\n", "titulo")
        self.texto_resultado.insert(
            "end",
            "Ingrese los coeficientes de A y los términos independientes b, o cargue uno "
            "de los casos de prueba. El resultado incluirá clasificación, solución, "
            "rangos y comprobación automática.\n\n",
        )
        self.texto_resultado.insert(
            "end",
            "Sugerencia: también puede escribir fracciones como 1/2 o -3/4.",
            "muted",
        )
        self.texto_resultado.configure(state="disabled")
        self.etiqueta_estado.configure(
            text="LISTO PARA RESOLVER",
            background=COLORES["azul_suave"],
            foreground=COLORES["azul"],
        )
        self.ultimo_resultado_texto = ""

    def _insertar(self, texto, etiqueta=None):
        if etiqueta:
            self.texto_resultado.insert("end", texto, etiqueta)
        else:
            self.texto_resultado.insert("end", texto)

    def _mostrar_resultado(self, A, b, resultado):
        self.texto_resultado.configure(state="normal")
        self.texto_resultado.delete("1.0", "end")

        tipo = resultado["tipo"]
        if tipo == "unica":
            estado = ("SOLUCIÓN ÚNICA", COLORES["verde_suave"], COLORES["verde"])
        elif tipo == "infinitas":
            estado = ("INFINITAS SOLUCIONES", COLORES["ambar_suave"], COLORES["ambar"])
        else:
            estado = ("SIN SOLUCIÓN", COLORES["rojo_suave"], COLORES["rojo"])
        self.etiqueta_estado.configure(
            text=estado[0], background=estado[1], foreground=estado[2]
        )

        self._insertar(resultado["clasificacion"] + "\n", "titulo")
        self._insertar("Sistema ingresado\n", "subtitulo")
        self._insertar(formatear_lista_ecuaciones(A, b) + "\n\n")
        self._insertar("Matriz escalonada\n", "subtitulo")
        self._insertar(
            formatear_matriz(resultado["matriz_escalonada"], len(A[0])) + "\n\n",
            "matriz",
        )
        self._insertar("Criterio de rangos\n", "subtitulo")
        self._insertar(
            f"rango(A) = {resultado['rango_A']}    "
            f"rango([A|b]) = {resultado['rango_aumentada']}    "
            f"n = {resultado['numero_variables']}\n\n"
        )

        if tipo == "unica":
            self._insertar("Valores de las variables\n", "subtitulo")
            for j, valor in enumerate(resultado["solucion"]):
                self._insertar(f"x{subindice(j + 1)} = {formatear_numero(valor)}\n")
            self._insertar("\nComprobación por sustitución\n", "subtitulo")
            self._insertar_comprobaciones(resultado["comprobaciones"])

        elif tipo == "infinitas":
            libres = resultado["variables_libres"]
            nombres_libres = ", ".join(f"x{subindice(j + 1)}" for j in libres)
            self._insertar("Variables libres\n", "subtitulo")
            self._insertar(f"{nombres_libres}\n\n")
            self._insertar("Solución paramétrica general\n", "subtitulo")
            for j, expresion in enumerate(resultado["expresiones"]):
                self._insertar(
                    formatear_expresion_parametrica(j, expresion, libres) + "\n"
                )
            parametros = ", ".join(
                f"t{subindice(i + 1)} ∈ ℝ" for i in range(len(libres))
            )
            self._insertar(f"con {parametros}\n\n", "muted")
            self._insertar("Comprobación de una solución particular\n", "subtitulo")
            self._insertar(
                "Se asignó 0 a cada parámetro libre y se sustituyó en Ax = b.\n"
            )
            self._insertar_comprobaciones(resultado["comprobaciones"])

        else:
            fila = resultado["fila_contradiccion"]
            self._insertar("Fila contradictoria\n", "subtitulo")
            if fila is not None:
                contradiccion = resultado["matriz_escalonada"][fila]
                self._insertar(
                    formatear_matriz([contradiccion], len(A[0])) + "\n",
                    "matriz",
                )
                self._insertar(
                    "Esta fila representa 0 = k con k ≠ 0; por eso el sistema no puede cumplirse.\n",
                    "alerta",
                )

        self.texto_resultado.configure(state="disabled")
        self.ultimo_resultado_texto = self.texto_resultado.get("1.0", "end-1c")

    def _insertar_comprobaciones(self, comprobaciones):
        for item in comprobaciones:
            simbolo = "✓" if item["cumple"] else "✗"
            etiqueta = "correcto" if item["cumple"] else "alerta"
            linea = (
                f"{simbolo} E{item['ecuacion']}: "
                f"{formatear_numero(item['izquierda'])} = "
                f"{formatear_numero(item['derecha'])}\n"
            )
            self._insertar(linea, etiqueta)

    def _mostrar_pasos(self, resultado):
        self.texto_pasos.configure(state="normal")
        self.texto_pasos.delete("1.0", "end")
        numero_variables = resultado["numero_variables"]
        fase_anterior = None

        for numero, paso in enumerate(resultado["pasos"], start=1):
            if paso["fase"] != fase_anterior:
                if fase_anterior is not None:
                    self.texto_pasos.insert("end", "\n")
                self.texto_pasos.insert(
                    "end", paso["fase"].upper() + "\n", "fase"
                )
                fase_anterior = paso["fase"]

            self.texto_pasos.insert("end", f"Paso {numero}. {paso['titulo']}\n")
            self.texto_pasos.insert(
                "end", f"Operación: {paso['operacion']}\n", "operacion"
            )
            self.texto_pasos.insert(
                "end",
                formatear_matriz(paso["matriz"], numero_variables) + "\n\n",
            )

        self.texto_pasos.configure(state="disabled")

    def copiar_resultado(self):
        if not self.ultimo_resultado_texto:
            messagebox.showinfo("Sin resultado", "Resuelva primero un sistema.")
            return
        self.raiz.clipboard_clear()
        self.raiz.clipboard_append(self.ultimo_resultado_texto)
        self.raiz.update()
        messagebox.showinfo("Copiado", "El resultado se copió al portapapeles.")


def iniciar_aplicacion():
    raiz = tk.Tk()
    AplicacionAlgebraLineal(raiz)
    raiz.mainloop()
