import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = path.resolve("../..");
const publicDir = path.resolve("public");
const runtime = path.join(publicDir, "runtime");
fs.rmSync(runtime, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(path.join(root, "assets/icono.ico"), path.join(publicDir, "icono.ico"));
const target = process.env.VITE_TARGET || "web";
if (!["web", "windows", "android"].includes(target)) throw new Error("Destino inválido.");
if (target === "web") {
  const source = path.join(root, "packages/core/src");
  const destination = path.join(runtime, "python");
  const manifest = [];
  function copy(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "__pycache__") copy(file);
      if (entry.isFile() && entry.name.endsWith(".py")) {
        const relative = path.relative(source, file).split(path.sep).join("/");
        const dest = path.join(destination, relative);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(file, dest);
        manifest.push({ path: relative, sha256: crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") });
      }
    }
  }
  copy(path.join(source, "nexolineal"));
  fs.writeFileSync(path.join(runtime, "core-manifest.json"), JSON.stringify(manifest, null, 2));
  fs.cpSync(path.resolve("node_modules/pyodide"), path.join(runtime, "pyodide"), { recursive: true });
}
console.log(JSON.stringify({ target, core: "packages/core/src/nexolineal" }));
