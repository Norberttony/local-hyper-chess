
import { BoardGraphics } from "hyper-chess-board/graphics/index.js";
import { PlayersWidget } from "hyper-chess-board/graphics/widgets/index.js";

import { getFirstElemOfClass } from "../graphics/utils.js";
import { NetworkWidget } from "../graphics/widgets/network-widget.js";
import { pollDatabase } from "../network/db-utils.js";

const lobbyElem = document.getElementById("lobby");

const lobby_featuredGameElem            = getFirstElemOfClass(lobbyElem, "lobby__featured-game");
const lobby_featuredTitleElem           = getFirstElemOfClass(lobbyElem, "lobby__featured-title");
const lobby_featuredGameContainerElem = document.getElementById("lobby__featured-game-container");

// populate with a board template
const featuredGameBoard = new BoardGraphics(false);

// to-do: more global state
window.goToFeaturedGame = goToFeaturedGame;

let featuredGameId;

lobby_featuredGameContainerElem.appendChild(featuredGameBoard.skeleton);

new PlayersWidget(featuredGameBoard);
new NetworkWidget(featuredGameBoard, "None");


export async function fetchFeaturedGame(){
    featuredGameBoard.loading();
    const featured = JSON.parse(await pollDatabase("GET", { type: "featuredGame" }));

    if (featured && featured.status == "ok"){
        featuredGameId = featured.id;
        lobby_featuredTitleElem.innerText = featured.title;

        const [ gameId, rowNum ] = featured.id.split("_");
        await featuredGameBoard.widgets.NetworkWidget.setNetworkId(gameId, rowNum, undefined, false);

        // jump to the end to show the live game
        featuredGameBoard.jumpToVariation(featuredGameBoard.mainVariation);
        featuredGameBoard.applyChanges();

        featuredGameBoard.skeleton.addEventListener("click", goToFeaturedGame);
    }else{
        lobby_featuredGameElem.style.display = "none";
    }
}

function goToFeaturedGame(){
    changeHash(`#game=${featuredGameId}`);
}

export function stopUpdatingFeaturedGame(){
    featuredGameBoard.widgets.NetworkWidget.disable();
}
