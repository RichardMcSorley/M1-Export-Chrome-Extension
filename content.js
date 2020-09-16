const ROW_LENGTH = 12;

const HEADERS = {
  m1: [
      "Ticker",
      "Name",
      "Shares",
      "Avg. Price",
      "Cost Basis",
      "Unrealized Gain",
      "Unrealized Gain %",
      "Value"
  ],
  // Simply Safe requires the first 3 headers to be ticker,
  // shares, and avg. price.
  ss: [
      "Ticker",
      "Shares",
      "Avg. Price",
      "Name",
      "Cost Basis",
      "Unrealized Gain",
      "Unrealized Gain %",
      "Value"
  ]
}

chrome.runtime.onMessage.addListener(function (request) {
    switch(request) {
        case "m1.save":
            save('m1');
            break;
        case "m1.copy":
            copy('m1');
            break;
        case "ss.save":
            save('ss');
            break;
        case "ss.copy":
            copy('ss');
            break;
        default:
            break;
    }
});

// format: 'ss' or 'm1', determines what order the data is in.
function getData(joinRowsBy, format) {
    let headers = HEADERS[format];
    let rows = [];

    try {
        rows = getPositions();
        // Theres no data to export
        if (rows.length === 0) throw "Could not find positions on this page!";
        // Remove headers because our output was greater than expected
        if (rows[0].length !== ROW_LENGTH) headers = [];
        // now map the rows
        rows = rows.map(row => mapPositionValue(row, joinRowsBy, format));
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

// format: 'ss' or 'm1', determines what order the data is in.
function mapPositionValue(row, joinRowsBy, format) {
    const sanitized = sanitize(row);
    // More rows than we expect! Panic and return everything! Likely out of order
    if (sanitized.length !== ROW_LENGTH) return sanitized.join(joinRowsBy);

    const [
        ticker, // MAIN
        name, // Main Street Capital Corp.
        shares, // 12.63455
        price, // $30.32
        costBasis, // $380.00
        maintenance, // 45%
        _gain, // +$18.31 (▲4.78%)
        gain1, // +$18.31
        gain2, // ▲4.78%
        _gain3, // ▲
        _gain4, // 4.78%
        value // $401.40
    ] = sanitized;

    let output = format === 'ss' ?
        [
            ticker,
            shares,
            price,
            name,
            costBasis,
            gain1,
            gain2,
            value
        ]
        :
        [
            ticker,
            name,
            shares,
            price,
            costBasis,
            gain1,
            gain2,
            value
        ]
    return output.join(joinRowsBy)
}

function sanitize(row) {
    return row.map(v => v.replace(/\,|\+|\▲/g, "").replace("▼", "-"));
}

// format: 'ss' or 'm1', determines what order the data is in.
function save(format) {
    const { headers, rows } = getData(",", format);
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

// format: 'ss' or 'm1', determines what order the data is in.
function copy(format) {
    const { headers, rows } = getData("\t", format);
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
