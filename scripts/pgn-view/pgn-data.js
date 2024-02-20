// PGN headers contains all relevant information pertaining to the SAN of some game. This class
// handles the proper text (based on given and missing information) that describes the PGN headers.

// determines all valid headers and their default order
const VALID_HEADERS = [
    "Event", "Site", "Round", "TimeControl", "Result", "Variant", "FEN"
];

function copyArray(arr){
    const nArr = [];
    for (const v of arr){
        nArr.push(v);
    }
    return nArr;
}

class PGN_Move {
    constructor(move){
        this.prev;
        this.next = [];

        this.location = [];

        // reference to actual move object
        this.move = move;
    }

    attachTo(move){
        this.prev = move;
        let l = move.next.push(this);
        this.location = copyArray(move.location);
        this.location.push(l - 1);
    }

    isBefore(move){
        return this.location.length <= move.location.length;
    }

    // returns true if this move is in the main variation
    isMain(){
        for (const m of this.location){
            if (m != 0)
                return false;
        }
        return true;
    }
}

class PGNData {
    constructor(pgnRoot){
        // should be a sentinel node
        this.pgnRoot = pgnRoot;

        this.initHeaders();
    }

    initHeaders(){
        this.headers = {
            "Event": "Hyper Chess Analysis",
            "Site": window.location.href,
            "Result": "*",
            "Variant": "Standard"
        };
    }

    clear(){
        delete this.pgnRoot;
        this.initHeaders();
    }

    setHeader(hdr, value){
        this.headers[hdr] = value;
    }

    unsetHeader(hdr){
        delete this.headers[hdr];
    }

    toString(){
        let pgn = "";
        // show all valid headers
        for (const hdr of VALID_HEADERS){
            if (this.headers[hdr])
                pgn += `[${hdr} "${this.headers[hdr]}"]\n`;
        }
        pgn += `\n${this.san}`;
        return pgn;
    }

    // generates SAN for this descendant node
    sanHelper(node, count){
        let san = "";
        let iter = node;

        // add full move counter
        if (count % 2 != 0){
            san += `${Math.floor(count / 2) + 1}... `;
        }

        // just prevent crashing :)
        let maxIters = 9999;

        // loop through pgn moves
        while (iter && --maxIters){
            // fullmove
            if (count % 2 == 0)
                san += `${Math.floor(count / 2) + 1}. `;

            san += `${iter.san} `;

            count++;

            // go through each variation and add it as a comment
            if (iter.next.length > 1){
                
                // fullmove
                if (count % 2 == 0)
                    san += `${Math.floor(count / 2) + 1}. `;

                san += `${iter.next[0].san} `;
                count++;

                for (let i = 1; i < iter.next.length; i++){
                    san += `{ ${this.sanHelper(iter.next[i], count)}} `;
                }

                iter = iter.next[0];
            }
            iter = iter.next[0];
        }

        return san;
    }

    get san(){
        return this.sanHelper(this.pgnRoot.next[0], 0);
    }
}

// returns a dictionary where keys are header names and values are header values.
// be warned: this function modifies the pgn string!
function extractHeaders(pgn){
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
