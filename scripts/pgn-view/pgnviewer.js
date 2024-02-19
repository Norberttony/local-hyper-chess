// handles displaying any of the moves in a separate panel, allowing the user to not only scroll
// through the various moves, but also scroll to a specific move. Most of the "move scrolling"
// logic is performed in a global instance of class GraphicalState.

var containerElem = document.getElementById("container");

let pgnElem = document.getElementById("pgn");

var pgnText = document.getElementById("pgnText");
var fenText = document.getElementById("fenText");

function selectPGNElem(elem){
    (document.getElementsByClassName("pgn_selected")[0] || elem || document.body).classList.remove("pgn_selected");
    if (elem){
        elem.classList.add("pgn_selected");
        
        // scrolls to selected pgn
        let pgnRect = pgnElem.getBoundingClientRect();
        let elemRect = elem.getBoundingClientRect();
        let elemPos = elemRect.top - pgnRect.top; // element's position relative to the PGN scroll view

        // already in view! don't scroll!
        if (elemPos > 0 && elemPos + elemRect.height < pgnRect.height)
            return;

        // determine direction of scroll
        if (elemPos <= 0){
            // so we've scrolled past element, set it to top (as that is first occurrence)
            pgnElem.scrollBy(0, elemRect.top - pgnRect.top);
        }else{
            pgnElem.scrollBy(0, elemRect.bottom - pgnRect.bottom);
        }
    }else{
        pgnElem.scrollTo(0, 0);
    }
}

let pgnData = new PGNData();
pgnText.value = pgnData.toString();
containerElem.addEventListener("madeMove", (event) => {
    const {state, board, san, move} = event.detail;

    // sometimes, a user loads a position where it is black to play, offsetting all PGN.
    const isOffset = pgnData.san == "" && board.turn == Piece.white;

    // adds counter (or number next to every two ply)
    if (board.turn == Piece.black || isOffset){
        let pgn_counterElem = document.createElement("pgn_counter");
        pgn_counterElem.classList.add("pgn_counter");
        pgn_counterElem.innerText = `${board.fullmove}.`;
        pgnElem.appendChild(pgn_counterElem);

        let str = `${board.fullmove}.`;
        if (isOffset){
            let pgn_elipsesElem = document.createElement("div");
            pgn_elipsesElem.classList.add("pgn_counter");
            pgn_elipsesElem.innerText = "...";
            pgn_elipsesElem.style.textAlign = "left";
            pgnElem.appendChild(pgn_elipsesElem);
            str += "..";
        }
        pgnData.addToSAN(str);
    }

    // now add the move itself
    const pgn_sanElem = document.createElement("div");
    pgn_sanElem.classList.add("pgn_san");
    pgn_sanElem.innerText = san;
    pgnElem.appendChild(pgn_sanElem);

    const index = state.moves.length - 1;
    pgn_sanElem.addEventListener("click", () => {
        state.setMoveIndex(index);
    });

    pgnData.addToSAN(san);

    pgnText.value = pgnData.toString();
});

containerElem.addEventListener("result", (event) => {
    const {state, board} = event.detail;

    // convert symbols of / and # into words
    let result = board.result;
    if (result == "/") result = "1/2 - 1/2";
    else if (board.result == "#" && board.turn == Piece.white) result = "0 - 1";
    else if (board.result == "#" && board.turn == Piece.black) result = "1 - 0";

    pgnData.addToSAN(result);

    // get some flavor text based on result
    let flavorText;
    if (result == "0 - 1"){
        flavorText = "Black wins by";
    }else if (result == "1 - 0"){
        flavorText = "White wins by";
    }else if (result == "1/2 - 1/2"){
        flavorText = "Game ended by";
    }

    // displays result
    const pgn_resultElem = document.createElement("div");
    pgn_resultElem.classList.add("pgn_result");
    pgn_resultElem.innerHTML = `<span>${result}</span><br /><span style = "font-size: large;">${flavorText} ${board.termination}</span>`;
    pgnElem.appendChild(pgn_resultElem);

    pgnText.value = pgnData.toString();
});

containerElem.addEventListener("loadedFEN", (event) => {
    const {state, fen} = event.detail;

    // none of the previous PGN is relevant to this new position, so...
    clearPGNView();
    pgnData.clear();

    if (fen.replace(/ /g, "") != StartingFEN.replace(/ /g, "")){
        pgnData.setHeader("Variant", "From Position");
        pgnData.setHeader("FEN", fen);
    }

    fenText.value = state.board.getFEN();
    pgnText.value = pgnData.toString();
});

containerElem.addEventListener("movescroll", (event) => {
    const {state, board, moveIndex} = event.detail;

    selectPGNElem(containerElem.getElementsByClassName("pgn_san")[moveIndex]);

    fenText.value = board.getFEN();
});
fenText.value = StartingFEN;

function clearPGNView(){
    pgnElem.innerHTML = "";
}

function PGNMoveBack(){
    gameState.previousMove();
}

function PGNMoveForward(){
    gameState.nextMove();
}

function PGNMoveFirst(){
    gameState.setMoveIndex(-1);
}

function PGNMoveLast(){
    gameState.setMoveIndex(gameState.moves.length - 1);
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
                PGNMoveFirst();
                break;
            case "arrowdown":
                PGNMoveLast();
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
