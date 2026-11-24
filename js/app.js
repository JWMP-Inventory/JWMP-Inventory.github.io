const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const STORE_KEY = "bom-generator-draft-v2";
const COLUMNS = [["location", "Indoor/Outdoor"], ["subtype", "Subtype"], ["swing", "Swing"], ["drawer", "Drawer"], ["shelves", "Shelves"], ["floorBracket", "Floor bracket"],["width", "Width"], ["depth", "Depth"], ["height", "Height"], ["grillWidth", "Trim width"], ["grillDepth", "Trim depth"], ["grillHeight", "Trim height"], ["trimHeight", "GF4 height"], ["gf5Width", "GF5 width"],["door", "Door style"], ["finish", "Finish"]];
let items = [];
let errorMap = {}; // { rowIndex: { field: message } }

/* ---------- storage ---------- */
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ job: $("jobNo").value, desc: $("jobDesc").value, totalLines: $("totalLines").value, items })); } catch (e) {}
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (s) {
      $("jobNo").value = s.job || ""; $("jobDesc").value = s.desc || ""; $("totalLines").value = s.totalLines || "";
      items = (s.items || []).map((d, i) => ItemRegistry.create({ line: i + 1, ...d })); // older drafts had no line numbers
    }
  } catch (e) {}
  if (!items.length) items = [newItem()];
}
// Next line number after the highest one in use.
function nextLine() {
  return Math.max(0, ...items.map(it => Number(it.line) || 0)) + 1;
}
function newItem() {
  return ItemRegistry.create({ line: nextLine() });
}

/* ---------- items table ---------- */
// Min width for a cell holding a select, so its longest option is never cut off.
function fitWidth(labels) {
  const n = Math.max(...labels.map(l => String(l).length));
  return `style="min-width:calc(${n}ch + 44px)"`;
}

function fieldCell(item, i, key, label, f, err) {
  if (f.kind === "none") return `<td class="na" aria-label="${label} not applicable">—</td>`;
  const attrs = `data-i="${i}" data-k="${key}" aria-label="${label} for line ${i + 1}" class="${err ? "invalid" : ""}" ${err ? `title="${esc(err)}"` : ""}`;
  if (f.kind === "toggle") {
    return `<td class="tog"><input type="checkbox" ${attrs}${item[key] ? " checked" : ""}></td>`;
  }
  if (f.kind === "number") {
    return `<td><input type="number" min="${f.min}" step="${f.step}" placeholder="${f.placeholder}" ${attrs} value="${item[key]}"></td>`;
  }
  const blank = item[key] === "" ? '<option value="" selected disabled>Select</option>' : "";
  const opts = f.options.map(o => `<option value="${o.value}"${o.value === item[key] ? " selected" : ""}>${esc(o.label)}</option>`).join("");
  return `<td ${fitWidth([...f.options.map(o => o.label), blank ? "Select" : ""])}><select ${attrs}>${blank}${opts}</select></td>`;
}

function rowHTML(item, i) {
  const errs = errorMap[i] || {};
  const fields = item.fields();
  const types = ItemRegistry.all.map(c => `<option value="${c.type}"${c.type === item.type ? " selected" : ""}>${esc(c.label)}</option>`).join("");
  return `<tr>
    <td class="ln"><input type="number" min="1" step="1" data-i="${i}" data-k="line" aria-label="Line number for row ${i + 1}" class="${errs.line ? "invalid" : ""}" ${errs.line ? `title="${esc(errs.line)}"` : ""} value="${item.line}"></td>
    <td ${fitWidth(ItemRegistry.all.map(c => c.label))}><select data-i="${i}" data-k="type" aria-label="Item type for line ${i + 1}">${types}</select></td>
    <td class="q"><input type="number" min="1" step="1" data-i="${i}" data-k="qty" aria-label="Quantity for line ${i + 1}" class="${errs.qty ? "invalid" : ""}" ${errs.qty ? `title="${esc(errs.qty)}"` : ""} value="${item.qty}"></td>
    ${COLUMNS.map(([k, l]) => fieldCell(item, i, k, l, fields[k], errs[k])).join("")}
    <td class="notes"><textarea rows="1" data-i="${i}" data-k="notes" aria-label="Special instructions for line ${i + 1}">${esc(item.notes || "")}</textarea></td>
    <td><button class="icon" data-del="${i}" aria-label="Remove line ${i + 1}" title="Remove line">×</button></td>
  </tr>`;
}

function render(focus) {
  $("rows").innerHTML = items.length
    ? items.map(rowHTML).join("")
    : '<tr><td colspan="21" class="empty">No items yet. Choose Add item to start.</td></tr>';
  $("count").textContent = items.length + (items.length === 1 ? " item" : " items");
  if (focus) { const el = $("rows").querySelector(`[data-i="${focus.i}"][data-k="${focus.k}"]`); if (el) el.focus(); }
}

function setStatus(ready) {
  const s = $("status");
  s.textContent = ready ? "Generated" : "Not generated";
  s.classList.toggle("ready", ready);
}
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2600);
}
// Re-checks highlighted rows so highlights clear as each field is filled in.
function refreshErrors() {
  for (const i in errorMap) {
    const e = items[i] ? items[i].validate() : {};
    if (Object.keys(e).length) errorMap[i] = e; else delete errorMap[i];
  }
}
function edited() { refreshErrors(); setStatus(false); save(); }

// Typing in number inputs / ticking checkboxes: update the value without re-rendering (keeps focus).
$("rows").addEventListener("input", e => {
  const el = e.target;
  if (!["INPUT", "TEXTAREA"].includes(el.tagName) || el.dataset.i == null) return;
  items[el.dataset.i][el.dataset.k] = el.tagName === "TEXTAREA" ? el.value : el.type === "checkbox" ? el.checked : el.value === "" ? "" : Number(el.value);
  el.classList.remove("invalid"); edited();
});
// Selects: update, re-normalize dependent options, re-render.
$("rows").addEventListener("change", e => {
  const el = e.target;
  if (el.tagName !== "SELECT" || el.dataset.i == null) return;
  const i = +el.dataset.i, k = el.dataset.k;
  if (k === "type") items[i] = ItemRegistry.switchType(items[i], el.value);
  else { items[i][k] = NUMERIC_KEYS.includes(k) ? Number(el.value) : el.value; items[i].normalize(); }
  edited(); render({ i, k });
});
$("rows").addEventListener("click", e => {
  const b = e.target.closest("[data-del]"); if (!b) return;
  const del = +b.dataset.del;
  items.splice(del, 1);
  // Shift highlights of the rows below up by one.
  errorMap = Object.fromEntries(Object.entries(errorMap).filter(([i]) => +i !== del).map(([i, e]) => [+i > del ? i - 1 : i, e]));
  edited(); render();
});

/* ---------- add from SKUs ---------- */
$("addSkus").onclick = () => {
  const skus = $("skus").value.split(/[\s,]+/).map(s => s.toUpperCase()).filter(Boolean);
  if (!skus.length) { $("skus").focus(); return; }
  const added = [], failed = [];
  for (const sku of skus) {
    const r = ItemRegistry.fromSku(sku);
    if (r.item) added.push(r.item); else failed.push({ sku, error: r.error });
  }
  if (added.length) {
    const blank = JSON.stringify(ItemRegistry.create({ line: 1 }));
    if (items.length === 1 && JSON.stringify(items[0]) === blank) items = []; // replace the untouched starter row
    const start = items.length;
    added.forEach((it, j) => { it.line = nextLine() + j; });
    items.push(...added);
    added.forEach((it, j) => { errorMap[start + j] = {}; }); // refreshErrors fills in what's missing
    edited(); render();
  }
  // Leave only the SKUs that failed in the box so they can be corrected.
  $("skus").value = failed.map(f => f.sku).join("\n");
  $("skuErr").innerHTML = failed.map(f => `${esc(f.sku)}: ${esc(f.error)}`).join("<br>");
  toast(`Added ${added.length} item${added.length === 1 ? "" : "s"}` + (failed.length ? `, ${failed.length} SKU${failed.length === 1 ? "" : "s"} not recognized.` : "."));
};

/* ---------- set all lines ---------- */
$("allDoor").innerHTML += DOOR_STYLES.map(v => `<option>${esc(v)}</option>`).join("");
$("allShelves").innerHTML += SHELF_COUNTS.map(v => `<option>${v}</option>`).join("");
$("allFinish").innerHTML += FINISHES.map(f => `<option value="${esc(f.value)}">${esc(finishLabel(f.value))}</option>`).join("");
$("applyAll").onclick = () => {
  const door = $("allDoor").value, shelves = $("allShelves").value, finish = $("allFinish").value;
  if (!door && shelves === "" && !finish) { toast("Choose a door style, shelf count or finish to apply."); return; }
  for (const it of items) {
    const f = it.fields();
    if (door && f.door.kind !== "none") it.door = door;
    if (shelves !== "" && f.shelves.kind !== "none") it.shelves = Number(shelves);
    if (finish && f.finish.kind !== "none") it.finish = finish;
    it.normalize();
  }
  edited(); render();
  toast("Applied to all lines.");
};
$("add").onclick = () => { items.push(newItem()); edited(); render({ i: items.length - 1, k: "type" }); };
$("clear").onclick = () => {
  if (!confirm("Clear the job number, description, and all items?")) return;
  $("jobNo").value = ""; $("jobDesc").value = ""; $("totalLines").value = ""; $("jobErr").textContent = ""; $("totalErr").textContent = "";
  items = [ItemRegistry.create({ line: 1 })]; errorMap = {}; edited(); render();
};
["jobNo", "jobDesc", "totalLines"].forEach(id => $(id).addEventListener("input", () => {
  $(id).classList.remove("invalid");
  if (id !== "jobDesc") $(id === "jobNo" ? "jobErr" : "totalErr").textContent = "";
  setStatus(false); save();
}));

/* ---------- generate + results ---------- */
function partsTable(rows) {
  return `<div class="tablewrap"><table class="plain"><thead><tr><th>Qty</th><th>Part no.</th><th>Description</th><th>BLDG</th></tr></thead><tbody>${
    rows.map(p => p.header
      ? `<tr class="asm"><td>${p.qty}</td><td colspan="3">${esc(p.header)}</td></tr>`
      : `<tr${p.assembly ? ' class="sub"' : ""}><td>${p.qty}</td><td>${esc(p.partNo)}</td><td>${esc(p.description)}</td><td>${esc(p.bldg)}</td></tr>`).join("")}</tbody></table></div>`;
}

// Item BOM rows: loose parts first, then each assembly as a header row followed by its parts.
function bomRows(parts) {
  const groups = new Map();
  for (const p of parts.filter(p => p.assembly)) {
    const { name, qty } = p.assembly;
    if (!groups.has(name)) groups.set(name, [{ header: name, qty }]);
    groups.get(name).push(p);
  }
  return [...parts.filter(p => !p.assembly), ...[...groups.values()].flat()];
}

// Consolidated rows: parts, then a Hardware header and the hardware (tally() already sorts hardware last).
function tallyRows(tally) {
  const i = tally.findIndex(p => p.hardware);
  return i < 0 ? tally : [...tally.slice(0, i), { header: "Hardware", qty: "" }, ...tally.slice(i)];
}

function renderResults(job, boms, tally) {
  const units = boms.reduce((n, b) => n + b.item.qty, 0);
  const desc = $("jobDesc").value.trim();
  $("resSub").textContent = `Job ${job}${desc ? " · " + desc : ""}`;
  $("resBody").className = "";
  $("resBody").innerHTML =
    `<p>${boms.length} line${boms.length === 1 ? "" : "s"}, ${units} total unit${units === 1 ? "" : "s"}.</p>
     <div id="tally">
       <p class="print-only"><b>Job ${esc(job)}</b>${desc ? " · " + esc(desc) : ""}</p>
       <h2>Consolidated parts</h2>
       ${tally.length ? partsTable(tallyRows(tally)) : '<p class="sub">No parts yet. Add calculations to each item class\'s parts() method.</p>'}
     </div>
     <h2 class="gap">Item BOMs</h2>` +
    boms.map(b => `<div class="bom"><div class="bom-head"><strong>Line ${b.line} × ${b.item.qty}</strong>${b.item.sku() ? `<strong>${esc(b.item.sku())}</strong>` : ""}<span>${esc(b.item.describe())}</span><span>Weight per unit: ${esc(weightText(b.parts, b.item))}</span></div>
      ${b.parts.length ? partsTable(bomRows(b.parts)) : `<p class="sub">No parts defined yet for ${esc(b.item.constructor.label)}.</p>`}</div>`).join("");
}

/* ---------- printable sheets: one landscape page per unit ---------- */
// Sheet image: images/[SKU].png, then each of item.defaultImage() in order, else the space stays blank.
function sheetImg(it) {
  const names = [it.sku(), it.defaultImage()].flat().filter(Boolean).map(n => `images/${encodeURIComponent(n)}.png`);
  if (!names.length) return "";
  const [first, ...rest] = names;
  return `<img src="${first}" alt="" data-next="${rest.join(" ")}"
    onerror="const n = this.dataset.next.split(' ').filter(Boolean); if (n.length) { this.dataset.next = n.slice(1).join(' '); this.src = n[0]; } else this.remove();">`;
}
/** Highlight class for a print sheet subheading: Hardware, and Box/Drawer assemblies; others keep the row striping. */
function asmClass(name) {
  if (name === "Hardware") return "asm-hw";
  if (name === "Box Assembly" || name.endsWith("Drawer Assembly")) return "asm-box";
  return "";
}
/**
 * Total weight of one unit from the inventory's Part Weight (lbs) column, e.g. "152.3 lbs".
 * Hardware counts as weightless, except cabinet legs at 1 lb each.
 * If any finished front has no weight (only Slab ones do for now), the cabinet is weighed as if it had Slab fronts.
 * Drawer boxes use drawerWeight() instead of their parts' weights; finished drawer fronts and rears are added on top.
 */
function weightText(parts, item) {
  if (!Inventory.rows.length) return "-";
  const isFront = p => /^(ULB[LR]D|ULBDRW|ILBPO(?!BOX))/.test(p.partNo);
  if (item.door !== "Slab" && parts.some(p => isFront(p) && Inventory.weightOf(p.partNo) === null)) {
    parts = ItemRegistry.create({ ...item, door: "Slab" }).bomParts();
  }
  let lbs = 0;
  for (const size of item.drawers()) {
    lbs += drawerWeight(item.drawerWidth(), DRAWER_HEIGHTS[size], DRAWER_DEPTHS[item.depth]);
  }
  for (const p of parts) {
    if (p.partNo.startsWith("ULDRW")) continue; // drawer box parts, weighed as a whole above
    const front = p.partNo.match(/^ULBDRW_SLAB_([\d.]+)_([\d.]+)_D[FB]/);
    if (front && Inventory.weightOf(p.partNo) === null) {
      lbs += drawerFrontWeight(+front[1], +front[2]) * p.qty;
      continue;
    }
    if (p.assembly?.name === "Hardware") {
      if (p.partNo.startsWith("CAB_LEG_")) lbs += p.qty;
      continue;
    }
    lbs += (Inventory.weightOf(p.partNo) || 0) * p.qty; // parts without a weight count as 0
  }
  return `${Math.round(lbs * 10) / 10} lbs`;
}

/** One sheet for a unit. parts is the list for this page; heading names the page (main BOM or hardware). */
function sheetHTML(b, job, n, total, totalLines, parts, heading) {
  const it = b.item;
  const rows = parts.length
    ? bomRows(parts).map(p => p.header
      ? `<tr class="asm ${asmClass(p.header)}"><td>${esc(p.header)}</td><td></td><td>${p.qty}</td><td>-</td></tr>`
      : `<tr><td>${esc(p.description)}</td><td>${esc(p.bldg)}</td><td>${p.qty}</td><td>${esc(p.partNo)}</td></tr>`).join("")
    : `<tr><td colspan="4">No parts defined yet for ${esc(it.constructor.label)}.</td></tr>`;
  const title = `${it.height === 30 ? "ADA Height" : "Full Height"} ${it.constructor.label}`;
  const dim = v => (v === "" ? "-" : `${v}"`);
  const chips = [it.subtype, it.drawer && it.drawer !== "None" ? it.drawer : "", it.door].map(c => `<span>${esc(c || "-")}</span>`).join("");
  return `<article class="sheet">
    <div>
      <h2>${heading}</h2>
      <table><thead><tr><th>PART NAME</th><th>BLDG</th><th>QTY</th><th>SKU</th></tr></thead><tbody>${rows}</tbody></table>
      ${heading === "BILL OF MATERIAL" ? `<div class="skubox notesbox"><span>Special Instructions</span><b>${esc(it.notes || "")}</b></div>` : ""}
    </div>
    <div class="sheet-side">
      <div class="sheet-tag">${esc(job.slice(-4))}-${b.line}</div>
      <p><b>Job Number: ${esc(job)}</b><br>Line ${b.line} of ${totalLines} · Cabinet ${n} of ${total}</p>
      <div class="sheet-img">${sheetImg(it)}</div>
      <h3>${esc(title)}</h3>
      <div class="dims"><div><span>WIDTH</span><b>${dim(it.width)}</b></div><div><span>DEPTH</span><b>${dim(it.depth)}</b></div><div><span>HEIGHT</span><b>${dim(it.height)}</b></div></div>
      <div class="sbox">${esc(LOCATION_CODES[it.location] || "")} SERIES - ${esc(it.location.toUpperCase())}</div>
      <div class="chips">${chips}</div>
      <div class="sbox">${esc(finishLabel(it.finish) || "-")}${it.finish.startsWith("FN-PC-") ? `<br>${esc(it.finish)}` : ""}</div>
      <div class="skubox"><span>Cabinet SKU</span><b>${esc(it.sku() || "-")}</b></div>
      <div class="skubox"><span>Cabinet Weight</span><b>${esc(weightText(b.parts, b.item))}</b></div>
      <img class="sheet-logo" src="images/JW-logo.png" alt="JW Metal Products">
    </div>
  </article>`;
}

function renderSheets(job, boms, totalLines) {
  const units = boms.reduce((n, b) => n + b.item.qty, 0);
  const out = [];
  let n = 0;
  // Each unit gets its BOM page, then a second page with its hardware (if it has any).
  for (const b of boms) {
    const hardware = b.parts.filter(p => p.assembly?.name === "Hardware");
    const main = b.parts.filter(p => p.assembly?.name !== "Hardware");
    for (let k = 0; k < b.item.qty; k++) {
      n++;
      out.push(sheetHTML(b, job, n, units, totalLines, main, "BILL OF MATERIAL"));
      if (hardware.length) out.push(sheetHTML(b, job, n, units, totalLines, hardware, "BILL OF MATERIAL - HARDWARE"));
    }
  }
  $("sheets").className = "";
  $("sheets").innerHTML = out.join("");
}
// Shrinks each sheet's BOM text until the list fits the page. Needs the print view visible to measure.
function fitSheets() {
  for (const s of document.querySelectorAll(".sheet")) {
    if (!s.offsetParent) continue; // hidden: can't measure
    const t = s.querySelector("table"), bottom = () => s.getBoundingClientRect().bottom - parseFloat(getComputedStyle(s).paddingBottom);
    let size = 11;
    t.style.fontSize = size + "px";
    while (t.getBoundingClientRect().bottom > bottom() && size > 6) t.style.fontSize = (size -= 0.25) + "px";
  }
}
addEventListener("beforeprint", fitSheets);

// Prints only the consolidated parts list (portrait); see body.print-tally in styles.css.
$("printTally").onclick = () => {
  if (!$("tally")) { toast("Generate BOMs first."); return; }
  document.body.classList.add("print-tally");
  print();
};
addEventListener("afterprint", () => document.body.classList.remove("print-tally"));

$("printBtn").onclick = () => {
  if (!$("sheets").querySelector(".sheet")) { toast("Generate BOMs first."); return; }
  print();
};

$("generate").onclick = () => {
  const job = $("jobNo").value.trim();
  errorMap = {};
  let first = null;
  items.forEach((it, i) => {
    const e = it.validate();
    if (items.some((o, j) => j !== i && o.line === it.line && it.line !== "")) e.line = `Line ${it.line} is used more than once.`;
    if (Object.keys(e).length) { errorMap[i] = e; first = first || { i, k: Object.keys(e)[0], msg: Object.values(e)[0] }; }
  });
  if (!job) { $("jobNo").classList.add("invalid"); $("jobErr").textContent = "Enter a job number."; }
  // Total line items: blank means the highest line number; otherwise it can't be lower than any line.
  const maxLine = nextLine() - 1, totalRaw = $("totalLines").value.trim(), total = totalRaw === "" ? maxLine : Number(totalRaw);
  const totalBad = !(Number.isInteger(total) && total >= maxLine);
  if (totalBad) { $("totalLines").classList.add("invalid"); $("totalErr").textContent = `Enter a whole number of at least ${maxLine} (the highest line number).`; }
  if (!items.length) { toast("Add at least one item."); return; }
  render(first && job ? first : null);
  if (first) toast(`Row ${first.i + 1}: ${first.msg}`);
  if (!job) { $("jobNo").focus(); return; }
  if (first) return;
  if (totalBad) { $("totalLines").focus(); return; }
  const boms = BOMGenerator.generate(items);
  renderResults(job, boms, BOMGenerator.tally(boms));
  renderSheets(job, boms, total);
  setStatus(true);
  location.hash = "bom-results";
};

/* ---------- views ---------- */
const VIEWS = ["job-builder", "bom-results", "product-data", "print"];
function route() {
  const v = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "job-builder";
  VIEWS.forEach(n => $("v-" + n).classList.toggle("on", n === v));
  document.querySelectorAll("nav a").forEach(a => a.dataset.view === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  scrollTo(0, 0);
  if (v === "print") fitSheets();
}
document.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) location.hash = g.dataset.go; });
addEventListener("hashchange", route);

load(); render(); route();
