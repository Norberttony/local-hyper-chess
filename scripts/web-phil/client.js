
const WEB_PHIL = {
    playing: false,
    worker: undefined,
    userColor: Piece.white,
    searchDepth: 3
};

{
    const form = document.forms["web-phil"];

    // user starts game against web phil
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        form.style.display = "none";
        const playAs = form.phil_color.value == "white" ? Piece.white : Piece.black;

        WEB_PHIL.userColor = playAs;
        gameState.setSide(playAs);

        setFlip(playAs == Piece.black);

        playWebPhil();
    });
}

function playWebPhil(){
    if (WEB_PHIL.playing)
        return;

    WEB_PHIL.playing = true;


    const phil = new Worker("./scripts/web-phil/main.js");
    WEB_PHIL.worker = phil;
    
    phil.onmessage = (e) => {
        if (!WEB_PHIL.playing)
            return;

        const { cmd, val, bestMove } = e.data;

        if (cmd == "searchFinish"){
            gameState.makeMove(bestMove);
            gameState.applyChanges(false);
        }
    }

    phil.postMessage({ type: "fen", fen: gameState.board.getFEN() });
}

function stopWebPhil(){
    if (!WEB_PHIL.playing)
        return;

    WEB_PHIL.playing = false;
    WEB_PHIL.worker.terminate();

    // clean up game state config
    gameState.allowVariations = true;
    gameState.allowedSides[Piece.white] = true;
    gameState.allowedSides[Piece.black] = true;
}

containerElem.addEventListener("single-scroll", (event) => {
    if (!WEB_PHIL.playing)
        return;

    const { prevVariation, variation, userInput } = event.detail;

    if (!userInput)
        return;

    WEB_PHIL.worker.postMessage({ cmd: "move", san: variation.san });
    WEB_PHIL.worker.postMessage({ cmd: "search", depth: WEB_PHIL.searchDepth });
});
