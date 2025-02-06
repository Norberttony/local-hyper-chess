
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');

importScripts(
    basePath + "/../../game/pre-game.js",
    basePath + "/../../game/coords.js",
    basePath + "/../../game/move.js",
    basePath + "/../../game/piece.js",
    basePath + "/../../game/game.js",
    basePath + "/../../graphics/san.js"
);

const board = new Board();

onmessage = (event) => {
    const { fen, moves } = event.data;

    board.loadFEN(fen);
    
    const moveObjects = [];
    for (const m of moves.split(" ")){
        const move = board.getMoveOfSAN(m);
        if (move){
            board.makeMove(move);
            moveObjects.push(move);
        }
    }

    postMessage(moveObjects);
}
