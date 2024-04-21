if (window.location.search != ""){
    const params = new URLSearchParams(window.location.search);
    const fullGameId = params.get("game_id").split("_");
    
    NETWORK.gameId = fullGameId[0];
    NETWORK.refNum = parseInt(fullGameId[1]);

    console.log(getMyId());

    // try to fetch game OR fetch challenge
    (async () => {
        const gameInfo = JSON.parse(
            await pollDatabase("GET", {
                type: "game",
                id: getMyId()
            })
        );

        if (gameInfo != "false"){
            console.log("game", gameInfo);
            gameState.loadFEN(gameInfo.fen);
            for (const m of gameInfo.moves){
                console.log(m);
                if (m != ""){
                    lastPlayedSAN = m;
                    gameState.makeMove(gameState.board.getMoveOfSAN(m));
                }
            }
            // to-do: set result of game
            console.log(gameInfo.result);
        }else{
            // otherwise request challenge
            NETWORK.userId = undefined;
            const challengeInfo = JSON.parse(
                await pollDatabase("GET", {
                    type: "challenge",
                    id: getMyId()
                })
            );

            if (challengeInfo != "false"){
                console.log("chall", challengeInfo);
                setMyId(challengeInfo.gameId);
                gameState.loadFEN(challengeInfo.fen);

                // challenger will get opposite color
                if (challengeInfo.color == "white"){
                    setUpBoard(-1);
                }else{
                    setUpBoard(1);
                }
            }else{
                alert("Invalid ID, it's possible the room has expired.");
            }
        }
    })();
    
}
