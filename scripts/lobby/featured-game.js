
const lobby_featuredGameElem = document.getElementById("lobby_featured-game");
const lobby_featuredTitleElem = document.getElementById("lobby_featured-title");
const lobby_featuredGameContainerElem = document.getElementById("lobby_featured-game-container");

// populate with a board template
const featuredGameBoardElem = boardTemplate.cloneNode(true);
lobby_featuredGameContainerElem.appendChild(featuredGameBoardElem);
const featuredBoardGameElem = featuredGameBoardElem.getElementsByClassName("game")[0];

let featuredGameId;
let isUpdatingFeaturedGame = false;
let keepUpdatingFeaturedGame = false;
let featuredGameMoveNum;
let featuredGameBoard;


async function fetchFeaturedGame(){
    const featured = JSON.parse(await pollDatabase("GET", { type: "featuredGame" }));

    if (featured && featured.status == "ok"){
        featuredGameId = featured.id;
        lobby_featuredTitleElem.innerText = featured.title;

        // featured game actually exists.
        const board = new Board();
        board.loadFEN(featured.fen);
        
        const sans = featured.moves.trim().split(" ");
        let lastMove;
        for (const san of sans){
            const move = board.getMoveOfSAN(san);
            if (move){
                board.makeMove(move);
                lastMove = move;
            }
        }

        featuredGameMoveNum = sans.length + 1;

        displayBoard(board, lastMove, false, featuredBoardGameElem);

        // remove id from all piece elements
        for (const p of featuredBoardGameElem.getElementsByClassName("piece")){
            p.id = "";
        }

        const whiteNameElem = featuredGameBoardElem.getElementsByClassName("white_player")[0].getElementsByClassName("name")[0];
        const blackNameElem = featuredGameBoardElem.getElementsByClassName("black_player")[0].getElementsByClassName("name")[0];
        const [ whiteName, blackName ] = featured.names.split("_");
        whiteNameElem.innerText = whiteName;
        blackNameElem.innerText = blackName;

        featuredGameBoard = board;
        
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
                    displayBoard(featuredGameBoard, moveObj, false, featuredBoardGameElem);
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
