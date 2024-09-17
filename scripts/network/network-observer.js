
var containerElem = document.getElementById("container");

containerElem.addEventListener("single-scroll", (event) => {
    const { prevVariation, variation, userInput } = event.detail;

    if (!userInput)
        return;

    // ensure user is playing on main variation
    if (variation.isMain() && NETWORK.myColor){
        // the move wasn't from this user. let's send it over to the other user.
        console.log("SEND MOVE TO USER", variation.san);
        pollDatabase("POST", {
            type: "move",
            id: getMyId(),
            move: variation.san,
            moveNum: NETWORK.moveNum
        });

        // start waiting for opponent's move
        NETWORK.moveNum++;
    }
});

let keepWaitingForMove = true;
let waitForMoveActive = false;
function waitForMove(){
    console.log("Must wait for move", keepWaitingForMove, waitForMoveActive);
    if (waitForMoveActive)
        return;
    waitForMoveActive = true;
    keepWaitingForMove = true;

    console.log("Begin waiting");
    return new Promise(async (res, rej) => {
        while (keepWaitingForMove){
            try {
                const rawData = await pollDatabase("GET", {
                    type: "gameStatus",
                    moveNum: NETWORK.moveNum + 1,
                    id: getMyId()
                });
                console.log(rawData);

                const gameInfo = JSON.parse(rawData);

                if (!gameInfo || gameInfo.status == "err"){
                    res(gameInfo);
                    console.error(`Errored: ${gameInfo}`);
                }else if (gameInfo.status == "ok"){
                    if (gameInfo.offers){
                        networkHandleOffers(gameInfo.offers);
                    }

                    if (gameInfo.result){
                        setResult(gameInfo.result, gameInfo.term);
                    }

                    if (gameInfo.move){
                        if (networkHandleMove(gameInfo.move))
                            res(gameInfo);
                    }
                }
            }
            catch(err){
                console.error(err);
            }

            await sleep(1000);
        }
        waitForMoveActive = false;
    });
}

function stopWaitingForMove(){
    console.log("Stop waiting for move.");
    if (waitForMoveActive)
        keepWaitingForMove = false;
}

function networkHandleMove(move){
    const mySide = NETWORK.myColor == "white" ? Piece.white : Piece.black;

    const isSpectator = !NETWORK.myColor;
    const isMyTurn = NETWORK.moveNum % 2 == (mySide == Piece.white ? 1 : 0);
    console.log(`When handling move ${move}; isSpectator? ${isSpectator} isMyTurn? ${isMyTurn}`);
    if (!isSpectator && !isMyTurn)
        return false;

    if (gameState.currentVariation.isMain() && gameState.currentVariation.next.length == 0){
        const moveObj = gameState.board.getMoveOfSAN(move);
        if (moveObj){
            gameState.makeMove(moveObj);
            gameState.applyChanges();
            NETWORK.moveNum++;
        }else{
            console.error(`Could not interpret move from other player: ${move}`);
        }
    }else{
        gameState.addMoveToEnd(move);
        NETWORK.moveNum++;
    }

    return true;
}

function networkHandleOffers(offers){
    const potentialId = offers.split("_");
    if (potentialId.length > 1){
        // rematches reuse the player id
        storeUserId(potentialId[0], potentialId[1], NETWORK.userId);
        document.getElementById("result-box_rematch").innerText = "Go to rematch";
        document.getElementById("panel_rematch").innerText = "Go to rematch";

        NETWORK.rematchId = offers;
        return;
    }

    const mySide = NETWORK.myColor == "white" ? Piece.white : Piece.black;
    const myChar = mySide == Piece.white ? "w" : "b";

    const [ draw, takeback, rematch ] = offers.split("");

    let offerTxt = "";
    if (draw != "n"){
        if (draw != myChar)
            offerTxt += "Your opponent has offered you a draw";
        else
            offerTxt += "You have offered your opponent a draw";
    }
    if (takeback != "n"){
        if (takeback != myChar)
            offerTxt += "Your opponent has offered you a takeback";
        else
            offerTxt += "You have offered your opponent a takeback";
    }
    if (rematch != "n"){
        if (rematch != myChar){
            document.getElementById("result-box_rematch").innerText = "Accept Rematch?";
            document.getElementById("panel_rematch").innerText = "Accept Rematch?";
        }else{
            document.getElementById("result-box_rematch").innerText = "Rematch offer sent";
            document.getElementById("panel_rematch").innerText = "Rematch offer sent";
        }
    }

    if (!gameState.mainHasResult)
        outputElem.innerText = offerTxt;
    else
        outputElem.innerText = "";
}

function setResult(result, termination){
    // when there is a checkmate or a draw by either threefold or fifty move rule, then that result
    // will already be calculated by the game state, and isn't necessary to represent over the
    // network (unlike resignation or draws by agreement)
    if (!gameState.board.result){
        gameState.board.setResult(result, termination);
        gameState.dispatchEvent("result", {
            result:         result,
            turn:           gameState.board.turn,
            termination:    termination
        });

        panel_goToBoardElem.style.display = "block";

        gameState.mainHasResult = true;
    }
};

// displays a result box
containerElem.addEventListener("result", (event) => {
    // if player can play out variations, they're not spectating or playing a multiplayer game
    if (gameState.allowVariations)
        return;

    const { result, turn, termination } = event.detail;

    // get result text of game
    let resultNum;
    if      (result == "0-1" || (result == "#" && turn == Piece.white))
        resultNum = -1;
    else if (result == "1-0" || (result == "#" && turn == Piece.black))
        resultNum = 1;
    else
        resultNum = 0;

    // an on-board result will either be / or #, whereas a result from the server will either
    // be 1-0, 0-1, or 1/2-1/2. It is a bit confusing and likely needs reworking, but... this works
    if (result){
        let resultText;

        if (resultNum == -1){
            resultText = "0-1";
        }else if (resultNum == 1){
            resultText = "1-0";
        }else{
            resultText = "1/2-1/2";
        }

        pollDatabase("POST", {
            id: getMyId(),
            type: "result",
            result: resultText,
            termination: termination
        });

        gameState.allowedSides[Piece.white] = true;
        gameState.allowedSides[Piece.black] = true;
    }

    let resultText;
    switch(resultNum){
        case -1:
            resultText = `Black won by ${termination}`;
            break;
        case 0:
            resultText = "Game ended in a draw";
            break;
        case 1:
            resultText = `White won by ${termination}`;
            break;
    }

    const myColor = NETWORK.myColor || (WEB_PHIL.playing && WEB_PHIL.userColor == Piece.white ? "white" : "black");

    // did this player win?
    let mewin;
    if (resultNum == 0){
        mewin = "drew";
    }else if (myColor == "white" && resultNum == 1 || myColor == "black" && resultNum == -1){
        mewin = "won";
    }else{
        mewin = "lost";
    }

    // avoid displaying the local result for spectating games
    if (!myColor)
        document.getElementById("result-box_local").style.display = "none";
    else
        document.getElementById("result-box_local").style.display = "";

    gameState.pgnData.setHeader("Termination", termination);

    displayResultBox(resultText, mewin, termination);
    activatePreGameControls();
});
