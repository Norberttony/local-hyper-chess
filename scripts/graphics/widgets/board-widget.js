
const WIDGET_LOCATIONS = {
    NONE:       0,
    LEFT:       1,
    TOP_BAR:    2,
    BOARD:      3,
    BOTTOM_BAR: 4,
    RIGHT:      5,
    BOTTOM:     6
};

const WIDGET_NAMES = Object.keys(WIDGET_LOCATIONS).map((val) => val.replaceAll("_", "-").toLowerCase());

class BoardWidget {
    constructor(boardgfx){
        boardgfx.attachWidget(this);
        this.boardgfx = boardgfx;
    }

    enable(){}
    disable(){}
}

function getFirstElemOfClass(container, className){
    return container.getElementsByClassName(className)[0];
}
