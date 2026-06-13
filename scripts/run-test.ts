import { emptyDir } from "@std/fs";

const watcher = Deno.watchFs([
  "./src/",
  "./test/",
], { recursive: true });

const runCmd = async (
  cmd: string[],
): Promise<{ output: string; error: string; code: number }> => {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await command.output();
  return {
    output: new TextDecoder().decode(stdout),
    error: new TextDecoder().decode(stderr),
    code,
  };
};

// Debounce runner
let timeout: ReturnType<typeof setTimeout> | undefined;

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

console.log("Watching ./src/ and ./test/ for changes... (Ctrl+C to stop)");
runTest("startup");

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
