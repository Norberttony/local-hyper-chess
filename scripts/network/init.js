
function getGameIdParts(gameId){
    const parts = {
        gameId: undefined,
        userId: undefined,
        rowNum: undefined
    };

    const gameIdParts = gameId.split("_");

    if (!isNaN(gameIdParts[1])){
        // gameId is of the form gameId_rowNum
        parts.gameId = gameIdParts[0];
        parts.rowNum = parseInt(gameIdParts[1]);

        // try to fetch stored user id
        const localFetch = localStorage.getItem(`${parts.gameId}_${parts.rowNum}_userId`);
        if (localFetch)
            parts.userId = localFetch;

    }else{
        // gameId is of the form gameId_userId_rowNum
        parts.gameId = gameIdParts[0];
        parts.userId = gameIdParts[1];
        parts.rowNum = parseInt(gameIdParts[2]);
    }
    
    return parts;
}

// fetches the game from the database
async function fetchGame(gameId, rowNum, userId){

    // check the cache
    const cacheId = `${gameId}_${rowNum}_cached`;
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
            gameId,
            rowNum,
            userId
        })
    );

    // start storing this in cache only if it is archived
    if (dbGame && dbGame.status != "err" && dbGame.archived){
        dbGame.timestamp = new Date();
        localStorage.setItem(cacheId, JSON.stringify(dbGame));
    }

    return dbGame;
}

async function acceptChallenge(challengeId){
    showDialogBox("Fetching challenge...", "Looking for an active challenge with this ID");

    // request from server
    const challengeInfo = JSON.parse(
        await pollDatabase("GET", {
            type: "acceptChallenge",
            challId: challengeId
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
        widgets.network.setNetworkId(gameId, refNum, userId);

        // store user ID and set the hash correctly
        storeUserId(gameId, refNum, userId);
        changeHash(`#game=${gameId}_${refNum}`);
    }
}

function hideNames(){
    widgets.players.disable();
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
