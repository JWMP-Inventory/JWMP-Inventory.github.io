/** The list of item types offered in the UI. To add a type: create its class, then add it here and in index.html. */
const ItemRegistry = {
  all: [Base, SinkBase, DrawerBank, BasePullout, GrillCabinet, WallCabinet],

  get(type) {
    return this.all.find(c => c.type === type);
  },

  /** Build an item from saved/plain data. Unknown types fall back to the first class. */
  create(data = {}) {
    const C = this.get(data.type) || this.all[0];
    return new C(data);
  },

  /** Change an item's type, keeping whatever values are still valid. */
  switchType(item, type) {
    const C = this.get(type);
    return new C({ qty: item.qty, line: item.line, location: item.location, width: item.width, depth: item.depth, height: item.height, door: item.door, finish: item.finish, notes: item.notes, steel: item.steel });
  },

  /**
   * Builds an item from a SKU: { item } on success, { error } otherwise.
   * Fails if any value in the SKU isn't an allowed option for that item type.
   */
  fromSku(sku) {
    // Steel type (304SS / 316SS) is read here, so each type's fromSku only has to handle 304SS.
    const steel = (sku.match(/^\d+-(\d{3}SS)-/) || [])[1];
    if (steel && !STEEL_TYPES.includes(steel)) return { error: `unsupported steel type ${steel}` };
    sku = sku.replace(/^(\d+)-\d{3}SS-/, "$1-304SS-");
    for (const C of this.all) {
      const data = C.fromSku(sku);
      if (!data) continue;
      const item = new C(data);
      item.steel = steel || "304SS";
      const bad = Object.keys(data).filter(k => item[k] !== data[k]);
      return bad.length ? { error: `unsupported ${bad.map(k => FIELD_LABELS[k]).join(", ")}` } : { item };
    }
    return { error: "SKU format not recognized" };
  },
};
