if (window.location.search != ""){
    const params = new URLSearchParams(window.location.search);
    const fullGameId = params.get("game_id");
    const fullChallengeId = params.get("challenge_id");
    
    if (fullGameId){
        const fullGameIdParts = fullGameId.split("_");
        NETWORK.gameId = fullGameIdParts[0];
        NETWORK.refNum = parseInt(fullGameIdParts[1]);

        // try to fetch stored user id
        const localFetch = localStorage.getItem(`${NETWORK.gameId}_${NETWORK.refNum}_userId`);
        if (localFetch)
            NETWORK.userId = localFetch;

        initFetchGame();
    }else if (fullChallengeId){
        const fullChallengeIdParts = fullChallengeId.split("_");
        NETWORK.gameId = fullChallengeIdParts[0];

        initFetchChallenge();
    }
}

async function initFetchGame(){
    const gameInfo = JSON.parse(
        await pollDatabase("GET", {
            type: "game",
            id: getMyId()
        })
    );

    if (gameInfo){
        console.log("game", gameInfo);

        NETWORK.moveNum = gameInfo.moveNum;

        gameState.loadFEN(gameInfo.fen);

        console.log(gameInfo.color);
        if (gameInfo.color != "none"){
            setUpBoard(gameInfo.color == "white" ? 1 : -1);
        }

        stopAnimations = true;
        for (const m of gameInfo.moves.split(" ")){
            console.log(m);
            if (m != ""){
                if (m.startsWith("1-0") || m.startsWith("0-1") || m.startsWith("1/2-1/2")){
                    let s = m.indexOf(" ");
                    setResult(m.substring(0, s), m.substring(s + 1));
                }else{
                    lastPlayedSAN = m;
                    const move = gameState.board.getMoveOfSAN(m);
                    gameState.makeMove(move);
                }
            }
        }
        stopAnimations = false;
        // to-do: set result of game
        console.log(gameInfo.result);

        console.log(gameState.board.turn, gameInfo.color);
        if (gameInfo.color != "none" && gameInfo.archived == false){
            console.log(gameState.board.turn, gameInfo.color == "white" ? Piece.white : Piece.black);
            if (gameState.board.turn != (gameInfo.color == "white" ? Piece.white : Piece.black)){
                console.log("awaiting opponent's move");
                waitForMove();
            }
            startGettingOffers();
        }else{
            // disallow both sides from moving
            gameState.setSide();
        }
    }
}

async function initFetchChallenge(){
    // clear variables not used for challenges
    NETWORK.userId = undefined;
    NETWORK.refNum = undefined;

    // request challenge info
    let challengeInfo = await pollDatabase("GET", {
        type: "acceptChallenge",
        id: getMyId()
    });

    console.log(challengeInfo);

    // challenge info either fails or returns a new game or old game id.
    if (challengeInfo && challengeInfo != "false"){
        if (challengeInfo[0] != "{"){
            // must load the old game with the id instead
            window.location.search = `?game_id=${JSON.parse(challengeInfo)}`;
        }else{
            // prepare loading this new game
            challengeInfo = JSON.parse(challengeInfo);

            NETWORK.moveNum = 0;
            setMyId(challengeInfo.gameId);
            localStorage.setItem(`${NETWORK.gameId}_${NETWORK.refNum}_userId`, NETWORK.userId);

            window.location.search = `?game_id=${NETWORK.gameId}_${NETWORK.refNum}`;
        }
    }else{
        alert("Invalid ID, it's possible the room has expired.");
    }
}
