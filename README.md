# BOM Generator

Static HTML/CSS/JS. No build step.

## Run
Open `index.html` in a browser, or in VS Code right-click it and choose **Open with Live Server**.

## Structure
```
index.html
css/styles.css
js/
  config.js            shared constants (doors, depths, heights) and field helpers
  bom.js               BOMGenerator: per-item BOMs + consolidated tally
  app.js               UI (table, validation, results, navigation)
  items/
    Item.js            base class: defaults, validation, description
    Base.js            Base (single/double door, swing, drawer option)
    SinkBase.js  DrawerBank.js  GrillCabinet.js  WallCabinet.js
    registry.js        list of item types shown in the UI
```

## Where calculations go
Each item class has a `parts()` method that returns the parts for ONE unit:
`[{ partNo: "...", description: "...", qty: 2 }]`
`BOMGenerator` multiplies by the line quantity and builds the consolidated tally.

## Changing options
Override `fields()` in an item class. It returns, per field, either `NONE`, `selectField([...])`
or `numberField({...})`. Options can depend on other values (see `Base.js`, where width depends on subtype).

## Adding an item type
1. Copy `js/items/SinkBase.js`, change the class name, `type`, and `label`.
2. Add a `<script>` tag for it in `index.html` (before `registry.js`).
3. Add the class to `ItemRegistry.all` in `js/items/registry.js`.
