console.log("app.js loaded");


/* =========================================
   LOAD INVENTORY JSON
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch("assets/data/inventory.json");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const inventoryData = await response.json();

        console.log("Inventory JSON loaded:", inventoryData);

        populateInventoryTable(inventoryData);

    } catch (error) {

        console.error("Error loading inventory JSON:", error);

        const inventoryBody =
            document.getElementById("inventoryBody");

        if (inventoryBody) {

            inventoryBody.innerHTML = `
                <tr>
                    <td colspan="15">
                        Error loading inventory data.
                    </td>
                </tr>
            `;

        }

    }

});


/* =========================================
   POPULATE INVENTORY TABLE
========================================= */

function populateInventoryTable(inventoryData) {

    const inventoryBody =
        document.getElementById("inventoryBody");


    if (!inventoryBody) {

        console.error("inventoryBody not found.");

        return;

    }


    /* Clear existing rows */

    inventoryBody.innerHTML = "";


    /* =========================================
       CREATE A ROW FOR EACH INVENTORY ITEM
    ========================================= */

    inventoryData.forEach(item => {


        /* -----------------------------------------
           HIDE BLANK PART NUMBERS
        ----------------------------------------- */

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        /* =========================================
           NUMERIC VALUES
        ========================================= */

        const onHand =
            Number(item["ON HAND"]) || 0;

        const dxfAdjust =
            Number(item["DXF ADJUST"]) || 0;

        const laserQueue =
            Number(item["FOR LASER (+)"]) || 0;

        const qtyShort =
            Number(item["QTY SHORT"]) || 0;

        const forecast =
            Number(item["FORECAST USAGE"]) || 0;


        /* =========================================
           DETERMINE QTY SHORT COLOR
        ========================================= */
let qtyShortClass = "";


/*
   CRITICAL
   Positive QTY SHORT
*/

if (qtyShort > 0) {

    qtyShortClass = "forecast-critical";

}





/*
   GOOD
*/

else if (
    qtyShort < onHand &&
    laserQueue === 0
) {

    qtyShortClass = "forecast-good";

}


/*
   LOW
*/

else if (
    qtyShort < onHand &&
    laserQueue !== 0
) {

    qtyShortClass = "forecast-low";

}
/*
   NO FORECAST
*/

else if (forecast === 0) {

    qtyShortClass = "forecast-none";

}


        /* =========================================
           CREATE TABLE ROW

           COLUMN ORDER:

           0  BAY
           1  SHELF
           2  BIN
           3  PART NUMBER
           4  WIDTH
           5  DEPTH
           6  HEIGHT
           7  LOCATION
           8  ON HAND
           9  DXF ADJUST
           10 LASER
           11 QTY SHORT
           12 FORECAST
           13 BARCODE
           14 SEARCH TAGS
        ========================================= */

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${item["BAY"] ?? ""}</td>

            <td>${item["SHELF"] ?? ""}</td>

            <td>${item["BIN"] ?? ""}</td>

            <td>${item["Part Number"] ?? ""}</td>

            <td>${item["WIDTH"] ?? "-"}</td>

            <td>${item["DEPTH"] ?? "-"}</td>

            <td>${item["HEIGHT"] ?? "-"}</td>

            <td>${item["LOCATION"] ?? ""}</td>

            <td>${item["ON HAND"] ?? 0}</td>

            <td>${item["DXF ADJUST"] ?? 0}</td>

            <td>${item["FOR LASER (+)"] ?? 0}</td>

            <td class="${qtyShortClass}">
                ${item["QTY SHORT"] ?? 0}
            </td>

            <td>${item["FORECAST USAGE"] ?? 0}</td>

            <td>${item["BARCODE"] ?? ""}</td>

            <td>${item["SEARCH TAGS"] ?? ""}</td>

        `;


        /* =========================================
           PART NUMBER TOOLTIP
        ========================================= */

        const partNumberCell = row.cells[3];

        if (partNumberCell) {

            partNumberCell.title =
                item["Part Number"];

        }


        /* =========================================
           SEARCH TAG TOOLTIP
        ========================================= */

        const searchTagsCell = row.cells[14];

        if (
            searchTagsCell &&
            item["SEARCH TAGS"]
        ) {

            searchTagsCell.title =
                item["SEARCH TAGS"];

        }


        /* =========================================
           ADD ROW TO TABLE
        ========================================= */

        inventoryBody.appendChild(row);

    });


    /* =========================================
       INITIALIZE DATATABLE
    ========================================= */

    initializeDataTable();

}


/* =========================================
   DATATABLE INITIALIZATION
========================================= */

function initializeDataTable() {

    const table =
        new DataTable("#inventoryTable", {


        /* =========================================
           PAGING
        ========================================= */

        pageLength: 10,

        lengthMenu: [
            10,
            20,
            50,
            100
        ],


        /* =========================================
           DEFAULT SORT
           QTY SHORT = COLUMN 11
        ========================================= */

        order: [
            [11, "desc"]
        ],


        /* =========================================
           FEATURES
        ========================================= */

        searching: true,

        ordering: true,

        info: true,

        paging: true,

        responsive: true,

        select: true,

        autoWidth: false,


        /* =========================================
           COLUMN DEFINITIONS
        ========================================= */

        columnDefs: [


            /* -----------------------------------------
               COLUMN WIDTHS
            ----------------------------------------- */

            {
                targets: 0,
                width: "55px"
            },

            {
                targets: 1,
                width: "50px"
            },

            {
                targets: 2,
                width: "50px"
            },

            {
                targets: 3,
                width: "400px"
            },

            {
                targets: 4,
                width: "75px"
            },

            {
                targets: 5,
                width: "75px"
            },

            {
                targets: 6,
                width: "75px"
            },


            /* -----------------------------------------
               WIDTH / DEPTH / HEIGHT
            ----------------------------------------- */

            {
                targets: [
                    4,
                    5,
                    6
                ],

                className: "dwh-highlight"

            },


            /* -----------------------------------------
               FORECAST COLUMN
               COLUMN 12
            ----------------------------------------- */

            {
                targets: 12,

                className: "forecast-highlight"

            },


            /* -----------------------------------------
               ON HAND / DXF / LASER
               COLUMNS 8, 9, 10
            ----------------------------------------- */

            {
                targets: [
                    8,
                    9,
                    10
                ],

                className: "onhand-highlight"

            },


            /* -----------------------------------------
               PRIMARY DATA
            ----------------------------------------- */

            {
                targets: [
                    0,
                    1,
                    2,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                    11
                ],

                className: "primary-data"

            },


            /* -----------------------------------------
               HIDDEN COLUMNS

               LOCATION
               BARCODE
               SEARCH TAGS
            ----------------------------------------- */

            {
                targets: [
                  7,   // LOCATION
        9,   // DXF ADJUST
        13,  // BARCODE
        14   // SEARCH TAGS
                ],

                visible: false

            }

        ]

    });


    /* =========================================
       MOVE RADIO BUTTONS AND SNAPSHOT
       INTO DATATABLE UI
    ========================================= */

    const lengthControl =
        document.querySelector(".dt-length");


    if (lengthControl) {


        const toggle =
            document.querySelector(".column-toggle");


        if (toggle) {

            lengthControl.appendChild(toggle);

        }


        const snapshot =
            document.querySelector(".snapshot-info");


        if (snapshot) {

            lengthControl.appendChild(snapshot);

        }

    }


    /* =========================================
       VIEW SYSTEM
    ========================================= */

    const advancedColumns = [

        0,   // BAY
        1,   // SHELF
        2,   // BIN
        4,   // WIDTH
        5,   // DEPTH
        6,   // HEIGHT
        12   // FORECAST

    ];


    function applyView(isFull) {


        advancedColumns.forEach(index => {

            table
                .column(index)
                .visible(isFull);

        });


        document.body.classList.toggle(
            "full-view",
            isFull
        );


        document.body.classList.toggle(
            "basic-view",
            !isFull
        );


        table.columns.adjust();


        /* -----------------------------------------
           KEEP QTY SHORT SORTING
        ----------------------------------------- */

        table
            .order([
                [11, "desc"]
            ])
            .draw(false);

    }


    /* =========================================
       DEFAULT VIEW ON LOAD
    ========================================= */

    table.on("init", function () {


        const checked =
            document.querySelector(
                'input[name="viewMode"]:checked'
            );


        const isFull =
            checked
                ? checked.value === "full"
                : false;


        applyView(isFull);

    });


    /* =========================================
       RADIO BUTTON EVENTS
    ========================================= */

    document
        .querySelectorAll(
            'input[name="viewMode"]'
        )
        .forEach(radio => {


            radio.addEventListener(
                "change",
                function () {


                    applyView(
                        this.value === "full"
                    );


                }

            );


        });

}