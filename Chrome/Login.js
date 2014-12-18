console.log(window.location.href);

if (window.location.origin == "https://login.live.com") {
    
    var hash = window.location.href.split('?')[1];
    // get access code
    var start = hash.indexOf("code=");
    if (start >= 0) {
        start = start + "code=".length;

        var end = hash.indexOf("&session_state");

        var access_code = hash.substring(start, end);
        //alert(access_code);

        // Get Access token
        var XHR = new XMLHttpRequest();
        XHR.open('POST', 'https://login.windows.net/common/oauth2/token', false);

        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        
        //Replace client app ID 
        var clientId = '"{ClientID}';

        XHR.send('client_id='+ clientId +'&redirect_uri=https://login.live.com/oauth20_desktop.srf&grant_type=authorization_code&code=' + access_code);
        console.log(XHR.response);

        var access_token;
        JSON.parse(XHR.response, function (k, v) {
            if (k.toString() === 'access_token') {
                access_token = v;
                return;
            }
        });
        console.log(access_token);

        // Store it
        chrome.storage.local.set({ "access_token": access_token });

        // Close the window
        window.close();
    }
}

