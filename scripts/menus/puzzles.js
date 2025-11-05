
import { StartingFEN } from "hyper-chess-board/index.js";
import { openMenuContainer, registerMenu, setWidgetsActive } from "./menus.js";


registerMenu("puzzles", openPuzzles, closePuzzles);

export function openPuzzles(){
    setWidgetsActive(new Set([
        "PGNWidget",
        "AnnotatorWidget",
        "AudioWidget",
        "AnimationsWidget",
        "PuzzlesWidget"
    ]));
    openMenuContainer(gameState.skeleton);
}

export function closePuzzles(){
    gameState.loadFEN(StartingFEN);
}
