/* Shared constants and helpers for describing item fields. */

const DOOR_STYLES = ["Slab", "Integrated", "Shaker", "Beveled Shaker", "Thin Rail Shaker", "No Doors"];
// Door style -> code in finished door/drawer front part numbers.
// TODO: add the other styles' codes; anything not listed uses SLAB for now.
const STYLE_CODES = { "Thin Rail Shaker": "TRS", "Integrated": "INT", "Beveled Shaker": "AP" };
// Handle style code in handle part numbers (only 6IC for now), and door styles that get no handles.
const HANDLE_STYLE = "6IC";
const NO_HANDLE_STYLES = ["Integrated", "No Doors"];
// Finish: value is the finish part number (stainless has none), label is what the dropdown shows.
const STAINLESS = "#4 Stainless Steel";
const POWDER_COATS = [
  ["FN-PC-3810007", "Bianco 302"], ["FN-PC-3810090", "Extrusion White"], ["FN-PC-3810130", "Seashell White"],
  ["FN-PC-3814401", "Pompano White"], ["FN-PC-3810070", "Bone White"], ["FN-PC-3870048", "Sky Grey"],
  ["FN-PC-3815003", "Almond"], ["FN-PC-3815012", "Sandstone"], ["FN-PC-3870070", "Taupe"],
  ["FN-PC-3870025", "Ash Grey"], ["FN-PC-3815002", "Sierra Tan"], ["FN-PC-3816500", "Carlsbad Canyon Brown"],
  ["FN-PC-3870019", "Slate Grey"], ["FN-PC-3870049", "Grey"], ["FN-PC-3870780", "Charcoal"],
  ["FN-PC-3870061", "Grey Classic 314"], ["FN-PC-3880020", "Jet Black"], ["FN-PC-3880002", "Carbon 301"],
  ["FN-PC-3860018", "Koko Brown"], ["FN-PC-3860026", "Marrone"], ["FN-PC-3830028", "Brick Red"],
  ["FN-PC-3830041", "Redwood"], ["FN-PC-3860080", "Statuary Bronze"], ["FN-PC-3860090", "Dark Anodized Bronze"],
  ["FN-PC-3890009", "Argento 307"], ["FN-PC-3815018", "Champagne 302"], ["FN-PC-3815021", "Champagne 304"],
  ["FN-PC-14999999", "Bengal Silver"], ["FN-PC-3850043", "Highland 301"], ["FN-PC-3860060", "Medium Bronze"],
  ["FN-PC-3868008", "Spartacus Bronze"], ["FN-PC-3896021", "Neptune Bronze"], ["FN-PC-3890018", "Argento 314"],
  ["FN-PC-3890015", "Pearl Dark Grey"], ["FN-PC-3860064", "Pearl Copper"], ["FN-PC-3840127", "Pearl Night Blue"],
  ["FN-PC-3850500", "Covert Green"], ["FN-PC-3860006", "Aged Copper"], ["FN-PC-3850080", "Ivy Green"],
  ["FN-PC-3850037", "Classic Green"], ["FN-PC-3850110", "Hartford Green"], ["FN-PC-3840051", "Military Blue"],
  ["FN-PC-3840025", "Interstate Blue"], ["FN-PC-3840033", "Azzurro 307"], ["FN-PC-3890080", "Brilliant Sparkle Silver"],
  ["FN-PC-3890011", "Argento 308"], ["FN-PC-3868192", "Gold Brown"], ["FN-PC-3868130", "Greco"],
  ["FN-PC-3860499", "Ambra"], ["FN-PC-3834005", "Steel Viola"],
];
// Dropdown shows just the color name to keep the column narrow; finishLabel() gives the full name.
const FINISHES = [{ value: STAINLESS, label: STAINLESS }, ...POWDER_COATS.map(([value, name]) => ({ value, label: name }))];
function finishLabel(v) {
  if (v === STAINLESS) return STAINLESS;
  const pc = POWDER_COATS.find(([code]) => code === v);
  return pc ? `Powder Coat - ${pc[1]}` : "";
}

const LOCATIONS = ["Indoor", "Outdoor"];
const LOCATION_CODES = { Indoor: "1100", Outdoor: "1200" }; // SKU prefix
const DRAWER_HEIGHTS = { "Quarter": 7.5, "Third": 10, "Three Eighths": 11.25, "Half": 15 };
const DRAWER_CODES = { "Quarter": "QDR", "Third": "TDR", "Three Eighths": "TEDR", "Half": "HDR" }; // SKU abbreviations
const DRAWER_DEPTHS = { 24: 21, 28: 24, 32: 27 }; // item depth -> drawer part depth
// Estimated weight (lbs) of a drawer box: no finished front/rear, slides or brackets.
// Fitted to 4 weighed drawers (W x H x D, lbs): 12x11.25x21 18, 24x14x24 34.25, 36x11.25x21 33, 21x7.5x21 17.15 (all within 2%).
const drawerWeight = (w, h, d) => 0.044 * h * (w + d) + 0.0071 * w * d;
// Estimated weight of one Slab finished drawer front or rear, for sizes with no inventory weight (fitted to the ones that have one).
const drawerFrontWeight = (w, h) => 0.016 * w * h;
const SHELF_COUNTS =[0, 1, 2, 3, 4];
const STANDARD_DEPTHS = [24, 28, 32];
const WALL_DEPTHS = [13, 24];
const STANDARD_HEIGHTS = [{ value: 30, label: "30 (ADA)" }, { value: 34.5, label: "34.5" }];

// Every configurable property an item can have (qty is handled separately).
const FIELD_KEYS = ["location", "subtype", "swing", "drawer", "shelves", "floorBracket", "width", "depth", "height", "grillWidth", "grillDepth", "grillHeight", "trimHeight", "gf5Width", "door", "finish"];
const FIELD_LABELS = { qty: "quantity", location: "location (indoor/outdoor)", subtype: "subtype", swing: "swing", drawer: "drawer option", shelves: "number of shelves", floorBracket: "floor bracket", width: "width", depth: "depth", height: "height", grillWidth: "trim width", grillDepth: "trim depth", grillHeight: "trim height", trimHeight: "GF4 height", gf5Width: "GF5 width", door: "door style", finish: "finish" };
const NUMERIC_KEYS = ["qty", "shelves", "width", "depth", "height", "grillWidth", "grillDepth", "grillHeight", "trimHeight", "gf5Width"];

// Steel types accepted in SKUs (e.g. 1200-316SS-...). Items default to 304SS.
const STEEL_TYPES = ["304SS", "316SS"];

// Widths in part numbers get a leading zero below 10: 9 -> "09" (13.5 and "09" are unchanged).
const pad2 = v => (/^\d$/.test(String(v)) ? "0" + v : String(v));

// Reverse lookup: the key in obj whose value is value (undefined if none).
const keyOf = (obj, value) => Object.keys(obj).find(k => obj[k] === value);

function range(min, max, step) {
  const out = [];
  for (let v = min; v <= max; v += step) out.push(v);
  return out;
}
const ALL_WIDTHS = range(9, 48, 3);

// Field descriptors returned by Item.fields(). The UI renders from these.
const NONE = { kind: "none" }; // not applicable to this item
function selectField(options, { default: def = "" } = {}) {
  return {
    kind: "select",
    options: options.map(o => (typeof o === "object" ? o : { value: o, label: String(o) })),
    default: def,
  };
}
// Drawer options shown without the word "Drawer" (the column is already labelled Drawer).
function drawerField(values) {
  return selectField(values.map(value => ({ value, label: value.replace(/ Drawers?$/, "") })), { default: "None" });
}
function numberField({ min = 1, step = 1, placeholder = "" } = {}) {
  return { kind: "number", min, step, placeholder };
}
function toggleField({ default: def = false } = {}) {
  return { kind: "toggle", default: def };
}

// Tags parts so item BOMs list them under an assembly header ("qty · name").
// qty is left blank for plain groupings (box, pilasters, shelves); pass it for real assemblies.
// Part qtys are not multiplied by qty; pass them already totalled.
function inAssembly(name, parts, qty = "") {
  const assembly = { name, qty };
  return parts.map(p => ({ ...p, assembly }));
}
const HARDWARE_ASSEMBLY = "Pilasters, Shelves & Brackets";

// Builds one BOM line for Item.parts(). bldg is the building the part comes from.
function part(partNo, description, qty = 1, bldg = "307") {
  return { partNo, description, qty, bldg };
}