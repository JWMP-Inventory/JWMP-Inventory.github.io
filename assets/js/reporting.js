console.log("reporting.js loaded");


/* =========================================
   LOAD INVENTORY JSON
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch(
    "assets/data/inventory.json?t=" + Date.now()
);


        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }


        const jsonData =
    await response.json();

const inventoryData =
    jsonData.inventory;


        console.log(
            "Reporting JSON loaded:",
            inventoryData
        );


createInventoryHealthChart(inventoryData);

createTopCriticalChart(inventoryData);

createTopLowInventoryChart(inventoryData);

createTopOverstockChart(inventoryData);

createLaserPartsChart(inventoryData);


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

    const lowThreshhold = 13;


    /* -------------------------
       GOOD
    ------------------------- */

    if (
        onHand > lowThreshhold &&
        onHand > qtyShort
    ) {

        return "good";

    }


    /* -------------------------
       LOW
    ------------------------- */

    else if (
        onHand < lowThreshhold &&
        onHand > -1 &&
        onHand != 0
    ) {

        return "low";

    }


    /* -------------------------
       CRITICAL
    ------------------------- */

    else if (
        qtyShort > 0 ||
        onHand < 0
    ) {

        return "critical";

    }


    /* -------------------------
       TBD
    ------------------------- */

    else if (
        onHand == 0
    ) {

        return "TBD";

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

    let TBDCount = 0;


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

        else if (status === "TBD") {

            TBDCount++;

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
                "Critical",
                "TBD"
            ],

            datasets: [

                {

                    label: "Parts",

                    data: [
                        goodCount,
                        lowCount,
                        criticalCount,
                        TBDCount
                    ],

                    backgroundColor: [
                        "#69ff8c",
                        "#ffdb65",
                        "#ff4a4a",
                        "#00a6f9"
                    ],

                    hoverBackgroundColor: [
                        "#69ff8c",
                        "#ffdb65",
                        "#ff4a4a",
                        "#00a6f9"
                    ],

                    borderColor: [
                        "#69ff8c",
                        "#ffdb65",
                        "#ff4a4a",
                        "#00a6f9"
                    ],

                    hoverBorderColor: [
                        "#69ff8c",
                        "#ffdb65",
                        "#ff4a4a",
                        "#00a6f9"
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


/* =========================================
   TOP LOW INVENTORY PARTS
========================================= */

function createTopLowInventoryChart(inventoryData) {

    const lowParts = [];


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


        if (status !== "low") {

            return;

        }


        const onHand =
            Number(item["ON HAND"]) || 0;


        lowParts.push({

            partNumber:
                item["Part Number"],

            onHand:
                onHand

        });

    });


    /* -------------------------
       SORT LOWEST INVENTORY FIRST
    ------------------------- */

    lowParts.sort(
        (a, b) =>
            a.onHand - b.onHand
    );


    /* -------------------------
       TOP 10
    ------------------------- */

    const topParts =
        lowParts.slice(0, 10);


    const labels =
        topParts.map(
            item => item.partNumber
        );


    const values =
        topParts.map(
            item => item.onHand
        );


    const canvas =
        document.getElementById(
            "topLowInventoryChart"
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

                    label: "On Hand",

                    data: values,

                    backgroundColor: "#ffdb65",

                    hoverBackgroundColor: "#ffdb65",

                    borderColor: "#ffdb65",

                    hoverBorderColor: "#ffdb65",

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


/* =========================================
   TOP OVERSTOCKED PARTS
========================================= */

function createTopOverstockChart(inventoryData) {

    const overstockParts = [];

    /* Parts to exclude from overstock report */

    const excludedParts = [
        "HECH_24",
        "24_3.5FLCH_LEFT",
        "24_3.5FLCH_RIGHT",
        "MAG_PLATE_DOUBLE_2",
        "MAG_PLATE_SINGLE"
    ];


    inventoryData.forEach(item => {

        /* Ignore blank part numbers */

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        const partNumber =
            String(item["Part Number"]).trim();


        /* Ignore excluded parts */

        if (excludedParts.includes(partNumber)) {

            return;

        }


        const status =
            getInventoryStatus(item);


        /* Only consider Good inventory */

        if (status !== "good") {

            return;

        }


        const onHand =
            Number(item["ON HAND"]) || 0;


        overstockParts.push({

            partNumber:
                partNumber,

            onHand:
                onHand

        });

    });


    /* -------------------------
       SORT LARGEST INVENTORY FIRST
    ------------------------- */

    overstockParts.sort(
        (a, b) =>
            b.onHand - a.onHand
    );


    /* -------------------------
       TOP 10
    ------------------------- */

    const topParts =
        overstockParts.slice(0, 10);


    const labels =
        topParts.map(
            item => item.partNumber
        );


    const values =
        topParts.map(
            item => item.onHand
        );


    const canvas =
        document.getElementById(
            "topOverstockChart"
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

                    label: "On Hand",

                    data: values,

                    backgroundColor: "#69ff8c",

                    hoverBackgroundColor: "#69ff8c",

                    borderColor: "#69ff8c",

                    hoverBorderColor: "#69ff8c",

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


/* =========================================
   PARTS CURRENTLY ON LASER
========================================= */

function createLaserPartsChart(inventoryData) {

    const laserParts = [];


    inventoryData.forEach(item => {

        /* Ignore blank part numbers */

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        const laserQueue =
            Number(item["FOR LASER (+)"]) || 0;


        /* Only include parts currently on laser */

        if (laserQueue <= 0) {

            return;

        }


        laserParts.push({

            partNumber:
                item["Part Number"],

            laserQueue:
                laserQueue

        });

    });


    /* -------------------------
       SORT LARGEST LASER QUEUE FIRST
    ------------------------- */

    laserParts.sort(
        (a, b) =>
            b.laserQueue - a.laserQueue
    );


    /* -------------------------
       TOP 10
    ------------------------- */

    const topParts =
        laserParts.slice(0, 10);


    const labels =
        topParts.map(
            item => item.partNumber
        );


    const values =
        topParts.map(
            item => item.laserQueue
        );


    const canvas =
        document.getElementById(
            "laserPartsChart"
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

                    label: "For Laser",

                    data: values,

                    backgroundColor: "#00a6f9",

                    hoverBackgroundColor: "#00a6f9",

                    borderColor: "#00a6f9",

                    hoverBorderColor: "#00a6f9",

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