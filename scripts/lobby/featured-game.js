
const lobby_featuredGameElem            = getFirstElemOfClass(lobbyElem, "lobby__featured-game");
const lobby_featuredTitleElem           = getFirstElemOfClass(lobbyElem, "lobby__featured-title");
const lobby_featuredGameContainerElem = document.getElementById("lobby__featured-game-container");

// populate with a board template
const featuredGameBoard = new BoardGraphics(false);
lobby_featuredGameContainerElem.appendChild(featuredGameBoard.skeleton);

const featuredGameWidgets = {
    players: new PlayersWidget(featuredGameBoard),
    network: new NetworkWidget(featuredGameBoard, WIDGET_LOCATIONS.NONE)
};

let featuredGameId;
let isUpdatingFeaturedGame = false;
let keepUpdatingFeaturedGame = false;


async function fetchFeaturedGame(){
    featuredGameBoard.loading();
    const featured = JSON.parse(await pollDatabase("GET", { type: "featuredGame" }));

    if (featured && featured.status == "ok"){
        featuredGameId = featured.id;
        lobby_featuredTitleElem.innerText = featured.title;

        const [ whiteName, blackName ] = featured.names.split("_");
        featuredGameWidgets.players.setNames(whiteName, blackName);

        const [ gameId, rowNum ] = featured.id.split("_");
        await featuredGameWidgets.network.setNetworkId(gameId, rowNum);

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

function stopUpdatingFeaturedGame(){
    featuredGameWidgets.network.disable();
}
