const canvas=document.getElementById("myCanvas");
// full window height and 200px width (like a road)
canvas.height=window.innerHeight;
canvas.width=200;

// create reference to 2d context
const ctx = canvas.getContext("2d");
const car = new Car(100, 100, 30, 50);
car.draw(ctx);