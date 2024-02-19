// handles move animations

var containerElem = document.getElementById("container");

let playerMadeMove = false;
containerElem.addEventListener("madeMove", (event) => {
    const {state, board, san, move} = event.detail;

    // a bad solution to handle moves played by an enemy player (network)
    // generally, I'd prefer if all of the observers everywhere were decoupled completely...
    // but fatigue and laziness stopped me here.
    if (typeof socket !== "undefined" && lastPlayedSAN == san) return;

    playerMadeMove = true;
});

let prevMoveIndex = gameState.currIndex;
containerElem.addEventListener("movescroll", (event) => {
    const {state, board, moveIndex} = event.detail;

    if (playerMadeMove){
        playerMadeMove = false;
        prevMoveIndex = moveIndex;
        return;
    }

    // display the board from just before the move was made.
    let dir = Math.sign(moveIndex - prevMoveIndex);
    prevMoveIndex = moveIndex;
    let lastMadeMove = state.moves[moveIndex];
    if (dir == -1) lastMadeMove = state.moves[moveIndex + 1];

    if (!lastMadeMove) return;

    // now move piece graphically
    let piece;

    if (dir == 1){
        piece = document.getElementById(`${getFileFromSq(lastMadeMove.to)}_${getRankFromSq(lastMadeMove.to)}`);
        setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from));
    }else{
        piece = document.getElementById(`${getFileFromSq(lastMadeMove.from)}_${getRankFromSq(lastMadeMove.from)}`);
        setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to));
    }

    setTimeout(() => {
        if (dir == 1)
            setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to));
        else
            setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from));
    }, 1);
});
