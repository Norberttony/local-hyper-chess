
window.gameState = new BoardGraphics(true, true, document.getElementById("main-board"));

const widgets = {
    annotator: new AnnotatorWidget(gameState),
    animation: new AnimationWidget(gameState),
    audio: new AudioWidget(gameState),
    pgn: new PGNWidget(gameState, WIDGET_LOCATIONS.RIGHT),
    network: new NetworkWidget(gameState, WIDGET_LOCATIONS.RIGHT),
    extras: new ExtrasWidget(gameState, WIDGET_LOCATIONS.BOTTOM),
    players: new PlayersWidget(gameState)
};

widgets.players.setNames("Anonymous (white)", "Anonymous (black)");

gameState.display();

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
{
    const buttons = document.getElementsByTagName("button");
    for (const b of buttons){
        b.onmousedown = (event) => {
            event.preventDefault();
        }
    }
}
