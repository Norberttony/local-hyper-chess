// handles create-game logic
var createGameFormElem = document.forms["create-game-form"];
var createGameFormPopup = document.getElementById("create-game-popup");
var createGameFormBoardElem = createGameFormElem.getElementsByClassName("game")[0];
var fenTextElem = document.getElementById("fenText");
var startingFenElem = document.getElementById("starting-fen");
const createGameFormState = new Board();

createGameFormElem.fen.addEventListener("input", () => {
    setCreateGameFEN(createGameFormElem.fen.value);
});
setCreateGameFEN(StartingFEN);

function displayCreateGameBoard(){
    displayBoard(createGameFormState, false, false, createGameFormBoardElem);
    for (const p of createGameFormBoardElem.getElementsByClassName("piece")){
        p.id = "";
    }
}

function setCreateGameFEN(fen){
    createGameFormElem.fen.value = fen;
    if (!startingFenElem.checked){
        createGameFormState.loadFEN(fen);
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
        createGameFormState.loadFEN(StartingFEN);
        displayCreateGameBoard();
    }else{
        createGameFormElem.fen.readOnly = false;
        setCreateGameFEN(createGameFormElem.fen.value);
    }
});

if (startingFenElem.checked){
    createGameFormElem.fen.readOnly = true;
    createGameFormState.loadFEN(StartingFEN);
    displayCreateGameBoard();
}
