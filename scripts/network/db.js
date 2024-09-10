

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
    const fullId = JSON.parse(await pollDatabase("POST", gameConfig));

    console.log("Created challenge; info:", fullId);

    if (!fullId){
        alert("Something went wrong in creating the game");
    }else if (fullId.status == "err"){
        alert(`Something went wrong: ${fullId.msg}`);
    }

    // extract information from server
    const { challId, userId } = fullId;
    setMyId(`${challId}_${userId}`);

    peer_idElem.value = `https://norberttony.github.io/local-hyper-chess#chall=${challId}`;

    gameState.loadFEN(StartingFEN);
    displayBoard();

    document.getElementById("invite-popup-container").style.display = "flex";
    document.getElementById("invite-popup").style.display = "flex";

    // now that a new game is starting, there is no need for this "offer rematch" button
    panel_rematchElem.style.display = "none";

    const { status, chall, msg } = await checkIfAccepted();

    if (status == "err")
        return alert(`Something went wrong with the challenge: ${msg}`);
    else if (status == "cancelled")
        return;

    // now, the challenge ID has a different ref number than the game ID's ref number...
    const [ gameId, refNum ] = chall.gameId.split("_");
    storeUserId(gameId, refNum, userId);

    changeHash(`#game=${chall.gameId}`);

    hideInvite();
}

let cancelChallengePolling = false;
async function checkIfAccepted(){
    
    cancelChallengePolling = false;

    return new Promise(async (res, rej) => {
        while (!cancelChallengePolling){
            const val = JSON.parse(
                await pollDatabase("GET", {
                    type: "challengeStatus",
                    id: `${NETWORK.gameId}_${NETWORK.userId}`
                })
            );

            console.log("Is challenge accepted?", val);

            if (!val){
                res({ status: "err", msg: "Something went wrong!" });
                break;
            }else if (val.status == "err"){
                res(val);
                break;
            }else if (val.status == "ok"){
                if (!val.chall)
                    await sleep(1000);
                else{
                    res(val);
                    break;
                }
            }
        }
        if (cancelChallengePolling){
            res({ status: "cancelled" });
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
    const info = await pollDatabase("POST", {
        type: "cancelChallenge",
        id: getMyId()
    });

    cancelChallengePolling = true;

    if (info){
        if (info.status == "ok"){
            console.log("deleted challenge");
        }else if (info.status == "err"){
            alert(`Error deleting challenge: ${info.msg}`);
        }
    }else{
        alert("Something went wrong in deleting the challenge");
    }

    // hide invite box
    hideInvite();
}
