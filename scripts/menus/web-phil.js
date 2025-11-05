
import { registerMenu, openMenuContainer } from "./menus.js";

registerMenu("web-phil", openWebPhil, closeWebPhil);

export function openWebPhil(){
    gameState.setActiveWidgets(new Set([
        "PGNWidget",
        "AnnotatorWidget",
        "AudioWidget",
        "AnimationsWidget",
        "WebPhilWidget",
        "ExtrasWidget"
    ]));
    gameState.allowVariations = false;
    openMenuContainer(gameState.skeleton);
}

export function closeWebPhil(){
    gameState.allowVariations = true;
}
