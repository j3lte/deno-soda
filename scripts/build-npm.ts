import { build, emptyDir } from "https://deno.land/x/dnt@0.34.0/mod.ts";

const cleanupTypes = async (dir: string) => {
  for await (const dirEntry of Deno.readDir(dir)) {
    const entryPath = `${dir}/${dirEntry.name}`;
    if (dirEntry.isDirectory) {
      await cleanupTypes(entryPath);
    } else {
      const file = await Deno.readTextFile(entryPath);
      const newFile = file.replaceAll('.js"', '"');
      await Deno.writeTextFile(entryPath, newFile);
    }
  }
};

await emptyDir("./npm");

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./npm",
  mappings: {},
  declaration: true,
  skipSourceOutput: true,
  scriptModule: false,
  shims: {
    undici: true,
  },
  test: false,
  typeCheck: false,
  compilerOptions: {
    importHelpers: false,
    target: "ES2021",
  },
  package: {
    // package.json properties
    name: "soda-query",
    version: Deno.args[0] || "1.0.0",
    description: "SodaQuery: A JavaScript client for Socrata Open Data APIs",
    license: "MIT",
    publishConfiig: {
      access: "public",
    },
    keywords: [
      "soda",
      "socrata",
      "open data",
      "api",
      "client",
      "deno",
      "typescript",
    ],
    author: {
      name: "J.W. Lagendijk",
      email: "jwlagendijk@gmail.com",
    },
    repository: {
      type: "git",
      url: "git+https://github.com/j3lte/deno-soda.git",
    },
    bugs: {
      url: "https://github.com/j3lte/deno-soda/issues",
    },
  },
  async postBuild(): Promise<void> {
    // steps to run after building and before running the tests
    await Deno.copyFile("LICENSE", "npm/LICENSE");
    await Deno.copyFile("README.md", "npm/README.md");
    await cleanupTypes("./npm/types");
  },
});
