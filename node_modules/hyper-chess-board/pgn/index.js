
import { Piece } from "../game/piece.js";
import { getMoveSAN } from "../game/san.js";


export function PGNHeadersToString(headers){
    let pgn = "";
    for (const [ name, value ] of Object.entries(headers))
        pgn += `[${name} "${value}"]\n`;
    return pgn;
}

// splits the given string into each individual game.
// returns an array of the individual games.
export function splitPGNs(pgnsString){
    const games = [];

    // the first capture group catches all of the PGN headers. The next capture group handles
    // capturing comments, move numbers, and SANs. The very last capture group searches for the
    // game termination marker (required for each PGN).
    const pgnRegex = /(?:\[[^\]^\[]*\]\s*)*(?:{[^{^}]*}\s*|\d+\.+|\([^{^}]*\s+\)|[A-Za-z0-9\+\#]+|\s+)*(?:\*|1-0|0-1|1\/2-1\/2)/g;

    for (const [ pgn ] of pgnsString.matchAll(pgnRegex))
        games.push(pgn.trim());

    return games;
}

// takes in a list of moves
export function convertToPGN(headers, moves, board, result = "*"){
    let pgn = `${PGNHeadersToString(headers)}\n`;

    // play out each move
    let counter = board.fullmove;
    if (board.turn == Piece.black){
        pgn += `${counter++}... `;
    }
    for (const move of moves){
        const san = getMoveSAN(board, move);
        board.makeMove(move);

        if (board.turn == Piece.black){
            pgn += `${counter++}. ${san} `;
        }else{
            pgn += `${san} `;
        }
    }

    pgn += result;

    return pgn.trim();
}

// returns a dictionary where keys are header names and values are header values.
export function extractHeaders(pgn){
    const headers = {};

    let leftBracket = pgn.indexOf("[");
    while (leftBracket > -1){
        let rightBracket = pgn.indexOf("]");
        const field = pgn.substring(leftBracket, rightBracket + 1);

        let leftQuote = field.indexOf("\"") + leftBracket;
        let rightQuote = field.indexOf("\"", leftQuote + 1) + leftBracket;

        if (leftQuote > -1 && rightQuote > -1){
            let value = pgn.substring(leftQuote + 1, rightQuote).trim();
            let name = pgn.substring(leftBracket + 1, leftQuote).trim();
            headers[name] = value;
        }

        // remove header now that we've extracted it
        pgn = pgn.substring(rightBracket + 1);

        leftBracket = pgn.indexOf("[");
    }

    return headers;
}

export function extractMoves(pgn){
    // remove headers
    pgn = pgn.replace(/\[.+?\]\s*/g, "");

    // remove any comments
    pgn = pgn.replace(/\{.+?\}\s*/g, "");

    // remove full move counters
    pgn = pgn.replace(/[0-9]+[\.]+/g, "");

    // add a space before and after parentheses
    pgn = pgn.replace(/\(/g, " ( ").replace(/\)/g, " ) ");

    // make sure there is one space between each move
    pgn = pgn.replace(/\s+/g, " ");
    pgn = pgn.trim();

    return pgn;
}

// returns the current date in the form YYYY.MM.DD
export function getPGNDateNow(){
    const date = new Date();
    const y = date.getFullYear().toString().padStart(4, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = (date.getDay() + 1).toString().padStart(2, "0");

    return `${y}.${m}.${d}`;
}
