
window.gameState = new BoardGraphics(true, true, document.getElementById("main-board"));

const aw = new AnnotatorWidget(gameState);
new AnimationWidget(gameState);

gameState.display();

function setFEN(){
    let fen = fenText.value;
    gameState.loadFEN(fen);
}

function setPGN(){
    let pgn = pgnText.value;
    gameState.loadPGN(pgn);
}

function copyLinkWithPGN(){
    const statusElem = document.getElementById("panel_copy-link");
    const pgn = gameState.pgnData.toString().replace(/\n/g, "");
    const url = `${window.location.origin}${window.location.pathname}#board,pgn=${encodeURIComponent(pgn)}`;

    console.log(pgn);

    if (copyToClipboard(undefined, url)){
        statusElem.innerText = "Successfully copied!";
    }else{
        statusElem.innerText = "Unknown error; cannot copy";
    }
}

const toggle_bookmarkElem = document.getElementById("toggle_bookmark");

function toggleBookmark(elem){
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const gameId = `${NETWORK.gameId}_${NETWORK.refNum}`;

    const idx = bookmarks.indexOf(gameId);
    if (idx > -1){
        // remove
        bookmarks.splice(idx, 1);
        elem.innerText = "Add bookmark?";
    }else{
        // add
        bookmarks.push(gameId);
        elem.innerText = "Remove bookmark?";
    }

    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

// prevent focusing on buttons (so that arrow key presses and other things still register on the
// board, even if the user clicks other buttons like "copy PGN")
let buttons = document.getElementsByTagName("button");
for (let i = 0; i < buttons.length; i++){
    buttons[i].onmousedown = (event) => {
        event.preventDefault();
    }
}
