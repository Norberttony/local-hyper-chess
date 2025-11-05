
import { openMenuContainer, registerMenu } from "../menus/menus.js";

import { fetchFeaturedGame, stopUpdatingFeaturedGame } from "./featured-game.js";
import { startRefreshingChallenges, stopRefreshingChallenges } from "./refresh.js";

// to-do: this variable is repeated in multiple files when it should be only declared once.
const lobbyElem = document.getElementById("lobby");

registerMenu("lobby", openLobby, closeLobby);

function openLobby(){
    openMenuContainer(lobbyElem);
    startRefreshingChallenges();
    fetchFeaturedGame();
}

function closeLobby(){
    stopRefreshingChallenges();
    stopUpdatingFeaturedGame();
}
