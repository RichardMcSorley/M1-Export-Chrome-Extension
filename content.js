chrome.runtime.onMessage.addListener(function (request) {
    if (request === "save") save();
    if (request === "copy") copy();
});

function getData() {
    const commaRows = [];
    const tabbedRows = [];
    // First 3 lines of headers should not move, the order is to support simply safe dividends
    const headers = [
        "Ticker",
        "Shares",
        "Avg. Price",
        "Name",
        "Maintenance",
        "Unrealized Gain",
        "Unrealized Gain %",
        "Value"
    ];

    try {
        // Find row elements -> find values in each row -> extract text
        const rows = [
            ...document.querySelectorAll('a[href*="position"]')
        ].map(elm =>
            [...elm.querySelectorAll("span")].map(elm => elm.textContent)
        );

        rows.forEach(row => {
            const [
                ticker, // MAIN
                name, // Main Street Capital Corp.
                shares, // 12.63455
                price, // $30.32
                maintenance, // 45%
                gain, // +$18.31 (▲4.78%)
                gain1, // +$18.31
                gain2, // ▲4.78%
                gain3, // ▲
                gain4, // 4.78%
                value // $401.40
            ] = row;

            const newRow = [
                // First 3 lines  should not move, the order is to support simply safe dividends
                ticker,
                shares,
                price,
                name.replace(",", ""), // escape , for CSV. Ex. CompanyName , Inc.
                maintenance,
                gain1.replace("+", ""), // remove + value, most spreadsheet software interpret no value as positive
                gain2.replace("▲", "").replace("▼", "-"), // replace symbols with positive or negative values
                value
            ];
            commaRows.push(newRow.join(","));
            tabbedRows.push(newRow.join("\t"));
        });
    } catch (error) {
        console.error(error);
        commaRows.push(["Error getting holdings"]);
        tabbedRows.push(["Error getting holdings"]);
    }

    return {
        headers,
        tabbedRows,
        commaRows
    };
}

function save() {
    const { commaRows, headers } = getData();
    const encodedUri = encodeURI(
        `data:text/csv;charset=utf-8,${headers.join(",")}\n${commaRows.join(
            "\n"
        )}`
    );
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "m1.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    console.log("Saved holdings to CSV.");
}

function copy() {
    const { tabbedRows, headers } = getData();
    navigator.clipboard
        .writeText(`${headers.join("\t")}\n${tabbedRows.join("\n")}`)
        .then(
            () => {
                console.log("Copied holdings into clipboard.");
            },
            e => {
                console.log("Could not copy holdings into clipboard.", e);
                alert(
                    "Could not copy holdings into clipboard. Please try again."
                );
            }
        );
}
