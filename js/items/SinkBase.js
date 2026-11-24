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
    // Only 2 door images so far: with a false drawer, or full height with no drawer.
    if (this.subtype !== "Double Door") return "";
    if (this.falseDrawers().length) return "DEFAULT-BASE-2D-1FQDR";
    return this.drawer === "None" && this.height === 34.5 ? "2D-FHSB" : "";
  }

  // Same parts as Base, minus the pilasters and header channel.
  parts() {
    return super.parts().filter(p => !p.partNo.startsWith("RPP_30_") && !p.partNo.startsWith("HECH_"));
  }
}
