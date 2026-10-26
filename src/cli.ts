#!/usr/bin/env tsx
import { main } from "./scaffold";

const code = await main(process.argv.slice(2));
process.exit(code);
