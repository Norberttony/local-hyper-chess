
import { BoardGraphics, initInput } from "../../node_modules/hyper-chess-board/graphics/index.mjs";
import {
    AnnotatorWidget, AnimationWidget, AudioWidget,
    EngineWidget, PGNWidget, ExtrasWidget, PlayersWidget,
    WIDGET_LOCATIONS
} from "../../node_modules/hyper-chess-board/graphics/widgets/index.mjs";

import { NetworkWidget } from "./widgets/network-widget.mjs";
import { PuzzlesWidget } from "./widgets/puzzles-widget.mjs";
import { WebPhilWidget } from "./widgets/web-phil-widget.mjs";


// initializes the main board display
export const gameState = new BoardGraphics(true, true, document.getElementById("main-board"));

// adds widgets to the board display
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

// initializes some of the widgets
webPhil.disable();
players.setNames("-", "-");
gameState.display();

// initializes input listening
initInput();

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
