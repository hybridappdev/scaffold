import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tree = [
  ".github/workflows/ci.yml",
  "README.md",
  "index.html",
  "package.json",
  "src/main.tsx",
  "src/screen.test.tsx",
  "src/screen.tsx",
];

const temps: string[] = [];

afterEach(async () => {
  await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function run(args: string[], cwd: string) {
  return spawnSync(path.join(repoRoot, "node_modules/.bin/tsx"), [path.join(repoRoot, "src/cli.ts"), ...args], {
    cwd,
    encoding: "utf8",
  });
}

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "scaffold-"));
  temps.push(dir);
  return dir;
}

async function filesIn(dir: string): Promise<Map<string, string>> {
  const found = new Map<string, string>();

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      const relative = path.relative(dir, full).split(path.sep).join("/");
      found.set(relative, await readFile(full, "utf8"));
    }
  }

  await walk(dir);
  return found;
}

describe("scaffold", () => {
  it("matches examples/book-desk", async () => {
    const parent = await tempDir();
    const dir = path.join(parent, "book-desk");
    const result = run(["book-desk", "--dir", dir], parent);

    expect(result.status).toBe(0);
    const generated = await filesIn(dir);
    const expected = await filesIn(path.join(repoRoot, "examples/book-desk"));

    expect([...generated.keys()].sort()).toEqual([...tree].sort());
    expect([...generated.keys()].sort()).toEqual([...expected.keys()].sort());
    for (const [file, contents] of generated) {
      expect(contents, file).toBe(expected.get(file));
      expect(contents, file).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    }

    const screen = generated.get("src/screen.tsx") ?? "";
    const manifest = generated.get("package.json") ?? "";
    const workflow = generated.get(".github/workflows/ci.yml") ?? "";
    const readme = generated.get("README.md") ?? "";

    expect(manifest).toContain('"@hybridappdev/primitives": "github:hybridappdev/primitives"');
    expect(manifest).toContain('"dev": "vite"');
    expect(manifest).toContain('"test": "vitest run --environment jsdom"');
    expect(manifest).toContain('"typecheck":');
    expect(screen).toContain('label="Book"');
    expect(screen).toContain("ChartFrame");
    expect(screen).toContain('label="Publish"');
    expect(screen).toContain('variant="primary"');
    expect(screen).toContain("@hybridappdev/primitives/styles.css");
    expect(screen).toContain("@hybridappdev/primitives/tokens.css");
    expect(screen).not.toMatch(/\bclassName\b/);
    expect(screen).not.toMatch(/\bstyle\s*=/);
    expect(generated.get("src/screen.test.tsx")).toContain("Publish");
    expect(workflow).toContain("pnpm test");
    expect(workflow).toContain("pnpm typecheck");
    expect(workflow).toMatch(/branches:\s*\n\s*- main/);
    expect(readme.trim().split(/(?<=\.)\s+/)).toHaveLength(3);
    expect(readme).toContain("scaffolded");
    expect(readme).toContain("@hybridappdev/primitives");
    expect(readme).toContain("https://syedarshad.in");
  });

  it("writes the name as the directory when --dir is omitted", async () => {
    const parent = await tempDir();
    const result = run(["book-desk"], parent);

    expect(result.status).toBe(0);
    const manifest = JSON.parse(await readFile(path.join(parent, "book-desk/package.json"), "utf8")) as {
      name: string;
    };
    expect(manifest.name).toBe("book-desk");
  });

  it.each(["--tailwind", "--mui", "--template", "--styled-components", "--help"])(
    "rejects %s",
    async (flag) => {
      const parent = await tempDir();
      const result = run(["book-desk", flag], parent);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("The UI library is not a choice.\n");
      expect(await readdir(parent)).toEqual([]);
    },
  );

  it("rejects a name outside ^[a-z][a-z0-9-]+$", async () => {
    const parent = await tempDir();
    const result = run(["Book"], parent);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(await readdir(parent)).toEqual([]);
  });
});
