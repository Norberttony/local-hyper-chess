
// handles create-game logic

const createGameFormElem = document.forms["create-game__form"];
const createGameFormPopup = document.getElementById("create-game");
const fenTextElem = document.getElementById("create-game__fen");
const startingFenElem = document.getElementById("create-game__use-default-fen");
let createGameFormBoard;

module_loader.waitForAll()
    .then(() => {
        createGameFormBoard = new BoardGraphics(false, false, document.getElementById("create-game__board"));
        setCreateGameFEN(StartingFEN);

        if (startingFenElem.checked){
            createGameFormElem.fen.readOnly = true;
            createGameFormBoard.loadFEN(StartingFEN);
            displayCreateGameBoard();
        }
    });

createGameFormElem.fen.addEventListener("input", () => {
    setCreateGameFEN(createGameFormElem.fen.value);
});

function displayCreateGameBoard(){
    createGameFormBoard.display();
}

function setCreateGameFEN(fen){
    createGameFormElem.fen.value = fen;
    if (!startingFenElem.checked){
        createGameFormBoard.loadFEN(fen);
        displayCreateGameBoard();
    }
}

function showCreateGamePopup(isMultiplayer){
    if (isMultiplayer){
        createGameFormElem.classList.remove("create-game-form--bot");
        createGameFormElem.classList.add("create-game-form--multiplayer");
    }else{
        createGameFormElem.classList.remove("create-game-form--multiplayer");
        createGameFormElem.classList.add("create-game-form--bot");
    }

    document.getElementById("invite-popup-container").style.display = "flex";
    document.getElementById("invite-popup").style.display = "none";
    createGameFormPopup.style.display = "block";

    // load current board FEN into the viewer
    setCreateGameFEN(fenTextElem.value);
}

createGameFormElem.addEventListener("submit", (event) => {
    event.preventDefault();

    const fen = startingFenElem.checked ? StartingFEN : createGameFormElem.fen.value;
    if (createGameFormElem.classList.contains("create-game-form--multiplayer")){
        const gameConfig = {
            color: createGameFormElem.color.value,
            fen,
            visibility: createGameFormElem.visibility.value
        };

        hideCreateGamePopup();
        generateInvite(gameConfig);
    }else{
        openMenu("web-phil");

        let col = createGameFormElem.color.value;
        if (col == "random")
            col = Math.random() > 0.5 ? "white" : "black";

        col = col == "white" ? Piece.white : Piece.black;

        gameState.loadFEN(fen);
        gameState.setFlip(col == Piece.black);
        widgets.web_phil.userColor = col;
        widgets.web_phil.start();
        
        hideCreateGamePopup();
    }
});

function hideCreateGamePopup(){
    createGameFormPopup.style.display = "none";
    hideInvite();
}

startingFenElem.addEventListener("change", () => {
    if (startingFenElem.checked){
        createGameFormElem.fen.readOnly = true;
        createGameFormBoard.loadFEN(StartingFEN);
        displayCreateGameBoard();
    }else{
        createGameFormElem.fen.readOnly = false;
        setCreateGameFEN(createGameFormElem.fen.value);
    }
});
