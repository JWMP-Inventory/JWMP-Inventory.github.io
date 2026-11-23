class GrillCabinet extends Item {
  static type = "grill-cabinet";
  static label = "Grill Cabinet";

  // Width ranges per door count: 1 door 9-24, 2 doors 24-48, 3 doors 48-72 (3" steps).
  // At 48" both 2 and 3 doors are allowed; above 48" it must be 3 doors.
  static WIDTHS = {
    "Single Door": range(9, 24, 3),
    "Double Door": range(24, 48, 3),
    "Triple Door": range(48, 72, 3),
  };

  fields() {
    return {
      ...super.fields(),
      subtype: selectField(Object.keys(GrillCabinet.WIDTHS), { default: "Single Door" }),
      // Each door swings its own way, written left to right: e.g. LLR = left, left, right.
      swing: selectField(GrillCabinet.swings(this.doorCount())),
      width: selectField(GrillCabinet.WIDTHS[this.subtype] || []),
      // Grill on top: typed to the 1/16".
      grillWidth: numberField({ min: 0.0625, step: 0.0625, placeholder: "in" }),
      grillDepth: numberField({ min: 0.0625, step: 0.0625, placeholder: "in" }),
      grillHeight: numberField({ min: 0.0625, step: 0.0625, placeholder: "in" }),
      trimHeight: numberField({ min: 0.0625, step: 0.0625, placeholder: "in" }),
      gf5Width: numberField({ min: 0.0625, step: 0.0625, placeholder: "in" }),
    };
  }

  validate() {
    const errors = super.validate();
    for (const k of ["grillWidth", "grillDepth", "grillHeight", "trimHeight", "gf5Width"]) {
      if (!errors[k] && !Number.isInteger(this[k] * 16)) errors[k] = `Enter the ${FIELD_LABELS[k]} in 1/16" steps.`;
    }
    if (!errors.grillWidth && this.width !== "" && this.grillWidth > this.width) errors.grillWidth = `Trim width can't be more than the cabinet width (${this.width}").`;
    if (!errors.gf5Width && this.width !== "" && this.gf5Width >= this.width) errors.gf5Width = `GF5 width must be less than the cabinet width (${this.width}").`;
    return errors;
  }

  describe() {
    const g = [this.grillWidth, this.grillDepth, this.grillHeight];
    return super.describe() + (g.every(v => v !== "") ? ` · Trim ${g.join(" × ")}` : "");
  }

  /** Every L/R combination for n doors: 1 -> L, R; 2 -> LL, LR, RL, RR; 3 -> LLL ... RRR. */
  static swings(n) {
    let out = [""];
    for (let i = 0; i < n; i++) out = out.flatMap(s => [s + "L", s + "R"]);
    return n ? out : [];
  }

  doorCount() {
    return { "Single Door": 1, "Double Door": 2, "Triple Door": 3 }[this.subtype] || 0;
  }

  // Trim kit sizes. TODO: real formulas pending; using the typed grill dimensions for now.
  calcWidth() { return this.grillWidth; }
  calcHeight() { return this.grillHeight; } // entered Trim H, used by GF1, GF3, GF5
  calcHeightGF4() { return this.trimHeight; } // entered GF4 H, GF4 only
  calcDepth() { return this.grillDepth; }

  trimKitParts() {
    const [cw, ch, cd, ch4] = [this.calcWidth(), this.calcHeight(), this.calcDepth(), this.calcHeightGF4()];
    // GF5 + GF3 + GF3 = cabinet width; GF5 width is entered, the two GF3s split the rest.
    const w5 = this.gf5Width, w3 = (this.width - w5) / 2;
    return inAssembly("Trim Kit Assembly", [
      part(`GF1_${cw}x${ch}x${cd}`, "Grill Frame", 2),
      part(`GF3_${w3}x${ch}xL`, "Grill Frame Left"),
      part(`GF3_${w3}x${ch}xR`, "Grill Frame Right"),
      part(`GF4_${cw}x${ch4}`, "Grill Frame"),
      part(`GF5_${w5}x${ch}`, "Grill Frame"),
    ]);
  }

  parts() {
    return [...this.boxParts(), ...this.trimKitParts()];
  }

  boxParts() {
    const { depth: d, height: h } = this, w = pad2(this.width);
    // Same box as a base, but the grill (GB) versions of each part.
    return inAssembly("Box Assembly", [
      part(`GBBA_${w}_${h}`, "Back"),
      part(`GBLHS_${d}_${h}`, "Left Side"),
      part(`GBRHS_${d}_${h}`, "Right Side"),
      part(`GBFL_${w}_${d}`, "Floor"),
      part(`GBHE_${w}_${d}`, "Header"),
      part(`GBHECH_${d}`, "Header Channel", this.width > 48 ? 2 : 1),
      part(`GB${d}_3.5FLCH_LEFT`, "Left Floor Channel"),
      part(`GB${d}_3.5FLCH_RIGHT`, "Right Floor Channel"),
      ...(this.width >= 39 ? [part(`GB${d}_3.5FLCH_MIDDLE`, "Middle Floor Channel", this.floorChannelCount() - 2)] : []),
    ]);
  }

  /** Left + right, plus 1 middle at 39" and up, or 2 middles wider than 57". */
  floorChannelCount() {
    return this.width > 57 ? 4 : this.width >= 39 ? 3 : 2;
  }
}
