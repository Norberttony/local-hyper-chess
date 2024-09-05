// handles move animations

let queuedAnimations = [];

var containerElem = document.getElementById("container");

containerElem.addEventListener("single-scroll", (event) => {
    const { prevVariation, variation, userInput } = event.detail;

    // clear queued animations
    for (const a of queuedAnimations)
        clearTimeout(a);
    queuedAnimations = [];

    if (userInput)
        return;

    // display the board from just before the move was made.
    let dir = variation.prev == prevVariation ? 1 : -1;
    let lastMadeMove = variation.move;
    if (dir == -1)
        lastMadeMove = prevVariation.move;

    if (!lastMadeMove)
        return;

    // make captured pieces disappear
    for (const c of lastMadeMove.captures){
        const piece = getPieceFromPool(getFileFromSq(c.sq), getRankFromSq(c.sq), isDisplayFlipped, Piece.getType(c.captured), Piece.getColor(c.captured));
        piece.classList.add("captured");
        gameElem.appendChild(piece);
    }

    // now move piece graphically
    let piece;

    if (dir == 1){
        piece = document.getElementById(`${getFileFromSq(lastMadeMove.to)}_${getRankFromSq(lastMadeMove.to)}`);
        setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from));
    }else{
        piece = document.getElementById(`${getFileFromSq(lastMadeMove.from)}_${getRankFromSq(lastMadeMove.from)}`);
        setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to));
    }

    const timeout = setTimeout(() => {
        if (dir == 1)
            setElemLocation(piece, getFileFromSq(lastMadeMove.to), getRankFromSq(lastMadeMove.to));
        else
            setElemLocation(piece, getFileFromSq(lastMadeMove.from), getRankFromSq(lastMadeMove.from));

        const index = queuedAnimations.indexOf(timeout);
        if (index > -1)
            queuedAnimations.splice(index, 1);
    }, 10);

    queuedAnimations.push(timeout);
});
