
window.gameState = new BoardGraphics(true, true, document.getElementById("main-board"));

const widgets = {
    annotator: new AnnotatorWidget(gameState),
    animation: new AnimationWidget(gameState),
    audio: new AudioWidget(gameState),
    pgn: new PGNWidget(gameState, WIDGET_LOCATIONS.RIGHT),
    network: new NetworkWidget(gameState, WIDGET_LOCATIONS.RIGHT),
    extras: new ExtrasWidget(gameState, WIDGET_LOCATIONS.BOTTOM),
    players: new PlayersWidget(gameState),
    web_phil: new WebPhilWidget(gameState)
};
widgets.web_phil.disable();

widgets.players.setNames("-", "-");

gameState.display();

function hideNames(){
    widgets.players.disable();
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
