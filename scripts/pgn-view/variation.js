
// the variation object operates as a linked list with a single previous node and a list of next
// nodes.

class Variation {
    constructor(move, san){
        this.prev;
        this.next = [];

        // operates as a move counter as well.
        this.level = 0;

        // allows (un)doing the move whenever user scrolls through pgn
        if (move)
            this.move = move.clone();

        // SAN of the move
        this.san = san;

        // any glyphs attached to this move
        this.glyphs = [];

        // this move's comment
        this.comment = "";
    }

    // detaches this variation from its previous variation
    detach(){
        if (this.prev)
            this.prev.next.splice(this.prev.next.indexOf(this), 1);
    }

    // attaches this variation to come after the given variation
    attachTo(variation){
        // if necessary, detaches from any previous variation
        this.detach();

        // sets previous variation
        this.prev = variation;
        this.level = variation.level + 1;
        variation.next.push(this);
    }

    // finds a common ancestor with another variation node
    findCommonAncestor(other){
        let n1;
        let n2;

        // n1 will be the node with the greatest level
        if (this.level > other.level){
            n1 = this;
            n2 = other;
        }else{
            n1 = other;
            n2 = this;
        }

        // search back until the nodes match levels
        while (n1.level > n2.level){
            n1 = n1.prev;
            if (!n1)
                throw new Error("Cannot find a common ancestor of two disconnected nodes");
        }

        // keep searching up levels until a common ancestor is found
        while (n1 != n2){
            n1 = n1.prev;
            n2 = n2.prev;

            if (!n1 || !n2)
                throw new Error("Cannot find a common ancestor of two disconnected nodes");
        }

        // return the common ancestor
        return n1;
    }

    // returns the current variation as text
    toText(deleteGlyphs = false){
        let moves = "";

        // go back to the first moves and collect them first
        if (this.prev && this.prev.san){
            moves += this.prev.toText(deleteGlyphs) + " ";
        }

        // append this move after those first moves
        const san = deleteGlyphs ? removeGlyphs(this.san) : this.san;
        moves += san;

        return moves;
    }

    get location(){
        if (this.prev)
            return this.prev.next.indexOf(this);
    }
}
