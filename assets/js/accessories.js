console.log("consumables.js loaded");


/* =========================================
   LOAD INVENTORY DATA
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


        console.log(
            "Consumables JSON loaded:",
            jsonData
        );


        /* =========================================
           GET INVENTORY ARRAY
        ========================================= */

        const inventoryData =
            jsonData.inventory;


        if (!Array.isArray(inventoryData)) {

            throw new Error(
                "Inventory data is not an array."
            );

        }


        /* =========================================
           UPDATE ALL CONSUMABLE CARDS
        ========================================= */

        document
            .querySelectorAll(".consumable-card")
            .forEach(card => {

                updateConsumableCard(
                    card,
                    inventoryData
                );

            });


    } catch (error) {

        console.error(
            "Error loading inventory JSON:",
            error
        );

    }

});


/* =========================================
   UPDATE CONSUMABLE CARD
========================================= */

function updateConsumableCard(
    card,
    inventoryData
) {


    /* =========================================
       GET SETTINGS FROM HTML
    ========================================= */

    const sku =
        String(
            card.dataset.sku || ""
        ).trim();


    const baseline =
        Number(
            card.dataset.baseline
        ) || 0;


    const unit =
        card.dataset.unit || "";


    /* =========================================
       OPTIONAL STATUS THRESHOLDS

       Default:
       Warning = 50%
       Critical = 25%
    ========================================= */

    const warningThreshold =
        Number(
            card.dataset.warning
        ) || 50;


    const criticalThreshold =
        Number(
            card.dataset.critical
        ) || 25;


    /* =========================================
       FIND INVENTORY ITEM
    ========================================= */

    const inventoryItem =
        inventoryData.find(item =>
            String(
                item["Part Number"] || ""
            ).trim() === sku
        );


    /* =========================================
       FIND ELEMENTS INSIDE CARD
    ========================================= */

    const quantityElement =
        card.querySelector(
            ".consumable-quantity"
        );


    const progressElement =
        card.querySelector(
            ".material-progress-bar"
        );


    const percentageElement =
        card.querySelector(
            ".consumable-percentage"
        );


    const baselineElement =
        card.querySelector(
            ".consumable-baseline"
        );


    const unitElements =
        card.querySelectorAll(
            ".material-unit"
        );


    /* =========================================
       MAKE SURE REQUIRED ELEMENTS EXIST
    ========================================= */

    if (
        !quantityElement ||
        !progressElement ||
        !percentageElement
    ) {

        console.warn(
            "Consumable card is missing required elements:",
            card
        );

        return;

    }


    /* =========================================
       UPDATE UNIT
    ========================================= */

    unitElements.forEach(element => {

        element.textContent =
            unit;

    });


    /* =========================================
       UPDATE BASELINE
    ========================================= */

    if (baselineElement) {

        baselineElement.textContent =
            baseline.toLocaleString();

    }


    /* =========================================
       ITEM NOT FOUND
    ========================================= */

    if (!inventoryItem) {

        console.warn(
            `Consumable SKU not found: ${sku}`
        );


        quantityElement.textContent =
            "0";


        progressElement.style.width =
            "0%";


        percentageElement.textContent =
            "0%";


        progressElement.classList.remove(
            "material-good",
            "material-warning",
            "material-critical"
        );


        progressElement.classList.add(
            "material-critical"
        );


        return;

    }


    /* =========================================
       GET CURRENT QUANTITY
    ========================================= */

    const quantity =
        Number(
            inventoryItem["ON HAND"]
        ) || 0;


    /* =========================================
       CALCULATE PERCENTAGE
    ========================================= */

    let percentage = 0;


    if (baseline > 0) {

        percentage =
            (quantity / baseline) * 100;

    }


    /* =========================================
       PROGRESS BAR CANNOT EXCEED 100%
    ========================================= */

    const progressPercentage =
        Math.min(
            Math.max(percentage, 0),
            100
        );


    /* =========================================
       UPDATE QUANTITY
    ========================================= */

    quantityElement.textContent =
        quantity.toLocaleString();


    /* =========================================
       UPDATE PROGRESS BAR
    ========================================= */

    progressElement.style.width =
        progressPercentage + "%";


    /* =========================================
       UPDATE PERCENTAGE
    ========================================= */

    percentageElement.textContent =
        Math.round(percentage) + "%";


    /* =========================================
       RESET STATUS CLASSES
    ========================================= */

    progressElement.classList.remove(
        "material-good",
        "material-warning",
        "material-critical"
    );


    /* =========================================
       DETERMINE MATERIAL STATUS
    ========================================= */

    if (percentage <= criticalThreshold) {

        progressElement.classList.add(
            "material-critical"
        );

    }

    else if (percentage <= warningThreshold) {

        progressElement.classList.add(
            "material-warning"
        );

    }

    else {

        progressElement.classList.add(
            "material-good"
        );

    }

}