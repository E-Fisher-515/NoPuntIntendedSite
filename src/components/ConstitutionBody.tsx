type Block =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "gap" };

function blocksOf(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2) });
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) });
      index += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4) });
      index += 1;
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*] /.test(lines[index])) {
        items.push(lines[index].replace(/^[-*] /, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (!line.trim()) {
      blocks.push({ type: "gap" });
      index += 1;
      continue;
    }
    blocks.push({ type: "p", text: line });
    index += 1;
  }
  return blocks;
}

export function ConstitutionBody({ text }: { text: string }) {
  return (
    <article className="max-w-3xl border border-rule bg-cream px-8 py-10">
      {blocksOf(text).map((block, index) => {
        if (block.type === "h1") {
          return (
            <h1 key={index} className="mb-6 text-center font-serif text-4xl text-forest">
              {block.text}
            </h1>
          );
        }
        if (block.type === "h2") {
          return (
            <h2 key={index} className="mb-3 mt-8 font-serif text-2xl text-forest">
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={index} className="mb-2 mt-6 font-serif text-xl text-forest">
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="mb-2 list-disc space-y-1 pl-6 text-[17px] leading-8 text-ink/80">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "gap") {
          return <div key={index} className="h-3" />;
        }
        return (
          <p key={index} className="text-[17px] leading-8 text-ink/80">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
