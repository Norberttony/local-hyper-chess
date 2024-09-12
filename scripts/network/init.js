
function getGameIdParts(gameId){
    const parts = {
        gameId: undefined,
        userId: undefined,
        refNum: undefined
    };

    const gameIdParts = gameId.split("_");

    if (!isNaN(gameIdParts[1])){
        // gameId is of the form gameId_refNum
        parts.gameId = gameIdParts[0];
        parts.refNum = parseInt(gameIdParts[1]);

        // try to fetch stored user id
        const localFetch = localStorage.getItem(`${parts.gameId}_${parts.refNum}_userId`);
        if (localFetch)
            parts.userId = localFetch;

    }else{
        // gameId is of the form gameId_userId_refNum
        parts.gameId = gameIdParts[0];
        parts.userId = gameIdParts[1];
        parts.refNum = parseInt(gameIdParts[2]);
    }
    
    return parts;
}

// fetches the game from the database
async function fetchGame(gameSuperId){

    // split super id to parts
    const superIdSplit = gameSuperId.split("_");
    const gameId = superIdSplit[0];
    const refNum = superIdSplit[superIdSplit.length - 1];

    // check the cache
    const cacheId = `${gameId}_${refNum}_cached`;
    const cachedGame = JSON.parse(localStorage.getItem(cacheId));
    if (cachedGame){
        // update timestamp
        cachedGame.timestamp = new Date();
        localStorage.setItem(cacheId, JSON.stringify(cachedGame));

        return cachedGame;
    }

    const dbGame = JSON.parse(
        await pollDatabase("GET", {
            type: "game",
            id: gameSuperId
        })
    );

    // start storing this in cache only if it is archived
    if (dbGame && dbGame.status != "err" && dbGame.archived){
        dbGame.timestamp = new Date();
        localStorage.setItem(cacheId, JSON.stringify(dbGame));
    }

    return dbGame;
}

// displays the game on the board (PGN, FEN, player names, etc.)
async function loadGame(gameSuperId){
    // notify user
    showDialogBox("Fetching Game...", "The game is being fetched from the database");

    document.getElementById("panel_rematch").style.display = "none";

    console.log("Fetching game information for", gameSuperId);

    // break into parts
    const { gameId, userId, refNum } = getGameIdParts(gameSuperId);
    NETWORK.gameId = gameId;
    NETWORK.userId = userId;
    NETWORK.refNum = refNum;

    // in case user reconnects later, store the user id for this game in local storage
    // this will allow the server to recognize the user as one of the players.
    if (userId)
        storeUserId(gameId, refNum, userId);
    else
        NETWORK.userId = fetchUserId(gameId, refNum);

    console.log(getMyId());

    // request game from database
    const gameInfo = await fetchGame(getMyId());

    console.log(gameInfo);

    if (!gameInfo || gameInfo.status == "err"){
        hideDialogBox();
        hideDialogContainer();
        alert(`The game could not be found in the database. ${gameInfo ? gameInfo.msg : ""}`);
        return;
    }

    // notify user of successful db connection
    showDialogBox("Loading Game...", "The game is almost ready!");

    // everything is put in a timeout in order for the dialog box to update.
    setTimeout(() => {

        // interpret game info from db
        const { moveNum, names, fen, color, moves, archived } = gameInfo;

        NETWORK.moveNum = moveNum;
        gameState.loadFEN(fen);

        // set up the names and board based on color
        const [ whiteName, blackName ] = names ? names.split("_") : [ "Anonymous", "Anonymous" ];
        if (color != "none"){
            setUpBoard(color == "white" ? 1 : -1);
            setNames(color == "white" ? "You" : whiteName, color == "black" ? "You" : blackName);
        }else{
            setNames(whiteName, blackName);
        }

        // load the game move by move
        const movesSplit = moves.split(" ");
        let res;
        let term;
        for (const m of movesSplit){
            if (m != ""){
                if (m.startsWith("1-0") || m.startsWith("0-1") || m.startsWith("1/2-1/2")){
                    res = m;
                    term = movesSplit[movesSplit.length - 1];
                    break;
                }else{
                    const move = gameState.board.getMoveOfSAN(m);
                    gameState.makeMove(move);
                }
            }
        }

        hideDialogContainer();

        console.log("From fetching game:", res, term);

        if (res && term)
            setResult(res, term);

        gameState.applyChanges();

        if (color != "none")
            NETWORK.myColor = color;
        
        waitForMove();

        // disallow both sides from moving for spectators
        if (color == "none" && !archived){
            gameState.setSide();
        }
        
        // if game is archived, skip to the beginning
        if (archived){
            gameState.jumpToVariation(gameState.variationRoot);
            gameState.applyChanges();
        }

        hideDialogBox();

        // update pgn headers
        gameState.pgnData.setHeader("Event", "Hyper Chess Online Game");

    }, 100);
}

async function acceptChallenge(challengeId){
    showDialogBox("Fetching challenge...", "Looking for an active challenge with this ID");

    // request from server
    const challengeInfo = JSON.parse(
        await pollDatabase("GET", {
            type: "acceptChallenge",
            id: challengeId
        })
    );

    if (!challengeInfo || challengeInfo.status == "err"){
        hideDialogBox();
        hideDialogContainer();
        alert(`An error occurred: ${challengeInfo.msg}`);
        return;
    }

    const gameSuperId = challengeInfo.gameId.split("_");

    if (gameSuperId.length == 2){
        // a game ID has been given from the server
        // this challenge was already accepted and now links to this game.
        changeHash(`#game=${challengeInfo.gameId}`);
        alert("Too late, the challenge was already accepted. You may spectate the game.");
    }else if (gameSuperId.length == 3){

        // set NETWORK variables
        const [ gameId, userId, refNum ] = gameSuperId;
        NETWORK.gameId = gameId;
        NETWORK.userId = userId;
        NETWORK.refNum = refNum;
        NETWORK.moveNum = 0;

        // store user ID and set the hash correctly
        storeUserId(gameId, refNum, userId);
        changeHash(`#game=${gameId}_${refNum}`);
    }
}

function setNames(whiteName, blackName){
    whiteInfoElem.style.display = "block";
    whiteInfoElem.getElementsByClassName("name")[0].innerText = whiteName;

    blackInfoElem.style.display = "block";
    blackInfoElem.getElementsByClassName("name")[0].innerText = blackName;
}

function hideNames(){
    whiteInfoElem.style.display = "none";
    blackInfoElem.style.display = "none";
}

// if the cache contains more than maxGames games, the oldest games are purged.
function purgeCache(maxGames){
    const cachedGames = [];
    for (const [ k, v ] of Object.entries(localStorage)){
        if (k.endsWith("_cached")){
            if (!v.startsWith("{")){
                localStorage.removeItem(k);
                continue;
            }

            const game = JSON.parse(v);
            game.key = k;
            cachedGames.push(game);

        }
    }

    cachedGames.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (cachedGames.length > maxGames){
        const removedGames = cachedGames.splice(0, cachedGames.length - maxGames);
        console.log("Removed cached games:", removedGames);
        for (const g of removedGames){
            localStorage.removeItem(g.key);
        }
    }
}

// purge cache once on entering website
purgeCache(200);
