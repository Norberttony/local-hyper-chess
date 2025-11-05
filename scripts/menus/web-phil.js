
import { registerMenu, openMenuContainer, setWidgetsActive } from "./menus.js";

registerMenu("web-phil", openWebPhil, closeWebPhil);

export function openWebPhil(){
    setWidgetsActive(new Set([
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
