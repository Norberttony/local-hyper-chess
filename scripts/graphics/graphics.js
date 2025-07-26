
module_loader.waitForAll()
    .then(() => {
        initInput();
        window.gameState = new BoardGraphics(true, true, document.getElementById("main-board"));

        new AnnotatorWidget(gameState);
        new AnimationWidget(gameState);
        new AudioWidget(gameState);
        new EngineWidget(gameState, WIDGET_LOCATIONS.RIGHT);
        new PGNWidget(gameState, WIDGET_LOCATIONS.RIGHT);
        new NetworkWidget(gameState, WIDGET_LOCATIONS.RIGHT);
        new ExtrasWidget(gameState, WIDGET_LOCATIONS.BOTTOM);
        new PuzzlesWidget(gameState);
        const players = new PlayersWidget(gameState);
        const webPhil = new WebPhilWidget(gameState);

        webPhil.disable();

        players.setNames("-", "-");

        gameState.display();
    });

function hideNames(){
    gameState.widgets.PlayersWidget.disable();
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
