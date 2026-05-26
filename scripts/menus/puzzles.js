import { StartingFen } from "hyper-chess-board";
import { openMenuContainer, registerMenu } from "./menus.js";


registerMenu("puzzles", openPuzzles, closePuzzles);

export function openPuzzles(){
    gameState.setActiveWidgets(new Set([
        "PgnWidget",
        "AnnotatorWidget",
        "AudioWidget",
        "AnimationsWidget",
        "PuzzlesWidget"
    ]));
    openMenuContainer(gameState.skeleton);
}

export function closePuzzles(){
    gameState.loadFen(StartingFen);
}
