
const myGamesElem = document.getElementById("my-games");
const myGames_fetchingElem = document.getElementById("my-games_fetching");
const myGames_menuElem = document.getElementById("my-games_menu");
const myGames_download = document.getElementById("my-games_download");

const bookmarkedGamesElem = document.getElementById("bookmarked-games");

let allMyGames = [];
let allMyBookmarks = [];

let activeViewGamesMenu = "my-games";

refreshViewGames();


function showMyGames(elem){
    myGamesElem.style.display = "";
    bookmarkedGamesElem.style.display = "none";

    myGames_menuElem.getElementsByClassName("active")[0].classList.remove("active");
    elem.classList.add("active");

    activeViewGamesMenu = "my-games";
}

function showBookmarkedGames(elem){
    bookmarkedGamesElem.style.display = "flex";
    myGamesElem.style.display = "none";

    myGames_menuElem.getElementsByClassName("active")[0].classList.remove("active");
    elem.classList.add("active");

    activeViewGamesMenu = "bookmarked-games";
}


function prepareBoardElem(id, gameInfo){
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
        changeHash(`#game=${id}`);
    });

    return [ boardElem, board ];
}

// when calling refreshViewGames directly, the website layout isn't recalculated or re-set until
// everything finishes. So, it is separated by a setTimeout to allow the website to update
// correctly.
function refreshViewGamesSetup(){
    // start by clearing previous games
    myGamesElem.innerHTML = "";
    myGames_fetchingElem.innerText = "Fetching your games...";
    myGames_download.disabled = true;

    setTimeout(() => {
        refreshViewGames();
    }, 100);
}

async function refreshViewGames(){
    if (typeof localStorage === "undefined"){
        myGames_fetchingElem.innerText = "Error: browser's local storage is not enabled";
        return;
    }

    allMyGames = [];

    // go through every game the user might have played
    for (const [ k, userId ] of Object.entries(localStorage)){
        if (k.endsWith("_userId")){

            const [ gameId, refNum ] = k.replace("_userId", "").split("_");

            const gameSuperId = `${gameId}_${userId}_${refNum}`;

            // fetch with this information
            const gameInfo = await fetchGame(gameSuperId);

            // something might have gone wrong when communicating with the server
            if (!gameInfo || !gameInfo.status){
                continue;
            }

            // server could not find game, or the user isn't playing this game.
            if (gameInfo.status == "err" || gameInfo.color == "none"){
                localStorage.removeItem(k);
                continue;
            }

            const [ boardElem, board ] = prepareBoardElem(`${gameId}_${refNum}`, gameInfo);

            boardElem.addEventListener("click", () => {
                setMyId(gameSuperId);
            });

            if (gameInfo.result && gameInfo.result != "*"){
                // add a delete button for the game
                const delElem = document.createElement("button");
                delElem.classList.add("delete");
                boardElem.appendChild(delElem);

                delElem.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    if (confirm("Are you sure you want to remove this game from your storage?\nThe game will still be visible to other users with the link.")){
                        // in order to keep the user's authentication, store it somewhere
                        // user should still be able to clear their unwanted archived games but the
                        // authentication is still stored to prove ownership of a game.
                        // this also provides (in the future) a way to retrieve games that were accidentally deleted.
                        const auths = JSON.parse(localStorage.getItem("authentications") || "[]");
                        auths.push(gameSuperId);
                        localStorage.setItem("authentications", JSON.stringify(auths));

                        // remove from local storage
                        localStorage.removeItem(k);
                        boardElem.parentNode.removeChild(boardElem);

                        alert("Game has been removed from your storage");
                    }
                });
            }

            let toPlay = board.turn;

            // gameInfo will be used in sorting.
            const sortGI = Object.assign({}, gameInfo);
            sortGI.elem = boardElem;
            sortGI.toPlay = toPlay;
            sortGI.id = `${gameId}_${refNum}`;

            // sort the gameInfo with the rest of the games
            const idx = binaryInsert(allMyGames, sortGI, compareGames);
            if (idx + 1 == allMyGames.length){
                myGamesElem.appendChild(boardElem);
            }else{
                myGamesElem.insertBefore(boardElem, allMyGames[idx + 1].elem);
            }
        }
    }

    await refreshBookmarkedGames();

    console.log(allMyGames);

    myGames_fetchingElem.innerText = "All games have been fetched";
    myGames_download.removeAttribute("disabled");
    console.log("Refreshing view games done");
}

async function refreshBookmarkedGames(){
    const bookmarkedGames = JSON.parse(localStorage.getItem("bookmarks") || "[]");

    let toRemove = [];

    bookmarkedGamesElem.innerHTML = "";

    allMyBookmarks = [];

    for (const b of bookmarkedGames){
        // fetch with this information
        const gameInfo = await fetchGame(b);

        // something might have gone wrong when communicating with the server
        if (!gameInfo || !gameInfo.status){
            continue;
        }

        // server could not find game, or the user isn't playing this game.
        if (gameInfo.status == "err"){
            toRemove.push(b);
            continue;
        }

        const [ boardElem, board ] = prepareBoardElem(b, gameInfo);

        gameInfo.toPlay = board.turn;
        gameInfo.id = b;
        gameInfo.elem = boardElem;
        allMyBookmarks.push(gameInfo);

        bookmarkedGamesElem.appendChild(boardElem);
    }

    for (const r of toRemove){
        bookmarkedGames.splice(bookmarkedGames.indexOf(r), 1);
    }

    localStorage.setItem("bookmarks", JSON.stringify(bookmarkedGames));
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

function downloadMyGames(games){
    let content = "";

    for (const g of games){
        // create a PGNData object just for the headers
        const pgn = new PGNData(new Variation(undefined, ""));

        // set the PGN headers accordingly.
        pgn.setHeader("Event", "Hyper Chess Online Game");
        pgn.setHeader("Site", `${window.location.origin}${window.location.pathname}#game=${g.id}`);
        pgn.setHeader("Result", g.result);

        if (g.fen != StartingFEN)
            pgn.setHeader("FEN", g.fen);

        if (g.names){
            const [ white, black ] = g.names.split("_");
            pgn.setHeader("White", g.color == "white" ? "You" : white);
            pgn.setHeader("Black", g.color == "black" ? "You" : black);
        }else{
            pgn.setHeader("White", g.color == "white" ? "You" : "Anonymous");
            pgn.setHeader("Black", g.color == "black" ? "You" : "Anonymous");
        }


        let moves = g.moves.trim().split(" ");

        // result and termination may be stored as last two elements.
        let res = moves[moves.length - 2];
        let term = moves[moves.length - 1];
        if (res != "1-0" && res != "1/2-1/2" && res != "0-1"){
            res = undefined;
            term = undefined;
        }else{
            moves.pop();
            moves.pop();
            res = res;
            term = term;
        }

        // database does not automatically record checkmate results at the end of the move PGN,
        // so it is done manually here.
        let finalMove = moves[moves.length - 1];
        if (finalMove[finalMove.length - 1] == "#"){
            res = g.result;
            term = "checkmate";
        }
        
        // add in the move counters! += 3 because adding a move offsets the array
        let c = 1;
        for (let i = 0; i < moves.length; i += 3)
            moves.splice(i, 0, `${c++}.`);

        // database does not automatically add an asterisk to indicate an incomplete game.
        if (!res && g.result == "*")
            res = "*";

        // capitalize first letter of termination
        if (term)
            term = term[0].toUpperCase() + term.substring(1);

        if (term)
            pgn.setHeader("Termination", term);

        // if result and termination exist, they should have a space separating them in the PGN
        if (res)
            res = ` ${res}`;
        else
            res = "";

        if (term)
            term = ` ${term}`;
        else
            term = "";

        content += `${pgn.toString()}${moves.join(" ")}${res}${term}\n\n\n`;
    }

    downloadAsFile("Hyper Chess Games.pgn", content);
}

function downloadAsFile(filename, txt){
    const a = document.createElement("a");
    
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(txt)}`;
    a.download = filename;
    a.style.display = "none";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
}
