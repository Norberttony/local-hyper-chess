
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

const pieceValues = [0, 9999999, 3, 6, 4, 8, 1, 8];

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



function evaluate(board){
    let value = 0;
    for (const p of board.squares){
        if (Piece.ofColor(p, Piece.white)){
            value += pieceValues[Piece.getType(p)];
        }else{
            value -= pieceValues[Piece.getType(p)];
        }
    }
    return value;
}

// performs an alpha-beta search.
function think(board, depthPly, alpha = -Infinity, beta = Infinity){
    if (depthPly == 0)
        return [ evaluate(board), undefined ];

    const isWhite = board.turn == Piece.white;
    let bestValue = isWhite ? -Infinity : Infinity;
    let bestMove;
    const moves = board.generateMoves(false).sort((a, b) => b.captures.length - a.captures.length);
    for (const m of moves){
        board.makeMove(m);

        let value;

        // one of the kings is captured in this instance!
        if (isWhite && board.kings[1] == 255){
            value = 2 * pieceValues[1] - depthPly;
        }else if (!isWhite && board.kings[0] == 255){
            value = 2 * -pieceValues[1] + depthPly;
        }else{
            if (isWhite)
                value = think(board, depthPly - 1, alpha, Infinity)[0];
            else
                value = think(board, depthPly - 1, -Infinity, beta)[0];
        }

        if (isWhite){
            if (value >= bestValue){
                bestValue = value;
                bestMove = m;
                alpha = value;
                if (alpha <= beta){
                    board.unmakeMove(m);
                    return [ value, m ];
                }
            }
        }else{
            if (value <= bestValue){
                bestValue = value;
                bestMove = m;
                beta = value;
                if (beta <= alpha){
                    board.unmakeMove(m);
                    return [ value, m ];
                }
            }
        }
        
        board.unmakeMove(m);
    }

    if (isWhite && bestValue < -pieceValues[1] || !isWhite && bestValue > pieceValues[1]){
        // white is in big trouble. king is being captured no matter what... BUT! can I just stay and do nothing?
        board.nextTurn();
        const isSafe = !board.isAttacked(board.getEnemyKingSq());
        board.nextTurn();
        if (isSafe){
            // STALEMATE!!!
            return [ 0, undefined ];
        }
    }
    
    return [ bestValue, bestMove ];
}
