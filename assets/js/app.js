console.log("app.js loaded");

/* =========================================
   GLOBAL FILTER (HIDES BLANK PART NUMBERS)
========================================= */

DataTable.ext.search.push(function (settings, data) {

    let column4 = data[3]; // Part Number column

    if (!column4 || column4.trim() === "") {
        return false;
    }

    return true;
});


/* =========================================
   MAIN INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const table = new DataTable("#inventoryTable", {

        pageLength: 10,
        lengthMenu: [10, 20, 50, 100],

        searching: true,
        ordering: true,
        info: true,
        paging: true,
        responsive: true,
        select: true,

        autoWidth: false,













        

        columnDefs: [

            /* -----------------------------
               COLUMN WIDTHS (optional tuning)
            ----------------------------- */
            { targets: 0, width: "55px" },
            { targets: 1, width: "50px" },
            { targets: 2, width: "50px" },
            

            { targets: 4, width: "75px" },
            { targets: 5, width: "75px" },
            { targets: 6, width: "75px" },

            

            
{
        targets: [4,5,6],
        className: "dwh-highlight"
    },

    {
        targets: [0,1,2],
        className: "blb-highlight"
    },

{
        targets: [8,10,11],
        className: "onhand-highlight"
    },




    /* FUNCTION TARGETTING QTY SHORT COLUMN AND APPLYING FORMATTING BASED ON  VALUES */
{
    targets: 10,
    createdCell: function (cell, cellData, rowData) {

        const onHand = parseFloat(rowData[8]) || 0;
        const forecast = parseFloat(rowData[11]) || 0;

        if (forecast === 0) return;

        const shortage = forecast - onHand;

        if (shortage <= 0) {
            cell.classList.add("forecast-good");
        }
        else if (shortage < 20) {
            cell.classList.add("forecast-low");
        }
        else {
            cell.classList.add("forecast-critical");
        }

    }
},






 


            /* -----------------------------
               LOCATION COLUMN STYLE
            ----------------------------- */
            {
                targets: [0,1,2,4,5,6,7,8,10],
                className: "primary-data"
            },

            /* -----------------------------
               PERMANENTLY HIDDEN COLUMNS
            ----------------------------- */
            {
                targets: [9,12,13],
                visible: false
            }
        ]




    });


    /* =========================================
       MOVE RADIO BUTTONS AND LAST SNAPSHOT MARKER INTO DATATABLE UI
    ========================================= */

    const lengthControl = document.querySelector(".dt-length");

    if (lengthControl) {

        const toggle = document.querySelector(".column-toggle");
        if (toggle) lengthControl.appendChild(toggle);

const snapshot = document.querySelector(".snapshot-info");
    if (snapshot) lengthControl.appendChild(snapshot);


    }





    /* =========================================
       VIEW SYSTEM (BASIC / FULL)
    ========================================= */

    const advancedColumns = [0,1,2,4,5,6,7,11]; 
    // Only columns that actually change between views

    function applyView(isFull) {



        advancedColumns.forEach(index => {
            table.column(index).visible(isFull);
        });

        document.body.classList.toggle("full-view", isFull);
        document.body.classList.toggle("basic-view", !isFull);

        table.columns.adjust().draw(false);
    }





    /* =========================================
       SET DEFAULT VIEW ON LOAD
    ========================================= */

  table.on('init', function () {

    const checked = document.querySelector('input[name="viewMode"]:checked');
    const isFull = checked ? checked.value === "full" : false;

    applyView(isFull);
    updateForecastFormatting();
});





    /* =========================================
       RADIO BUTTON EVENTS
    ========================================= */

    document.querySelectorAll('input[name="viewMode"]').forEach(radio => {

        radio.addEventListener("change", function () {
            applyView(this.value === "full");
        });

    });

});