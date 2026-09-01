"""Interfaz minimalista de la calculadora construida con Flet."""

import flet as ft

from analisis_sistema import resolver_sistema
from entrada_datos import leer_matriz_texto, validar_dimension
from formato_latex import (
    comprobacion_latex,
    procedimiento_gauss_jordan_latex,
    procedimiento_gauss_latex,
    resumen_latex,
)


AZUL = "#2563EB"
FONDO = "#F4F7FB"
TEXTO = "#172033"
SECUNDARIO = "#64748B"
BORDE = "#DDE4EE"
BLANCO = "#FFFFFF"
VERDE = "#16835B"
AMBAR = "#A15C00"
ROJO = "#C63E46"


class AplicacionSistemas:
    """Administra los controles, la lectura de datos y las salidas."""

    def __init__(self, pagina):
        self.pagina = pagina
        self.entradas_A = []
        self.entradas_b = []
        self.secciones = {}

        self.campo_m = ft.TextField(
            value="3",
            label="Ecuaciones (m)",
            width=165,
            keyboard_type=ft.KeyboardType.NUMBER,
        )
        self.campo_n = ft.TextField(
            value="3",
            label="Variables (n)",
            width=165,
            keyboard_type=ft.KeyboardType.NUMBER,
        )

        self.mensaje = ft.Text("", color=ROJO, size=13)
        self.contenedor_matriz = ft.Column(spacing=8)
        self.navegacion = ft.Row(spacing=8, wrap=True, visible=False)
        self.salida = ft.Markdown(
            value=(
                "# Calculadora lista\n\n"
                "Indique las dimensiones, escriba los coeficientes y presione "
                "**Resolver sistema**."
            ),
            selectable=True,
            extension_set=ft.MarkdownExtensionSet.GITHUB_WEB,
            latex_scale_factor=1.1,
            latex_style=ft.TextStyle(color=TEXTO, size=17),
        )
        self.estado = ft.Container(
            content=ft.Text("LISTO PARA RESOLVER", size=12, weight=ft.FontWeight.BOLD),
            bgcolor="#EAF1FF",
            padding=ft.Padding.symmetric(horizontal=12, vertical=7),
            border_radius=ft.BorderRadius.all(20),
        )

        self._configurar_pagina()
        self._construir_pagina()
        self.crear_matriz()

    def _configurar_pagina(self):
        self.pagina.title = "Calculadora de sistemas lineales"
        self.pagina.bgcolor = FONDO
        self.pagina.padding = 0
        self.pagina.theme = ft.Theme(
            color_scheme_seed=ft.Colors.BLUE,
            font_family="Arial",
        )
        self.pagina.scroll = ft.ScrollMode.AUTO

    def _tarjeta(self, contenido):
        """Crea un bloque blanco reutilizable para mantener un diseño sencillo."""
        return ft.Container(
            content=contenido,
            bgcolor=BLANCO,
            padding=20,
            border=ft.Border.all(1, BORDE),
            border_radius=ft.BorderRadius.all(14),
        )

    def _construir_pagina(self):
        encabezado = ft.Container(
            bgcolor=BLANCO,
            padding=ft.Padding.symmetric(horizontal=28, vertical=22),
            border=ft.Border(bottom=ft.BorderSide(1, BORDE)),
            content=ft.Column(
                [
                    ft.Text(
                        "Calculadora de sistemas lineales",
                        size=28,
                        weight=ft.FontWeight.BOLD,
                        color=TEXTO,
                    ),
                    ft.Text(
                        "Eliminación manual por Gauss y Gauss-Jordan",
                        size=14,
                        color=SECUNDARIO,
                    ),
                ],
                spacing=3,
            ),
        )

        dimensiones = self._tarjeta(
            ft.Column(
                [
                    ft.Text("1. Dimensiones", size=18, weight=ft.FontWeight.BOLD),
                    ft.Text(
                        "Puede trabajar con matrices cuadradas o rectangulares.",
                        color=SECUNDARIO,
                    ),
                    ft.Row([self.campo_m, self.campo_n], wrap=True),
                    ft.OutlinedButton(
                        "Crear matriz",
                        on_click=self.crear_matriz,
                    ),
                ],
                spacing=12,
            )
        )

        datos = self._tarjeta(
            ft.Column(
                [
                    ft.Text(
                        "2. Matriz aumentada [A|b]",
                        size=18,
                        weight=ft.FontWeight.BOLD,
                    ),
                    ft.Text(
                        "Admite enteros, decimales y fracciones como -3/4.",
                        color=SECUNDARIO,
                    ),
                    ft.Container(
                        content=self.contenedor_matriz,
                        padding=ft.Padding.only(top=4, bottom=4),
                    ),
                    self.mensaje,
                    ft.Row(
                        [
                            ft.FilledButton(
                                "Resolver sistema",
                                bgcolor=AZUL,
                                color=BLANCO,
                                on_click=self.resolver,
                            ),
                            ft.OutlinedButton(
                                "Limpiar",
                                on_click=self.limpiar,
                            ),
                        ],
                        wrap=True,
                    ),
                ],
                spacing=12,
            )
        )

        panel_entrada = ft.Column(
            [dimensiones, datos],
            spacing=14,
            col={"sm": 12, "md": 5, "lg": 4},
        )

        panel_resultado = ft.Column(
            [
                self._tarjeta(
                    ft.Column(
                        [
                            ft.Row(
                                [
                                    ft.Text(
                                        "Resultado",
                                        size=18,
                                        weight=ft.FontWeight.BOLD,
                                    ),
                                    self.estado,
                                ],
                                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                                wrap=True,
                            ),
                            self.navegacion,
                        ],
                        spacing=12,
                    )
                ),
                self._tarjeta(self.salida),
            ],
            spacing=14,
            col={"sm": 12, "md": 7, "lg": 8},
        )

        contenido = ft.Container(
            padding=ft.Padding.all(22),
            content=ft.ResponsiveRow(
                [panel_entrada, panel_resultado],
                spacing=16,
                run_spacing=16,
            ),
        )

        self.pagina.add(encabezado, contenido)

    def crear_matriz(self, _evento=None):
        """Genera una cuadrícula vacía según las dimensiones solicitadas."""
        try:
            m = validar_dimension(self.campo_m.value, "La cantidad de ecuaciones")
            n = validar_dimension(self.campo_n.value, "La cantidad de variables")
        except ValueError as error:
            self._mostrar_error(str(error))
            return

        self.entradas_A = []
        self.entradas_b = []
        filas_visuales = []

        encabezados = [ft.Container(width=42)]
        for columna in range(n):
            encabezados.append(
                ft.Container(
                    content=ft.Text(
                        f"x{columna + 1}",
                        weight=ft.FontWeight.BOLD,
                        text_align=ft.TextAlign.CENTER,
                    ),
                    width=72,
                    align=ft.Alignment.CENTER,
                )
            )
        encabezados.append(
            ft.Container(
                content=ft.Text("b", weight=ft.FontWeight.BOLD),
                width=72,
                align=ft.Alignment.CENTER,
            )
        )
        filas_visuales.append(ft.Row(encabezados, spacing=7))

        for fila in range(m):
            controles = [
                ft.Container(
                    content=ft.Text(f"E{fila + 1}", color=SECUNDARIO),
                    width=42,
                    align=ft.Alignment.CENTER,
                )
            ]
            fila_A = []

            for _ in range(n):
                campo = ft.TextField(
                    value="0",
                    width=72,
                    text_align=ft.TextAlign.CENTER,
                    dense=True,
                )
                fila_A.append(campo)
                controles.append(campo)

            campo_b = ft.TextField(
                value="0",
                width=72,
                text_align=ft.TextAlign.CENTER,
                dense=True,
            )
            controles.append(campo_b)
            self.entradas_A.append(fila_A)
            self.entradas_b.append(campo_b)
            filas_visuales.append(
                ft.Row(controles, spacing=7, scroll=ft.ScrollMode.AUTO)
            )

        self.contenedor_matriz.controls = filas_visuales
        self.mensaje.value = ""
        self.pagina.update()

    def _leer_datos(self):
        textos_A = []
        textos_b = []

        for fila in self.entradas_A:
            textos_A.append([campo.value for campo in fila])
        for campo in self.entradas_b:
            textos_b.append(campo.value)

        return leer_matriz_texto(textos_A, textos_b)

    def resolver(self, _evento=None):
        """Resuelve el sistema y prepara las cuatro secciones de salida."""
        try:
            A, b = self._leer_datos()
            resultado = resolver_sistema(A, b)
        except ValueError as error:
            self._mostrar_error(str(error))
            return

        self.secciones = {
            "Resumen": resumen_latex(resultado),
            "Gauss-Jordan": procedimiento_gauss_jordan_latex(resultado),
            "Gauss": procedimiento_gauss_latex(resultado),
            "Comprobación": comprobacion_latex(resultado),
        }

        self.navegacion.controls = []
        for nombre in self.secciones:
            self.navegacion.controls.append(
                ft.OutlinedButton(
                    nombre,
                    data=nombre,
                    on_click=self.mostrar_seccion,
                )
            )

        self.navegacion.visible = True
        self.salida.value = self.secciones["Resumen"]
        self.mensaje.value = ""
        self._actualizar_estado(resultado["tipo"])
        self.pagina.update()

    def mostrar_seccion(self, evento):
        """Cambia la salida sin repetir los cálculos del sistema."""
        nombre = evento.control.data
        self.salida.value = self.secciones[nombre]
        self.pagina.update()

    def limpiar(self, _evento=None):
        """Restablece las celdas y elimina el resultado anterior."""
        for fila in self.entradas_A:
            for campo in fila:
                campo.value = "0"
        for campo in self.entradas_b:
            campo.value = "0"

        self.secciones = {}
        self.navegacion.controls = []
        self.navegacion.visible = False
        self.salida.value = (
            "# Calculadora lista\n\n"
            "Escriba los coeficientes del nuevo sistema y presione **Resolver sistema**."
        )
        self.mensaje.value = ""
        self.estado.content.value = "LISTO PARA RESOLVER"
        self.estado.bgcolor = "#EAF1FF"
        self.estado.content.color = TEXTO
        self.pagina.update()

    def _mostrar_error(self, mensaje):
        self.mensaje.value = mensaje
        self.pagina.update()

    def _actualizar_estado(self, tipo):
        if tipo == "unica":
            texto, color, fondo = "SOLUCIÓN ÚNICA", VERDE, "#E8F7F1"
        elif tipo == "infinitas":
            texto, color, fondo = "INFINITAS SOLUCIONES", AMBAR, "#FFF5DD"
        else:
            texto, color, fondo = "SIN SOLUCIÓN", ROJO, "#FDECEE"

        self.estado.content.value = texto
        self.estado.content.color = color
        self.estado.bgcolor = fondo


def crear_aplicacion(pagina):
    """Función que Flet utiliza para construir la aplicación."""
    AplicacionSistemas(pagina)

