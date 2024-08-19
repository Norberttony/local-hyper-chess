// Initializes the graphical board by generating HTML elements

var gameElem = document.getElementById("game");
var game_containerElem = document.getElementById("game_container");

// displays certain board features (ranks, files, tiles, etc.)
let filesElem = document.getElementById("files");
for (const c of "abcdefgh"){
    let file = document.createElement("div");
    file.innerText = c;
    filesElem.appendChild(file);
}

let ranksElem = document.getElementById("ranks");
for (let r = 1; r <= 8; r++){
    let rank = document.createElement("div");
    rank.innerText = r;
    ranksElem.appendChild(rank);
}
