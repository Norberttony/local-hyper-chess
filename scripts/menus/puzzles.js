
import { StartingFEN } from "hyper-chess-board/index.js";
import { openMenuContainer, registerMenu } from "./menus.js";


registerMenu("puzzles", openPuzzles, closePuzzles);

export function openPuzzles(){
    gameState.setActiveWidgets(new Set([
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
