// handles create-game logic
var createGameFormElem = document.forms["create-game-form"];
var createGameFormPopup = document.getElementById("create-game-popup");
var createGameFormBoardElem = createGameFormElem.getElementsByClassName("game")[0];
var fenTextElem = document.getElementById("fenText");
const createGameFormState = new Board();

createGameFormElem.fen.addEventListener("input", () => {
    setCreateGameFEN(createGameFormElem.fen.value);
});
setCreateGameFEN(StartingFEN);

function setCreateGameFEN(fen){
    createGameFormElem.fen.value = fen;
    createGameFormState.loadFEN(fen);
    displayBoard(createGameFormState, false, false, createGameFormBoardElem);
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
        fen: createGameFormElem.fen.value
    };

    hideCreateGamePopup();
    generateInvite(gameConfig);
});

function hideCreateGamePopup(){
    createGameFormPopup.style.display = "none";
    hideInvite();
}
