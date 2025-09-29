
import fs from "node:fs";
import pathModule from "node:path";
import { Board } from "./game/game.mjs";

const perftPath = pathModule.join(".", "perft.json");

try {
    console.log("[!!!] Only running tests that are <= 50k nodes because the program is slow");

    const testSuite = JSON.parse(fs.readFileSync(perftPath));

    const b = new Board();

    for (const { fen, nodes } of testSuite){
        b.loadFEN(fen);
        console.log(fen);
        for (const depthStr of Object.keys(nodes)){
            const depth = parseInt(depthStr);
            const expected = nodes[depthStr];
            if (expected > 50000)
                continue;
            const actual = countMoves(depth, b)[0];
            console.log(actual, expected);
            if (actual != expected)
                throw new Error(`Perft results did not match for fen ${fen} at depth ${depthStr}`);
        }
    }

    console.log("Test finished successfully!");
}
catch(err){
    console.error("An error occurred during testing:", err);
}


function countMoves(depth, board, prevMove){
    if (depth == 0){
        if (prevMove)
            return [
                1,
                prevMove.captures.length > 0 ? 1 : 0,
                prevMove.captures.length,
                board.isGameOver() && board.result.termination == "checkmate" ? 1 : 0
            ];
        else
            return [ 1, 0, 0, 0 ];
    }

    const counter = [ 0, 0, 0, 0 ];
    const moves = board.generateMoves();
    for (const m of moves){
        board.makeMove(m);

        const res = countMoves(depth - 1, board, m);
        for (let i = 0; i < 4; i++)
            counter[i] += res[i];

        if (!prevMove)
            console.log(m.uci, res[0]);

        board.unmakeMove(m);
    }

    return counter;
}

