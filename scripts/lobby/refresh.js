
import { getFirstElemOfClass } from "../graphics/utils.js";
import { pollDatabase } from "../network/db-utils.js";

const lobbyElem = document.getElementById("lobby");
const lobbyListContainer = getFirstElemOfClass(lobbyElem, "lobby__list");
const lobbyListElem = getFirstElemOfClass(lobbyElem, "lobby__list-items");

let refreshInterval;

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

export function startRefreshingChallenges(){
    // already refreshing?
    if (refreshInterval)
        return;

    refreshInterval = setInterval(refreshChallenges, 60000);
}

export function stopRefreshingChallenges(){
    if (refreshInterval){
        clearInterval(refreshInterval);
        refreshInterval = undefined;
    }
}

async function refreshChallenges(){
    lobbyListContainer.classList.add("lobby__list--refreshing");

    const challenges = JSON.parse(
        await pollDatabase("GET", {
            type: "publicChallenges"
        })
    );

    const userChallenges = getChallengesFromLocalStorage();
    const challDict = {};
    // assume no challenges were accepted
    for (const c of userChallenges){
        c.strikes--;
        challDict[c.challId] = c;
    }

    lobbyListElem.innerHTML = "";
    for (const {id, name, isBot, color, fen} of challenges){
        const challElem = createChallengeTemplate(id, name, isBot, color, fen);

        // ensure this is not the user's own challenge
        if (challDict[id]){
            challElem.addEventListener("click", () => {
                alert("You may not accept your own challenge.");
            });
            // was relevant, keep
            challDict[id].strikes++;
        }else{
            challElem.addEventListener("click", () => {
                acceptChallenge(id);
            });
        }

        lobbyListElem.appendChild(challElem);
    }

    // only keep challenges that have no strikes left.
    setChallengesToLocalStorage(userChallenges.filter(v => v.strikes > 0));

    lobbyListContainer.classList.remove("lobby__list--refreshing");
}
