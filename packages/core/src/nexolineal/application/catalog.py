"""Catálogo único de operaciones y formularios de los tres destinos."""

from dataclasses import dataclass
from .catalog_data import OPERATION_DATA
from .numerical_catalog import NUMERICAL_DATA


@dataclass(frozen=True)
class OperationSpec:
    id: str
    title: str
    category: str
    fields: tuple
    description: str = ""

    @property
    def required(self):
        return tuple(field["name"] for field in self.fields if field["required"])

    @property
    def optional(self):
        return tuple(field["name"] for field in self.fields if not field["required"])

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "fields": list(self.fields),
            "description": self.description,
        }


# La proyección sobre una recta amplía explícitamente la geometría de fase 07.
_projection = next(
    item for item in OPERATION_DATA if item["id"] == "vectores.producto_punto"
)
VISUAL_DATA = [
    {
        **_projection,
        "id": "vectores.proyeccion",
        "title": "Proyección ortogonal",
        "description": "Proyectar u sobre la recta generada por v ≠ 0; comprobar la descomposición ortogonal.",
    }
]

CATALOG = {
    item["id"]: OperationSpec(**{**item, "fields": tuple(item["fields"])})
    for item in OPERATION_DATA + NUMERICAL_DATA + VISUAL_DATA
}
