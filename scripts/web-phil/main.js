
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

const myBoard = new Board();
let startSearch = new Date();
let thinkTime = Infinity;

onmessage = (e) => {
    const cmd = e.data.cmd;

    switch(cmd){
        case "search":
            startSearch = new Date();
            thinkTime = e.data.thinkTime;

            let bestVal;
            let bestMove;

            let d = 1;
            for (; d <= 32; d++){
                const [ val, move ] = think(myBoard, d);
                if (move){
                    bestVal = val;
                    bestMove = move;
                }

                if (!isAllowedThink())
                    break;
            }
            postMessage({ cmd: "searchFinish", val: bestVal, san: getMoveSAN(myBoard, bestMove), depth: d });
            myBoard.makeMove(bestMove);
            break;
        case "move":
            myBoard.makeMove(myBoard.getMoveOfSAN(e.data.san));
            break;
        case "fen":
            console.log(`Setting myBoard FEN to ${e.data.fen}`);
            myBoard.loadFEN(e.data.fen);
            console.log(`FEN set to ${myBoard.getFEN()}`);
            break;
    }
}


const pieceValues = [
    0,  // empty
    999999999,  // king
    3,  // retractor
    6,  // chameleon
    4,  // springer
    8,  // coordinator
    1,  // straddler
    8   // immobilizer
];

const backRankPenalty = 0.5;

function evaluate(board){
    let value = 0;
    let s = 0;
    for (const p of board.squares){
        const t = Piece.getType(p);

        if (Piece.ofColor(p, Piece.white)){
            value += pieceValues[t];

            if (t != Piece.king){
                if (s < 8 && t != Piece.king){
                    value -= backRankPenalty;
                }else if (s < 16){
                    value -= 0.5 * backRankPenalty;
                }
            }
        }else if (Piece.ofColor(p, Piece.black)){
            value -= pieceValues[t];

            if (t != Piece.king){
                if (s >= 56){
                    value += backRankPenalty;
                }else if (s >= 48){
                    value += 0.5 * backRankPenalty;
                }
            }
        }

        s++;
    }
    return board.turn == Piece.white ? value : -value;
}

// keeps thinking about captures until none remain!
function thinkCaptures(board, alpha = -Infinity, beta = Infinity, pregenMoves = undefined){

    if (!isAllowedThink())
        return beta;

    const nowVal = evaluate(board);
    if (nowVal >= beta)
        return beta;

    if (nowVal < alpha - 8){
        return alpha;
    }

    if (nowVal > alpha)
        alpha = nowVal;
    
    const moves = pregenMoves || board.generateMoves(true).sort((a, b) => b.captures.length - a.captures.length);

    for (const m of moves){
        if (m.captures.length == 0)
            break;

        board.makeMove(m);

        const nextDepthMoves = board.generateMoves(true).sort((a, b) => b.captures.length - a.captures.length);

        let value;

        const res = board.isGameOver(nextDepthMoves);
        if (res == "/")
            value = 0;
        else if (res == "#")
            value = 9999999999;
        else
            value = -thinkCaptures(board, -beta, -alpha, nextDepthMoves);

        board.unmakeMove(m);

        if (!isAllowedThink())
            return beta;

        if (value >= beta)
            return beta;

        if (value > alpha)
            alpha = value;
    }

    return alpha;
}

function think(board, depthPly, alpha = -Infinity, beta = Infinity, pregenMoves = undefined){
    if (!isAllowedThink())
        return [ beta, undefined ];

    if (depthPly == 0)
        return [ thinkCaptures(board, alpha, beta, pregenMoves), undefined ];

    let bestMove;
    const moves = pregenMoves || board.generateMoves(true).sort((a, b) => b.captures.length - a.captures.length);
    for (const m of moves){
        board.makeMove(m);

        let value;

        const nextDepthMoves = board.generateMoves(true).sort((a, b) => b.captures.length - a.captures.length);
        
        const res = board.isGameOver(nextDepthMoves);
        if (res == "/")
            value = 0;
        else if (res == "#")
            value = 9999999999 + depthPly;
        else
            value = -think(board, depthPly - 1, -beta, -alpha, nextDepthMoves)[0];

        board.unmakeMove(m);

        if (!isAllowedThink())
            return [ beta, undefined ];

        if (value >= beta)
            return [ beta, undefined ];

        if (value > alpha){
            alpha = value;
            bestMove = m;
        }
    }

    return [ alpha, bestMove ];
}

// returns true if can still think, or false if out of time.
function isAllowedThink(){
    return (new Date() - startSearch) < thinkTime;
}
