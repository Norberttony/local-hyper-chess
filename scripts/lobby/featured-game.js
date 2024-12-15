
const lobby_featuredGameElem            = getFirstElemOfClass(lobbyElem, "lobby__featured-game");
const lobby_featuredTitleElem           = getFirstElemOfClass(lobbyElem, "lobby__featured-title");
const lobby_featuredGameContainerElem = document.getElementById("lobby__featured-game-container");

// populate with a board template
const featuredGameBoard = new BoardGraphics(false);
lobby_featuredGameContainerElem.appendChild(featuredGameBoard.skeleton);

const featuredGameWidgets = {
    players: new PlayersWidget(featuredGameBoard)
};

let featuredGameId;
let isUpdatingFeaturedGame = false;
let keepUpdatingFeaturedGame = false;
let featuredGameMoveNum;


async function fetchFeaturedGame(){
    const featured = JSON.parse(await pollDatabase("GET", { type: "featuredGame" }));

    if (featured && featured.status == "ok"){
        featuredGameId = featured.id;
        lobby_featuredTitleElem.innerText = featured.title;

        // featured game actually exists.
        featuredGameBoard.loadFEN(featured.fen);
        
        const sans = featured.moves.trim().split(" ");
        let lastMove;
        for (const san of sans){
            const move = featuredGameBoard.state.getMoveOfSAN(san);
            if (move){
                featuredGameBoard.makeMove(move);
                lastMove = move;
            }
        }

        featuredGameMoveNum = sans.length + 1;

        featuredGameBoard.display();

        const [ whiteName, blackName ] = featured.names.split("_");
        featuredGameWidgets.players.setNames(whiteName, blackName);

        lobby_featuredGameElem.style.display = "block";

        startUpdatingFeaturedGame();
    }else{
        lobby_featuredGameElem.style.display = "none";
    }
}

function goToFeaturedGame(){
    changeHash(`#game=${featuredGameId}`);
}

async function startUpdatingFeaturedGame(){
    if (isUpdatingFeaturedGame)
        return;
    keepUpdatingFeaturedGame = true;
    isUpdatingFeaturedGame = true;
    
    while (keepUpdatingFeaturedGame){
        let gameInfo;
        try {
            gameInfo = JSON.parse(await pollDatabase("GET", { id: featuredGameId, type: "gameStatus", moveNum: featuredGameMoveNum }));
        }
        catch(err){
            // just try again
            console.error(err);
        }

        if (gameInfo && gameInfo.status == "ok"){
            if (gameInfo.move){
                const moveObj = featuredGameBoard.getMoveOfSAN(gameInfo.move);
                if (moveObj){
                    featuredGameBoard.makeMove(moveObj);
                    featuredGameBoard.display();
                    featuredGameMoveNum++;
                }else{
                    console.error(`Could not interpret move from other player: ${gameInfo.move}`);
                }
            }
        }

        await sleep(10000);
    }
    isUpdatingFeaturedGame = false;
}

function stopUpdatingFeaturedGame(){
    if (isUpdatingFeaturedGame)
        keepUpdatingFeaturedGame = false;
}
