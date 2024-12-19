
// disable current game controls and enable pregame controls
function activatePreGameControls(){
    widgets.network.active = true;
    widgets.network.disable();
    widgets.extras.enable();
}

// disable pregame controls and enable game controls
function activateGameControls(){
    widgets.network.enable();
    widgets.extras.disable();
}

activatePreGameControls();
