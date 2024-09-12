
const myGamesElem = document.getElementById("my-games");
const myGames_fetchingElem = document.getElementById("my-games_fetching");
const boardTemplate = document.getElementById("board-template").children[0];

refreshViewGames();

async function refreshViewGames(){
    // start by clearing previous games
    myGamesElem.innerHTML = "";
    myGames_fetchingElem.innerText = "Fetching your games...";

    if (typeof localStorage === "undefined"){
        myGames_fetchingElem.innerText = "Error: browser's local storage is not enabled";
        return;
    }

    let allGames = [];

    // go through every game the user might have played
    for (const [ k, userId ] of Object.entries(localStorage)){
        if (k.endsWith("_userId")){

            const [ gameId, refNum ] = k.replace("_userId", "").split("_");

            // fetch with this information
            const gameInfo = await fetchGame(`${gameId}_${userId}_${refNum}`);

            // something might have gone wrong when communicating with the server
            if (!gameInfo || !gameInfo.status){
                continue;
            }

            // server could not find game, or the user isn't playing this game.
            if (gameInfo.status == "err" || gameInfo.color == "none"){
                localStorage.removeItem(k);
                continue;
            }

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

            // gameInfo will be used in sorting.
            const sortGI = Object.assign({}, gameInfo);
            sortGI.elem = boardElem;
            sortGI.toPlay = toPlay;

            // sort the gameInfo with the rest of the games
            const idx = binaryInsert(allGames, sortGI, compareGames);
            if (idx + 1 == allGames.length){
                myGamesElem.appendChild(boardElem);
            }else{
                myGamesElem.insertBefore(boardElem, allGames[idx + 1].elem);
            }

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

    console.log(allGames);

    myGames_fetchingElem.innerText = "All games have been fetched";
    console.log("Refreshing view games done");
}

// returns true if game 1 is more important (greater) than game 2 and false otherwise
function compareGames(g1, g2){
    // games w/ no result are more important
    if (g1.result == "*"){
        // prioritize based on whose turn it is to play
        if (g1.toPlay == g1.color)
            return g2.result != "*" || g2.toPlay != g2.color;
        else
            return g2.result != "*";
    }

    if (g2.result == "*"){
        return false;
    }

    return new Date(g1.lastActive || g1.timestamp || 0) > new Date(g2.lastActive || g2.timestamp || 0);
}

// receives a sorted array, item, and an optional function which extracts value to compare with.
// returns the index of the newly inserted element.
// sorted array should be in descending order.
function binaryInsert(arr, item, cmp = (a, b) => a > b){
    let lo = 0;
    let hi = arr.length;

    while (lo < hi){
        const mid = Math.floor((lo + hi) / 2);
        const midItem = arr[mid];
        
        if (cmp(item, midItem)){
            hi = mid;
        }else{
            lo = mid + 1;
        }
    }

    arr.splice(lo, 0, item);

    return lo;
}
