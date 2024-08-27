
const MENUS = {
    activeMenu: undefined,
    containers: [ "container", "lobby_container", "my-games_container" ],
    menus: {}
};


// adds a menu to the collection.
// start performs initialization for the menu item and stop performs de-initialization.
function registerMenu(name, start, stop){
    if (MENUS.menus[name])
        throw new Error(`Registering another menu with the same name ${name}`);
    MENUS.menus[name] = { start, stop };
}

function openMenu(name){
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

function activateContainer(id){
    for (const id of MENUS.containers){
        document.getElementById(id).style.display = "none";
    }

    document.getElementById(id).style.display = "";
}

function setNetworkVisibility(vis){
    const setDisplay = vis ? "" : "none";

    document.getElementById("play-game-controls").style.display = setDisplay;
}

function setExtraVisibility(vis){
    const setDisplay = vis ? "" : "none";

    document.getElementById("extra").style.display = setDisplay;
}

function setPuzzlesVisibility(vis){
    const setDisplay = vis ? "" : "none";

    document.getElementById("puzzles").style.display = setDisplay;
}

function changeHash(newHash, quiet = false){
    history.pushState(null, "", newHash);

    if (newHash.startsWith("#puzzles")){
        openMenu("puzzles");
    }else if (newHash.startsWith("#my-games")){
        openMenu("view-games");
    }else if (newHash.startsWith("#board")){
        openMenu("analysis-board");
    }else if (newHash.startsWith("#lobby")){
        openMenu("lobby");
    }else if (newHash.startsWith("#game") || newHash.startsWith("#chall")){
        openMenu("multiplayer-game");
    }

    if (!quiet){
        if (newHash.startsWith("#puzzles=")){
            const puzzleId = parseInt(newHash.replace("#puzzles=", ""));
            loadPuzzle(puzzleId);
        }else if (newHash.startsWith("#game=")){
            loadGame(newHash.replace("#game=", ""));
        }else if (newHash.startsWith("#chall=")){
            acceptChallenge(newHash.replace("#chall=", ""));
        }
    }
}

const LOBBY = {
    interval: undefined
};

registerMenu("lobby",
    () => {
        activateContainer("lobby_container");

        refreshChallenges();
        LOBBY.interval = setInterval(refreshChallenges, 10000);
    },
    () => {
        if (LOBBY.interval)
            clearInterval(LOBBY.interval);
    }
);

registerMenu("view-games",
    () => {
        activateContainer("my-games_container");
    },
    () => {

    }
);

const analysisState = {
    pgn: ""
};

registerMenu("analysis-board",
    () => {
        pgnText.value = gameState.pgnData.toString();

        activateContainer("container");
        setNetworkVisibility(false);
        setExtraVisibility(true);
        setPuzzlesVisibility(false);
        hideNames();
    },
    () => {
        // save state of analysis board
        analysisState.pgn = pgnText.value;
    }
);

registerMenu("puzzles",
    () => {
        activateContainer("container");
        setNetworkVisibility(false);
        setExtraVisibility(false);
        setPuzzlesVisibility(true);
        hideNames();

        console.log("START SOLVING");
        document.getElementById("panel").style.height = "calc(var(--game-height) / 2)";
    },
    () => {
        document.getElementById("panel").style.height = "";

        stopSolvingPuzzle();
        
        // reset the analysis board's state
        gameState.loadPGN(analysisState.pgn);
    }
);

registerMenu("multiplayer-game",
    () => {
        activateContainer("container");
        setNetworkVisibility(true);
        setExtraVisibility(false);
        setPuzzlesVisibility(false);
        gameState.allowVariations = false;
    },
    () => {
        if (waitForMoveActive)
            keepWaitingForMove = false;
        gameState.allowVariations = true;

        // save state of analysis board
        analysisState.pgn = pgnText.value;
    }
);
