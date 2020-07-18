const ROW_LENGTH = 11;

chrome.runtime.onMessage.addListener(function (request) {
    if (request === "save") save();
    if (request === "copy") copy();
});

function getData(joinRowsBy) {
    // First 3 lines of headers should not move, the order is to support simply safe dividends
    let headers = [
        "Ticker",
        "Shares",
        "Avg. Price",
        "Name",
        "Maintenance",
        "Unrealized Gain",
        "Unrealized Gain %",
        "Value"
    ];
    let rows = [];

    try {
        rows = getPositions();
        // Theres no data to export
        if (rows.length === 0) throw "Could not find positions on this page!";
        // Remove headers because our output was greater than expected
        if (rows[0].length !== ROW_LENGTH) headers = [];
        // now map the rows
        rows = rows.map(row => mapPositionValue(row, joinRowsBy));
    } catch (error) {
        console.error(error);
        headers = ["Error", "Error Message"];
        rows = [
            ["Something went wrong.", JSON.stringify(error)].join(joinRowsBy)
        ];
    }
    return { headers, rows };
}

function getPositions() {
    return [...document.querySelectorAll('a[href*="position"]')].map(elm =>
        [...elm.querySelectorAll("span")].map(elm => elm.textContent)
    );
}

function mapPositionValue(row, joinRowsBy) {
    const sanitized = sanitize(row);
    // More rows than we expect! Panic and return everything! Likely out of order
    if (sanitized.length !== ROW_LENGTH) return sanitized.join(joinRowsBy);

    const [
        ticker, // MAIN
        name, // Main Street Capital Corp.
        shares, // 12.63455
        price, // $30.32
        maintenance, // 45%
        _gain, // +$18.31 (▲4.78%)
        gain1, // +$18.31
        gain2, // ▲4.78%
        _gain3, // ▲
        _gain4, // 4.78%
        value // $401.40
    ] = sanitized;

    return [
        // First 3 lines  should not move, the order is to support simply safe dividends
        ticker,
        shares,
        price,
        name,
        maintenance,
        gain1,
        gain2,
        value
    ].join(joinRowsBy);
}

function sanitize(row) {
    return row.map(v => v.replace(/\,|\+|\▲/g, "").replace("▼", "-"));
}

function save() {
    const { headers, rows } = getData(",");
    const encodedUri = encodeURI(
        `data:text/csv;charset=utf-8,${headers.join(",")}\n${rows.join("\n")}`
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
    const { headers, rows } = getData("\t");
    navigator.clipboard
        .writeText(`${headers.join("\t")}\n${rows.join("\n")}`)
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
