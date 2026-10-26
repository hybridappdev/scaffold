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
