
// handles create-game logic

const createGameFormElem = document.forms["create-game__form"];
const createGameFormPopup = document.getElementById("create-game");
const fenTextElem = document.getElementById("create-game__fen");
const startingFenElem = document.getElementById("create-game__use-default-fen");
const createGameFormBoard = new BoardGraphics(false, false, document.getElementById("create-game__board"));

createGameFormElem.fen.addEventListener("input", () => {
    setCreateGameFEN(createGameFormElem.fen.value);
});
setCreateGameFEN(StartingFEN);

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

function showCreateGamePopup(){
    document.getElementById("invite-popup-container").style.display = "flex";
    document.getElementById("invite-popup").style.display = "none";
    createGameFormPopup.style.display = "block";

    // load current board FEN into the viewer
    setCreateGameFEN(fenTextElem.value);
}

createGameFormElem.addEventListener("submit", (event) => {
    event.preventDefault();

    const gameConfig = {
        color: createGameFormElem.color.value,
        fen: startingFenElem.checked ? StartingFEN : createGameFormElem.fen.value,
        visibility: createGameFormElem.visibility.value
    };

    hideCreateGamePopup();
    generateInvite(gameConfig);
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

if (startingFenElem.checked){
    createGameFormElem.fen.readOnly = true;
    createGameFormBoard.loadFEN(StartingFEN);
    displayCreateGameBoard();
}
