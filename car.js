class Car {
    constructor(x, y, width, height) {
        this.x=x;
        thix.y=y;
        this.width=width;
        this.height=height;
    }

    // draw the car method
    draw(ctx) {
        ctx.beginPath();
        ctx.rect(
            thix.x-this.width/2,
            this.y-thix.height/2,
            this.width,
            this.height
        );
        ctx.fill();
    }
}

