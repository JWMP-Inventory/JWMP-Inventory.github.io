console.log("reporting.js loaded");


/* =========================================
   LOAD INVENTORY JSON
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response =
            await fetch("assets/data/inventory.json");


        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }


        const inventoryData =
            await response.json();


        console.log(
            "Reporting JSON loaded:",
            inventoryData
        );


        createInventoryHealthChart(inventoryData);

        createTopCriticalChart(inventoryData);


    } catch (error) {

        console.error(
            "Error loading inventory JSON:",
            error
        );

    }

});


/* =========================================
   DETERMINE INVENTORY STATUS

   THIS MATCHES THE LOGIC USED
   ON THE INVENTORY PAGE
========================================= */

function getInventoryStatus(item) {


    const onHand =
        Number(item["ON HAND"]) || 0;


    const laserQueue =
        Number(item["FOR LASER (+)"]) || 0;


    const qtyShort =
        Number(item["QTY SHORT"]) || 0;


    const forecast =
        Number(item["FORECAST USAGE"]) || 0;


    /* -------------------------
       NO FORECAST
    ------------------------- */



    /* -------------------------
       GOOD
    ------------------------- */

    if (
        (onHand>10 || onHand>qtyShort)
    ) {

        return "good";

    }


    /* -------------------------
       LOW
    ------------------------- */

    else if (
        ((onHand < 10) && (onHand > -1))
    ) {

        return "low";

    }


    /* -------------------------
       CRITICAL
    ------------------------- */

    else if ((qtyShort > 0) || (onHand<0)) {

        return "critical";

    }


    return "none";

}


/* =========================================
   INVENTORY HEALTH CHART
========================================= */

function createInventoryHealthChart(inventoryData) {


    let goodCount = 0;

    let lowCount = 0;

    let criticalCount = 0;


    inventoryData.forEach(item => {


        /* Ignore blank part numbers */

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        const status =
            getInventoryStatus(item);


        if (status === "good") {

            goodCount++;

        }

        else if (status === "low") {

            lowCount++;

        }

        else if (status === "critical") {

            criticalCount++;

        }

    });


    const canvas =
        document.getElementById(
            "inventoryHealthChart"
        );


    if (!canvas) {

        return;

    }


new Chart(canvas, {

    type: "bar",

    data: {

        labels: [
            "Good",
            "Low",
            "Critical"
        ],
datasets: [

    {

        label: "Parts",

        data: [
            goodCount,
            lowCount,
            criticalCount
        ],

        backgroundColor: [
            "#69ff8c",
            "#ffdb65",
            "#ff4a4a"
        ],

        hoverBackgroundColor: [
            "#69ff8c",
            "#ffdb65",
            "#ff4a4a"
        ],

        borderColor: [
            "#69ff8c",
            "#ffdb65",
            "#ff4a4a"
        ],

        hoverBorderColor: [
            "#69ff8c",
            "#ffdb65",
            "#ff4a4a"
        ],

        borderWidth: 0,

        borderRadius: 6

    }

]

    },

    options: {

        indexAxis: "y",

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {
                display: false
            }

        },

scales: {

    x: {

        beginAtZero: true,

        ticks: {
            precision: 0,
            color: "#ffffff",
            font: {
                size: 14
            }
        }

    },

    y: {

        grid: {
            display: false
        },

        ticks: {
            color: "#ffffff",
            font: {
                size: 14,
                weight: "500"
            }
        }

    }

}

    }

});


}


/* =========================================
   TOP CRITICAL PARTS
========================================= */

function createTopCriticalChart(inventoryData) {


    const criticalParts = [];


    inventoryData.forEach(item => {


        /* Ignore blank part numbers */

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        const status =
            getInventoryStatus(item);


        if (status !== "critical") {

            return;

        }


        const qtyShort =
            Number(item["QTY SHORT"]) || 0;


        criticalParts.push({

            partNumber:
                item["Part Number"],

            qtyShort:
                qtyShort

        });

    });


    /* -------------------------
       SORT LARGEST SHORTAGE FIRST
    ------------------------- */

    criticalParts.sort(
        (a, b) =>
            b.qtyShort - a.qtyShort
    );


    /* -------------------------
       TOP 10
    ------------------------- */

    const topParts =
        criticalParts.slice(0, 10);


    const labels =
        topParts.map(
            item => item.partNumber
        );


    const values =
        topParts.map(
            item => item.qtyShort
        );


    const canvas =
        document.getElementById(
            "topCriticalChart"
        );


    if (!canvas) {

        return;

    }


    new Chart(canvas, {

        type: "bar",


        data: {

            labels: labels,


datasets: [

    {

        label: "Qty Short",

        data: values,

        backgroundColor: "#ff4a4a",

        hoverBackgroundColor: "#ff4a4a",

        borderColor: "#ff4a4a",

        hoverBorderColor: "#ff4a4a",

        borderWidth: 0,

        borderRadius: 6

    }

]

        },


        options: {

            indexAxis: "y",

            responsive: true,

            maintainAspectRatio: false,


            plugins: {

                legend: {

                    display: false

                }

            },


          scales: {

    x: {

        beginAtZero: true,

        ticks: {

            precision: 0,

            color: "#ffffff",

            font: {

                size: 14

            }

        }

    },

    y: {

        ticks: {

            color: "#ffffff",

            font: {

                size: 14,

                weight: "500"

            }

        }

    }

}

        }

    });

}