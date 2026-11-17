# scaffold

A new app does not get to choose its own platform.

```
pnpm scaffold book-desk
```

The name is the argument and matches `^[a-z][a-z0-9-]+$`. `--dir` sets the output directory and defaults to the name. Any other flag exits with "The UI library is not a choice."

```
book-desk/
  package.json
  index.html
  src/main.tsx
  src/screen.tsx
  src/screen.test.tsx
  .github/workflows/ci.yml
  README.md
```

`examples/book-desk` is that tree.

[syedarshad.in](https://syedarshad.in)

[primitives](https://github.com/hybridappdev/primitives)

MIT
