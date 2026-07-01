console.log("app.js loaded");

/* HIDES BLANK ENTRIES IN PART COLUMN */
DataTable.ext.search.push(function (settings, data) {

    let column4 = data[3];

    if (!column4 || column4.trim() === "") {
        return false;
    }

    return true;
});

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


        
        columnDefs: [
    {
        targets: [7,8,9],   // LOCATION, ON HAND, DXF UPDATE (adjust if needed)
        className: "location-col"
    },
    {
        targets: [0,1,2,4,5,6,9,11,12],
        visible: false
    }
]



    });

    /* -----------------------------
       RADIO BUTTON VIEW SWITCH
    ------------------------------*/

    const advancedColumns = [0,1,2,4,5,6,9,11,12];

    document.querySelectorAll('input[name="viewMode"]').forEach(function(radio) {

        radio.addEventListener("change", function() {

            const showAdvanced = this.value === "full";

            advancedColumns.forEach(function(index) {
                table.column(index).visible(showAdvanced);
            });


            document.body.classList.toggle("full-view", showAdvanced);
            document.body.classList.toggle("basic-view", !showAdvanced);




        });

    });

});