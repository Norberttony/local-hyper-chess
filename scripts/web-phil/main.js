
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

onmessage = (e) => {
    const cmd = e.data.cmd;

    switch(cmd){
        case "search":
            const [ val, bestMove ] = think(myBoard, e.data.depth);
            postMessage({ cmd: "searchFinish", val, san: getMoveSAN(myBoard, bestMove) });
            myBoard.makeMove(bestMove);
            break;
        case "move":
            myBoard.makeMove(myBoard.getMoveOfSAN(e.data.san));
            break;
        case "fen":
            myBoard.loadFEN(e.data.fen);
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
function thinkCaptures(board, alpha = -Infinity, beta = Infinity){

    const nowVal = evaluate(board);
    if (nowVal >= beta)
        return beta;

    if (nowVal < alpha - 8){
        return alpha;
    }

    if (nowVal > alpha)
        alpha = nowVal;
    
    const moves = board.generateMoves(true).sort((a, b) => b.captures.length - a.captures.length);

    for (const m of moves){
        if (m.captures.length == 0)
            break;

        board.makeMove(m);

        let value;

        const res = board.isGameOver(moves);
        if (res == "/")
            value = 0;
        else if (res == "#")
            value = 9999999999;
        else
            value = -thinkCaptures(board, -beta, -alpha);

        board.unmakeMove(m);

        if (value >= beta)
            return beta;

        if (value > alpha)
            alpha = value;
    }

    return alpha;
}

function think(board, depthPly, alpha = -Infinity, beta = Infinity){
    if (depthPly == 0)
        return [ thinkCaptures(board, alpha, beta), undefined ];

    let bestMove;
    const moves = board.generateMoves(true).sort((a, b) => b.captures.length - a.captures.length);
    for (const m of moves){
        board.makeMove(m);

        let value;
        
        const res = board.isGameOver(moves);
        if (res == "/")
            value = 0;
        else if (res == "#")
            value = 9999999999 - depthPly;
        else
            value = -think(board, depthPly - 1, -beta, -alpha)[0];

        board.unmakeMove(m);

        if (value >= beta)
            return [ beta, undefined ];

        if (value > alpha){
            alpha = value;
            bestMove = m;
        }
    }

    return [ alpha, bestMove ];
}
