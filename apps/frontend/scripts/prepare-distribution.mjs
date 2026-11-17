// Un manifiesto de bytes identifica exactamente lo que se descarga para uso offline.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
const target = process.env.VITE_TARGET || "web",
  dist = path.resolve("dist");
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const source =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (target !== "web") {
  const html = path.join(dist, "index.html");
  fs.writeFileSync(
    html,
    fs.readFileSync(html, "utf8").replace(/<link rel="manifest"[^>]*>/, ""),
  );
}
const files = [];
function walk(dir) {
  for (const entry of fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (
      !file.endsWith(".map") &&
      ![
        "sw.js",
        "precache.json",
        "version.json",
        "manifest.webmanifest",
      ].includes(entry.name)
    ) {
      const bytes = fs.readFileSync(file);
      files.push({
        url: path.relative(dist, file).split(path.sep).join("/"),
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.length,
      });
    }
  }
}
walk(dist);
const id =
  source.slice(0, 12) +
  "-" +
  crypto
    .createHash("sha256")
    .update(JSON.stringify(files))
    .digest("hex")
    .slice(0, 12);
const core = JSON.parse(
  fs.readFileSync("../../packages/core/python-files.json", "utf8"),
).map((p) => {
  const bytes = fs.readFileSync("../../" + p);
  return {
    path: p.replace("packages/core/src/", ""),
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
});
const build = {
  version,
  source_sha: source,
  target,
  build_id: id,
  core_manifest_sha256: crypto
    .createHash("sha256")
    .update(JSON.stringify(core))
    .digest("hex"),
  offline_download_bytes: files.reduce((n, f) => n + f.bytes, 0),
};
fs.writeFileSync(
  path.join(dist, "version.json"),
  JSON.stringify(build, null, 2) + "\n",
);
if (target === "web") {
  const manifest = {
    id: "./",
    name: "NexoLineal",
    short_name: "NexoLineal",
    lang: "es",
    description:
      "Álgebra lineal y métodos numéricos con procedimientos y comprobaciones.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#10203c",
    theme_color: "#10203c",
    icons: [
      {
        src: "./icon.svg",
        sizes: "192x192 512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "./icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
  fs.writeFileSync(
    path.join(dist, "manifest.webmanifest"),
    JSON.stringify(manifest, null, 2),
  );
  for (const url of ["version.json", "manifest.webmanifest"]) {
    const bytes = fs.readFileSync(path.join(dist, url));
    files.push({
      url,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    });
  }
  fs.writeFileSync(
    path.join(dist, "precache.json"),
    JSON.stringify({ build, ...{ files } }, null, 2),
  );
  const template = fs.readFileSync(
    "src/distribution/service-worker.js",
    "utf8",
  );
  fs.writeFileSync(
    path.join(dist, "sw.js"),
    template
      .replace("__BUILD__", JSON.stringify(build))
      .replace("__FILES__", JSON.stringify(files)),
  );
}
console.log(JSON.stringify(build));
