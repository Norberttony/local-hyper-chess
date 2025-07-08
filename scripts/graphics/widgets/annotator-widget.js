
class AnnotatorWidget extends BoardWidget {
    constructor(boardgfx){
        super(boardgfx);

        // initialize by adding canvas
        const canvas = document.createElement("canvas");
        canvas.classList.add("board-graphics__annotations");
        boardgfx.boardDiv.appendChild(canvas);

        canvas.width = 1000;
        canvas.height = 1000;

        // this currently creates a circular reference which could lead to memory leaks if boardgfx
        // (instance of BoardGraphics) does not delete this .boardgfx reference.
        this.annotations = [];
        this.ctx = canvas.getContext("2d");

        this.ctx.lineWidth = 12;
        this.ctx.strokeStyle = "rgba(0, 120, 0)";
        this.ctx.fillStyle = "rgba(0, 120, 0)";
        this.ctx.lineCap = "round";

        this.startX;
        this.startY;

        // attach event listeners
        boardgfx.boardDiv.addEventListener("mousedown", (event) => {
            this.mousedown(event);
        })
        boardgfx.boardDiv.addEventListener("mouseup", (event) => {
            this.mouseup(event);
        });
        boardgfx.boardDiv.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
        boardgfx.skeleton.addEventListener("variation-change", () => {
            this.clearAll();
        });
    }

    redrawAll(){
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (const coords of this.annotations){
            coords.split("").map((val) => parseInt(val));
            this.drawAnnotation(...coords);
        }
    }

    clearAll(){
        this.annotations = [];
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawAnnotation(startX, startY, endX, endY){
        // general variables useful for drawing annotations
        const squareSize = this.ctx.canvas.width / 8;
        const halfSquare = this.ctx.canvas.width / 16;

        // start and end coordinates in pixel coordinates
        const sx = startX * squareSize + halfSquare;
        const sy = startY * squareSize + halfSquare;
        const ex = endX   * squareSize + halfSquare;
        const ey = endY   * squareSize + halfSquare;

        // representing as a vector
        const x = endX - startX;
        const y = endY - startY;
        const mag = Math.sqrt(x**2 + y**2);
        const nx = x / mag;
        const ny = y / mag;

        // rotated by 90 degrees
        const rx = -ny;
        const ry = nx;

        if (sx == ex && sy == ey){
            // draw just a highlight on the square
            this.ctx.lineWidth = 12;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, halfSquare - this.ctx.lineWidth / 2, 0, 2 * Math.PI);
            this.ctx.stroke();
        }else{

            const midOffsetX = -50 * nx;
            const midOffsetY = -50 * ny;
            const arrowOffsetX = -80 * nx;
            const arrowOffsetY = -80 * ny;

            // otherwise let's draw an arrow from start to end
            this.ctx.lineWidth = 25;
            this.ctx.beginPath();
            this.ctx.moveTo(sx, sy);
            this.ctx.lineTo(ex + midOffsetX, ey + midOffsetY);
            this.ctx.stroke();

            this.ctx.lineWidth = 0;
            this.ctx.beginPath();
            this.ctx.moveTo(ex, ey);

            this.ctx.lineTo(ex + 50 * rx + arrowOffsetX, ey + 50 * ry + arrowOffsetY);
            this.ctx.lineTo(ex - 50 * rx + arrowOffsetX, ey - 50 * ry + arrowOffsetY);

            this.ctx.lineTo(ex, ey);
            this.ctx.fill();
        }
    }

    mousedown(event){
        if (event.button != 2)
            return;

        const rect = this.ctx.canvas.getBoundingClientRect();

        this.startX = Math.floor((event.clientX - rect.x) / this.ctx.canvas.clientWidth * 8);
        this.startY = Math.floor((event.clientY - rect.y) / this.ctx.canvas.clientHeight * 8);

        // if board is flipped, flip the coords too
        if (this.boardgfx.isFlipped){
            this.startX = 7 - this.startX;
            this.startY = 7 - this.startY;
        }
    }

    mouseup(event){
        if (event.button != 2)
            return this.clearAll();
    
        const rect = this.ctx.canvas.getBoundingClientRect();
    
        let annotationEndX = Math.floor((event.clientX - rect.x) / this.ctx.canvas.clientWidth * 8);
        let annotationEndY = Math.floor((event.clientY - rect.y) / this.ctx.canvas.clientHeight * 8);
    
        // flip coords if board flipped too
        if (this.boardgfx.isFlipped){
            annotationEndX = 7 - annotationEndX;
            annotationEndY = 7 - annotationEndY;
        }
    
        const code = `${this.startX}${this.startY}${annotationEndX}${annotationEndY}`;
        const index = this.annotations.indexOf(code);
        if (index > -1){
            this.annotations.splice(index, 1);
            this.redrawAll();
        }else{
            this.drawAnnotation(this.startX, this.startY, annotationEndX, annotationEndY);
            this.annotations.push(code);
        }

        event.preventDefault();
    }
}
