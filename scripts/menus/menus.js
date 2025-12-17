import { gameState } from "../graphics/graphics.js";
import { Side } from "hyper-chess-board/index.js";

import { getGameIdParts } from "../network/db-utils.js";
import { acceptChallenge } from "../network/challenges.js";

const mainBoardElem = gameState.skeleton;

const MENUS = {
    activeMenu: undefined,
    menus: {}
};

window.changeHash = changeHash;


// adds a menu to the collection.
// start performs initialization for the menu item and stop performs de-initialization.
export function registerMenu(name, start, stop){
    if (MENUS.menus[name])
        throw new Error(`Registering another menu with the same name ${name}`);
    MENUS.menus[name] = { start, stop };
}

export function openMenu(name){
    const menu = MENUS.menus[name];

    if (!menu || menu == MENUS.activeMenu)
        return;

    // close previously active menu
    if (MENUS.activeMenu)
        MENUS.activeMenu.stop();

    // open this menu
    menu.start();
    MENUS.activeMenu = menu;
}

export function openMenuContainer(elem){
    for (const elem of document.getElementsByClassName("menu-container"))
        elem.style.display = "none";
    elem.style.display = "";
}

export async function changeHash(newHash, quiet = false){
    history.pushState(null, "", newHash);

    // deactivate active menu button
    for (const activeElem of document.getElementById("menu").getElementsByClassName("active")){
        activeElem.classList.remove("active");
    }

    if (newHash.startsWith("#puzzles")){
        document.getElementById("menu_puzzles").classList.add("active");
        openMenu("puzzles");
    }else if (newHash.startsWith("#my-games")){
        openMenu("view-games");
    }else if (newHash.startsWith("#board")){
        document.getElementById("menu_board").classList.add("active");
        openMenu("analysis-board");
    }else if (newHash.startsWith("#lobby")){
        document.getElementById("menu_play").classList.add("active");
        openMenu("lobby");
    }else if (newHash.startsWith("#game") || newHash.startsWith("#chall")){
        openMenu("multiplayer-game");
    }else if (newHash.startsWith("#web-phil")){
        openMenu("web-phil");
    }

    if (!quiet){
        if (newHash.startsWith("#puzzles=")){
            const puzzleId = parseInt(newHash.replace("#puzzles=", ""));
            await gameState.widgets.PuzzlesWidget.puzzles;
            gameState.widgets.PuzzlesWidget.loadPuzzle(puzzleId);
        }else if (newHash.startsWith("#game=")){
            const parts = getGameIdParts(newHash.replace("#game=", ""));
            gameState.widgets.NetworkWidget.setNetworkId(parts.gameId, parts.rowNum, parts.userId, true);
        }else if (newHash.startsWith("#chall=")){
            acceptChallenge(newHash.replace("#chall=", ""));
        }else if (newHash.startsWith("#board,pgn=")){
            const pgn = decodeURIComponent(newHash.replace("#board,pgn=", ""));
            changeHash("#board", true);
            gameState.loadPGN(pgn);
            return;
        }
    }
}

export function setAnalysisBoard(){
    // disable network widget now so that the engine widget can start
    gameState.widgets.NetworkWidget.disable();
    gameState.setActiveWidgets(new Set([
        "ExtrasWidget",
        "PGNWidget",
        "AnnotatorWidget",
        "AudioWidget",
        "AnimationsWidget",
        "EngineWidget"
    ]));
    openMenuContainer(mainBoardElem);
}

export function setMultiplayerBoard(){
    gameState.setActiveWidgets(new Set([
        "PGNWidget",
        "AnnotatorWidget",
        "AudioWidget",
        "AnimationsWidget",
        "PlayersWidget"
    ]));
    gameState.allowVariations = false;
    openMenuContainer(mainBoardElem);
}

export function closeMultiplayerBoard(){
    gameState.allowVariations = true;
    gameState.allowInputFrom[Side.White] = true;
    gameState.allowInputFrom[Side.Black] = true;
}

// to-do: trying to separate out menu initialization from menu.js, maybe these should go elsewhere?
registerMenu("analysis-board", setAnalysisBoard, () => 0);
registerMenu("multiplayer-game", setMultiplayerBoard, closeMultiplayerBoard);
