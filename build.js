const { build } = require("esbuild");
const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const output = path.join(__dirname, "dist");
  await fs.mkdir(output, { recursive: true });
  await build({
    entryPoints: [path.join(__dirname, "game.js")],
    outfile: path.join(output, "game.js"),
    bundle: true,
    minify: true,
    target: ["es2020"],
    legalComments: "eof"
  });
  for (const file of ["index.html", "styles.css", "assets"]) {
    await fs.cp(path.join(__dirname, file), path.join(output, file), { recursive: true });
  }
  console.log("Build complete: dist/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
