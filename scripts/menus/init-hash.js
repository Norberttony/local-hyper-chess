
function hashInit(){
    // sets the hash based on current URL
    if (window.location.hash)
        changeHash(window.location.hash);
    else
        changeHash("#board");

    // if user had PGN in session storage, load it
    {
        const pgn = sessionStorage.getItem("analysisBoardPGN");
        if (pgn && window.location.hash.startsWith("#board"))
            gameState.loadPGN(pgn);
    }

    // if user changes hash in URL
    window.addEventListener("hashchange", (event) => {
        const hash = event.newURL.substring(event.newURL.indexOf("#"));
        changeHash(hash);
    });
}
