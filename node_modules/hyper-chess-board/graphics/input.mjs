
import { setAllMoveHighlightsToPool, getMoveHighlightFromPool } from "./pool.mjs";

// This file handles the way that the user might interact with the game board via dragging pieces.

// make pieces draggable
const INPUT = {
    currentMoves: undefined,
    selected: undefined,
    draggingElem: undefined,
    gameState: undefined,
    testMove: undefined
};

export function initInput(){
    document.body.addEventListener("pointerup", draggingPointerup);
    document.body.addEventListener("pointermove", pointerMove);
    document.body.addEventListener("touchmove", touchMove, { passive: false });
}

export function setInputTarget(gameState, draggingElem, event){
    INPUT.gameState = gameState;
    INPUT.draggingElem = draggingElem;

    piecePointerdown(event);
}

// sets the elements dragging position based on the user's pointer position
function setDraggingElemPos(pageX, pageY){
    if (!INPUT.dragging)
        return;
    INPUT.draggingElem.style.left = `calc(${pageX}px - var(--piece-width) / 2)`;
    INPUT.draggingElem.style.top = `calc(${pageY}px - var(--piece-height) / 2)`;
}

function pointerMove(event){
    if (INPUT.dragging)
        event.preventDefault();
    setDraggingElemPos(event.pageX, event.pageY);
}

// prevent scrolling and glitches on mobile devices when thing is being dragged
function touchMove(event){
    if (INPUT.dragging)
        event.preventDefault();
}

function piecePointerdown(event){
    const elem = event.target;
    if (event.button !== undefined && event.button != 0)
        return;

    if (!elem.classList.contains("board-graphics__move-highlight"))
        setAllMoveHighlightsToPool(INPUT.gameState.skeleton);
    else
        return draggingPointerup(event);

    if (!elem.dataset.coords)
        return;

    const coords = elem.dataset.coords.split("_");
    const square = parseInt(coords[0]) + parseInt(coords[1] * 8);

    // check with gameState if the piece can move
    if (!INPUT.gameState.canMove(square))
        return;

    const piece = INPUT.gameState.state.squares[square];

    INPUT.dragging = elem;
    INPUT.selected = elem;
    elem.classList.add("board-graphics__piece--dragged");
    // copy over graphics
    INPUT.draggingElem.style.backgroundPositionY = INPUT.dragging.style.backgroundPositionY;

    INPUT.draggingElem.className = "board-graphics__dragging";
    INPUT.draggingElem.classList.add(`board-graphics__piece--type-${INPUT.dragging.dataset.pieceType}`);
    INPUT.draggingElem.style.display = "block";

    setDraggingElemPos(event.pageX, event.pageY);

    // get moves for selected piece and display them
    INPUT.currentMoves = INPUT.gameState.state.generatePieceMoves(square, piece);
    for (let i = 0; i < INPUT.currentMoves.length; i++){
        const move = INPUT.currentMoves[i];
        
        const highlight = getMoveHighlightFromPool(move.to % 8, Math.floor(move.to / 8), INPUT.gameState.isFlipped);
        highlight.dataset.index = i;

        // if move is a capture, update highlight graphically to indicate that
        if (move.captures.length > 0)
            highlight.classList.add("board-graphics__move-highlight--capture");

        INPUT.gameState.piecesDiv.appendChild(highlight);
    }
}

function draggingPointerup(event){
    if (event.button == 2)
        return;

    if (INPUT.dragging){
        INPUT.dragging.classList.remove("board-graphics__piece--dragged");
        INPUT.draggingElem.style.display = "none";
    }
    
    let highlight = event.target;

    // handle touch events
    if (event.pointerType == "touch")
        highlight = document.elementFromPoint(event.clientX, event.clientY);
    
    // player let go at a highlight, indicating they're moving the piece there.
    if (highlight.classList.contains("board-graphics__move-highlight")){
        INPUT.testMove = INPUT.currentMoves[parseInt(highlight.dataset.index)];

        // testMove handlers
        INPUT.gameState.makeMove(INPUT.testMove);
        INPUT.gameState.applyChanges(true);
        INPUT.testMove = undefined;

        // clear all moves from board
        setAllMoveHighlightsToPool(INPUT.gameState.skeleton);
    }

    if (!INPUT.dragging){
        // clear all moves from board
        if (INPUT.gameState)
            setAllMoveHighlightsToPool(INPUT.gameState.skeleton);
    }else{
        INPUT.dragging = undefined;
    }
}
