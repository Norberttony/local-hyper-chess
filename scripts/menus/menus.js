
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

// network handles activating game controls (spectators have no game controls) but whenever
// network is hidden, the pregame controls should always be activated.
function setNetworkVisibility(vis){
    if (!vis)
        activatePreGameControls();
}

function setExtraVisibility(vis){
    vis ? widgets.extras.enable() : widgets.extras.disable();
}

function setPuzzlesVisibility(vis){
    const setDisplay = vis ? "" : "none";

    getFirstElemOfClass(document, "puzzles-widget").style.display = setDisplay;
}

function changeHash(newHash, quiet = false){
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
            loadGame(newHash.replace("#game=", ""));
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

const LOBBY = {
    interval: undefined
};

registerMenu("lobby",
    () => {
        activateContainer("lobby");

        refreshChallenges();
        LOBBY.interval = setInterval(refreshChallenges, 10000);

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
        // pgnText.value = gameState.pgnData.toString();

        activateContainer("main-board");
        setNetworkVisibility(false);
        setExtraVisibility(true);
        setPuzzlesVisibility(false);
        hideNames();
    },
    () => {}
);

registerMenu("puzzles",
    () => {
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

        toggle_bookmarkElem.style.display = "block";
    },
    () => {
        stopWaitingForMove();
        gameState.allowVariations = true;
        gameState.allowedSides[Piece.white] = true;
        gameState.allowedSides[Piece.black] = true;

        panel_rematchElem.style.display = "none";
        panel_goToBoardElem.style.display = "none";

        toggle_bookmarkElem.style.display = "none";
    }
);

registerMenu("web-phil",
    () => {
        activateContainer("main-board");
        setNetworkVisibility(false);
        setExtraVisibility(true);
        setPuzzlesVisibility(false);
        gameState.allowVariations = false;

        document.getElementById("web-phil").style.display = "";
        gameState.loadFEN(StartingFEN);
    },
    () => {
        document.getElementById("web-phil").style.display = "none";
        stopWebPhil();
    }
)
