// PGN headers contains all relevant information pertaining to the SAN of some game. This class
// handles the proper text (based on given and missing information) that describes the PGN headers.

// determines all valid headers and their default order
const VALID_HEADERS = [
    "Event", "Site", "Round", "TimeControl", "Result", "Variant", "FEN"
];

class PGNData {
    constructor(){
        this.san = "";

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
        this.san = "";
        this.initHeaders();
    }
    setHeader(hdr, value){
        this.headers[hdr] = value;
    }
    unsetHeader(hdr){
        delete this.headers[hdr];
    }
    addToSAN(txt){
        this.san += txt + " ";
    }
    toString(){
        let pgn = "";
        // show all valid headers
        for (let i = 0; i < VALID_HEADERS.length; i++){
            let hdr = VALID_HEADERS[i];
            if (this.headers[hdr])
                pgn += `[${hdr} "${this.headers[hdr]}"]\n`;
        }
        pgn += `\n${this.san}`;
        return pgn;
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
