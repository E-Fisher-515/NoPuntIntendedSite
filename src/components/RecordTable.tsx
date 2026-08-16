type Column = { key: string; label: string };
type Row = Record<string, string | number | null | undefined>;

export function RecordTable({
  title,
  columns,
  rows,
  empty = "Not enough archived data to compute this record yet.",
}: {
  title: string;
  columns: Column[];
  rows: Row[];
  empty?: string;
}) {
  return (
    <section className="mb-10">
      <h3 className="mb-3 font-serif text-2xl text-forest">{title}</h3>
      {!rows.length ? (
        <p className="border border-dashed border-rule px-4 py-6 text-sm text-ink/60">{empty}</p>
      ) : (
        <div className="overflow-x-auto border border-rule">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-charcoal text-cream">
              <tr className="text-[11px] uppercase tracking-[0.14em]">
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-normal">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-rule odd:bg-cream even:bg-cream-dark/40">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-2">
                      {row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
