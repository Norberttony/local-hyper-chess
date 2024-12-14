
const WIDGET_LOCATIONS = {
    LEFT:       0,
    TOP_BAR:    1,
    BOARD:      2,
    BOTTOM_BAR: 3,
    RIGHT:      4,
    BOTTOM:     5
};

const WIDGET_NAMES = Object.keys(WIDGET_LOCATIONS).map((val) => val.replaceAll("_", "-").toLowerCase());

class BoardWidget {
    constructor(boardgfx, name, location){
        if (boardgfx.widgetNames.has(name)){
            console.error("Attempted to attach ", name, " as a widget to ", boardgfx, " when an instance of this widget is already attached.");
            throw new Error("Tried to attach a widget of the same name to a BoardGraphics instance.");
        }
        boardgfx.widgetNames.add(name);
        this.name = name;
        this.location = location;
    }

    enable(){}
    disable(){}
}
