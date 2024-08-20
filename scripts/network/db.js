

var invite_copyElem = document.getElementById("invite_copy");
var peer_idElem = document.getElementById("peer-id");

// allows copying the invite link
invite_copyElem.addEventListener("click", () => {
    // access to clipboard is rather finicky. if the first method in the try block does not work,
    // then the second method in the finally block is attempted.
    try {
        navigator.clipboard.writeText(peer_idElem.value);
        invite_copyElem.innerText = "Successfully copied!";
    }catch(err){
        console.error(err);
    }finally{
        peer_idElem.select();
        document.execCommand("copy");
        invite_copyElem.innerText = "Successfully copied!";
    }
});

// retrieves invite from server
async function generateInvite(gameConfig){
    // send request to server
    gameConfig.type = "challenge";
    const fullId = await pollDatabase("POST", gameConfig);

    if (!fullId){
        alert("Something went wrong in creating the game");
    }

    // extract information from server
    setMyId(fullId);

    peer_idElem.value = `https://norberttony.github.io/local-hyper-chess?challenge_id=${NETWORK.gameId}`;

    gameState.loadFEN(StartingFEN);
    displayBoard();

    document.getElementById("invite-popup-container").style.display = "flex";
    document.getElementById("invite-popup").style.display = "flex";

    // now that a new game is starting, there is no need for this "offer rematch" button
    panel_rematchElem.style.display = "none";

    const { gameId } = JSON.parse(await checkIfAccepted());

    // now, the challenge ID has a different ref number than the game ID's ref number...
    localStorage.setItem(`${gameId}_userId`, NETWORK.userId);

    window.location.search = `?game_id=${gameId}`;
}

async function checkIfAccepted(){
    return new Promise(async (res, rej) => {
        while (true){
            const val = await pollDatabase("GET", {
                type: "challengeStatus",
                id: `${NETWORK.gameId}_${NETWORK.userId}`
            });

            if (val == "false")
                await sleep(1000);
            else
                res(val);
        }
    });
}

async function sleep(amt){
    return new Promise(async (res, rej) => {
        setTimeout(() => {
            res();
        }, amt);
    });
}

// user wants to share the invitation!
function shareInvite(){
    if (navigator.share){
        navigator.share({
            title: "Play Hyper Chess!",
            text: "An invitation to play a game of Hyper Chess",
            url: peer_idElem.value
          })
          .then(() => console.log("Successful share"))
          .catch(error => console.log("Error sharing:", error));
    }
}

// gets rid of the server's challenge
async function cancelInvite(){
    const success = await pollDatabase("POST", {
        type: "cancelChallenge",
        id: `${NETWORK.gameId}_${NETWORK.userId}_${NETWORK.refNum}`
    });

    if (success){
        console.log("deleted challenge");
    }else{
        alert("Something went wrong in deleting the challenge");
    }
    // close invite screen
}

// Receives a newly updated board state from the server.
// config is {fen}, movelist is an array of move SANs
// this function reconstructs the game given these two arguments
function handleMovelist(config, movelist){
    console.log("got info from server", config, movelist);
    gameState.loadFEN(config.fen);

    movelist = movelist.trim();

    if (movelist.length == 0) return;

    let moves = movelist.split(" ");
    for (let m = 0; m < moves.length; m++){
        let move = gameState.latestBoard.getMoveOfSAN(moves[m]);
        console.log(move);
        if (move){
            gameState.makeMove(move);
        }else{
            console.error(`Game failed to be reconstructed because of illegal SAN: ${moves[m]}`);
        }
    }
    gameState.applyChanges();
}

// hides utils from spectators
var containerElem = document.getElementById("container");
function setSpectator(){
    hideDialogBox();
    document.body.style.setProperty("--player-elems-visibility", "none");
    
    setUpBoard(0);
    handleMovelist(config, movelist);
};
