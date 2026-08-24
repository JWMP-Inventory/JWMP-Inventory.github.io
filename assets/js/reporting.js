console.log("reporting.js loaded");


/* =========================================
   GLOBAL VARIABLES
========================================= */

let inventoryData = [];

let currentPartTypeFilter = "";


/* Keep references to the charts */

let inventoryHealthChart = null;
let topCriticalChart = null;
let topLowInventoryChart = null;
let topOverstockChart = null;
let laserPartsChart = null;


/* =========================================
   LOAD INVENTORY JSON
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response =
            await fetch(
                "assets/data/inventory.json?t=" + Date.now()
            );


        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }


        const jsonData =
            await response.json();


        inventoryData =
            jsonData.inventory;


        console.log(
            "Reporting JSON loaded:",
            inventoryData
        );


        /* Create charts */

        createInventoryHealthChart();

        createTopCriticalChart();

        createTopLowInventoryChart();

        createTopOverstockChart();

        createLaserPartsChart();


        /* Set up shared filter */

        setupPartTypeFilter();


    } catch (error) {

        console.error(
            "Error loading inventory JSON:",
            error
        );

    }

});


/* =========================================
   PART TYPE FILTER
========================================= */

function setupPartTypeFilter() {

    const filterInput =
        document.getElementById(
            "partTypeFilter"
        );


    if (!filterInput) {

        console.warn(
            "Part Type filter not found."
        );

        return;

    }


    filterInput.addEventListener(
        "input",
        () => {

            currentPartTypeFilter =
                filterInput.value
                    .trim()
                    .toLowerCase();


            refreshAllCharts();

        }
    );

}


/* =========================================
   CHECK PART TYPE FILTER
========================================= */

function matchesPartType(item) {

    /* No filter */
    if (!currentPartTypeFilter) {
        return true;
    }

    const filter =
        currentPartTypeFilter
            .toLowerCase()
            .trim();


    /* =========================================
       CHECK PART NUMBER
       Partial matching
    ========================================= */

    const partNumber =
        String(
            item["Part Number"] || ""
        ).toLowerCase()
        .trim();

    if (partNumber.includes(filter)) {
        return true;
    }


    /* =========================================
       CHECK SEARCH TAGS
       Token AND matching
    ========================================= */

    const searchTags =
        String(
            item["SEARCH TAGS"] || ""
        ).toLowerCase();

    const searchTokens =
        filter.split(/\s+/);

    return searchTokens.every(token =>
        searchTags.includes(token)
    );

}


/* =========================================
   REFRESH ALL CHARTS
========================================= */

function refreshAllCharts() {

    /* Destroy existing charts */

    if (inventoryHealthChart) {

        inventoryHealthChart.destroy();

    }


    if (topCriticalChart) {

        topCriticalChart.destroy();

    }


    if (topLowInventoryChart) {

        topLowInventoryChart.destroy();

    }


    if (topOverstockChart) {

        topOverstockChart.destroy();

    }


    if (laserPartsChart) {

        laserPartsChart.destroy();

    }


    /* Rebuild charts */

    createInventoryHealthChart();

    createTopCriticalChart();

    createTopLowInventoryChart();

    createTopOverstockChart();

    createLaserPartsChart();

}


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

function createInventoryHealthChart() {

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


        /* Apply Part Type filter */

        if (!matchesPartType(item)) {

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


    inventoryHealthChart =
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

function createTopCriticalChart() {

    const criticalParts = [];


    inventoryData.forEach(item => {

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        /* Apply Part Type filter */

        if (!matchesPartType(item)) {

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


    criticalParts.sort(
        (a, b) =>
            b.qtyShort - a.qtyShort
    );


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


    topCriticalChart =
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

function createTopLowInventoryChart() {

    const lowParts = [];


    inventoryData.forEach(item => {

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        /* Apply Part Type filter */

        if (!matchesPartType(item)) {

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


    lowParts.sort(
        (a, b) =>
            a.onHand - b.onHand
    );


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


    topLowInventoryChart =
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

function createTopOverstockChart() {

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

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        const partNumber =
            String(item["Part Number"]).trim();


        /* Ignore excluded parts */

        if (
            excludedParts.includes(partNumber)
        ) {

            return;

        }


        /* Apply Part Type filter */

        if (!matchesPartType(item)) {

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


    overstockParts.sort(
        (a, b) =>
            b.onHand - a.onHand
    );


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


    topOverstockChart =
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

function createLaserPartsChart() {

    const laserParts = [];


    inventoryData.forEach(item => {

        if (
            !item["Part Number"] ||
            String(item["Part Number"]).trim() === ""
        ) {

            return;

        }


        /* Apply Part Type filter */

        if (!matchesPartType(item)) {

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


    laserParts.sort(
        (a, b) =>
            b.laserQueue - a.laserQueue
    );


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


    laserPartsChart =
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