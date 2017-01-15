var ktActivated = false;    //Extension enabled?

//Toggle ktPopup when browser icon is pressed
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({}, function(tabs) {
        for (var i=0; i<tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, {type: "toggleKt"});
        }
    });
    //Store whether extension is enabled or not
    if (ktActivated == false){
        ktActivated = true;
    }else{
        ktActivated = false;
    }
});

//Respond to tab messages received
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
      switch(request.type) {
          //Reply whether startup tab should enable itself
          case "enabled?":
              sendResponse({status: ktActivated});
      }
  }
);