
export const WIDGET_LOCATIONS = {
    NONE:           0,
    LEFT:           1,
    TOP_BAR:        2,
    BOARD:          3,
    BOTTOM_BAR:     4,
    RIGHT_BLACK:    5,
    RIGHT:          6,
    RIGHT_WHITE:    7,
    BOTTOM:         8
};

export const WIDGET_NAMES = Object.keys(WIDGET_LOCATIONS).map((val) => val.replaceAll("_", "-").toLowerCase());

export class BoardWidget {
    constructor(boardgfx){
        boardgfx.attachWidget(this);
        this.boardgfx = boardgfx;
    }

    enable(){}
    disable(){}
}

export function getFirstElemOfClass(container, className){
    return container.getElementsByClassName(className)[0];
}
