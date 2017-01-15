var savedText;	//Highlighted text
var ktActivated = false;	//Extension enabled?

//Query extension page on startup to determine if chrome app should start enabled
$(function(){
	chrome.runtime.sendMessage({type: "enabled?"}, function(response) {
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
	if (ev.keyCode == 90) { //if z is pressed
		console.log(savedText);
		//updateStatistics
	}
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
function showPopup(ev){
	var mainDoc = window.document;
	var ktPopupBoxHTML = mainDoc.getElementById('ktPopupBox');
	var $ktPopupBoxHTML = $(ktPopupBoxHTML);

    //Disable popup if nothing is selected
    if (savedText == ""){
        $ktPopupBoxHTML.css("visibility", "hidden");
        return;
    }else{
        $ktPopupBoxHTML.css("visibility", "visible");
    }

	//Initialize ktPopupBox HTML and CSS if not yet initialized
	if (!ktPopupBoxHTML) {
        var $ktPopupBoxCSS = $('<link />').appendTo('head');
        $ktPopupBoxCSS.attr({
        	type: "text/css",
			rel: "stylesheet",
			href: chrome.extension.getURL("css/ktPopup.css")
        });
        console.log("ktPopupBox CSS Initialized");

        $ktPopupBoxHTML = $('<div />').appendTo('body');
        $ktPopupBoxHTML.attr('id', 'ktPopupBox');
        console.log("ktPopupBox HTML Initialized");
	}

    //Updates html within ktPopupBox to show relevant content
    $ktPopupBoxHTML.html(savedText);

    //Updates ktPopupBox position
	$ktPopupBoxHTML.css("top", ev.clientY);
	$ktPopupBoxHTML.css("left", ev.clientX);

}

//Return text currently highlighted by user
function getSelectionText() {
	var text = "";
	if (window.getSelection) {
		text = window.getSelection().toString();
	} else if (document.selection && document.selection.type != "Control"){
		text = document.selection.createRange().text;
	}
	return text;
}

