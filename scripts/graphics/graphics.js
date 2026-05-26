import {
    BoardGraphics, initInput,
    AnnotatorWidget, AnimationWidget, AudioWidget,
    EngineWidget, PgnWidget, ExtrasWidget, PlayersWidget
} from "hyper-chess-board";
import { NetworkWidget } from "./widgets/network-widget.js";
import { PuzzlesWidget } from "./widgets/puzzles-widget.js";
import { WebPhilWidget } from "./widgets/web-phil-widget.js";


// initializes the main board display
const mainBoardElem = document.getElementById("main-board");
export const gameState = new BoardGraphics(true, true, mainBoardElem);

// to-do: find a better way of allowing browser of using the game state
window.gameState = gameState;

// adds widgets to the board display
new AnnotatorWidget(gameState);
new AnimationWidget(gameState);
new AudioWidget(gameState);
new EngineWidget(gameState, "Right");
new PgnWidget(gameState, "Right");
new NetworkWidget(gameState, "Right");
new ExtrasWidget(gameState, "Bottom");
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
