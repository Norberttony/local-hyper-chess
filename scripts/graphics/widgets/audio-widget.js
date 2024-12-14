
// Whenever a move, capture, or something important happens, a sound occurs.

const AUDIO = {
    move:           "sounds/move.mp3",
    capture:        "sounds/capture.mp3"
};

// this is a certified goofy solution.
// audio is "buffered" because of a delay when the request for the audio is issued. This acts as a
// cache. Even though the browser automatically caches audio...? eh.
let bufferedAudio = {
    [AUDIO.move]: new Audio(AUDIO.move),
    [AUDIO.capture]: new Audio(AUDIO.capture)
};


class AudioWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx, "Audio", WIDGET_LOCATIONS.BOARD);

        boardgfx.skeleton.addEventListener("single-scroll", (event) => {
            let { prevVariation, variation, userInput } = event.detail;
            
            // only play audio if move scrolling is going forward by exactly 1
            makeNoise(variation.move);
        });
    }
}


function playAudio(src){
    if (bufferedAudio[src]){
        bufferedAudio[src].load();
        bufferedAudio[src].play();
    }else{
        (new Audio(src)).play();
    }

    bufferedAudio[src] = new Audio(src);
    bufferedAudio[src].load();
}

function makeNoise(move){
    if (move && move.captures.length > 0)
        playAudio(AUDIO.capture);
    else
        playAudio(AUDIO.move);
}
