var token;

$('a#signout').click(function () {
    chrome.storage.local.remove("access_token");
    alert("You have logged out.");
    return false;
});



$('a#signin').click(function () {

    //Set your clientId
    var clientId = '"{ClientID}';

    // Pop up login window
    newwindow = window.open('https://login.windows.net/common/oauth2/authorize?resource=https%3A%2F%2Fanalysis.windows.net%2Fpowerbi%2Fapi&client_id='+clientId+'&response_type=code&redirect_uri=https://login.live.com/oauth20_desktop.srf&site_id=500453', 'name', 'height=700,width=550');

    
    
});


