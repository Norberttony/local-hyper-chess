
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');


importScripts(
    basePath + "/../../game/pre-game.js",
    basePath + "/../../game/coords.js",
    basePath + "/../../game/move.js",
    basePath + "/../../game/piece.js",
    basePath + "/../../game/game.js",
    basePath + "/../../graphics/san.js",
    basePath + "/hyper-active.js"
);

const myBoard = new Board();

onmessage = (e) => {
    const cmd = e.data.cmd;

    switch(cmd){
        case "search":
            
            const lan = getMove(e.data.thinkTime);

            const engineMove = myBoard.getMoveOfLAN(lan);
            const san = getMoveSAN(myBoard, engineMove);

            myBoard.makeMove(engineMove);
            sendMove(engineMove);

            postMessage({ cmd: "searchFinished", val: '-', san, depth: '-' });
            
            break;
        case "move":
            const userMove = myBoard.getMoveOfSAN(e.data.san);
            myBoard.makeMove(userMove);
            sendMove(userMove);
            break;
        case "fen":
            console.log(`Setting myBoard FEN to ${e.data.fen}`);
            myBoard.loadFEN(e.data.fen);
            setFEN(e.data.fen);
            console.log(`FEN set to ${myBoard.getFEN()}`);
            break;
    }
}


function flipVertically(sq){
    const r = getRankFromSq(sq);
    return ((7 - r) << 3) + getFileFromSq(sq);
}

function getMove(time){
    const moveInt = Module.ccall(
        "thinkForWasm",
        "number",
        [ "number" ],
        [ time ]
    );
    
    const fromSq = flipVertically((moveInt & 0b111111000) >> 3);
    const toSq =   flipVertically((moveInt & 0b111111000000000) >> 9);

    return `${squareToAlgebraic(fromSq)}${squareToAlgebraic(toSq)}`;
}

function sendMove(move){

    const fromSq = flipVertically(move.from);
    const toSq = flipVertically(move.to);

    Module.ccall(
        "chooseMoveWasm",
        "number",
        [ "number", "number" ],
        [ fromSq, toSq ]
    );
}

function setFEN(fen){
    Module.ccall(
        "loadFEN",
        null,
        [ "string" ],
        [ fen ]
    );
}
