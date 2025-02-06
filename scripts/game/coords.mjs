// handles functions relating to converting coordinates back and forth

// converts algebraic notation to a square on the board
// consider attaching this directly to Board.
export function algebraicToSquare(a){
    return a.charCodeAt(0) - 97 + 8 * (parseInt(a[1]) - 1);
}

// converts a square on the board to algebraic notation
export function squareToAlgebraic(sq){
    let r = squareToAlgebraicRank(sq);
    let f = squareToAlgebraicFile(sq);
    return `${f}${r}`;
}

export function squareToAlgebraicFile(sq){
    return String.fromCharCode(getFileFromSq(sq) + 97);
}

export function squareToAlgebraicRank(sq){
    return Math.floor(sq / 8) + 1;
}

// returns file (0 - 7) of given square
export function getFileFromSq(sq){
    return sq % 8;
}

// returns rank (0 - 7) of given square
export function getRankFromSq(sq){
    return Math.floor(sq / 8);
}
