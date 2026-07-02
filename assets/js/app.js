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
        targets: [8,10],
        className: "onhand-highlight"
    },





             

            /* -----------------------------
               LOCATION COLUMN STYLE
            ----------------------------- */
            {
                targets: [0,1,2,4,5,6,7,8,10],
                className: "location-col"
            },

            /* -----------------------------
               PERMANENTLY HIDDEN COLUMNS
            ----------------------------- */
            {
                targets: [9,11,12],
                visible: false
            }
        ]




    });


    /* =========================================
       MOVE VIEW TOGGLE INTO DATATABLE UI
    ========================================= */

    const lengthControl = document.querySelector(".dt-length");

    if (lengthControl) {
        const toggle = document.querySelector(".column-toggle");
        if (toggle) lengthControl.appendChild(toggle);
    }


    /* =========================================
       VIEW SYSTEM (BASIC / FULL)
    ========================================= */

    const advancedColumns = [4,5,6]; 
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