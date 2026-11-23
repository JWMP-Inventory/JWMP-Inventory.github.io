class BasePullout extends Item {
  static type = "base-pullout";
  static label = "Base Pullout";

  fields() {
    return {
      ...super.fields(),
      subtype: selectField(["Pull Out Single Trashcan", "Pull Out Double Trashcan", "Pull Out Tray Divider", "Pull Out Pantry Organizer"]),
    };
  }

  // SKU code per subtype (the organizer's code includes its dashes).
  static SKU_CODES = {
    "Pull Out Single Trashcan": "STC",
    "Pull Out Double Trashcan": "DTC",
    "Pull Out Tray Divider": "TD",
    "Pull Out Pantry Organizer": "-ORG-",
  };

  // SKU: [location]-304SS-[F|A]HBPO[subtype code][width, 2 digits]-[depth],
  // e.g. 1100-304SS-FHBPOSTC18-24, 1200-304SS-FHBPOTD09-24, 1200-304SS-FHBPO-ORG-12-28
  static fromSku(sku) {
    const m = sku.match(/^(\d+)-304SS-([FA])HBPO([A-Z]+|-[A-Z]+-)(\d+)-(\d+)$/);
    if (!m) return null;
    const [, loc, ht, code, width, depth] = m;
    return {
      location: keyOf(LOCATION_CODES, loc),
      subtype: keyOf(BasePullout.SKU_CODES, code),
      width: +width, depth: +depth, height: ht === "A" ? 30 : 34.5,
    };
  }

  sku() {
    const code = BasePullout.SKU_CODES[this.subtype];
    if (!code) return "";
    return [
      LOCATION_CODES[this.location], this.steel,
      `${this.height === 30 ? "A" : "F"}HBPO${code}${String(this.width).padStart(2, "0")}`, this.depth,
    ].join("-");
  }

  parts() {
    const d = this.depth, dd = DRAWER_DEPTHS[d];
    return [
      // Base box minus the header channel.
      ...this.boxParts().filter(p => !p.partNo.startsWith("HECH_")),
      ...inAssembly(HARDWARE_ASSEMBLY, [
        part("RPP_30_PO", "Front Left Pilaster"),
        part("RPP_30_R_PO", "Front Right Pilaster"),
        part("RPP_30_PO_REAR", "Rear Left Pilaster"),
        part("RPP_30_R_PO_REAR", "Rear Right Pilaster"),
        part(`UDRW_BRKT_${dd}L_${d}BOX`, "Left Drawer Bracket"),
        part(`UDRW_BRKT_${dd}R_${d}BOX`, "Right Drawer Bracket"),
      ]),
      ...this.pulloutParts(),
      ...this.frontParts(),
      ...this.hardwareParts(),
    ];
  }

  /** One full width pullout front: gets a handle and bumpers/gasket, but no hinges. */
  doorCount() {
    return 1;
  }

  hasHinges() {
    return false;
  }

  /** The pullout rides on the pilasters like one drawer. */
  pilasterDrawerRows() {
    return 1;
  }

  /** Door height used in pullout part numbers (full height door; no drawers above). */
  doorHeight() {
    return 30;
  }

  /** Finished pullout front, e.g. ILBPO_SLAB_18_30_DF / _DB (other styles follow the door rules). */
  frontParts() {
    const w = this.width, h = this.doorHeight(), style = this.styleCode();
    if (style === "AP") return inAssembly("Pullout Front Assembly", this.beveledParts("ILBPO", w, h), 1);
    // 2-digit width; handle style at the end when the front gets a handle, e.g. ILBPO_SLAB_09_30_DF_6IC.
    const handle = NO_HANDLE_STYLES.includes(this.door) ? "" : `_${HANDLE_STYLE}`;
    const code = this.frontCode("ILBPO", w, h);
    return inAssembly("Pullout Front Assembly", [
      part(`${code}_DF${handle}`, "Pullout Front", 1, "505"),
      part(`${code}_DB${handle}`, "Pullout Back", 1, "505"),
      ...(style === "TRS" ? [part(`ILBPO_TRS_${pad2(w)}_${h}_TRSIP`, "TRS Inner Panel")] : []),
    ], 1);
  }

  /** The pullout assembly for the subtype. TODO: tray divider, pantry organizer. */
  pulloutParts() {
    const w = pad2(this.width), dd = DRAWER_DEPTHS[this.depth], h = this.doorHeight();
    // Single and double trashcans differ only in the top part's code.
    const can = { "Pull Out Single Trashcan": "POSTC", "Pull Out Double Trashcan": "PODTC" }[this.subtype];
    if (can) {
      return inAssembly(`${can} Drawer Assembly`, [
        part(`ILBPOBOX_${w}_${h}_POTC_1`, "Internal Pullout Front", 1, "505"),
        part(`ILBPOBOX_${w}_${dd}_${can}_2`, "Internal Pullout Top", 1, "505"),
        part(`ILBPOBOX_${w}_${dd}_POTC_3`, "Internal Pullout Bottom", 1, "505"),
        part(`ILBPOBOX_${h}_POTC_ANGLE_1`, "Rear Right Post", 1, "505"),
        part(`ILBPOBOX_${h}_POTC_ANGLE_2`, "Rear Left Post", 1, "505"),
        part(`ILBPOBOX_${w}_${dd}_POTC_4`, "Floor Filler", 1, "505"),
      ], 1);
    }
    return [];
  }
}
