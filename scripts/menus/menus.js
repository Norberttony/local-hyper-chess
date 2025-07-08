
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
            loadPuzzle(puzzleId);
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
    () => {

    }
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
    () => {}
);

registerMenu("puzzles",
    () => {
        setWidgetsActive(new Set([
            "PGNWidget",
            "AnnotatorWidget",
            "AudioWidget",
            "AnimationsWidget",
            
        ]));

        activateContainer("main-board");
        setNetworkVisibility(false);
        setExtraVisibility(false);
        setPuzzlesVisibility(true);
        hideNames();
    },
    () => {
        stopSolvingPuzzle();
        
        // reset the analysis board's state
        gameState.loadFEN(StartingFEN);
    }
);

registerMenu("multiplayer-game",
    () => {
        activateContainer("main-board");
        setNetworkVisibility(true);
        setExtraVisibility(false);
        setPuzzlesVisibility(false);
        gameState.allowVariations = false;
    },
    () => {
        gameState.allowVariations = true;
        gameState.allowInputFrom[Piece.white] = true;
        gameState.allowInputFrom[Piece.black] = true;

        // panel_rematchElem.style.display = "none";
        // panel_goToBoardElem.style.display = "none";
    }
);

registerMenu("web-phil",
    () => {
        setNetworkVisibility(false);

        widgets.web_phil.enable();
        widgets.network.active = false;
        delete widgets.network.color;
        delete widgets.network.gameId;
        delete widgets.network.userId;

        activateContainer("main-board");
        setExtraVisibility(true);
        setPuzzlesVisibility(false);
        gameState.allowVariations = false;
    },
    () => {
        widgets.web_phil.disable();
        widgets.web_phil.stop();

        gameState.allowVariations = true;
    }
)
