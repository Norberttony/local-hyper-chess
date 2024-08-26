// handles move animations

var containerElem = document.getElementById("container");

containerElem.addEventListener("single-scroll", (event) => {
    const { prevVariation, variation, userInput } = event.detail;

    if (userInput)
        return;

    // display the board from just before the move was made.
    let dir = variation.prev == prevVariation ? 1 : -1;
    let lastMadeMove = variation.move;
    if (dir == -1)
        lastMadeMove = prevVariation.move;

    if (!lastMadeMove)
        return;

    // now move piece graphically
    let piece;

    if (dir == 1){
        piece = document.getElementById(`${getFileFromSq(lastMadeMove.to)}_${getRankFromSq(lastMadeMove.to)}`);
        setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from));
    }else{
        piece = document.getElementById(`${getFileFromSq(lastMadeMove.from)}_${getRankFromSq(lastMadeMove.from)}`);
        setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to));
    }

    setTimeout(() => {
        if (dir == 1)
            setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to));
        else
            setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from));
    }, 10);
});
