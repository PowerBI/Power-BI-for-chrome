var contextMenuItemForSelection = {
	"id": "analyzeInPowerBI",
	"title": "Analyze in Power BI",
	"contexts": ["selection"]
};
chrome.contextMenus.create(contextMenuItemForSelection);

chrome.contextMenus.onClicked.addListener(function (clickData) {
    

    // send selection text to OneNote
    if (clickData.menuItemId == "analyzeInPowerBI" && clickData.selectionText) {
        //console.log("Selected text: " + clickData.selectionText); // selected data without html

        //Select current tab to send message
        chrome.tabs.query({
            "active": true,
        }, function(tabs) {
            //It returns array so looping over tabs result
            for (tab in tabs) {

                //Send Message to a tab
                chrome.tabs.sendMessage(tabs[tab].id, {
                    method: "getSelection"
                });
            }
        });
    }
});

//Adding a handler when message is recieved from content scripts
chrome.extension.onMessage.addListener(function (response, sender) {
    chrome.storage.local.get("access_token", function (result) {

        // Find the access token first or ask for login.
        chrome.storage.local.get("access_token", function (result) {
            if (result.access_token != null) {
                // First create Dataset
                var rowHeadings = response.data;
                console.log(rowHeadings); // this is the json text for row headings returned from script1.js
                var url = SendtoPBI('https://api.powerbi.com/beta/myorg/Datasets', rowHeadings, result.access_token);
                alert('Table Name: ' + response.tableName);

                // Send the rowes
                var rowData = response.rows; // This is the json text for row data returned from script1.js
                console.log(rowData);
                SendtoPBI(url + '/Tables/' + response.tableName + '/rows', rowData, result.access_token);
                

            } else {
                alert('Please sign in first.');
            }
        });
    
    });
});

function SendtoPBI(url, data, access_token) {

    
        // Create new HTTP POST request
        var XHR = new XMLHttpRequest();
        XHR.open('POST',url,false);

        XHR.setRequestHeader('Content-Type', 'application/json'); 
        XHR.setRequestHeader('Authorization', 'Bearer ' + access_token);
        // Send the request
        XHR.send(data);
        // TODO: Handle response errors
        console.log(XHR.response);
        
        var location = XHR.getResponseHeader("Location");
        
        return location;
        
            



}