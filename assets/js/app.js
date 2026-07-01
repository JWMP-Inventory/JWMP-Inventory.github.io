console.log("app.js loaded")



/*  HIDES BLANK ENTRIES IN PART COLUMN BEFORE TABLE CREATION */
DataTable.ext.search.push(function (settings, data) {

    // Column 3 = index 2 (0-based indexing)
    let column4 = data[3];

    // Hide row if column 3 is empty/null/whitespace
    if (!column4 || column4.trim() === "") {
        return false;
    }

    return true;
});



/*  INITIALIZES DATATABLE*/
document.addEventListener("DOMContentLoaded", () => {
    new DataTable("#inventoryTable", {
    pageLength: 10,
    lengthMenu: [10, 25, 50, 100],
    searching: true,
    ordering: true,
    info: true,
    paging: true,
    responsive: true,


    /*  HIDES THE TAG COLUMN */
columnDefs: [
    {
        targets: [11],  // multiple columns
        visible: false
    }
],





/* ADDS ROW DIVIDERS BETWEEN DIFFERENT BAYS, SEE CSS FILE FOR CALL*/

    drawCallback: function () {
        let api = this.api();

        let rows = api.rows({ page: 'current' }).nodes();
        let lastBay = null;

        api.column(0, { page: 'current' }).data().each(function (bay, i) {

            if (lastBay !== null && bay !== lastBay) {
                $(rows).eq(i).addClass('bay-separator');
            }

            lastBay = bay;
        });
    }










    });
});





