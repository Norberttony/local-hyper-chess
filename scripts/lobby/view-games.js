
const myGamesElem = document.getElementById("my-games");
const myGames_fetchingElem = document.getElementById("my-games_fetching");
const boardTemplate = document.getElementById("board-template").children[0];

refreshViewGames();

async function refreshViewGames(){
    // start by clearing previous games
    myGamesElem.innerHTML = "";

    if (typeof localStorage === "undefined"){
        myGames_fetchingElem.innerText = "Error: browser's local storage is not enabled";
        return;
    }

    // go through every game the user might have played
    for (const [ k, userId ] of Object.entries(localStorage)){
        if (k.endsWith("_userId")){

            const [ gameId, refNum ] = k.replace("_userId", "").split("_");

            // fetch with this information
            const gameInfo = await fetchGame(`${gameId}_${userId}_${refNum}`);

            if (!gameInfo || !gameInfo.status || gameInfo.status == "err" || gameInfo.color == "none"){
                localStorage.removeItem(k);
                continue;
            }

            if (gameInfo.status == "ok"){

                const { fen, color, result, moves } = gameInfo;

                // load moves using an external board.
                const board = new Board();
                board.loadFEN(gameInfo.fen);

                const movesSplit = moves.split(" ");
                let res;
                let term;
                let lastMove;
                let toPlay = board.turn;
                for (const m of movesSplit){
                    if (m != ""){
                        if (m.startsWith("1-0") || m.startsWith("0-1") || m.startsWith("1/2-1/2")){
                            res = m;
                            term = movesSplit[movesSplit.length - 1];
                            break;
                        }else{
                            const move = board.getMoveOfSAN(m);
                            board.makeMove(move);
                            lastMove = move;
                            toPlay = board.turn;
                        }
                    }
                }
                toPlay = toPlay == Piece.black ? "black" : "white";

                // add the board to the display
                const boardElem = boardTemplate.cloneNode(true);
                myGamesElem.appendChild(boardElem);

                const boardGameElem = boardElem.getElementsByClassName("game")[0];

                displayBoard(board, lastMove, color == "black", boardGameElem);

                // remove id from all piece elements
                for (const p of boardGameElem.getElementsByClassName("piece")){
                    p.id = "";
                }

                // if a result exists, display it on the board
                if (result && result != "*"){
                    const resDiv = document.createElement("div");
                    resDiv.classList.add("result");
                    resDiv.innerText = result.split("-").join(" - ");
                    boardGameElem.appendChild(resDiv);
                }else{
                    // add a message if it is the user to play
                    const toPlayElem = document.createElement("p");
                    toPlayElem.classList.add("message");
                    boardElem.appendChild(toPlayElem);
                    if (toPlay == color){
                        toPlayElem.innerText = "It is your turn to play";
                    }else{
                        toPlayElem.innerText = "Waiting for opponent";
                    }
                }

                // clicking on the board should link to the game
                boardElem.addEventListener("click", () => {
                    setMyId(`${gameId}_${userId}_${refNum}`);
                    changeHash(`#game=${gameId}_${refNum}`);
                });
            }
        }
    }

    myGames_fetchingElem.innerText = "All games have been fetched";
    console.log("Refreshing view games done");
}
