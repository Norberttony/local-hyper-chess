// PGN headers contains all relevant information pertaining to the SAN of some game. This class
// handles the proper text (based on given and missing information) that describes the PGN headers.

// determines all valid headers and their default order
const VALID_HEADERS = [
    "Event", "Site", "Round", "TimeControl", "White", "Black", "Result", "Termination", "Variant", "FEN"
];

export class PGNData {
    constructor(pgnRoot){
        this.pgnRoot = pgnRoot;

        // whether or not started as white to play
        this.startedWTP = true;

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

    clearHeaders(){
        this.headers = {};
    }

    clear(){
        this.initHeaders();
    }

    setHeader(hdr, value){
        this.headers[hdr] = value;

        if (hdr == "FEN"){
            this.startedWTP = value.split(" ")[1] == "w";
        }else if (hdr == "Variant" && value == "Standard"){
            this.startedWTP = true;
        }
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

        if (!this.startedWTP && node && node == this.pgnRoot.next[0])
            count++;

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

            // go through each variation and add it as a variation (enclosed in parentheses)
            if (iter.next.length > 1){
                
                // fullmove
                if (count % 2 == 0)
                    san += `${Math.floor(count / 2) + 1}. `;

                san += `${iter.next[0].san} `;
                count++;

                for (let i = 1; i < iter.next.length; i++){
                    san += `( ${this.sanHelper(iter.next[i], count - 1)}) `;
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
