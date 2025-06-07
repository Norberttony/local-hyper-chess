
// allows the user to scroll through the PGN.

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
                gameState.flip();
                break;

            // if no bound key was hit, do not prevent event default.
            default:
                return;
        }
        event.preventDefault();
    }
});


/* mobile user holds down next/back buttons */

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

    function startHold(event){
        event.preventDefault();
        cancelHold(event);
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

    function cancelHold(event){
        event.preventDefault();
        clearTimeout(holdTimeout);
    }

    elem.addEventListener("pointerdown", startHold);
    elem.addEventListener("pointerleave", cancelHold);
    elem.addEventListener("pointerup", cancelHold);

    // disable text highlighting on iOS when screen is held down for a short period of time.
    function preventTouch(event){
        event.preventDefault();
    }

    elem.addEventListener("touchstart", preventTouch);
    elem.addEventListener("touchmove", preventTouch);
    elem.addEventListener("touchend", preventTouch);
    elem.addEventListener("touchcancel", preventTouch);
}
