
// The challenges in local storage are ones the user themselves created. This was done to avoid
// users accepting their own challenges (which would break the system, since it's not possible to
// store two different user ID's under one game ID).
function addChallToLocalStorage(challId){
    const challenges = getChallengesFromLocalStorage();
    challenges.push({ challId, strikes: 3 });

    localStorage.setItem("user_challenges", JSON.stringify(challenges));
}

function getChallengesFromLocalStorage(){
    if (!localStorage.getItem("user_challenges"))
        localStorage.setItem("user_challenges", "[]");

    return JSON.parse(localStorage.getItem("user_challenges"));
}

function setChallengesToLocalStorage(challenges){
    localStorage.setItem("user_challenges", JSON.stringify(challenges));
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
            if (game.fen.split(" ").length == 3){
                localStorage.removeItem(k);
                continue;
            }
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
