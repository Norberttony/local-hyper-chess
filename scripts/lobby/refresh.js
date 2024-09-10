
const lobbyElem = document.getElementById("lobby");


function createChallengeTemplate(id, name, isBot, color, fen){
    const challElem = document.createElement("div");
    challElem.classList.add("chall");
    
    // color sent is from perspective of opponent, so must inverse it
    if (color == "white")
        color = "black";
    else if (color == "black")
        color = "white";

    const isBotElem = isBot ? `<span class = "isBot">BOT</span>` : "";

    challElem.innerHTML = 
`
<span class = "chall_id">${id}</span>
<span class = "chall_name">${name}${isBotElem}</span>
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
    for (const {id, name, isBot, color, fen} of challenges){
        const challElem = createChallengeTemplate(id, name, isBot, color, fen);
        challElem.addEventListener("click", () => {
            acceptChallenge(id);
        });
        lobbyElem.appendChild(challElem);
    }
}
