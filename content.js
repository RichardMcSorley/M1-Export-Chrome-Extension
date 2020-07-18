chrome.runtime.onMessage.addListener(function (request) {
    if(request === 'save') save();
    if(request === 'copy') copy();
});

function getData(){
    const commaRows = [];
    const tabbedRows = [];
    const headers = [
            "Ticker",
            "Quantity",
            "Cost Per Share",
        ];
    
    try{
        
        const elmRows = document.querySelectorAll('a[href*="position"]');
        if(!elmRows) throw('no rows');

        elmRows.forEach((elm)=>{
            const [
                ticker,
                _,
                shares,
                price,
            ] = elm.querySelectorAll('span');


            commaRows.push([
                ticker.textContent,
                shares.textContent,
                price.textContent,
            ].join(','));

            tabbedRows.push([
                ticker.textContent,
                shares.textContent,
                price.textContent,
            ].join('\t'));

        });

    } catch(error){
        console.error(error);
        commaRows.push(['Error getting holdings']);
        tabbedRows.push(['Error getting holdings']);
    }

    return {
        headers,
        tabbedRows,
        commaRows
    }
}

function save(){
    const { commaRows, headers } = getData();
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${headers.join(',')}\n${commaRows.join('\n')}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "m1.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click(); // This will download the file
    link.remove();
    console.log('Saved holdings to CSV.')
}

function copy() {
    const { tabbedRows, headers } = getData();
    navigator.clipboard.writeText(`${headers.join('\t')}\n${tabbedRows.join('\n')}`).then(() => {
        console.log('Copied holdings into clipboard.')
    }, (e) => {
        console.log('Could not copy holdings into clipboard.', e)
        alert('Could not copy holdings into clipboard. Please try again.')
    });
}

