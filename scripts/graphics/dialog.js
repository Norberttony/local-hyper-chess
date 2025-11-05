
// handles displaying the dialog box to the user.

var preGameControlsElem = document.getElementById("pre-game-controls");

var dialog_box_containerElem = document.getElementById("dialog-box-container");
var dialog_boxElem = document.getElementById("dialog-box");
var dialog_box_titleElem = document.getElementById("dialog-box-title");
var dialog_box_descElem = document.getElementById("dialog-box-desc");

var result_boxElem = document.getElementById("result-box");
var panel_rematchElem = document.getElementById("panel_rematch");
var panel_goToBoardElem = document.getElementById("panel_go-to-board");

var invite_popup_containerElem = document.getElementById("invite-popup-container");
var invite_popupElem = document.getElementById("invite-popup");

export function showDialogContainer(){
    dialog_box_containerElem.style.display = "flex";
}

export function hideDialogContainer(){
    dialog_box_containerElem.style.display = "none";
}

export function showDialogBox(title, desc){
    hideResultBox();

    showDialogContainer();
    dialog_boxElem.style.display = "block";

    if (title && desc){
        document.getElementById("dialog_title").innerText = title;
        document.getElementById("dialog_desc").innerText = desc;
    }
}

export function hideDialogBox(){
    hideDialogContainer();

    dialog_boxElem.style.display = "none";
}

function displayResultBox(result, mewin, termination){
    // change text
    document.getElementById("result-box_result").innerText = result;
    document.getElementById("result_mewin").innerText = mewin;
    document.getElementById("how_span").innerText = termination;

    // hide other boxes
    hideDialogBox();

    // display
    showDialogContainer();
    result_boxElem.style.display = "block";
}

function hideResultBox(){
    result_boxElem.style.display = "none";
    hideDialogContainer();
}

function hideInvite(){
    invite_popup_containerElem.style.display = "none";
    invite_popupElem.style.display = "none";
}
