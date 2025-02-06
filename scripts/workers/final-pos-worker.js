
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');

importScripts(
    basePath + "/../../game/module-loader.js"
);

const loader = new Module_Loader();

let board;

loader.load(basePath + "/../../game/game.mjs")
    .then((module) => {
        board = new module.Board();
    });

onmessage = async (event) => {
    const { fen, moves } = event.data;

    if (!board)
        await loader.waitForAll();

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
