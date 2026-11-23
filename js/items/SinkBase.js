// Same options as Base (subtype, swing, widths), plus false drawer fronts.
class SinkBase extends Base {
  static type = "sink-base";
  static label = "Sink Base";

  fields() {
    return {
      ...super.fields(),
      shelves: selectField(SHELF_COUNTS, { default: 1 }),
      drawer: drawerField(["None", "Quarter Drawer", "Third Drawer", "False Quarter Drawer", "False Third Drawer"]),
    };
  }

  static skuKind = "SB"; // FHSB / AHSB; otherwise the same SKU format as Base

  defaultImage() {
    // Only the 2 door false drawer image applies to sink bases; otherwise no image yet.
    return this.subtype === "Double Door" && this.falseDrawers().length ? "DEFAULT-BASE-2D-1FQDR" : "";
  }

  // Same parts as Base, minus the pilasters and header channel.
  parts() {
    return super.parts().filter(p => !p.partNo.startsWith("RPP_30_") && !p.partNo.startsWith("HECH_"));
  }
}
