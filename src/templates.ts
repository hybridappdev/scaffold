export type AppFile = {
  path: string;
  contents: string;
};

function text(value: string): string {
  const stripped = value.replace(/^\n/, "").replace(/\n[ \t]*$/, "");
  const lines = stripped.split("\n");
  const margin = lines.reduce((min, line) => {
    if (line.trim().length === 0) return min;
    const width = line.match(/^ */)?.[0].length ?? 0;
    return Math.min(min, width);
  }, Number.POSITIVE_INFINITY);
  const body = lines
    .map((line) => (line.trim().length === 0 ? "" : line.slice(margin)))
    .join("\n");
  return `${body}\n`;
}

const typecheck = [
  "tsc",
  "--noEmit",
  "--strict",
  "--jsx react-jsx",
  "--target es2022",
  "--module esnext",
  "--moduleResolution bundler",
  "--lib es2022,dom,dom.iterable",
  "--skipLibCheck",
  "--isolatedModules",
  "--noUnusedLocals",
  "--noUnusedParameters",
  "--noFallthroughCasesInSwitch",
  "src/main.tsx",
  "src/screen.tsx",
  "src/screen.test.tsx",
].join(" ");

function packageJson(name: string): string {
  return text(`
    {
      "name": "${name}",
      "private": true,
      "version": "0.1.0",
      "license": "MIT",
      "type": "module",
      "engines": {
        "node": ">=20"
      },
      "packageManager": "pnpm@10.23.0",
      "scripts": {
        "dev": "vite",
        "test": "vitest run --environment jsdom",
        "typecheck": "${typecheck}"
      },
      "dependencies": {
        "@hybridappdev/primitives": "github:hybridappdev/primitives",
        "react": "^19.3.1",
        "react-dom": "^19.3.1"
      },
      "devDependencies": {
        "@testing-library/react": "^16.3.3",
        "@types/react": "^19.3.0",
        "@types/react-dom": "^19.3.0",
        "jsdom": "^30.1.3",
        "typescript": "^7.0.2",
        "vite": "^8.3.5",
        "vitest": "^5.0.5"
      },
      "pnpm": {
        "onlyBuiltDependencies": ["esbuild", "@hybridappdev/primitives"]
      }
    }
  `);
}

function indexHtml(name: string): string {
  return text(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${name}</title>
        <style>
          body {
            margin: 0;
            background: var(--color-bg);
            color: var(--color-fg);
            font: var(--type-body);
          }

          main {
            display: flex;
            flex-direction: column;
            gap: var(--space-6);
            padding: var(--space-6);
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
  `);
}

const mainTsx = text(`
  import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import { Screen } from "./screen";

  const root = document.getElementById("root");
  if (!root) throw new Error("Missing root");

  createRoot(root).render(
    <StrictMode>
      <Screen />
    </StrictMode>,
  );
`);

const screenTsx = text(`
  import { useState } from "react";
  import { Button, ChartFrame, Filter } from "@hybridappdev/primitives";
  // @ts-expect-error package css has no type declarations
  import "@hybridappdev/primitives/tokens.css";
  // @ts-expect-error package css has no type declarations
  import "@hybridappdev/primitives/styles.css";

  const books = [
    { value: "Equities", label: "Equities" },
    { value: "Credit", label: "Credit" },
    { value: "Rates", label: "Rates" },
  ];

  const points = [12, 18, 14, 22, 19, 27];

  export function Screen() {
    const [book, setBook] = useState("Equities");

    return (
      <main>
        <Filter id="book" label="Book" options={books} value={book} onChange={setBook} />
        <ChartFrame title="Unrealized P&L" tone="neutral" points={points} />
        <Button variant="primary" size="md" label="Publish" />
      </main>
    );
  }
`);

const screenTestTsx = text(`
  import { cleanup, render, screen } from "@testing-library/react";
  import { afterEach, describe, expect, it } from "vitest";
  import { Screen } from "./screen";

  afterEach(() => {
    cleanup();
  });

  describe("screen", () => {
    it("finds the Publish button", () => {
      render(<Screen />);
      expect(screen.getByRole("button", { name: "Publish" })).toBeTruthy();
    });
  });
`);

const ciYml = text(`
  name: ci

  on:
    push:
      branches:
        - main

  jobs:
    check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
          with:
            version: 10
        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: pnpm
        - run: pnpm install
        - run: pnpm test
        - run: pnpm typecheck
`);

function readme(name: string): string {
  return text(`
    ${name} was scaffolded. It depends on @hybridappdev/primitives. See [syedarshad.in](https://syedarshad.in).
  `);
}

export function appFiles(name: string): AppFile[] {
  return [
    { path: "package.json", contents: packageJson(name) },
    { path: "index.html", contents: indexHtml(name) },
    { path: "src/main.tsx", contents: mainTsx },
    { path: "src/screen.tsx", contents: screenTsx },
    { path: "src/screen.test.tsx", contents: screenTestTsx },
    { path: ".github/workflows/ci.yml", contents: ciYml },
    { path: "README.md", contents: readme(name) },
  ];
}
