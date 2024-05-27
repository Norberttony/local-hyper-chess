
const StartingFEN = "unbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNU w 1";

const lobbyElem = document.getElementById("lobby");


// refresh challenges every 10 seconds
setInterval(refreshChallenges, 10000);
refreshChallenges();


function createChallengeTemplate(id, color, fen){
    const challElem = document.createElement("div");
    challElem.classList.add("chall");
    
    // color sent is from perspective of opponent, so must inverse it
    if (color == "white")
        color = "black";
    else if (color == "black")
        color = "white";

    challElem.innerHTML = 
`
<span class = "chall_id">${id}</span>
<span class = "chall_color">You play as ${color}</span>
<span>${fen == StartingFEN ? "Starting position" : "FEN: " + fen}</span>
`;
    return challElem;
}

async function refreshChallenges(){
    const challenges = JSON.parse(
        await pollDatabase("GET", {
            type: "publicChallenges"
        })
    );

    lobbyElem.innerHTML = "";
    for (const {id, color, fen} of challenges){
        const challElem = createChallengeTemplate(id, color, fen);
        challElem.addEventListener("click", () => {
            window.location.href = `https://norberttony.github.io/local-hyper-chess/?challenge_id=${id}`;
        });
        lobbyElem.appendChild(challElem);
    }
}
