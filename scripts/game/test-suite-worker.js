
const workerURL = location.toString();

importScripts(
    `${workerURL}/coords.js`,
    `${workerURL}/pre-game.js`,
    `${workerURL}/move.js`,
    `${workerURL}/piece.js`,
    `${workerURL}/game.js`,
    `${workerURL}/test-suite.js`,
);

onmessage = (e) => {
    console.log(e.data);

    switch (e.data[0]){
        case "suite":
            const data = performTest(test_suite.positions, e.data[1]);
            break;

        default:
            console.error("Unrecognized command ", e.data);
    }
}

function performTest(positions, depthLimit = 3){
    console.log("Performing Test Suite Run...");

    const state = new Board();
    let totalTime = 0;

    for (pos of positions){
        state.loadFEN(pos.fen);

        console.log(`\u001b[36mDisplaying results for ${pos.name}`);
        console.log(`\u001b[36mFEN of ${pos.fen}`);

        let thisTime = 0;
        
        // find any discrepancies in move count
        const iters = Math.min(pos.moveCounts.length, depthLimit + 1);
        for (let i = 0; i < iters; i++){
            // heading is displayed here so the user knows that the test suite is just thinking
            console.log(`\u001b[32mChecking at depth ${i}:`);
            
            const start = performance.now();

            const [moveCount, capturesCount, piecesCapturedCount, checkmateCount] = countStats(state, i);
            
            const end = performance.now();
            thisTime += end - start;

            // yep.
            const success = [
                moveCount           == pos.moveCounts[i],
                capturesCount       == pos.captureCounts[i],
                piecesCapturedCount == pos.piecesCapturedCounts[i],
                checkmateCount      == pos.checkmateCounts[i]
            ];

            const getColor = (success) => success ? "\u001b[32m": "\u001b[31m";

            console.log(`${getColor(success[0])}   - Moves:                ${moveCount} when expecting ${pos.moveCounts[i]}`);
            console.log(`${getColor(success[1])}   - Moves that capture:   ${capturesCount} when expecting ${pos.captureCounts[i]}`);
            console.log(`${getColor(success[2])}   - Pieces captured:      ${piecesCapturedCount} when expecting ${pos.piecesCapturedCounts[i]}`);
            console.log(`${getColor(success[3])}   - Checkmates:           ${checkmateCount} when expecting ${pos.checkmateCounts[i]}`);
        }

        totalTime += thisTime;
        const time = thisTime / iters;
        console.log(`\u001b[36mTook ${Math.round(time * 10) / 10}ms to finish`);
        console.log("");
    }
    console.log(`End of Test Suite Run, total time: ${totalTime}ms`);

    return totalTime;
}

function countMoves(state, depth){
    if (depth == 0){
        return 1;
    }
    let movesAmt = 0;
    let moves = state.generateMoves(true);
    for (let m = 0; m < moves.length; m++){
        let move = moves[m];
        state.makeMove(move);
        movesAmt += countMoves(state, depth - 1);
        state.unmakeMove(move);
    }
    return movesAmt;
}

function countStats(state, depth, maxDepth = depth){
    if (depth == 0){
        return [1, 0, 0, 0];
    }

    // counters
    let prevMovesAmt = 0;
    let movesAmt = 0;
    let moveCapturesAmt = 0;
    let piecesCapturedAmt = 0;
    let checkmatesAmt = 0;

    const moves = state.generateMoves(true);
    for (const m of moves){
        state.makeMove(m);

        // count capture info
        if (m.captures.length > 0){
            moveCapturesAmt++;
            piecesCapturedAmt += m.captures.length;
        }
        if (state.isGameOver() == "#"){
            checkmatesAmt++;
            //console.log(state.getFEN());
        }

        // search node
        if (!state.result){
            const [ma, mca, pca, ca] = countStats(state, depth - 1, maxDepth);
            movesAmt += ma;
            moveCapturesAmt += mca;
            piecesCapturedAmt += pca;
            checkmatesAmt += ca;
        }else{
            // well... it's still a valid move, so...
            movesAmt++;
        }

        state.unmakeMove(m);

        if (depth == maxDepth){
            //console.log(`Progress: ${(moves.indexOf(m) + 1) / moves.length * 100}%`);
            //console.log(`${m.uci} ${movesAmt - prevMovesAmt}`);
            prevMovesAmt = movesAmt;
        }
    }

    return [movesAmt, moveCapturesAmt, piecesCapturedAmt, checkmatesAmt];
}

function divide(state, depth, maxDepth = depth){
    if (depth == 0){
        return [1, 0, 0, 0];
    }

    // counters
    let prevMovesAmt = 0;
    let movesAmt = 0;
    let moveCapturesAmt = 0;
    let piecesCapturedAmt = 0;
    let checkmatesAmt = 0;

    const moves = state.generateMoves(true);
    for (const m of moves){
        state.makeMove(m);

        // count capture info
        if (m.captures.length > 0){
            moveCapturesAmt++;
            piecesCapturedAmt += m.captures.length;
        }
        if (state.isGameOver() == "#"){
            checkmatesAmt++;
        }

        // search node
        if (!state.result){
            const [ma, mca, pca, ca] = countStats(state, depth - 1, maxDepth);
            movesAmt += ma;
            moveCapturesAmt += mca;
            piecesCapturedAmt += pca;
            checkmatesAmt += ca;
            console.log(m.uci, ma, mca, pca, ca);
        }else{
            // well... it's still a valid move, so...
            movesAmt++;
        }

        state.unmakeMove(m);

        if (depth == maxDepth){
            //console.log(`Progress: ${(moves.indexOf(m) + 1) / moves.length * 100}%`);
            //console.log(`${m.uci} ${movesAmt - prevMovesAmt}`);
            prevMovesAmt = movesAmt;
        }
    }

    return [movesAmt, moveCapturesAmt, piecesCapturedAmt, checkmatesAmt];
}
