
var containerElem = document.getElementById("container");

// used to prevent network from resending the move (though this could be useful for confirmation)
let lastPlayedSAN;

containerElem.addEventListener("madeMove", (event) => {
    const {state, board, san, move, pgnMove} = event.detail;
    // ensure user is playing om main variation
    // to-do: probably don't depend on this being the case:
    // gameState.allowVariations is only false when a game is actually being played...
    if (san != lastPlayedSAN && pgnMove.isMain() && !gameState.allowVariations){
        // the move wasn't from this user. let's send it over to the other user.
        console.log("SEND MOVE TO USER", san);
        pollDatabase("POST", {
            type: "move",
            id: getMyId(),
            move: san
        });

        // start waiting for opponent's move
        NETWORK.moveNum++;
        waitForMove();
    }
});

let keepGettingOffers = true;
let hasSetResult = false;
let startGettingOffersActive = false;
async function startGettingOffers(){
    // to-do: figure out what's causing this shifty code :)
    if (startGettingOffersActive)
        return;
    startGettingOffersActive = true;
    
    keepGettingOffers = true;
    while (keepGettingOffers){
        const offers = JSON.parse(await pollDatabase("GET", {
            type: "offers",
            id: getMyId()
        }));

        console.log(offers);

        if (offers.draw != "false"){
            if (offers.draw == "offered")
                outputElem.innerText = "Draw has been offered";
            else if (offers.draw == "accepted")
                setResult("1/2-1/2", "agreement");
        }else{
            outputElem.innerText = "";
        }
        if (offers.rematch == "true"){
            document.getElementById("result-box_rematch").innerText = "Accept rematch?";
            document.getElementById("panel_rematch").innerText = "Accept rematch?";
        }else if (offers.rematch != "false"){
            // new game id to go to!
            window.location.search = `?game_id=${offers.rematch}`;
        }
        if (offers.result != "*" && !hasSetResult){
            const i = offers.result.indexOf(" ");
            setResult(offers.result.substring(0, i), offers.result.substring(i + 1));
        }

        await sleep(2000);
    }
    startGettingOffersActive = false;
}

let keepWaitingForMove = true;
let waitForMoveActive = false;
function waitForMove(){
    if (waitForMoveActive)
        return;
    waitForMoveActive = true;
    keepWaitingForMove = true;
    return new Promise(async (res, rej) => {
        while (keepWaitingForMove){
            const san = await pollDatabase("GET", {
                type: "gameStatus",
                moveNum: NETWORK.moveNum + 1,
                id: getMyId()
            });

            console.log(san);

            if (san == "" || san == "false"){
                await sleep(1000);
            }else{
                NETWORK.moveNum++;
                lastPlayedSAN = san;
                if (san.startsWith("1-0") || san.startsWith("0-1") || san.startsWith("1/2-1/2")){
                    // result!
                    const result = san.substring(0, san.indexOf(" "));
                    const termination = san.substring(san.indexOf(" ") + 1);
                    setResult(result, termination);
                }else{
                    if (gameState.currentMove.isMain() && gameState.currentMove.next.length == 0)
                        gameState.makeMove(gameState.board.getMoveOfSAN(san));
                    else
                        gameState.addMoveToEnd(san);
                }
                break;
            }
        }
        waitForMoveActive = false;
        res();
    });
}

function setResult(result, termination){
    // when there is a checkmate or a draw by either threefold or fifty move rule, then that result
    // will already be calculated by the game state, and isn't necessary to represent over the
    // network (unlike resignation or draws by agreement)
    if (!gameState.board.result){
        gameState.board.setResult(result, termination);
        gameState.dispatchEvent("result", {state: gameState, board: gameState.board});

        keepWaitingForMove = false;
    }
};

// displays a result box
containerElem.addEventListener("result", (event) => {
    // if player can play both sides at once, they're not spectating or playing a multiplayer game
    if (gameState.allowedSides[Piece.white] && gameState.allowedSides[Piece.black])
        return;

    keepWaitingForMove = false;

    const {state, board} = event.detail;

    // get result text of game
    let result;
    if      (board.result == "0-1" || (board.result == "#" && board.turn == Piece.white)) result = -1;
    else if (board.result == "1-0" || (board.result == "#" && board.turn == Piece.black)) result = 1;
    else    result = 0;

    // an on-board result will either be / or #, whereas a result from the server will either
    // be 1-0, 0-1, or 1/2-1/2. It is a bit confusing and likely needs reworking, but... this works
    if (board.result){
        let resultText;

        if (result == -1){
            resultText = "0-1";
        }else if (result == 1){
            resultText = "1-0";
        }else{
            resultText = "1/2-1/2";
        }

        pollDatabase("POST", {
            id: getMyId(),
            type: "result",
            result: resultText,
            termination: board.termination
        });

        gameState.allowedSides[Piece.white] = true;
        gameState.allowedSides[Piece.black] = true;
        gameState.allowVariations = true;
    }

    let resultText;
    switch(result){
        case -1:
            resultText = `Black won by ${board.termination}`;
            break;
        case 0:
            resultText = "Game ended in a draw";
            break;
        case 1:
            resultText = `White won by ${board.termination}`;
            break;
    }

    // did this player win?
    let mewin;
    if (result == 0){
        mewin = "drew";
    }else if (gameState.allowedSides[Piece.white] && result == 1 || !gameState.allowedSides[Piece.white] && result == -1){
        mewin = "won";
    }else{
        mewin = "lost";
    }

    displayResultBox(resultText, mewin, board.termination);
    activatePreGameControls();
});
