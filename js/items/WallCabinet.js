// Same door subtype, swing, widths and door logic as Base; its own box parts and a custom height.
class WallCabinet extends Base {
  static type = "wall-cabinet";
  static label = "Wall Cabinet";

  fields() {
    return {
      ...super.fields(),
      drawer: NONE,
      floorBracket: NONE,
      depth: selectField(WALL_DEPTHS, { default: 13 }),
      height: numberField({ min: 1, step: 0.5, placeholder: "in" }), // custom height
    };
  }

  // SKU: [location]-304SS-W[width][height]-[1D|2D][-swing, single door only]-[depth], e.g. 1100-304SS-W1830-1D-L-24
  static fromSku(sku) {
    const m = sku.match(/^(\d+)-304SS-W(\d{2})(\d{2,}(?:\.\d+)?)-([12])D(?:-([LR]))?-(\d+)$/);
    if (!m) return null;
    const [, loc, width, height, doors, swing, depth] = m;
    return {
      location: keyOf(LOCATION_CODES, loc),
      subtype: doors === "1" ? "Single Door" : "Double Door",
      swing: { L: "Left", R: "Right" }[swing] || "",
      width: +width, height: +height, depth: +depth,
    };
  }

  defaultImage() {
    return ""; // no wall cabinet image yet (don't fall back to the Base one)
  }

  sku() {
    const single = this.subtype === "Single Door";
    return [
      LOCATION_CODES[this.location], this.steel,
      `W${String(this.width).padStart(2, "0")}${String(this.height).padStart(2, "0")}`,
      single ? "1D" : "2D", single && this.swing[0], this.depth,
    ].filter(Boolean).join("-");
  }

  parts() {
    const { depth: d, height: h } = this, w = pad2(this.width);
    return [
      ...inAssembly("Box Assembly", [
        part(`BA_${w}_${h}`, "Back"),
        part(`LHS_${d}_${h}`, "Left Side"),
        part(`RHS_${d}_${h}`, "Right Side"),
        part(`FL_${w}_${d}`, "Floor"),
        part(`HE_${w}_${d}`, "Header"),
        part(`LRCV_${w}_${d}`, "Lower Cover"),
        ...this.hingeChannelParts(h),
      ]),
      // Shelves only; wall cabinets have no pilasters or shelf brackets.
      ...(this.shelves > 0 ? inAssembly("Shelves", [part(`USH_${w}_${d}`, "Shelf", this.shelves, "505")]) : []),
      ...this.allDoorParts(),
      ...this.hardwareParts(), // no floor channels, so no legs
    ];
  }

  /** Wall cabinet doors are the full cabinet height. */
  floorChannelCount() {
    return 0;
  }

  doorHeight() {
    return this.height;
  }
}
