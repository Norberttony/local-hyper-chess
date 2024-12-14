// handles generating elements to represent the pieces. Whenever a piece is taken, its element
// is put into a pool for later use.

var draggingElem = document.getElementById("dragging");
var gameElem = document.getElementById("game");

// fetches an element from the pool
function fetchElem(className, f, r, boardFlipped){
    let elem = document.getElementById("element-pool");
    if (!elem){
        elem = document.createElement("div");
    }

    elem.id = "";
    setElemLocation(elem, f, r, boardFlipped);
    elem.className = className;

    return elem;
}

// sets the location of an element on the board
function setElemLocation(elem, f, r, boardFlipped){
    elem.style.transform = `translate(${(boardFlipped ? 7 - f : f) * 100}%, ${(boardFlipped ? r : 7 - r) * 100}%)`;
}

// either creates a completely new move highlight, or fetches an unused element.
function getMoveHighlightFromPool(f, r, boardFlipped){
    return fetchElem("board-graphics__move-highlight", f, r, boardFlipped);
}

// either creates a completely new move highlight, or fetches an unused element.
function getLastMoveHighlightFromPool(f, r, boardFlipped){
    return fetchElem("board-graphics__move-highlight--last", f, r, boardFlipped);
}

// either creates a completely new piece, or fetches an unused element.
function getPieceFromPool(f, r, boardFlipped, pieceType, pieceColor){
    let piece = fetchElem("piece", f, r, boardFlipped);

    piece.id = `${f}_${r}`;

    piece.style.backgroundPositionY = colorToBackground[pieceColor];
    piece.classList.add(PieceTypeToFEN[pieceType]);
    
    return piece;
}

// puts an element back into the pool.
function setElemToPool(elem){
    elem.id = "element-pool";
    elem.className = "";
    elem.innerHTML = "";
    elem.onpointerdown = function(){}
    elem.onpointerup = function(){}
}

// puts a class into the pool
function setClassToPool(classSelector, container = gameElem){
    let elems = container.getElementsByClassName(classSelector);
    while (elems.length > 0)
        setElemToPool(elems[0]);
}

// puts all pieces back into the pool.
function setAllPiecesToPool(container){
    setClassToPool("piece", container);
}

// puts all highlights back into pool.
function setAllMoveHighlightsToPool(container){
    setClassToPool("board-graphics__move-highlight", container);
}

// puts all last move highlights back into pool.
function setAllLastMoveHighlightsToPool(container){
    setClassToPool("board-graphics__move-highlight--last", container);
}

// attaches a glyph to the piece element
function attachGlyph(elem, src){
    const div = document.createElement("div");
    div.classList.add("glyph");
    div.style.backgroundImage = `url(${src})`;
    elem.appendChild(div);
}
