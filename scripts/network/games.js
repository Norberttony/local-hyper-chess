
// fetches the game from the database
async function fetchGame(gameId, rowNum, userId){

    // check the cache
    const cacheId = `${gameId}_${rowNum}_cached`;
    const cachedGame = JSON.parse(localStorage.getItem(cacheId));
    if (cachedGame && cachedGame.lastActive){
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
