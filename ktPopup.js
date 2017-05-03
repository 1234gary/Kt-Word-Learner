
var highlightedText = "";
var ktActivated = false;

//Properties of Saved Word
function savedWord(numberOfTimesSeen, priority){
    this.timesSeen = numberOfTimesSeen;
    this.priority = priority;
}

//Query extension page on startup to determine if chrome app should start enabled
$(function(){
	chrome.runtime.sendMessage({type: "enabled?"}, function(response) {
        //chrome.storage.sync.clear();
		console.log('queried');
        if ((ktActivated == false) && (response.status == true)) {
            toggleKt();
        }
	});
});

//Respond to tab messages received
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
        console.log("message received");
		switch(request.type) {
			//Toggle ktPopup
			case "toggleKt":
                toggleKt();
        }
	}
);

//Toggle ktPopup when browser icon is pressed
function toggleKt(){
	if (ktActivated == false) {
		ktActivated = true;
		console.log("activated");
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("mousemove", onMouseMove, false);
	}else{
		ktActivated = false;
        console.log("deactivated");
        document.removeEventListener("keydown", onKeyDown, true);
        document.removeEventListener("mousemove", onMouseMove, false);
	}
}

//Displays word statistics in ktPopupBox
function onKeyDown(ev){
	if ((ev.shiftKey == true)|(ev.ctrlKey == true)|(ev.altKey == true)|(ev.metaKey == true)){
		return;
	}
	if (ev.keyCode == 90) { //if z is pressed
		storeMarkedData();
	}else if (ev.keyCode == 88) { //if x is pressed
        changePriority();
	}else if (ev.keyCode == 86) { //if v is pressed
        clearMarkedData();
	}
}

//Modify marked count of selected character
function storeMarkedData(){
	var values = {};
	var key = highlightedText;
    chrome.storage.sync.get(key, function(obj){
        if (obj[key] == undefined){
            values[key] = new savedWord(1, "none");
        }else{
            values[key] = obj[key];
            values[key].timesSeen += 1;
		}
        chrome.storage.sync.set(values);
		updateKtHTML();
    });
}

//Modify priority of selected character
function changePriority(){
    var values = {};
    var key = highlightedText;
    values[key] = {"priority":"none"};
    chrome.storage.sync.get(key, function(obj){
        if (obj[key] == undefined){
            values[key] = new savedWord(0,"low");
        }else{
            values[key] = obj[key];
        	switch (values[key].priority){
				case "none": values[key].priority = "low"; break;
                case "low": values[key].priority = "med"; break;
                case "med": values[key].priority = "high"; break;
                case "high": values[key].priority = "none"; break;
			}
        }
        chrome.storage.sync.set(values);
        updateKtHTML();
        updateKtBoxColor();
    });
}

//Clear all data of selected character
function clearMarkedData(){
    var values = {};
    var key = highlightedText;
    values[key] = undefined;
    chrome.storage.sync.set(values, function(){
        updateKtHTML();
        updateKtBoxColor();
	});
}

//Updates display text if selected text is changed/rikaikun text is changed
function onMouseMove(ev){
    setTimeout(function(){
        var mainDoc = window.document;
        var rikaikun = mainDoc.getElementById('rikaichan-window');
        if (rikaikun){ //if rikaikun is in use, take text from rikaikun's display
            var rikaiText = $(rikaikun).text();
            if (rikaiText != ""){
                var i = 0;
                while (rikaiText[i] != " " && rikaiText[i] != "("){
                    i += 1;
                }
                rikaiText = rikaiText.substring(0,i);
            }
            if (rikaiText != highlightedText){
                highlightedText = rikaiText;
                showPopup(ev)
            }
        }
        else{ //else just take the highlighted text
            var updatedText = getSelectionText();
            if (updatedText != highlightedText){
                highlightedText = updatedText;
                showPopup(ev)
            }
        }
    }, 100);
}

//Displays appropriate statistics in ktPopupBox
function showPopup(ev) {
    var mainDoc = window.document;
    var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
    var $ktPopupBoxHTML = $(ktPopupBoxHTML);

    //Disable popup if nothing is selected
    if (highlightedText == "") {
        $ktPopupBoxHTML.css("visibility", "hidden");
        return;
    } else {
        $ktPopupBoxHTML.css("visibility", "visible");
    }

    //Initialize ktPopupBox HTML and CSS if not yet initialized
    if (!ktPopupBoxHTML) {
        initKtPopupBox();
    }
    updateKtHTML();
    updateKtCSS(ev);
}

//Updates HTML within ktPopupBox to show relevant content
function updateKtHTML(){
	var numberOfMarksOnWord = 0;
	var priority = "none";
    var key = highlightedText;

    $(".ktVocab").html(highlightedText + " ");
    chrome.storage.sync.get(key, function(obj){
    	if (obj[key] != undefined){
            numberOfMarksOnWord = obj[key].timesSeen;
            priority = obj[key].priority;
		}
        $(".ktStatistics").html(numberOfMarksOnWord + " Mark(s), Priority: " + priority);
    });
}

//Updates CSS within ktPopupBox and rikaikun
function updateKtCSS(ev){
    var mainDoc = window.document;
    var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
    var $ktPopupBoxHTML = $(ktPopupBoxHTML);


    var rikaikunCSS = mainDoc.getElementById('rikaichan-window');
    if (!rikaikunCSS){
        $ktPopupBoxHTML.css("top", window.scrollY + ev.clientY + 30);
        $ktPopupBoxHTML.css("left", window.scrollX + ev.clientX);
	}else{
        $(rikaikunCSS).css("padding-top", 35);
        $ktPopupBoxHTML.css("top", $(rikaikunCSS).css("top"));
        $ktPopupBoxHTML.css("left", $(rikaikunCSS).css("left"));
	}


    updateKtBoxColor();
}

//Update priority color for ktPopupBox
function updateKtBoxColor(){
    var mainDoc = window.document;
    var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
    var $ktPopupBoxHTML = $(ktPopupBoxHTML);
    chrome.storage.sync.get(highlightedText, function(obj){

    	//default case
        $ktPopupBoxHTML.css("background", "#2F4F4F");

        if (obj[highlightedText] != undefined) {
            if (obj[highlightedText]["priority"] != undefined) {
                switch (obj[highlightedText]["priority"]) {
                    case "low":
                        $ktPopupBoxHTML.css("background", "#006600");
                        break;
                    case "med":
                        $ktPopupBoxHTML.css("background", "#CCCC00");
                        break;
                    case "high":
                        $ktPopupBoxHTML.css("background", "#ff4d4d");
                        break;
                }
            }
        }
    });
}


//Initializes ktPopupBox HTML and CSS
function initKtPopupBox(){
    var $ktPopupBoxCSS = $('<link />').appendTo('head');
    $ktPopupBoxCSS.attr({
        type: "text/css",
        rel: "stylesheet",
        href: chrome.extension.getURL("css/ktPopup.css")
    });
    console.log("ktPopupBox CSS Initialized");

    $ktPopupBoxHTML = $('<div />').appendTo('body');
    $ktPopupBoxHTML.attr('id', 'ktPopupBox');
    $ktPopupBoxHTML.append("<span class = 'ktVocab' />");
    $ktPopupBoxHTML.append("<span class = 'ktStatistics' />");
    console.log("ktPopupBox HTML Initialized");
}

//Return text currently highlighted by user
function getSelectionText(){
	var text = "";
	if (window.getSelection) {
		text = window.getSelection().toString();
	} else if (document.selection && document.selection.type != "Control"){
		text = document.selection.createRange().text;
	}
	return text;
}

