
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
    constructor(boardgfx, name, location){
        if (boardgfx.widgetNames.has(name)){
            console.error("Attempted to attach ", name, " as a widget to ", boardgfx, " when an instance of this widget is already attached.");
            throw new Error("Tried to attach a widget of the same name to a BoardGraphics instance.");
        }
        boardgfx.widgetNames.add(name);

        this.boardgfx = boardgfx;
        this.name = name;
        this.location = location;
    }

    enable(){}
    disable(){}
}

function getFirstElemOfClass(container, className){
    return container.getElementsByClassName(className)[0];
}
