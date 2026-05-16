import { Fragment, type ReactNode } from "react";

/** Renders a normal “&” in heading copy (Playfair’s default glyph is a decorative swash). */
export function withPlainAmpersand(text: string): ReactNode {
  if (!text.includes("&")) return text;

  const parts = text.split("&");
  return parts.map((part, index) => (
    <Fragment key={`${index}-${part}`}>
      {part}
      {index < parts.length - 1 ? <span className="plain-amp">&</span> : null}
    </Fragment>
  ));
}
