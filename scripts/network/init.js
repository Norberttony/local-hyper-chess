if (window.location.search != ""){
    const params = new URLSearchParams(window.location.search);
    const fullGameId = params.get("game_id").split("_");
    
    NETWORK.gameId = fullGameId[0];
    NETWORK.refNum = parseInt(fullGameId[1]);

    const localFetch = localStorage.getItem(`${NETWORK.gameId}_${NETWORK.refNum}_userId`);
    if (localFetch)
        NETWORK.userId = localFetch;

    // try to fetch game OR fetch challenge
    (async () => {
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
            for (const m of gameInfo.moves){
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
            }

        }else{
            // otherwise request challenge
            NETWORK.userId = undefined;
            let challengeInfo = await pollDatabase("GET", {
                type: "challenge",
                id: getMyId()
            });

            if (challengeInfo && challengeInfo != "false"){
                if (challengeInfo[0] != "{"){
                    // must load the game id instead
                    window.location.search = `?game_id=${challengeInfo}`;
                }else{
                    console.log("chall", challengeInfo);
                    challengeInfo = JSON.parse(challengeInfo);

                    NETWORK.moveNum = 0;
                    setMyId(challengeInfo.gameId);
                    gameState.loadFEN(challengeInfo.fen);

                    // challenger will get opposite color
                    if (challengeInfo.color == "white"){
                        setUpBoard(-1);
                    }else{
                        setUpBoard(1);
                    }
                    if (!gameState.allowedSides[challengeInfo.color == "white" ? Piece.white : Piece.black]){
                        waitForMove();
                    }
                    startGettingOffers();
                }
            }else{
                alert("Invalid ID, it's possible the room has expired.");
            }
        }
    })();
    
}
