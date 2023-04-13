import { emptyDir } from "../dev_deps.ts";

const watcher = Deno.watchFs([
  "./src/",
  "./test/",
], { recursive: true });

const runCmd = async (cmd: string[]) => {
  const p = Deno.run({ cmd, stdout: "piped", stderr: "piped" });
  const status = await p.status();
  const output = await p.output();
  const error = await p.stderrOutput();
  p.close();
  return {
    output: new TextDecoder().decode(output),
    error: new TextDecoder().decode(error),
    code: status.code,
  };
};

// Debounce runner
let timeout: number | undefined;

const runTest = (path: string) => {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(async () => {
    console.log(">>>>> runTest", path);
    await emptyDir("./.coverage/");
    const test = await runCmd(["deno", "test", "--allow-net", "--coverage=./.coverage", "./test/"]);
    console.log(test.output);

    if (test.code !== 0) {
      console.log(test.error);
      return;
    }
    const cov = await runCmd([
      "deno",
      "coverage",
      "./.coverage/",
      "--lcov",
      "--exclude=/test|scripts/",
    ]);
    await Deno.writeTextFile("./.coverage/coverageFile.lcov", cov.output);

    await runCmd(["genhtml", "-o", "./.coverage/", "./.coverage/coverageFile.lcov"]);
  }, 100);
};

for await (const event of watcher) {
  // console.log(">>>>> event", event);
  const { kind, paths } = event;
  if (["modify", "create", "delete"].includes(kind) && paths[0]) {
    const [path] = paths;
    if (path.endsWith(".ts")) {
      runTest(path);
    }
  }
}
