// handles certain elements pertaining to the network
// of course, things such as offering a draw or rematch, or player names and connections.
// just functions that manipulate elements to display information relating to the network...

var outputElem = document.getElementById("output");

// disable current game controls and enable pregame controls
function activatePreGameControls(){
    widgets.pgn.disable();
    widgets.extras.enable();
}

// disable pregame controls and enable game controls
function activateGameControls(){
    widgets.pgn.enable();
    widgets.extras.disable();
}

activatePreGameControls();

// sets up board and starts the game
// side is -1 for black, 1 for white, and 0 for spectator
function setUpBoard(side){
    // clear controls and views
    document.getElementById("output").innerText = "";
    document.getElementById("result-box_rematch").innerText = "Offer Rematch";
    document.getElementById("panel_rematch").innerText = "Offer Rematch";

    // clears board
    gameState.loadFEN(StartingFEN);

    if (side != 0){
        setFlip(side == -1);
        if (side == 1)
            gameState.setSide(Piece.white);
        else
            gameState.setSide(Piece.black);
    }else{
        gameState.allowedSides[Piece.white] = false;
        gameState.allowedSides[Piece.black] = false;
    }
    gameState.allowVariations = false;

    whiteInfoElem.style.display = "flex";
    blackInfoElem.style.display = "flex";

    // set up names.
    if (side == 1){
        widgets.players.setNames("Anonymous (You)", "Anonymous (Opponent)");
    }else if (side == -1){
        widgets.players.setNames("Anonymous (Opponent)", "Anonymous (You)");
    }else{
        widgets.players.setNames("Anonymous", "Anonymous");
    }

    // disables any elements that should not be active during a live game.
    if (side != 0)
        activateGameControls();
    else
        activatePreGameControls();
}

let resigning = false;
function resign(){
    if (resigning)
        return;

    const c = confirm("Are you sure you want to resign?");
    if (!c)
        return;

    resigning = true;
    pollDatabase("POST", {
        type: "resign",
        id: getMyId()
    })
        .then((info) => {
            console.log(info);
        })
        .catch((err) => {
            alert(err);
        })
        .finally(() => {
            resigning = false;
        });
}

let drawing = false;
function offerDraw(){
    if (drawing)
        return;

    const c = confirm("Are you sure you want to offer a draw?");
    if (!c)
        return;

    drawing = true;
    pollDatabase("POST", {
        type: "draw",
        id: getMyId()
    })
        .then((info) => {
            console.log(info);
        })
        .catch((err) => {
            alert(err);
        })
        .finally(() => {
            drawing = false;
        });
}

let rematching = false;
function offerRematch(){
    if (NETWORK.rematchId){
        // button can teleport you to the rematch game
        changeHash(`#game=${NETWORK.rematchId}`);
        delete NETWORK.rematchId;
    }else{
        // or can offer a rematch to the opponent
        if (rematching)
            return;

        rematching = true;
        pollDatabase("POST", {
            type: "rematch",
            id: getMyId()
        })
            .then((info) => {
                console.log(info);
            })
            .catch((err) => {
                alert(err);
            })
            .finally(() => {
                rematching = false;
            });
    }
}
