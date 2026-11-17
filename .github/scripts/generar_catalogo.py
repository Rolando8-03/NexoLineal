"""Genera esquemas, ejemplos y manifiesto a partir del catálogo Python único."""

import argparse
import json
from pathlib import Path
from nexolineal.application.catalog import CATALOG

ROOT = Path(__file__).resolve().parents[2]


def generated():
    schema = json.loads(
        (ROOT / "packages/contracts/problem.schema.json").read_text(encoding="utf-8")
    )
    original = {
        "matrices.producto",
        "calculadora.evaluar",
        "calculo.definida",
        "calculo.derivar",
    }
    schema["properties"]["operation_id"]["enum"] = list(CATALOG) + [
        "catalogo.operaciones"
    ]
    schema["allOf"] = [
        x
        for x in schema["allOf"]
        if x["if"]["properties"]["operation_id"]["const"] in original
    ]
    matrix = schema["allOf"][0]["then"]["properties"]["input"]["properties"]["A"]
    number = matrix["anyOf"][1]["items"]["items"]
    vector = {
        "anyOf": [
            {"type": "string", "minLength": 1},
            {"type": "array", "minItems": 1, "maxItems": 20, "items": number},
        ]
    }
    family = {
        "anyOf": [
            {"type": "string"},
            {"type": "array", "maxItems": 20, "items": vector["anyOf"][1]},
        ]
    }
    for spec in CATALOG.values():
        if spec.id in original:
            continue
        properties = {}
        for field in spec.fields:
            kind = field["kind"]
            value = (
                matrix
                if kind == "matrix"
                else (
                    vector
                    if kind == "vector"
                    else family if kind == "vectors" else number
                )
            )
            if kind == "select":
                value = {"enum": field["choices"]}
            elif kind in ("integer", "index"):
                value = {
                    "anyOf": [
                        {
                            "type": "integer",
                            **({"minimum": 0} if kind == "index" else {}),
                        },
                        {"type": "string", "pattern": "^[+-]?[0-9]+$"},
                    ]
                }
            elif kind == "cuts":
                value = {
                    "anyOf": [
                        {"type": "string"},
                        {"type": "array", "items": {"type": "integer", "minimum": 1}},
                    ]
                }
            properties[field["name"]] = value
        schema["allOf"].append(
            {
                "if": {"properties": {"operation_id": {"const": spec.id}}},
                "then": {
                    "properties": {
                        "input": {
                            "type": "object",
                            "required": list(spec.required),
                            "properties": properties,
                            "additionalProperties": False,
                        }
                    }
                },
            }
        )
    schema["allOf"].append(
        {
            "if": {"properties": {"operation_id": {"const": "catalogo.operaciones"}}},
            "then": {"properties": {"input": {"type": "object", "maxProperties": 0}}},
        }
    )
    examples = []
    for spec in CATALOG.values():
        inputs = {
            f["name"]: (
                f["default"] == "true" if f["kind"] == "boolean" else f["default"]
            )
            for f in spec.fields
            if f["required"] or f["default"] != ""
        }
        examples.append(
            {"schema_version": "1.0", "operation_id": spec.id, "input": inputs}
        )
    manifest = [
        p.relative_to(ROOT).as_posix()
        for p in sorted((ROOT / "packages/core/src/nexolineal").rglob("*.py"))
    ]
    return {
        "packages/contracts/problem.schema.json": schema,
        "tests/fixtures/fase04_defaults.json": examples,
        "packages/core/python-files.json": manifest,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for relative, data in generated().items():
        path = ROOT / relative
        text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        if args.check:
            assert path.is_file() and path.read_text(encoding="utf-8") == text, (
                relative + " requiere regeneración"
            )
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
    print(
        "Catálogo, ejemplos y manifiesto coherentes con", len(CATALOG), "operaciones."
    )
