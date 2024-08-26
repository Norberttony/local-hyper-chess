
// sets the hash based on current URL
if (window.location.hash)
    changeHash(window.location.hash);
else
    changeHash("#board");


// if user changes hash in URL
window.addEventListener("hashchange", (event) => {
    const hash = event.newURL.substring(event.newURL.indexOf("#"));
    changeHash(hash);
});
