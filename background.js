const documentUrlPatterns = ["https://dashboard.m1finance.com/d/invest/holdings"];

function send(type){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage( tabs[0].id, type);
    });
}

chrome.contextMenus.create({
    id: "m1ToCSV",
    title: 'Copy/Save Holdings',
    documentUrlPatterns,
});

chrome.contextMenus.create({
    id: "m1ToCSV-save",
    parentId: "m1ToCSV",
    title: 'Save to CSV',
    onclick: ()=>send('save'),
    documentUrlPatterns,
});

chrome.contextMenus.create({
    id: "m1ToCSV-copy",
    parentId: "m1ToCSV",
    title: 'Copy to clipboard',
    onclick: ()=>send('copy'),
    documentUrlPatterns,
});

