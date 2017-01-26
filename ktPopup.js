var savedText;	//Highlighted text
var ktActivated = false;	//Extension enabled?

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
	var key = savedText;
    chrome.storage.sync.get(key, function(obj){
        if (obj[key] == undefined){
            values[key] = {"marks":1};
		}else if (obj[key]["marks"] == undefined) {
        	values[key] = obj[key];
            values[key]["marks"] = 1;
        }else{
            values[key] = obj[key];
            values[key]["marks"] = obj[key]["marks"] + 1;
		}
        chrome.storage.sync.set(values);
		updateKtHTML();
    });
}

//Modify priority of selected character
function changePriority(){
    var values = {};
    var key = savedText;
    values[key] = {"priority":"none"};
    chrome.storage.sync.get(key, function(obj){
        if (obj[key] == undefined){
            values[key] = {"priority":"low"};
        }else if (obj[key]["priority"] == undefined) {
            values[key] = obj[key];
            values[key]["priority"] = "low";
        }else{
            values[key] = obj[key];
        	switch (obj[key]["priority"]){
				case "none": values[key]["priority"] = "low"; break;
                case "low": values[key]["priority"] = "med"; break;
                case "med": values[key]["priority"] = "high"; break;
                case "high": values[key]["priority"] = "none"; break;
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
    var key = savedText;
    values[key] = {};
    chrome.storage.sync.set(values, function(){
        updateKtHTML();
        updateKtBoxColor();
	});
}

//Updates display text if selected text is changed
function onMouseMove(ev){
	var updatedText = getSelectionText();
	if (updatedText != savedText){
		savedText = updatedText;
        showPopup(ev)
	}
}

//Displays appropriate statistics in ktPopupBox
function showPopup(ev) {
    var mainDoc = window.document;
    var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
    var $ktPopupBoxHTML = $(ktPopupBoxHTML);

    //Disable popup if nothing is selected
    if (savedText == "") {
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
	var marks = 0;
	var priority = "none";

    $(".ktVocab").html(savedText);
    chrome.storage.sync.get(savedText, function(obj){
    	if (obj[savedText] != undefined){
    		if (obj[savedText]["marks"] != undefined){
    			marks = obj[savedText]["marks"];
			}
            if (obj[savedText]["priority"] != undefined){
                priority = obj[savedText]["priority"];
            }
		}
        $(".ktStatistics").html(marks + " Mark(s), Priority: " + priority);
    });
}

//Updates CSS within ktPopupBox
function updateKtCSS(ev){
    var mainDoc = window.document;
    var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
    var $ktPopupBoxHTML = $(ktPopupBoxHTML);
    $ktPopupBoxHTML.css("top", ev.clientY);
    $ktPopupBoxHTML.css("left", ev.clientX);
	updateKtBoxColor();
}

//Update priority color for ktPopupBox
function updateKtBoxColor(){
    var mainDoc = window.document;
    var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
    var $ktPopupBoxHTML = $(ktPopupBoxHTML);
    chrome.storage.sync.get(savedText, function(obj){

    	//default case
        $ktPopupBoxHTML.css("background", "#2F4F4F");

        if (obj[savedText] != undefined) {
            if (obj[savedText]["priority"] != undefined) {
                switch (obj[savedText]["priority"]) {
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
    var mainDoc = window.document;
    var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
    var $ktPopupBoxHTML = $(ktPopupBoxHTML);
    var $ktPopupBoxCSS = $('<link />').appendTo('head');
    $ktPopupBoxCSS.attr({
        type: "text/css",
        rel: "stylesheet",
        href: chrome.extension.getURL("css/ktPopup.css")
    });
    console.log("ktPopupBox CSS Initialized");

    $ktPopupBoxHTML = $('<div />').appendTo('body');
    $ktPopupBoxHTML.attr('id', 'ktPopupBox');
    $ktPopupBoxHTML.append("<div class = 'ktVocab' />");
    $ktPopupBoxHTML.append("<div class = 'ktStatistics' />");
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

