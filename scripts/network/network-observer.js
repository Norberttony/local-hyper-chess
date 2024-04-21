
var containerElem = document.getElementById("container");

// used to prevent network from resending the move (though this could be useful for confirmation)
let lastPlayedSAN;
/*
socket.on("move", (moveSAN) => {
    lastPlayedSAN = moveSAN;
    let move = gameState.latestBoard.getMoveOfSAN(moveSAN);
    gameState.makeMove(move);
});
*/

containerElem.addEventListener("madeMove", (event) => {
    const {state, board, san, move, pgnMove} = event.detail;
    // ensure user is playing om main variation
    if (san != lastPlayedSAN && pgnMove.isMain()){
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

let keepWaitingForMove = true;
function waitForMove(){
    keepWaitingForMove = true;
    return new Promise(async (res, rej) => {
        while (keepWaitingForMove){
            const san = await pollDatabase("GET", {
                type: "move",
                moveNum: NETWORK.moveNum,
                id: getMyId()
            });

            console.log(san);

            if (san == ""){
                await sleep(1000);
            }else{
                NETWORK.moveNum++;
                lastPlayedSAN = san;
                if (san == "1-0" || san == "0-1" || san == "1/2-1/2"){
                    // result!
                    setResult(san);
                }else{
                    if (gameState.currentMove.isMain() && gameState.currentMove.next.length == 0)
                        gameState.makeMove(gameState.board.getMoveOfSAN(san));
                    else
                        gameState.addMoveToEnd(san);
                }
                break;
            }
        }
        res();
    });
}

function setResult(result, termination){
    // when there is a checkmate or a draw by either threefold or fifty move rule, then that result
    // will already be calculated by the game state, and isn't necessary to represent over the
    // network (unlike resignation or draws by agreement)
    if (!gameState.latestBoard.result){
        gameState.latestBoard.setResult(result, termination);
        gameState.dispatchEvent("result", {state: gameState, board: gameState.latestBoard});
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
    if      (board.result == "0 - 1" || (board.result == "#" && board.turn == Piece.white)) result = -1;
    else if (board.result == "1 - 0" || (board.result == "#" && board.turn == Piece.black)) result = 1;
    else    result = 0;

    // an on-board result will either be / or #, whereas a result from the server will either
    // be 1-0, 0-1, or 1/2-1/2. It is a bit confusing and likely needs reworking, but... this works
    if (board.result == "/" || board.result == "#")
        pollDatabase("POST", {
            type: "result",
            result,
            termination: board.termination
        });

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
