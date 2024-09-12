
// allows the user to scroll through the PGN.

function clearPGNView(){
    pgnElem.innerHTML = "";
}

let selectedVariation = 0;
function PGNMoveBack(){
    if (gameState.previousVariation())
        gameState.applyChanges();
    selectedVariation = 0;
}

function PGNMoveForward(){
    if (gameState.nextVariation(selectedVariation))
        gameState.applyChanges();
    selectedVariation = 0;
}

function PGNUpVariation(){
    selectedVariation--;
    if (selectedVariation < 0){
        selectedVariation = gameState.currentVariation.next.length - 1;
    }
}

function PGNDownVariation(){
    selectedVariation = (selectedVariation + 1) % gameState.currentVariation.next.length;
}

function PGNMoveFirst(){
    // displays position with no moves made on the board
    gameState.jumpToVariation(gameState.variationRoot);
    gameState.applyChanges();
}

function PGNMoveLast(){
    // displays position of the last committed move in the main variation
    let iter = gameState.currentVariation;
    while (iter.next[0]){
        iter = iter.next[0];
    }

    gameState.jumpToVariation(iter);
    gameState.applyChanges();
}

// key binds for scrolling through moves
document.body.addEventListener("keydown", function(event){
    if (event.target == document.body){
        switch(event.key.toLowerCase()){
            case "arrowleft":
                PGNMoveBack();
                break;
            case "arrowright":
                PGNMoveForward();
                break;
            case "arrowup":
                PGNUpVariation();
                break;
            case "arrowdown":
                PGNDownVariation();
                break;

            case "f":
                flipBoard();
                break;

            // if no bound key was hit, do not prevent event default.
            default:
                return;
        }
        event.preventDefault();
    }
});


/* mobile user holds down next/back buttons */
const pgn_control_prevElem = document.getElementById("pgn_control_prev");
const pgn_control_nextElem = document.getElementById("pgn_control_next");

function addPointerHoldListener(elem, action){
    let holdTimeout;

    // times in ms, maxTime represents initial wait time for action and minTime represents
    // the lowest possible wait time for action
    let maxTime = 400;
    let minTime = 150;
    let time;

    // go through "maxTimes" moves before speeding up
    let maxTimes = 4;
    let times;

    function startHold(){
        cancelHold();
        time = maxTime;
        times = 0;
        pingHold();
    }

    function pingHold(){
        action();

        holdTimeout = setTimeout(pingHold, time);
        if (++times == maxTimes){
            time = Math.max(minTime, time / 1.2);
            times = 0;
        }
    }

    function cancelHold(){
        clearTimeout(holdTimeout);
    }

    elem.addEventListener("pointerdown", startHold);
    elem.addEventListener("pointerleave", cancelHold);
    elem.addEventListener("pointerup", cancelHold);
}

addPointerHoldListener(pgn_control_nextElem, PGNMoveForward);
addPointerHoldListener(pgn_control_prevElem, PGNMoveBack);
