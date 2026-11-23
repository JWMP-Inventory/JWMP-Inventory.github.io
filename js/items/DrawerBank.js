class DrawerBank extends Item {
  static type = "drawer-bank";
  static label = "Drawer Bank";

  // Subtype -> drawers from top to bottom. This order also sets the order of codes in SKUs and pilasters.
  static LAYOUTS = {
    "2 Drawer - 2 Half Drawers": ["Half", "Half"],
    "3 Drawer - 3 Third Drawers": ["Third", "Third", "Third"],
    "3 Drawer - 1 Quarter and 2 Three Eighths Drawers": ["Quarter", "Three Eighths", "Three Eighths"],
    "3 Drawer - 2 Quarter and 1 Half Drawer": ["Quarter", "Quarter", "Half"],
    "4 Drawer - 4 Quarter Drawers": ["Quarter", "Quarter", "Quarter", "Quarter"],
  };

  // Short dropdown labels; the full subtype name is still the value used everywhere else.
  static LABELS = {
    "2 Drawer - 2 Half Drawers": "2 Half",
    "3 Drawer - 3 Third Drawers": "3 Third",
    "3 Drawer - 1 Quarter and 2 Three Eighths Drawers": "1 Quarter, 2 3/8",
    "3 Drawer - 2 Quarter and 1 Half Drawer": "2 Quarter, 1 Half",
    "4 Drawer - 4 Quarter Drawers": "4 Quarter",
  };

  fields() {
    return {
      ...super.fields(),
      // The subtype defines the drawer layout, so there is no separate drawer option.
      subtype: selectField(Object.keys(DrawerBank.LAYOUTS).map(value => ({ value, label: DrawerBank.LABELS[value] || value }))),
      floorBracket: toggleField(),
      width: selectField(range(12, 48, 3)),
    };
  }

  // SKU: [location]-304SS-[drawer count][A if ADA]DB[width]-[drawer codes, e.g. 2QDR-1HDR]-[depth]
  static fromSku(sku) {
    const m = sku.match(/^(\d+)-304SS-(\d)(A?)DB(\d+)-((?:\d[A-Z]+-)+)(\d+)$/);
    if (!m) return null;
    const [, loc, count, ada, width, codes, depth] = m;
    const sizes = codes.split("-").filter(Boolean).flatMap(c => {
      const [, n, code] = c.match(/^(\d)([A-Z]+)$/);
      return Array(Number(n)).fill(keyOf(DRAWER_CODES, code));
    });
    // No matching layout (or a drawer count that doesn't add up) leaves subtype undefined, which is reported as unsupported.
    const layouts = DrawerBank.LAYOUTS;
    const subtype = sizes.length === Number(count) ? Object.keys(layouts).find(k => layouts[k].join() === sizes.join()) : undefined;
    return {
      location: keyOf(LOCATION_CODES, loc),
      subtype,
      width: +width, depth: +depth, height: ada ? 30 : 34.5,
    };
  }

  // e.g. DEFAULT-3TDR, DEFAULT-1QDR-2TEDR, DEFAULT-4QDR. Missing files leave the image space blank.
  defaultImage() {
    // Also tries the bare code (e.g. 2HDR.png) if there's no DEFAULT- version.
    const codes = this.drawerCodes().join("-");
    return codes ? [`DEFAULT-${codes}`, codes] : "";
  }

  sku() {
    return [
      LOCATION_CODES[this.location], this.steel,
      `${this.drawers().length}${this.height === 30 ? "A" : ""}DB${String(this.width).padStart(2, "0")}`,
      ...this.drawerCodes(), this.depth,
    ].join("-");
  }

  parts() {
    return [
      ...this.boxParts(34.5), // ADA drawer banks use the same parts as full height
      ...inAssembly(HARDWARE_ASSEMBLY, [
        ...this.pilasterParts(),
        ...(this.floorBracket ? [part(`FLBRKT_${this.depth}`, "Floor Bracket")] : []),
        // Outdoor banks get a divide between each pair of drawers.
        ...(this.location === "Outdoor" ? [part(`DIV_${pad2(this.width)}_UNIVERSAL`, "Drawer Divide", this.drawers().length - 1)] : []),
      ]),
      ...this.drawerParts(),
      ...this.hardwareParts(),
    ];
  }

  drawers() {
    return DrawerBank.LAYOUTS[this.subtype] || [];
  }

  /** ["Quarter", "Quarter", "Half"] -> ["2QDR", "1HDR"] */
  drawerCodes() {
    const counts = {};
    for (const s of this.drawers()) counts[s] = (counts[s] || 0) + 1;
    return Object.entries(counts).map(([s, n]) => `${n}${DRAWER_CODES[s]}`);
  }

  /** e.g. 2QDR_1HDR */
  pilasterCode() {
    return this.drawerCodes().join("_");
  }
}
