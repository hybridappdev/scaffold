import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { appFiles } from "./templates";

const namePattern = /^[a-z][a-z0-9-]+$/;

type Args = {
  name: string;
  dir: string;
};

class ScaffoldError extends Error {
  constructor(
    message: string,
    readonly stream: "stdout" | "stderr",
  ) {
    super(message);
  }
}

export function parseArgs(argv: string[]): Args {
  const names: string[] = [];
  let dir: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) continue;

    if (arg === "--dir" || arg.startsWith("--dir=")) {
      const value = arg === "--dir" ? argv[index + 1] : arg.slice("--dir=".length);
      if (arg === "--dir") index += 1;
      if (value === undefined || value.length === 0 || value.startsWith("-")) {
        throw new ScaffoldError("A directory is required.", "stderr");
      }
      dir = value;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new ScaffoldError("The UI library is not a choice.", "stdout");
    }

    names.push(arg);
  }

  const name = names[0];
  if (names.length !== 1 || name === undefined) {
    throw new ScaffoldError("scaffold <name>", "stderr");
  }
  if (!namePattern.test(name)) {
    throw new ScaffoldError("Name must match ^[a-z][a-z0-9-]+$.", "stderr");
  }

  return { name, dir: dir ?? name };
}

export async function writeApp(args: Args, cwd: string): Promise<void> {
  const root = path.resolve(cwd, args.dir);
  for (const file of appFiles(args.name)) {
    const target = path.join(root, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.contents);
  }
}

export async function main(argv: string[], cwd = process.cwd()): Promise<number> {
  try {
    await writeApp(parseArgs(argv), cwd);
    return 0;
  } catch (error) {
    if (error instanceof ScaffoldError) {
      const writer = error.stream === "stdout" ? process.stdout : process.stderr;
      writer.write(`${error.message}\n`);
      return 1;
    }
    const message = error instanceof Error ? error.message : "Scaffold failed.";
    process.stderr.write(`${message}\n`);
    return 1;
  }
}
