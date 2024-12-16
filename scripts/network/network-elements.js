// handles certain elements pertaining to the network
// of course, things such as offering a draw or rematch, or player names and connections.
// just functions that manipulate elements to display information relating to the network...

// disable current game controls and enable pregame controls
function activatePreGameControls(){
    widgets.network.disable();
    widgets.extras.enable();
}

// disable pregame controls and enable game controls
function activateGameControls(){
    widgets.network.enable();
    widgets.extras.disable();
}

activatePreGameControls();
