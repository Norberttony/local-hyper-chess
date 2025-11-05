
import { BoardGraphics } from "hyper-chess-board/graphics/index.js";
import { PlayersWidget, WIDGET_LOCATIONS } from "hyper-chess-board/graphics/widgets/index.js";

import { NetworkWidget } from "../graphics/widgets/network-widget.js";
import { registerMenu, openMenuContainer } from "../menus/menus.js";
import { gameLoader } from "../workers/game-loader.js";

const myGames_containerElem = document.getElementById("my-games_container");
const myGamesElem = document.getElementById("my-games");
const myGames_fetchingElem = document.getElementById("my-games_fetching");
const myGames_menuElem = document.getElementById("my-games_menu");
const myGames_download = document.getElementById("my-games_download");

registerMenu("view-games", openGames, closeGames);

// to-do: more global state to get rid of
window.downloadMyGames = downloadMyGames;

function openGames(){
    document.getElementById("menu_my-games").classList.add("active");
    openMenuContainer(myGames_containerElem);
    refreshViewGamesSetup();
}

function closeGames(){}

let allMyGames = [];
let allMyGamesTicket = 0;

// when calling refreshViewGames directly, the website layout isn't recalculated or re-set until
// everything finishes. So, it is separated by a setTimeout to allow the website to update
// correctly.
function refreshViewGamesSetup(){
    // start by clearing previous games
    myGamesElem.innerHTML = "";
    myGames_download.disabled = true;
    let myTicket = ++allMyGamesTicket;
    
    // clear gameloader tasks...
    gameLoader.tasks = [];

    setTimeout(() => {
        if (myTicket == allMyGamesTicket)
            refreshViewGames(allMyGamesTicket);
    }, 100);
}

async function refreshViewGames(ticket){
    if (typeof localStorage === "undefined"){
        myGames_fetchingElem.innerText = "Error: browser's local storage is not enabled";
        return;
    }

    allMyGames = [];

    // go through every game the user might have played
    for (const [ k, userId ] of Object.entries(localStorage)){
        if (k.endsWith("_userId")){

            const [ gameId, rowNum ] = k.replace("_userId", "").split("_");

            console.log(gameId, rowNum);

            const boardgfx = new BoardGraphics(false, false);
            const boardElem = boardgfx.skeleton;

            const network = new NetworkWidget(boardgfx, WIDGET_LOCATIONS.NONE);
            new PlayersWidget(boardgfx);

            myGamesElem.appendChild(boardElem);

            network.setNetworkId(gameId, rowNum, userId, false)
                .then((gameInfo) => {
                    if (allMyGamesTicket == ticket)
                        initViewGameBoard(gameInfo, boardgfx, gameId, rowNum, userId);
                })
                .catch((msg) => {
                    console.warn(`Could not load game ${gameId}_${rowNum} because ${msg}`);

                    // delete board elem
                    myGamesElem.removeChild(boardElem);

                    // if the game no longer exists or the user no longer has access to it, it
                    // is removed entirely.
                    if (msg == "Error: ID has an illegal reference")
                        localStorage.removeItem(k);
                });
        }
    }

    myGames_download.removeAttribute("disabled");
    console.log("Refreshing view games done");
}

function initViewGameBoard(gameInfo, boardgfx, gameId, rowNum, userId){
    const boardElem = boardgfx.skeleton;
    boardgfx.jumpToVariation(boardgfx.mainVariation);
    boardgfx.applyChanges();

    const names = (gameInfo.names || "Anonymous_Anonymous").split("_");
    if (gameInfo.color == "white")
        names[0] = "You";
    else if (gameInfo.color == "black")
        names[1] = "You";
    boardgfx.setNames(...names);

    if (gameInfo.result && gameInfo.result != "*"){
        const isWinner = gameInfo.result == "0-1" && gameInfo.color == "black" || gameInfo.result == "1-0" && gameInfo.color == "white";

        const resDiv = document.createElement("div");
        resDiv.classList.add("board-graphics__result");

        const resText = document.createElement("span");
        resText.innerText = gameInfo.result.split("-").join(" - ");
        resDiv.appendChild(resText);

        const winText = document.createElement("span");
        winText.classList.add("board-graphics_result__user-win");
        winText.innerText = "You " + (gameInfo.result == "1/2-1/2" ? "drew" : (isWinner ? "won" : "lost"));
        resDiv.appendChild(winText);

        boardgfx.boardDiv.appendChild(resDiv);

        // add a delete button for the game
        const delElem = document.createElement("button");
        delElem.classList.add("delete");
        boardElem.appendChild(delElem);

        delElem.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (confirm("Are you sure you want to remove this game from your storage?\nThe game will still be accessible to users with the link.")){
                // remove from local storage
                localStorage.removeItem(`${gameId}_${rowNum}_userId`);
                boardElem.parentNode.removeChild(boardElem);

                alert("Game has been removed from your storage");
            }
        });
    }

    boardElem.addEventListener("click", () => {
        changeHash(`#game=${gameId}_${rowNum}`);
    });

    let toPlay = boardgfx.state.turn;

    // gameInfo will be used in sorting.
    const sortGI = Object.assign({}, gameInfo);
    sortGI.elem = boardElem;
    sortGI.toPlay = toPlay;
    sortGI.id = `${gameId}_${rowNum}`;

    // sort the gameInfo with the rest of the games
    const idx = binaryInsert(allMyGames, sortGI, compareGames);
    if (idx + 1 == allMyGames.length){
        myGamesElem.appendChild(boardElem);
    }else{
        myGamesElem.insertBefore(boardElem, allMyGames[idx + 1].elem);
    }
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

function downloadMyGames(){
    const games = allMyGames;
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
