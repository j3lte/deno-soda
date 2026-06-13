// Sync the `version` field in deno.json to the version passed by the publish
// workflows, so `deno publish` (JSR) ships the right version.

const version = (Deno.args[0] ?? "").replace(/^v/, "").trim();

if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`Invalid version: "${Deno.args[0] ?? ""}"`);
  Deno.exit(1);
}

const path = new URL("../deno.json", import.meta.url);
const config = JSON.parse(await Deno.readTextFile(path));

config.version = version;

await Deno.writeTextFile(path, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Set deno.json version to ${version}`);

// Stamp the CHANGELOG: turn the `## [Unreleased]` placeholder into a dated
// version section, leaving a fresh empty `## [Unreleased]` heading on top for
// the next cycle. No-op if there is no CHANGELOG or no Unreleased section.
const changelogPath = new URL("../CHANGELOG.md", import.meta.url);
try {
  const changelog = await Deno.readTextFile(changelogPath);
  // Match the heading line only (anchored), not any inline mention in prose.
  const unreleasedHeading = /^## \[Unreleased\]$/m;
  if (unreleasedHeading.test(changelog)) {
    const date = new Date().toISOString().slice(0, 10);
    const stamped = changelog.replace(
      unreleasedHeading,
      `## [Unreleased]\n\n## [${version}] - ${date}`,
    );
    await Deno.writeTextFile(changelogPath, stamped);
    console.log(`Stamped CHANGELOG.md with ${version} (${date})`);
  } else {
    console.log("CHANGELOG.md has no '## [Unreleased]' section; skipped stamp.");
  }
} catch (err) {
  if (err instanceof Deno.errors.NotFound) {
    console.log("No CHANGELOG.md; skipped stamp.");
  } else {
    throw err;
  }
}
