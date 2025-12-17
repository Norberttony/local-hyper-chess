
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');

importScripts(
    basePath + "/../../game/module-loader.js"
);

const loader = new Module_Loader();

let board;

loader.load(basePath + "/../../../node_modules/hyper-chess-board/dist/game/board.js")
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
        let move;
        try {
            move = board.getMoveOfSAN(m);
        }
        catch(err){
            continue;
        }
        if (move){
            board.makeMove(move);
            moveObjects.push(move);
            move.san = m;
        }
    }

    postMessage(moveObjects);
}
