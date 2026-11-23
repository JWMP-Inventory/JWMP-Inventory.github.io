/*
 * BOM Generator UI skeleton
 *
 * Suggested architecture:
 *   - ProductDefinition / SKU lookup data: static data, JSON, or imported file
 *   - ItemType classes: BoxItem, OfficeItem, etc. own type-specific validation/calculation
 *   - BOM service: coordinates SKU resolution and calls the selected item type
 *   - Tally service: aggregates component quantities across all generated BOMs
 *   - Export service: handles PDF/CSV/XLSX output
 *
 * Keep DOM/UI code separate from calculation classes so the BOM engine can be tested
 * independently with known inputs and expected outputs.
 */

const itemsBody = document.querySelector("#itemsBody");
const rowTemplate = document.querySelector("#itemRowTemplate");
const itemCount = document.querySelector("#itemCount");
const jobStatus = document.querySelector("#jobStatus");
let nextLineNumber = 1;
let generatedResults = null;

function addItemRow(initial = {}) {
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");
  const itemType = row.querySelector(".item-type");
  itemType.value = initial.type || "base";
  row.querySelector(".sku-input").value = initial.sku || "";
  row.querySelector(".qty-input").value = initial.quantity ?? 1;
  row.querySelector('[data-dimension="width"]').value = initial.width ?? "";
  row.querySelector(".door-style").value = initial.doorStyle || "";

  // Depth options and height control depend on item type.
  updateDimensionOptions(row, initial.depth, initial.height);
  itemType.addEventListener("change", () => updateDimensionOptions(row));

  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    renumberRows();
  });
  itemsBody.appendChild(fragment);
  renumberRows();
}


function updateDimensionOptions(row, selectedDepth = null, selectedHeight = null) {
  const type = row.querySelector(".item-type").value;
  const depthSelect = row.querySelector('[data-dimension="depth"]');
  const heightSelect = row.querySelector('[data-dimension="height"]');
  const customHeight = row.querySelector('[data-dimension="custom-height"]');
  const isWallCabinet = type === "wall_base";

  const depths = isWallCabinet ? [13, 18, 24] : [24, 28, 32];
  const previousDepth = selectedDepth ?? depthSelect.value;
  depthSelect.innerHTML = '<option value="">—</option>' + depths
    .map(value => `<option value="${value}">${value}</option>`).join("");
  if (depths.map(String).includes(String(previousDepth))) depthSelect.value = String(previousDepth);

  if (isWallCabinet) {
    heightSelect.hidden = true;
    heightSelect.value = "";
    customHeight.hidden = false;
    if (selectedHeight !== null && selectedHeight !== "") customHeight.value = selectedHeight;
  } else {
    customHeight.hidden = true;
    customHeight.value = "";
    heightSelect.hidden = false;
    if (selectedHeight !== null && ["30", "34.5"].includes(String(selectedHeight))) {
      heightSelect.value = String(selectedHeight);
    }
  }
}

function renumberRows() {
  [...itemsBody.querySelectorAll("tr")].forEach((row, index) => {
    row.querySelector(".line-number").textContent = index + 1;
  });
  const count = itemsBody.querySelectorAll("tr").length;
  itemCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
  nextLineNumber = count + 1;
}

function readJobInput() {
  const rows = [...itemsBody.querySelectorAll("tr")];
  return {
    jobNumber: document.querySelector("#jobNumber").value.trim(),
    jobDescription: document.querySelector("#jobDescription").value.trim(),
    items: rows.map((row, index) => ({
      lineNumber: index + 1,
      type: row.querySelector(".item-type").value,
      sku: row.querySelector(".sku-input").value.trim(),
      quantity: Number(row.querySelector(".qty-input").value || 0),
      dimensions: {
        width: optionalNumber(row.querySelector('[data-dimension="width"]').value),
        depth: optionalNumber(row.querySelector('[data-dimension="depth"]').value),
        height: optionalNumber(
          row.querySelector('[data-dimension="custom-height"]').hidden
            ? row.querySelector('[data-dimension="height"]').value
            : row.querySelector('[data-dimension="custom-height"]').value
        ),
      },
      doorStyle: row.querySelector(".door-style").value,
    })),
  };
}

function optionalNumber(value) {
  return value === "" ? null : Number(value);
}

function validateJob(job) {
  const errors = [];
  if (!job.items.length) errors.push("Add at least one item.");
  job.items.forEach(item => {
    if (!item.sku) errors.push(`Line ${item.lineNumber}: enter a SKU.`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      errors.push(`Line ${item.lineNumber}: quantity must be a whole number greater than zero.`);
    }
    if (item.dimensions.width === null) errors.push(`Line ${item.lineNumber}: select a width.`);
    if (item.dimensions.depth === null) errors.push(`Line ${item.lineNumber}: select a depth.`);
    if (item.dimensions.height === null || item.dimensions.height <= 0) {
      errors.push(`Line ${item.lineNumber}: select or enter a valid height.`);
    }
  });
  return errors;
}

/*
 * TODO: Implement this function using your own item classes.
 *
 * A useful contract is for each item class to return a normalized BOM:
 * {
 *   lineNumber: 1,
 *   sku: "SKU-123",
 *   itemType: "box",
 *   quantityOfItems: 2,
 *   components: [
 *     { partNumber: "PART-001", description: "Example component", quantityPerItem: 4, totalQuantity: 8 }
 *   ],
 *   warnings: []
 * }
 *
 * Prefer having item classes return data rather than HTML. That makes results
 * easier to test, tally, export, and render in different layouts.
 */
function generateBOMs(job) {
  // Placeholder only — no real SKU lookup or BOM calculations yet.
  return {
    job,
    boms: [],
    tally: [],
    warnings: ["BOM calculation engine is not connected yet."],
  };
}

function renderGeneratedResults(results) {
  // TODO: Render results.boms into #result-individual and results.tally into #result-tally.
  // TODO: Enable export buttons after successful generation.
  const individualPanel = document.querySelector("#result-individual .card");
  individualPanel.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚙</div>
      <h3>Calculation engine not connected</h3>
      <p>The job input has been collected and validated. Implement <code>generateBOMs(job)</code> to calculate and render actual BOM data.</p>
      <button class="button button-secondary" data-go-view="job">Back to Job Builder</button>
    </div>`;
  individualPanel.querySelector("[data-go-view='job']").addEventListener("click", () => showView("job"));
  generatedResults = results;
  jobStatus.textContent = "Input captured";
  showView("results");
}

function showView(viewName) {
  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `view-${viewName}`);
  });
}

document.querySelector("#addRowButton").addEventListener("click", () => addItemRow());

document.querySelector("#generateButton").addEventListener("click", () => {
  const job = readJobInput();
  const errors = validateJob(job);
  if (errors.length) {
    alert(errors.join("\n"));
    return;
  }
  const results = generateBOMs(job);
  renderGeneratedResults(results);
});

document.querySelector("#clearJobButton").addEventListener("click", () => {
  if (!confirm("Clear the job number, description, and all item rows?")) return;
  document.querySelector("#jobNumber").value = "";
  document.querySelector("#jobDescription").value = "";
  itemsBody.innerHTML = "";
  addItemRow();
  jobStatus.textContent = "Not generated";
  generatedResults = null;
});

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

document.querySelectorAll("[data-go-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.goView));
});

document.querySelectorAll(".result-tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".result-tab").forEach(tab => tab.classList.toggle("active", tab === button));
    document.querySelectorAll(".result-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === `result-${button.dataset.result}`);
    });
  });
});

document.querySelector("#importDataButton").addEventListener("click", () => {
  document.querySelector("#dataFileInput").click();
});

document.querySelector("#dataFileInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  alert(`Selected "${file.name}". Import handling will be implemented with the product-data format.`);
  event.target.value = "";
});

document.querySelector("#exportTallyButton").addEventListener("click", () => {
  alert("Tally export will be implemented after the BOM data structure is finalized.");
});

// Start with one blank input row.
addItemRow();
