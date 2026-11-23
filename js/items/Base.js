class Base extends Item {
  static type = "base";
  static label = "Base";

  fields() {
    const single = this.subtype === "Single Door";
    return {
      ...super.fields(),
      subtype: selectField(["Single Door", "Double Door"], { default: "Single Door" }),
      swing: single ? selectField(["Left", "Right"]) : NONE,
      // Double doors can have 2 drawers side by side.
      drawer: drawerField(["None", "Quarter Drawer", "Third Drawer", ...(single ? [] : ["2 Quarter Drawers", "2 Third Drawers"])]),
      shelves: selectField(SHELF_COUNTS, { default: 2 }),
      floorBracket: toggleField(),
      width: selectField(single ? range(9, 24, 3) : range(24, 48, 3)),
    };
  }

  // SKU: [location]-304SS-[F|A]H[skuKind][width]-[1D|2D][-drawer]-[depth][-swing, single door only]
  // F = full height (34.5), A = ADA (30). Drawer is e.g. 1QDR, 2QDR, or 1FQDR for a false quarter drawer.
  static skuKind = "B";

  static fromSku(sku) {
    const re = new RegExp(`^(\\d+)-304SS-([FA])H${this.skuKind}(\\d+)-([12])D(?:-([12])(F?)([A-Z]+))?-(\\d+)(?:-([LR]))?$`);
    const m = sku.match(re);
    if (!m) return null;
    const [, loc, ht, width, doors, drawerCount, fake, drawerCode, depth, swing] = m;
    const size = keyOf(DRAWER_CODES, drawerCode);
    return {
      location: keyOf(LOCATION_CODES, loc),
      subtype: doors === "1" ? "Single Door" : "Double Door",
      swing: { L: "Left", R: "Right" }[swing] || "",
      drawer: !drawerCode ? "None" : fake ? `False ${size} Drawer` : drawerCount === "2" ? `2 ${size} Drawers` : `${size} Drawer`,
      width: +width, depth: +depth, height: ht === "A" ? 30 : 34.5,
    };
  }

  // Most specific first: DEFAULT-BASE-1D-1QDR-R, then DEFAULT-BASE-1D-R (or DEFAULT-BASE-2D-2QDR, then DEFAULT-BASE-2D).
  defaultImage() {
    const d = this.drawers(), drawer = d.length ? `-${d.length}${DRAWER_CODES[d[0]]}` : "";
    const base = this.subtype === "Single Door" ? "DEFAULT-BASE-1D" : "DEFAULT-BASE-2D";
    const swing = this.subtype === "Single Door" ? `-${this.swing[0] || ""}` : "";
    // One image covers 2 door cabinets with either false drawer.
    if (this.subtype === "Double Door" && this.falseDrawers().length) return ["DEFAULT-BASE-2D-1FQDR", base];
    // 2 door cabinets with 2 drawers (quarter or third) share one image.
    const twoDrawer = this.subtype === "Double Door" && d.length === 2
      ? [this.door === "Integrated" ? "FHB-2D-2QDR-INT" : "FHB36-2D-2QDR-HECH"] : [];
    // 2 door, no drawer: images come in 6" steps (FHB30-2D-HECH), each also used for the width 3" below it.
    const sized = this.subtype === "Double Door" && !d.length
      ? [`${this.height === 30 ? "A" : "F"}HB${this.width % 6 ? this.width + 3 : this.width}-2D-HECH`] : [];
    return [...twoDrawer, ...sized, ...(drawer ? [base + drawer + swing] : []), base + swing];
  }

  sku() {
    const single = this.subtype === "Single Door", drawers = this.drawers();
    const fake = this.drawer.match(/^False (Quarter|Third) Drawer$/);
    const drawer = fake ? `1F${DRAWER_CODES[fake[1]]}` : drawers.length && `${drawers.length}${DRAWER_CODES[drawers[0]]}`;
    return [
      LOCATION_CODES[this.location], this.steel,
      `${this.height === 30 ? "A" : "F"}H${this.constructor.skuKind}` + String(this.width).padStart(2, "0"),
      single ? "1D" : "2D", drawer, this.depth, single && this.swing[0],
    ].filter(Boolean).join("-");
  }

  parts() {
    const { width: w, depth: d } = this;
    const parts = [
      ...this.boxParts(),
      ...inAssembly(HARDWARE_ASSEMBLY, [
        ...this.pilasterParts(),
        ...(this.shelves > 0 ? [
          part(`RPPSH_${String(w).padStart(2, "0")}x${d}`, "Shelf", this.shelves, "505"),
          part("RPPSH_BRKT_L", "Left Shelf Bracket", this.shelves * 2),
          part("RPPSH_BRKT_R", "Right Shelf Bracket", this.shelves * 2),
        ] : []),
        ...(this.floorBracket ? [part(`FLBRKT_${d}`, "Floor Bracket")] : []),
        // Outdoor: a divide under each real drawer, the drawer's width (side-by-side drawers get half width).
        ...(this.location === "Outdoor" && this.drawers().length ? [part(`DIV_${pad2(this.drawerWidth())}_UNIVERSAL`, "Drawer Divide", this.drawers().length)] : []),
      ]),
    ];
    parts.push(...this.drawerParts(), ...this.falseDrawerParts());
    parts.push(...this.allDoorParts(), ...this.hardwareParts());
    return parts;
  }

  doorCount() {
    return this.subtype === "Single Door" ? 1 : 2;
  }

  /** Door assemblies. Double doors: a left and a right door, each half the cabinet width. */
  allDoorParts() {
    if (this.door === "No Doors") return [];
    const w = this.width;
    if (this.subtype === "Single Door") return this.doorParts(this.swing, w);
    return [
      ...this.doorParts("Left", w / 2), ...this.doorParts("Right", w / 2),
      // Outdoor double doors get a flap where the two doors meet.
      ...(this.location === "Outdoor" ? inAssembly("Double Door Flap", [part(`DBL_FLAP_${this.doorHeight()}`, "Double Door Flap")]) : []),
    ];
  }

  /** "Quarter Drawer" -> ["Quarter"], "2 Quarter Drawers" -> ["Quarter", "Quarter"]; None and false drawers have no drawer box. */
  drawers() {
    const m = this.drawer.match(/^(?:(2) )?(Quarter|Third) Drawers?$/);
    return m ? Array(Number(m[1] || 1)).fill(m[2]) : [];
  }

  falseDrawers() {
    const m = this.drawer.match(/^False (Quarter|Third) Drawer$/);
    return m ? [m[1]] : [];
  }

  /** A false drawer has a finished front and a mounting assembly, but no drawer box. */
  falseDrawerParts() {
    const size = this.falseDrawers()[0];
    if (!size) return [];
    const w = this.width;
    return [
      ...inAssembly(`False ${size} Drawer Assembly`, this.drawerFrontParts(w, DRAWER_HEIGHTS[size]), 1),
      ...inAssembly("False Drawer Mounting Assembly", [
        part(`ULBFD_RG_BAR_${pad2(w)}`, "Mounting Bar"),
        part(`ULBFD_BRKT_${size.toUpperCase()}`, "False Drawer Bracket", 2),
      ], 1),
    ];
  }

  /** Hinge channel style: shorter channels when a drawer or false drawer sits above the doors. */
  hingeStyle() {
    return {
      "Quarter Drawer": "QTR_DRAWER_DR", "2 Quarter Drawers": "QTR_DRAWER_DR",
      "Third Drawer": "TDR_DRAWER_DR", "2 Third Drawers": "TDR_DRAWER_DR",
      "False Quarter Drawer": "FALSE_QTR_DR", "False Third Drawer": "FALSE_TDR_DR",
    }[this.drawer] || "DR";
  }

  /** Pilaster code: ADJSH, or 1QDR / 1TDR with a drawer (2 side-by-side drawers are still one row). */
  pilasterCode() {
    const size = this.drawers()[0];
    return size ? `1${DRAWER_CODES[size]}` : "ADJSH";
  }

  /** Side-by-side drawers share one row on the pilasters. */
  pilasterDrawerRows() {
    return this.drawers().length ? 1 : 0;
  }

  /** 2 drawers sit side by side, so each is half the cabinet width. */
  drawerWidth() {
    return this.width / this.drawers().length;
  }

  /** Door height shrinks to make room for a drawer (or false drawer) front above it. */
  doorHeight() {
    if (this.drawer.includes("Quarter")) return 22.5;
    if (this.drawer.includes("Third")) return 20;
    return 30;
  }

  /** Front and back panel for one door. swing is "Left" or "Right". */
  doorParts(swing, width) {
    const style = this.styleCode();
    if (style === "AP") return inAssembly(`${swing} Door Assembly`, this.beveledParts(`ULB${swing[0]}D`, width, this.doorHeight()), 1);
    // Doors with handles carry the handle style at the end, e.g. ULBLD_SLAB_09_30_DF_6IC.
    const handle = NO_HANDLE_STYLES.includes(this.door) ? "" : `_${HANDLE_STYLE}`;
    const code = this.frontCode(`ULB${swing[0]}D`, width, this.doorHeight());
    const parts = [part(`${code}_DF${handle}`, `${swing} Door Front`, 1, "505"), part(`${code}_DB${handle}`, `${swing} Door Back`, 1, "505")];
    if (style === "TRS") parts.push(part(`ULB${swing[0]}D_TRS_${pad2(width)}_TRSIP`, "TRS Inner Panel for Doors"));
    return inAssembly(`${swing} Door Assembly`, parts, 1);
  }
}
