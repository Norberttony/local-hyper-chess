
const WEB_PHIL = {
    playing: false,
    worker: undefined,
    userColor: Piece.white,
    thinkTime: 1000
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


    const phil = new Worker("./scripts/hyper-active/main.js");
    WEB_PHIL.worker = phil;
    
    phil.onmessage = (e) => {
        if (!WEB_PHIL.playing)
            return;

        const { cmd, val, san, depth } = e.data;

        console.log(`Web Phil believes his position is valued at ${val} after calculating to a depth of ${depth} ply.`);
        console.log(san);

        if (cmd == "searchFinished"){
            if (!gameState.currentVariation.isMain() || gameState.currentVariation.next.length > 0){
                gameState.addMoveToEnd(san);
            }else{
                gameState.makeMove(gameState.board.getMoveOfSAN(san));
                gameState.applyChanges(false);
            }
        }
    }

    phil.postMessage({ type: "fen", fen: gameState.board.getFEN() });

    // if not user's turn, it's web phil's turn!
    if (WEB_PHIL.userColor != gameState.board.turn)
        WEB_PHIL.worker.postMessage({ cmd: "search", thinkTime: WEB_PHIL.thinkTime });
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

    // ensure user is making moves on the main variation itself
    if (variation.next.length > 0 || !variation.isMain())
        return;

    WEB_PHIL.worker.postMessage({ cmd: "move", san: variation.san });
    WEB_PHIL.worker.postMessage({ cmd: "search", thinkTime: WEB_PHIL.thinkTime });
});

window.addEventListener("beforeunload", (event) => {
    if (WEB_PHIL.playing)
        event.preventDefault();
});
