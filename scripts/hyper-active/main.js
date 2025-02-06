
const workerUrl = location + "";
const basePath = workerUrl.replace(/\/[^/]+$/, '/');


importScripts(
    basePath + "/../../game/module-loader.js",
    basePath + "/hyper-active.js"
);

const loader = new Module_Loader();

let myBoard;
let moduleLoaded = false;

loader.load(basePath + "/../../game/game.mjs")
    .then((module) => {
        myBoard = new module.Board();
    });

loader.load(basePath + "/../../game/san.mjs").then(globalize);
loader.load(basePath + "/../../game/coords.mjs").then(globalize);

Module["onRuntimeInitialized"] = () => {
    moduleLoaded = true;
}
run();

onmessage = async (e) => {
    const cmd = e.data.cmd;

    console.log(e.data);

    if (!moduleLoaded){
        console.log("NOT LOADED. WAIT");
        await new Promise((res, rej) => {

            function wait(){
                if (!moduleLoaded)
                    setTimeout(wait, 300);
                else
                    res();
            }

            wait();
        });
        console.log("LOADED. EXECUTE", e.data);
    }

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
    postMessage({ cmd: "update-fen", fen: myBoard.getFEN() });
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
        "loadFENWasm",
        null,
        [ "string" ],
        [ fen ]
    );
}
