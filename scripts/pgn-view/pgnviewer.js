
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

// creates and returns the new moveline with the given number and white elem.
function newMovelineElem(num, whiteSANElem){
    const moveline = document.createElement("div");

    moveline.classList.add("pgn_moveline");

    const numElem = document.createElement("div");
    numElem.classList.add("pgn_num");
    numElem.innerText = `${num}.`;
    
    moveline.appendChild(numElem);
    moveline.appendChild(whiteSANElem);

    return moveline;
}

// returns a list of two elements, the first moveline element and the second moveline element
// if the given moveline elem is already split, this returns an empty list.
function splitMovelineElem(movelineElem){
    // cannot split a moveline that is already split.
    if (movelineElem.classList.contains("pgn_split-moveline"))
        return [];

    movelineElem.classList.add("pgn_split-moveline");

    const elem1 = movelineElem;

    const numText = elem1.getElementsByClassName("pgn_num")[0].innerText;
    const elem2 = newMovelineElem(numText.substring(0, numText.length - 1), newBlankSANElem());

    const nextElem = elem1.nextElementSibling;
    if (nextElem)
        nextElem.parentNode.insertBefore(elem2, nextElem);
    else
        elem1.parentNode.appendChild(elem2);

    // swap the second move elem in the first moveline with a blank elem
    const blackMove = elem1.getElementsByClassName("pgn_san")[1];
    if (blackMove){
        elem2.appendChild(blackMove);
    }
    elem1.appendChild(newBlankSANElem());

    return [ elem1, elem2 ];
}

function newSANElem(san, variation){
    const div = document.createElement("div");
    div.classList.add("pgn_san");
    div.innerText = san;

    if (variation){
        div.addEventListener("click", () => {
            gameState.jumpToVariation(variation);
            displayBoard();
            selectPGNElem(div);
        });
    }

    return div;
}

function newBlankSANElem(){
    const div = newSANElem("...");
    div.classList.add("pgn_blank");
    return div;
}

function newVariationElem(){
    const div = document.createElement("div");
    div.classList.add("pgn_variation");
    return div;
}

function isPGNSpecialBlock(elem){
    return elem.classList.contains("pgn_moveline") || elem.classList.contains("pgn_result");
}

pgnText.value = gameState.pgnData.toString();

containerElem.addEventListener("new-variation", (event) => {
    pgnText.value = gameState.pgnData.toString();
    
    const { variation } = event.detail;

    // determine move number
    const moveNum = Math.floor((variation.level + 1) / 2);

    // determine the player who made this move
    const turn = variation.level % 2 == 1 ? Piece.white : Piece.black;

    // create a new SAN elem for this variation
    const sanElem = newSANElem(variation.san, variation);
    variation.element = sanElem;

    if (variation.isMain()){
        if (turn == Piece.black){
            // add this move to the previous move line
            const prevMoveline = variation.prev.element.parentNode;
            prevMoveline.appendChild(sanElem);

            // if the next element does not exist or is not a moveline, this must be the very end
            // of the pgn and a skip is required.
            const nextElem = prevMoveline.nextElementSibling;
            if (prevMoveline.getElementsByClassName("pgn_blank")[0]){
                // fetch next available moveline
                let nextMovelineElem = nextElem;
                while (!nextMovelineElem.classList.contains("pgn_moveline")){
                    nextMovelineElem = nextMovelineElem.nextElementSibling;
                }

                if (nextMovelineElem){
                    nextMovelineElem.appendChild(sanElem);
                }
            }else if (nextElem && !isPGNSpecialBlock(nextElem)){
                const blankSANElem = newBlankSANElem();
                prevMoveline.appendChild(blankSANElem);

                const moveline = newMovelineElem(moveNum, newBlankSANElem());
                moveline.appendChild(sanElem);

                // insert either after the special elements or just at the end.
                if (!nextElem || !nextElem.nextElementSibling){
                    pgnElem.appendChild(moveline);
                }else{
                    // keep searching for the next moveline element
                    let nextMoveline = nextElem;
                    while (nextMoveline && !nextMoveline.classList.contains("pgn_moveline"))
                        nextMoveline = nextMoveline.nextElementSibling;

                    // either moveline exists or we've reached the end of the pgn
                    if (nextMoveline)
                        pgnElem.insertBefore(moveline, nextMoveline);
                    else
                        pgnElem.appendChild(moveline);
                }
            }
        }else{
            // create a new move line for this variation
            const moveline = newMovelineElem(moveNum, sanElem);
            const resultElem = document.getElementsByClassName("pgn_result")[0];
            if (resultElem)
                pgnElem.insertBefore(moveline, resultElem);
            else
                pgnElem.appendChild(moveline);
        }
    }else{

        if (variation.location == 0){
            // same variation line
            const variationElem = variation.prev.element.parentNode;
            variationElem.appendChild(sanElem);
        }else{
            // create a new variation object to contain all of the variations after the previous
            // moveline
            const variationLineElem = document.createElement("div");
            variationLineElem.classList.add("pgn_variation-line");

            variationLineElem.appendChild(sanElem);
            
            let previousContainer = variation.prev.next[0].element.parentNode;

            if (previousContainer.classList.contains("pgn_moveline")){
                // do we split the moveline or not?
                if (turn == Piece.white){
                    // split!!!
                    const nextElem = previousContainer.nextElementSibling;
                    if (nextElem && nextElem.classList.contains("pgn_variation")){
                        nextElem.appendChild(variationLineElem);
                    }else{
                        const variationElem = newVariationElem();
                        variationElem.appendChild(variationLineElem);

                        const [ m1, m2 ] = splitMovelineElem(previousContainer);
                        m1.parentNode.insertBefore(variationElem, m2);
                    }
                }else{
                    const variationElem = newVariationElem();
                    variationElem.appendChild(variationLineElem);

                    // no split needed, just insert after moveline
                    const nextElem = previousContainer.nextElementSibling;
                    if (nextElem)
                        pgnElem.insertBefore(variationElem, nextElem);
                    else
                        pgnElem.appendChild(variationElem);
                }
            }else{
                // this must be another simple variation element, so let's just add a variation to the variation
                const variationElem = newVariationElem();
                variationElem.appendChild(variationLineElem);
                
                previousContainer.appendChild(variationElem);
            }
        }

    }
});

containerElem.addEventListener("result", (event) => {
    const { result, turn, termination } = event.detail;

    // 0 for draw, 1 if white wins, -1 if black wins
    let resultNum;
    if (result == "/" || result == "1/2-1/2")
        resultNum = 0;
    else if (result == "#" && turn == Piece.white || result == "0-1")
        resultNum = -1;
    else if (result == "#" && turn == Piece.black || result == "1-0")
        resultNum = 1;

    // based on the result number, add some result text and flavor text
    let resultText;
    let flavorText;
    if (resultNum == 0){
        resultText = "1/2 - 1/2";
        flavorText = "Game ended by";
    }else if (resultNum == -1){
        resultText = "0 - 1";
        flavorText = "Black wins by";
    }else if (resultNum == 1){
        resultText = "1 - 0";
        flavorText = "White wins by";
    }

    // displays result
    const pgn_resultElem = document.createElement("div");
    pgn_resultElem.classList.add("pgn_result");
    pgn_resultElem.innerHTML = `<span>${resultText}</span><br /><span style = "font-size: large;">${flavorText} ${termination}</span>`;
    pgnElem.appendChild(pgn_resultElem);

    gameState.pgnData.setHeader("Result", resultText);
    
    pgnText.value = gameState.pgnData.toString();
});

containerElem.addEventListener("loadFEN", (event) => {
    const { fen } = event.detail;

    // none of the previous PGN is relevant to this new position, so...
    clearPGNView();
    gameState.pgnData.clear();

    if (fen.replace(/ /g, "") != StartingFEN.replace(/ /g, "")){
        gameState.pgnData.setHeader("Variant", "From Position");
        gameState.pgnData.setHeader("FEN", fen);
    }

    fenText.value = fen;
    pgnText.value = gameState.pgnData.toString();
});

containerElem.addEventListener("variation-change", (event) => {
    const { variation } = event.detail;

    selectPGNElem(variation.element);

    // display new FEN (since variation changed)
    fenText.value = gameState.board.getFEN();
});
fenText.value = StartingFEN;

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
