const BOMGenerator = {
  /** One BOM per item, in line number order: [{ line, item, parts }] where parts are for a single unit. */
  generate(items) {
    return items.map(item => ({ line: item.line, item, parts: item.bomParts().filter(p => p.qty !== 0) })).sort((a, b) => a.line - b.line);
  },

  /** Consolidated tally across the whole job (part qty x item qty). */
  tally(boms) {
    const map = new Map();
    for (const { item, parts } of boms) {
      for (const p of parts) {
        const key = `${p.partNo}|${p.description}`;
        const row = map.get(key) || { partNo: p.partNo, description: p.description, qty: 0, bldg: p.bldg, hardware: p.assembly?.name === "Hardware" };
        row.qty += p.qty * item.qty;
        map.set(key, row);
      }
    }
    // Hardware last, then by part number.
    return [...map.values()].sort((a, b) => a.hardware - b.hardware || String(a.partNo).localeCompare(String(b.partNo)));
  },
};
