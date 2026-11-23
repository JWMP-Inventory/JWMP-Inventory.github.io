/* ---------- Product Data: inventory spreadsheet from assets/inventory.json ---------- */
// fetch() is blocked when index.html is opened straight from the folder (file://),
// so in that case the user picks the file instead.
const HIDDEN_COLS = ["DXF ADJUST", "FOR LASER (+)", "QTY SHORT", "FORECAST USAGE", "BARCODE"];
// Cell edits live in this browser only, as { originalPartNumber: { column: value } },
// and are re-applied on top of the file every time it loads. "Download" saves file + edits as JSON.
const EDITS_KEY = "bom-inventory-edits-v1";

const Inventory = {
  data: null,
  rows: [],
  keys: [], // original Part Number of each row, so edits survive renaming a part
  cols: [],
  edits: {},
  sort: { col: null, dir: 1 },

  /** Weight of one part in lbs (with any edits), or null if the part or its weight isn't in the inventory. */
  weightOf(partNo) {
    const r = this.rows.find(r => String(r["Part Number"]) === partNo);
    const w = r ? parseFloat(r["Part Weight (lbs)"]) : NaN;
    return isNaN(w) ? null : w;
  },

  load(data) {
    this.data = data;
    try { this.edits = JSON.parse(localStorage.getItem(EDITS_KEY) || "{}"); } catch (e) { this.edits = {}; }
    const base = data.inventory || [];
    this.keys = base.map(r => String(r["Part Number"]));
    this.rows = base.map((r, i) => ({ ...r, ...this.edits[this.keys[i]] }));
    this.cols = [...new Set(base.flatMap(r => Object.keys(r)))].filter(c => !HIDDEN_COLS.includes(c));
    const updated = data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "";
    $("invSub").textContent = `Inventory from assets/inventory.json${updated ? " · last updated " + updated : ""}. Click a cell to edit it.`;
    $("invMsg").hidden = true;
    $("invTools").hidden = false;
    this.render();
  },

  isEdited(i, col) {
    return Object.hasOwn(this.edits[this.keys[i]] || {}, col);
  },

  /** Saves one cell. Keeps numbers as numbers when the original value was a number. */
  setCell(i, col, text) {
    const original = this.data.inventory[i][col];
    const value = typeof original === "number" && text.trim() !== "" && !isNaN(text) ? Number(text) : text;
    const key = this.keys[i], e = this.edits[key] || {};
    if (String(value) === String(original ?? "")) delete e[col]; else e[col] = value;
    if (Object.keys(e).length) this.edits[key] = e; else delete this.edits[key];
    this.rows[i][col] = value;
    try { localStorage.setItem(EDITS_KEY, JSON.stringify(this.edits)); } catch (err) {}
    this.renderCount();
  },

  editCount() {
    return Object.values(this.edits).reduce((n, e) => n + Object.keys(e).length, 0);
  },

  renderCount() {
    const n = this.editCount();
    $("invEdits").textContent = n ? `${n} edited cell${n === 1 ? "" : "s"} (saved in this browser)` : "";
    $("invReset").hidden = !n;
  },

  render() {
    const q = $("invSearch").value.trim().toLowerCase();
    let idx = this.rows.map((_, i) => i);
    if (q) idx = idx.filter(i => this.cols.some(c => String(this.rows[i][c] ?? "").toLowerCase().includes(q)));
    const { col, dir } = this.sort;
    if (col) idx.sort((a, b) => {
      const x = this.rows[a][col] ?? "", y = this.rows[b][col] ?? "";
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * dir;
    });
    const head = this.cols.map(c => `<th data-col="${esc(c)}" aria-sort="${c === col ? (dir > 0 ? "ascending" : "descending") : "none"}">${esc(c)}${c === col ? (dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("");
    const body = idx.map(i => `<tr>${this.cols.map(c =>
      `<td contenteditable="plaintext-only" spellcheck="false" data-row="${i}" data-col="${esc(c)}"${this.isEdited(i, c) ? ' class="edited"' : ""}>${esc(this.rows[i][c] ?? "")}</td>`).join("")}</tr>`).join("");
    $("invTable").innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
    $("invCount").textContent = `${idx.length} of ${this.rows.length} parts`;
    this.renderCount();
  },

  /** Downloads the file with the edits applied, to replace assets/inventory.json. */
  download() {
    const out = { ...this.data, inventory: this.data.inventory.map((r, i) => ({ ...r, ...this.edits[this.keys[i]] })) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
    a.download = "inventory.json";
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

$("invSearch").addEventListener("input", () => Inventory.render());
$("invTable").addEventListener("click", e => {
  const th = e.target.closest("th[data-col]"); if (!th) return;
  const s = Inventory.sort;
  s.dir = s.col === th.dataset.col ? -s.dir : 1;
  s.col = th.dataset.col;
  Inventory.render();
});
// Commit a cell when it loses focus; Enter commits, Escape undoes the typing.
$("invTable").addEventListener("focusout", e => {
  const td = e.target.closest("td[data-row]"); if (!td) return;
  Inventory.setCell(+td.dataset.row, td.dataset.col, td.textContent);
  td.classList.toggle("edited", Inventory.isEdited(+td.dataset.row, td.dataset.col));
});
$("invTable").addEventListener("keydown", e => {
  const td = e.target.closest("td[data-row]"); if (!td) return;
  if (e.key === "Enter") { e.preventDefault(); td.blur(); }
  if (e.key === "Escape") { td.textContent = Inventory.rows[td.dataset.row][td.dataset.col] ?? ""; td.blur(); }
});
$("invDownload").onclick = () => Inventory.download();
$("invReset").onclick = () => {
  if (!confirm(`Undo all ${Inventory.editCount()} edited cells and go back to the file's values?`)) return;
  try { localStorage.removeItem(EDITS_KEY); } catch (e) {}
  Inventory.load(Inventory.data);
};
$("invFile").addEventListener("change", async e => {
  const f = e.target.files[0]; if (!f) return;
  try { Inventory.load(JSON.parse(await f.text())); } catch (err) { $("invMsg").textContent = "That file isn't valid inventory JSON."; }
});

fetch("assets/inventory.json")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(data => Inventory.load(data))
  .catch(() => {
    $("invMsg").textContent = "Couldn't load assets/inventory.json automatically (browsers block this when the page is opened straight from the folder). Choose Open inventory.json to load it.";
    $("invPick").hidden = false;
  });
