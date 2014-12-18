// Watches for the Live Login Popup to store token and closes the window.
$(window).load(function () {
    if (window.location.origin == "https://login.live.com") {
        var hash = window.location.hash;
        // get access token
        var start = hash.indexOf("#access_token=");
        if (start >= 0) {
            start = start + "#access_token=".length;

            var end = hash.indexOf("&token_type");

            var access_token = hash.substring(start, end);
            //alert(access_token);

            // Store it
            chrome.storage.local.set({ "access_token": access_token });

            // Close the window
            window.close();
        }
    }
});

chrome.extension.onMessage.addListener(function(request, sender) {
    //Hanlde request based on method
    if (request.method == "getSelection") {
        var range = window.getSelection().getRangeAt(0);
        var content = range.cloneContents();

        $('body').append('<span id="selection_html_placeholder"></span>');
        var placeholder = document.getElementById('selection_html_placeholder');
        placeholder.appendChild(content);

        // TODO: Get better table name
        var randomNumber = Math.floor(Math.random() * 10000);
        var tablename = window.location.hostname.replace('.', '_') + "_" + randomNumber.toString();
        tablename = tablename.replace("www_", "").replace(".com", "").replace(".","");
        //var tablename = "Chromedata_" + randomNumber.toString();

        var htmlContent = "<table>" + placeholder.innerHTML + "</table>";
        var rowdata= getRowData();
        var headings = getRowHeadings(tablename); 

        $('#selection_html_placeholder').remove();


        chrome.extension.sendMessage({
            data: headings,
            rows: rowdata,
            tableName: tablename,
        });
    } else chrome.extension.sendMessage({}); // snub them.
});

// A function that returns the json for data rows of a table
// Test the code at http://jsfiddle.net/u7nKF/1/
function getRowData() {
    var rows = { rows: [] };
    var $th = $('#selection_html_placeholder th');
    $('#selection_html_placeholder tr').each(function (i, tr) {
        var obj = {}, $tds = $(tr).find('td');
        $th.each(function (index, th) {
            obj[$(th).text().trim()] = $tds.eq(index).text().toString().trim();
            //obj[$(th).text().replace(/[^a-zA-Z 0-9]+/g, '').trim()] = $tds.eq(index).text().toString().trim();
        });
        rows.rows.push(obj);
    });

    rows.rows.shift(); // Remove the headers
    return JSON.stringify(rows);
}

// A function that returns the json required for the row headings of a table
function getRowHeadings(tableName) {
    var fields = [];
    var $th = $('#selection_html_placeholder th');

    $('#selection_html_placeholder th').each(function (i, th) {
        var obj = {};
        //obj['name'] = $(th).text().replace(/[^a-zA-Z 0-9]+/g, '').trim();
        obj['name'] = $(th).text().trim();
        obj['DataType'] = 'string'; // TODO: Get the real data type
        fields.push(obj);
    });

    var body = { Name: tableName, Tables: [] }; // TODO ask the user for the table name
    var table = {};
    table['Name'] = tableName; // TODO ask the user for the table name
    table['Columns'] = fields;
    body.Tables[0] = table;

    return JSON.stringify(body);
}
