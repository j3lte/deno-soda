// Reports JSDoc coverage of the public API, mirroring the metric JSR uses for
// its "has docs for most symbols" score (target: >= 80%).
//
// Usage:
//   deno task doc-coverage             # check ./mod.ts against the 80% threshold
//   deno task doc-coverage --list      # also print every undocumented symbol
//   deno task doc-coverage --min 90    # use a custom threshold
//   deno task doc-coverage ./mod.ts    # check a specific entry point
//
// Exits non-zero when coverage is below the threshold (useful in CI).

const THRESHOLD_DEFAULT = 80;

interface Entry {
  name: string;
  kind: string;
  documented: boolean;
}

// deno-lint-ignore no-explicit-any
const isDocumented = (node: any): boolean => ((node?.jsDoc?.doc ?? "").trim().length > 0);

// deno-lint-ignore no-explicit-any
function collect(symbols: any[]): Entry[] {
  const entries: Entry[] = [];

  for (const symbol of symbols ?? []) {
    const decl = symbol.declarations?.[0];
    if (!decl) continue;

    const kind: string = decl.kind ?? "unknown";
    entries.push({ name: symbol.name, kind, documented: isDocumented(decl) });

    if (kind === "class") {
      // deno-lint-ignore no-explicit-any
      for (const m of decl.def?.methods ?? []) {
        if ((m.accessibility ?? "public") !== "public") continue;
        entries.push({
          name: `${symbol.name}.${m.name}`,
          kind: "method",
          documented: isDocumented(m),
        });
      }
      // deno-lint-ignore no-explicit-any
      for (const p of decl.def?.properties ?? []) {
        if ((p.accessibility ?? "public") !== "public") continue;
        entries.push({
          name: `${symbol.name}.${p.name}`,
          kind: "property",
          documented: isDocumented(p),
        });
      }
    } else if (kind === "interface") {
      // deno-lint-ignore no-explicit-any
      for (const m of decl.def?.methods ?? []) {
        entries.push({
          name: `${symbol.name}.${m.name}`,
          kind: "method",
          documented: isDocumented(m),
        });
      }
      // deno-lint-ignore no-explicit-any
      for (const p of decl.def?.properties ?? []) {
        entries.push({
          name: `${symbol.name}.${p.name}`,
          kind: "property",
          documented: isDocumented(p),
        });
      }
    } else if (kind === "enum") {
      // deno-lint-ignore no-explicit-any
      for (const member of decl.def?.members ?? []) {
        entries.push({
          name: `${symbol.name}.${member.name}`,
          kind: "enumMember",
          documented: isDocumented(member),
        });
      }
    }
  }

  return entries;
}

async function main(): Promise<void> {
  const args = [...Deno.args];

  let min = THRESHOLD_DEFAULT;
  const minIdx = args.indexOf("--min");
  if (minIdx !== -1) {
    min = Number(args.splice(minIdx, 2)[1]);
    if (Number.isNaN(min)) {
      console.error("--min requires a number");
      Deno.exit(1);
    }
  }

  const list = args.includes("--list");
  const entry = args.find((a) => !a.startsWith("--")) ?? "./mod.ts";

  const { success, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
    args: ["doc", "--json", entry],
    stdout: "piped",
    stderr: "piped",
  }).output();

  if (!success) {
    console.error(new TextDecoder().decode(stderr));
    Deno.exit(1);
  }

  const doc = JSON.parse(new TextDecoder().decode(stdout));
  const entries = Object.values(doc.nodes ?? {}).flatMap((node) =>
    // deno-lint-ignore no-explicit-any
    collect((node as any).symbols)
  );

  const total = entries.length;
  const documented = entries.filter((e) => e.documented).length;
  const pct = total === 0 ? 100 : (documented / total) * 100;

  if (list) {
    const undocumented = entries.filter((e) => !e.documented);
    if (undocumented.length > 0) {
      console.log("Undocumented symbols:");
      for (const e of undocumented) console.log(`  - ${e.name} [${e.kind}]`);
      console.log("");
    }
  }

  console.log(`Doc coverage: ${documented}/${total} (${pct.toFixed(1)}%) — threshold ${min}%`);

  if (pct < min) {
    console.error(`Below threshold by ${(min - pct).toFixed(1)} points.`);
    Deno.exit(1);
  }
}

await main();
