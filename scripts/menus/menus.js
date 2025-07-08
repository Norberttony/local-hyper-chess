
const MENUS = {
    activeMenu: undefined,
    containers: [ "main-board", "lobby", "my-games_container" ],
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

async function changeHash(newHash, quiet = false){
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

// expects widgets to be a set
function setWidgetsActive(widgets){
    for (const [ name, widget ] of Object.entries(gameState.widgets)){
        if (widgets.has(name))
            widget.enable();
        else
            widget.disable();
    }
}

const LOBBY = {
    interval: undefined
};

registerMenu("lobby",
    () => {
        activateContainer("lobby");
        refreshChallenges();
        LOBBY.interval = setInterval(refreshChallenges, 6000);
        fetchFeaturedGame();
    },
    () => {
        if (LOBBY.interval)
            clearInterval(LOBBY.interval);
        stopUpdatingFeaturedGame();
    }
);

registerMenu("view-games",
    () => {
        document.getElementById("menu_my-games").classList.add("active");
        activateContainer("my-games_container");
        // for some reason, activating this menu causes the entire UI to wait until all games
        // are refreshed (even though it is async...?)
        refreshViewGamesSetup();
    },
    () => 0
);

registerMenu("analysis-board",
    () => {
        setWidgetsActive(new Set([
            "ExtrasWidget",
            "PGNWidget",
            "AnnotatorWidget",
            "AudioWidget",
            "AnimationsWidget"
        ]));

        activateContainer("main-board");
    },
    () => 0
);

registerMenu("puzzles",
    () => {
        setWidgetsActive(new Set([
            "PGNWidget",
            "AnnotatorWidget",
            "AudioWidget",
            "AnimationsWidget",
            "PuzzlesWidget"
        ]));

        activateContainer("main-board");
    },
    () => {
        // reset the analysis board's state
        gameState.loadFEN(StartingFEN);
    }
);

registerMenu("multiplayer-game",
    () => {
        activateContainer("main-board");
        setWidgetsActive(new Set([
            "PGNWidget",
            "AnnotatorWidget",
            "AudioWidget",
            "AnimationsWidget"
        ]));
        gameState.allowVariations = false;
    },
    () => {
        gameState.allowVariations = true;
        gameState.allowInputFrom[Piece.white] = true;
        gameState.allowInputFrom[Piece.black] = true;
    }
);

registerMenu("web-phil",
    () => {
        setWidgetsActive(new Set([
            "PGNWidget",
            "AnnotatorWidget",
            "AudioWidget",
            "AnimationsWidget",
            "WebPhilWidget",
            "ExtrasWidget"
        ]));

        activateContainer("main-board");
        gameState.allowVariations = false;
    },
    () => {
        gameState.allowVariations = true;
    }
)
