/**
 * Base class for every item type. Each subclass declares:
 *   - which options it offers (fields())
 *   - how it calculates its parts (parts())
 * Everything else (validation, defaults, description) is shared.
 */
class Item {
  static type = "";   // stable id, e.g. "base"
  static label = "";  // shown in the UI

  constructor(data = {}) {
    this.qty = 1;
    this.line = "";     // job line item number, set by the user (cabinets aren't always every line)
    this.location = "";
    this.subtype = "";
    this.swing = "";
    this.drawer = "";
    this.shelves = "";
    this.floorBracket = "";
    this.width = "";
    this.depth = "";
    this.height = "";
    this.grillWidth = "";   // grill cabinets only
    this.grillDepth = "";
    this.grillHeight = "";
    this.trimHeight = "";
    this.gf5Width = "";
    this.door = "";
    this.finish = "";
    this.notes = "";    // free text, printed as Special Instructions on the BOM sheet
    this.steel = "304SS"; // set from the SKU (304SS or 316SS); no field for it
    Object.assign(this, data);
    this.type = this.constructor.type;
    this.normalize();
  }

  /** Default options shared by most cabinets. Override per type. */
  fields() {
    return {
      location: selectField(LOCATIONS),
      subtype: NONE,
      swing: NONE,
      drawer: NONE,
      shelves: NONE,
      floorBracket: NONE,
      width: selectField(ALL_WIDTHS),
      depth: selectField(STANDARD_DEPTHS, { default: 24 }),
      height: selectField(STANDARD_HEIGHTS, { default: 34.5 }),
      grillWidth: NONE,
      grillDepth: NONE,
      grillHeight: NONE,
      trimHeight: NONE,
      gf5Width: NONE,
      door: selectField(DOOR_STYLES, { default: "Slab" }),
      finish: selectField(FINISHES, { default: STAINLESS }),
    };
  }

  /** Clears or resets any value that is not allowed by the current options. */
  normalize() {
    for (let pass = 0; pass < 3; pass++) { // options can depend on each other
      let changed = false;
      const fields = this.fields();
      for (const key of FIELD_KEYS) {
        const f = fields[key];
        let next = this[key];
        if (f.kind === "none") next = "";
        else if (f.kind === "select" && !f.options.some(o => o.value === next)) next = f.default;
        else if (f.kind === "toggle" && typeof next !== "boolean") next = f.default;
        if (next !== this[key]) { this[key] = next; changed = true; }
      }
      if (!changed) break;
    }
  }

  /** Returns { fieldKey: message } for anything missing or invalid. */
  validate() {
    const errors = {};
    if (!(Number.isInteger(this.line) && this.line >= 1)) errors.line = "Enter a whole line number of 1 or more.";
    if (!(Number.isInteger(this.qty) && this.qty >= 1)) errors.qty = "Enter a whole quantity of 1 or more.";
    const fields = this.fields();
    for (const key of FIELD_KEYS) {
      const f = fields[key], v = this[key];
      if (f.kind === "select" && v === "") errors[key] = `Choose a ${FIELD_LABELS[key]}.`;
      if (f.kind === "number" && !(Number(v) >= f.min)) errors[key] = `Enter a ${FIELD_LABELS[key]} of ${f.min} or more.`;
    }
    return errors;
  }

  /** One-line summary for the results page. */
  describe() {
    const dims = [this.width && `${this.width}W`, this.depth && `${this.depth}D`, this.height && `${this.height}H`].filter(Boolean).join(" × ");
    return [
      this.location, this.constructor.label, this.subtype, this.swing && `${this.swing} swing`, dims, this.door,
      this.drawer && this.drawer !== "None" ? this.drawer : "",
      this.shelves !== "" && `${this.shelves} ${this.shelves === 1 ? "shelf" : "shelves"}`,
      this.floorBracket === true && "Floor bracket",
      finishLabel(this.finish),
    ].filter(Boolean).join(" · ");
  }

  /** Reads one of this type's SKUs into item data, or returns null if it isn't one. Override per type. */
  static fromSku(sku) {
    return null;
  }

  /**
   * Fallback image name(s) in images/ (without .png) for the print sheet. "" means none.
   * May return a list, tried in order. Override per type.
   */
  defaultImage() {
    return "";
  }

  /** Item-level SKU, e.g. "1100-304SS-FHB09-1D-32-R". Override per type; "" means not defined yet. */
  sku() {
    return "";
  }

  /**
   * Parts for ONE unit of this item. Return [{ partNo, description, qty }].
   * Quantity multiplication happens in BOMGenerator, not here.
   * Override in each subclass.
   */
  parts() {
    return [];
  }

  /** Door style code used in finished door/drawer front part numbers. */
  styleCode() {
    return STYLE_CODES[this.door] || "SLAB";
  }

  /** Real drawers in one unit, as DRAWER_HEIGHTS keys, e.g. ["Quarter", "Half"]. Override per type. */
  drawers() {
    return [];
  }

  /** Box Assembly shared by base-style cabinets. h is the height used in the part numbers. */
  boxParts(h = this.height) {
    const w = pad2(this.width), d = this.depth;
    return inAssembly("Box Assembly", [
      part(`BA_${w}_${h}`, "Back"),
      part(`LHS_${d}_${h}`, "Left Side"),
      part(`RHS_${d}_${h}`, "Right Side"),
      part(`FL_${w}_${d}`, "Floor"),
      part(`HE_${w}_${d}`, "Header"),
      part(`HECH_${d}`, "Header Channel"),
      part(`${d}_3.5FLCH_LEFT`, "Left Floor Channel"),
      part(`${d}_3.5FLCH_RIGHT`, "Right Floor Channel"),
      ...(this.width >= 39 ? [part(`${d}_3.5FLCH_MIDDLE`, "Middle Floor Channel")] : []),
      ...this.hingeChannelParts(h),
    ]);
  }

  /** Hinge channel style code: DR for full height doors. Override per type. */
  hingeStyle() {
    return "DR";
  }

  hingeChannelParts(h = this.height) {
    const style = this.hingeStyle();
    return [part(`HC_${h}L_FTR_${style}`, "Left Hinge Channel"), part(`HC_${h}R_FTR_${style}`, "Right Hinge Channel")];
  }

  /** Pilaster code in pilaster part numbers. Override per type. */
  pilasterCode() {
    return "ADJSH";
  }

  /** The four pilasters (no assembly; callers group them). */
  pilasterParts() {
    const pc = this.pilasterCode(), loc = this.location.toUpperCase();
    // Adjustable shelf pilasters have no location or _UNIVERSAL: RPP_30_ADJSH, RPP_30_ADJSH_REAR.
    const adj = pc === "ADJSH";
    const front = adj ? "" : `_${loc}`, rear = adj ? "REAR" : "REAR_UNIVERSAL";
    return [
      part(`RPP_30_${pc}${front}`, "Front Left Pilaster"),
      part(`RPP_30_R_${pc}${front}`, "Front Right Pilaster"),
      part(`RPP_30_${pc}_${rear}`, "Rear Left Pilaster"),
      part(`RPP_30_R_${pc}_${rear}`, "Rear Right Pilaster"),
    ];
  }

  /**
   * Finished front/back part number, before _DF/_DB. prefix is ULBDRW, ULBLD or ULBRD.
   * Integrated puts its code after the size: ULBLD_12_30_INT; others before it: ULBLD_SLAB_12_30.
   */
  frontCode(prefix, w, h) {
    const style = this.styleCode();
    w = pad2(w);
    return style === "INT" ? `${prefix}_${w}_${h}_INT` : `${prefix}_${style}_${w}_${h}`;
  }

  /** Beveled Shaker front: 7 panels, e.g. ULBRD18_30_APIP (no underscore after the prefix). */
  beveledParts(prefix, w, h) {
    w = pad2(w);
    return [
      part(`${prefix}${w}_${h}_APIP`, "Inner Panel", 1, "505"),
      part(`${prefix}${w}_${h}_APF`, "Perimeter Panel", 1, "505"),
      part(`${prefix}${w}_${h}_APB`, "Rear Panel", 1, "505"),
      part(`${prefix}${h}_AP_INSERT_LEFT`, "Left Filler Panel", 1, "505"),
      part(`${prefix}${h}_AP_INSERT_RIGHT`, "Right Filler Panel", 1, "505"),
      part(`${prefix}${w}_AP_INSERT_TOP`, "Top Filler Panel", 1, "505"),
      part(`${prefix}${w}_AP_INSERT_BOTTOM`, "Bottom Filler Panel", 1, "505"),
    ];
  }

  /** Finished drawer front and rear (plus inner panel for TRS) for one drawer or false drawer. None with No Doors. */
  drawerFrontParts(w, h) {
    if (this.door === "No Doors") return [];
    const style = this.styleCode(), code = this.frontCode("ULBDRW", w, h);
    if (style === "AP") return this.beveledParts("ULBDRW", w, h);
    return [
      part(`${code}_DF`, "Finished Drawer Front", 1, "505"),
      part(`${code}_DB`, "Finished Drawer Rear", 1, "505"),
      ...(style === "TRS" ? [part(`ULBDRW_TRS_${pad2(w)}_${h}_TRSIP`, "TRS Inner Panel for Drawers")] : []),
    ];
  }

  /** Floor channels in boxParts(): left and right, plus middle at 39" wide and up. Override for types without them. */
  floorChannelCount() {
    return this.width >= 39 ? 3 : 2;
  }

  /** Whether the doors are hinged. Override per type. */
  hasHinges() {
    return true;
  }

  /** Doors on one unit. Override per type. */
  doorCount() {
    return 0;
  }

  /**
   * Hardware for one unit: 2 soft close hinges per door, plus a handle (2 stems, 1 tube)
   * per door and per real drawer (false drawers get none) unless the style has no handles,
   * plus indoor bumpers per door and real drawer.
   */
  hardwareParts() {
    const doors = this.doorCount();
    const fronts = doors + this.drawers().length;
    const legs = this.floorChannelCount() * 2;
    const handles = NO_HANDLE_STYLES.includes(this.door) ? 0 : fronts;
    return inAssembly("Hardware", [
      ...(doors && this.hasHinges() ? [part("HD_HINGE", "Soft Close Hinge", doors * 2)] : []),
      ...this.sealParts(fronts),
      // Fasteners: 4 1/4-20 rivnuts and screws per leg; the #10 and #8 sizes are filled in by bomParts().
      part("RIVNUT_10", "#10 Rivnut", 0),
      part("RIVNUT_8", "#8 Rivnut", 0),
      part("RIVNUT_.25_20", "1/4-20 Rivnut", legs * 4),
      part("RIVET_10", "#10 Rivet", 0),
      part("RIVET_8", "#8 Rivet", 0),
      part("SCREW_10", "#10 Screw", 0),
      part("SCREW_8", "#8 Screw", 0),
      part("SCREW_.25_20", "1/4-20 Screw", legs * 4),
      // Outdoor hinged doors: 2 mag plates per cabinet, single or double door style.
      ...(doors && this.hasHinges() && this.location === "Outdoor"
        ? [part(`MAG_PLATE_${doors === 1 ? "SINGLE" : "DOUBLE"}`, "Mag Plate", 2)] : []),
      // 2 legs per floor channel: 4.5" for full height, 2.5" for ADA.
      ...(legs ? [part(`CAB_LEG_${this.height === 30 ? "2.5" : "4.5"}`, "Cabinet Leg", legs)] : []),
      ...(handles ? [
        part("CAP_STEM", "Handle Stem", handles * 2, "505"),
        part("CAP_6IN_TUBE", "Handle Tube", handles, "505"),
      ] : []),
    ]);
  }

  /** Drawers each pilaster is set up for. Override when that differs from the drawer count. */
  pilasterDrawerRows() {
    return this.drawers().length;
  }

  /** parts() with the #10 and #8 fasteners counted from the parts actually on this cabinet. */
  bomParts() {
    const parts = this.parts();
    const count = re => parts.filter(p => re.test(p.description)).reduce((n, p) => n + p.qty, 0);
    const hinges = count(/Hinge Channel$/);
    const slides = count(/^(Left|Right) Drawer Bracket$/); // one bracket per drawer slide
    const headers = count(/^Header$/), floors = count(/^Floor$/), sides = count(/^(Left|Right) Side$/);
    const backNuts = this.width > 30 ? 6 : this.width > 18 ? 4 : 0; // per back, by width
    const qty = {
      RIVNUT_10: headers * 2 + hinges * 2 + floors * (this.width >= 27 ? 12 : 10) + sides * 3
        + count(/Pilaster$/) * this.pilasterDrawerRows() + count(/^Back$/) * backNuts,
      RIVNUT_8: hinges * 4 + slides * 3,
      RIVET_10: headers * 13 + sides * 9 + floors * 11,
      RIVET_8: parts.some(p => p.partNo.startsWith("ILBPOBOX_")) ? 20 : 0, // per pullout box assembly
    };
    // One screw per rivnut of the same size.
    qty.SCREW_10 = qty.RIVNUT_10;
    qty.SCREW_8 = qty.RIVNUT_8;
    return parts.map(p => (p.partNo in qty ? { ...p, qty: qty[p.partNo] } : p));
  }

  /**
   * Indoor: 2 rubber bumpers per door and real drawer (fronts).
   * Outdoor: gasket strip, in inches, equal to the door and drawer perimeters added together.
   */
  sealParts(fronts) {
    if (!fronts) return [];
    if (this.location === "Indoor") return [part("RB_BUMPER", "Rubber Bumper", fronts * 2)];
    if (this.location === "Outdoor") return [part("RB_GASKET", "Rubber Gasket (inches)", this.gasketLength())];
    return [];
  }

  /** Sum of the door, drawer and false drawer perimeters, in inches. Doors split the cabinet width evenly. */
  gasketLength() {
    const doors = this.doorCount(), drawerW = this.drawerWidth();
    const doorTotal = doors ? doors * 2 * (this.width / doors + this.doorHeight()) : 0;
    const drawerTotal = this.drawers().reduce((sum, s) => sum + 2 * (drawerW + DRAWER_HEIGHTS[s]), doorTotal);
    // False drawer fronts span the full cabinet width.
    return this.falseDrawers().reduce((sum, s) => sum + 2 * (this.width + DRAWER_HEIGHTS[s]), drawerTotal);
  }

  /** False drawer fronts on one unit, as DRAWER_HEIGHTS keys. Override per type. */
  falseDrawers() {
    return [];
  }

  /** Width used in drawer part numbers. Override when drawers sit side by side. */
  drawerWidth() {
    return this.width;
  }

  /**
   * Drawer brackets plus the box parts for every drawer from drawers().
   * Box parts carry an `assembly` ({ name, qty }) so item BOMs can group them;
   * their qty is already multiplied by the number of drawers of that size.
   */
  drawerParts() {
    const sizes = this.drawers();
    if (!sizes.length) return [];
    const w = pad2(this.drawerWidth()), d = this.depth, dd = DRAWER_DEPTHS[d];
    const parts = inAssembly(HARDWARE_ASSEMBLY, [
      part(`UDRW_BRKT_${dd}L_${d}BOX`, "Left Drawer Bracket", sizes.length),
      part(`UDRW_BRKT_${dd}R_${d}BOX`, "Right Drawer Bracket", sizes.length),
    ]);
    const counts = {};
    for (const s of sizes) counts[s] = (counts[s] || 0) + 1;
    for (const [size, n] of Object.entries(counts)) {
      const h = DRAWER_HEIGHTS[size];
      parts.push(...inAssembly(`${size} Drawer Assembly`, [
        part(`ULDRW_${w}_${h}_FRONT`, "Drawer Front"),
        part(`ULDRW_${w}_${h}_REAR`, "Drawer Rear"),
        part(`ULDRW_${w}_${dd}_BOTTOM`, "Drawer Bottom"),
        part(`ULDRW${h}_${dd}_SIDE`, "Drawer Outer Side", 2), // no _ after ULDRW, e.g. ULDRW7.5_21_SIDE
        part(`ULDRW${h}_${dd}_BODY`, "Drawer Inner Side", 2),
        ...this.drawerFrontParts(w, h),
      ].map(p => ({ ...p, qty: p.qty * n })), n));
    }
    return parts;
  }
}
