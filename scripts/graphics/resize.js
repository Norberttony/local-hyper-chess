// The issue is that currently, CSS does not provide a fully supported method of rounding pixel
// values. Because of that, the board and pieces often have sub-pixel dimensions. This throws off
// visuals (slight edges of squares visible beyond the highlight) as well as animations (transition
// just ignoring sub-pixel values, or similar, causing pieces to have an offset only during
// animation, causing a "bounce").
//
// Therefore, until rounding is fully supported, this will have to be the solution...
// Of course, this entire file was built with the goal of just handling board rendering
// calculations.

const mainBoardElem = document.getElementById("main-board");

function roundToNearest8(n){
    return 8 * Math.floor(n / 8);
}

function resizeBoard(){
    const aspectRatio = window.innerWidth / window.innerHeight;
    let size;

    const zoom = getComputedStyle(mainBoardElem).getPropertyValue("--zoom");
    const bodyRect = document.body.getBoundingClientRect();

    if (aspectRatio >= 1){
        size = roundToNearest8(window.innerHeight * zoom / 100);
    }else{
        size = roundToNearest8(bodyRect.width * zoom / 100);
    }

    mainBoardElem.style.setProperty("--game-width", `${size}px`);
    mainBoardElem.style.setProperty("--game-height", `${size}px`);
}

function windowResize(){
    window.requestAnimationFrame(resizeBoard);
}

window.addEventListener("resize", windowResize);
windowResize();
