const aiCanvas=document.getElementById("carCanvas");
aiCanvas.width=200;

const playerCanvas = document.getElementById("playerCanvas");
playerCanvas.width = 200;

const networkCanvas=document.getElementById("networkCanvas");
networkCanvas.width=300;

// create reference to 2d context
const aiCtx = aiCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
const playerCtx = playerCanvas.getContext("2d");

const aiRoad = new Road(aiCanvas.width/2, aiCanvas.width*0.9);
const playerRoad = new Road(playerCanvas.width/2, playerCanvas.width*0.9);

// create player car
let playerCar = new Car(playerRoad.getLaneCenter(1), 100, 30, 50, "PLAYER");

// generate AI cars
const aiCount = 250;
let aiCars = generateCars(aiCount);
let bestCar = aiCars[0];
if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < aiCars.length; i++) {
        aiCars[i].brain = JSON.parse(
            localStorage.getItem("bestBrain") 
        );

        if (i != 0) {
            NeuralNetwork.mutate(
                aiCars[i].brain,
                0.25
            );
        }
    }
}

function resetAiState() {

    aiCars = generateCars(aiCount);

    if (localStorage.getItem("bestBrain")) {
        for (let i = 0; i < aiCars.length; i++) {
            aiCars[i].brain = JSON.parse(
                localStorage.getItem("bestBrain") 
            );

            if (i != 0) {
                NeuralNetwork.mutate(
                    aiCars[i].brain,
                    0.25
                );
            }
        }
    } else {
        let aiCars = generateCars(aiCount);
        let bestCar = aiCars[0];
        save();
    }

    aiTraffic.length = 0;
    randomTraffic(aiRoad, aiTraffic);
}

function resetPlayerState() {

    console.log("resetPlayerState() called");

    playerCar = new Car(playerRoad.getLaneCenter(1), 100, 30, 50, "PLAYER");

    playerTraffic.length = 0;
    randomTraffic(playerRoad, playerTraffic);
}

// make random traffic for ai road
const aiTraffic = [];
randomTraffic(aiRoad, aiTraffic);

// make random traffic for player road
const playerTraffic = [];
randomTraffic(playerRoad, playerTraffic);

animate();

function save() {
    localStorage.setItem(
        "bestBrain",
        JSON.stringify(bestCar.brain)
    );
}

function discard() {
    localStorage.removeItem("bestBrain");
}

function generateCars(N) {
    const cars = [];
    for (let i = 0; i < N; i++) {
        const c = new Car(aiRoad.getLaneCenter(1), 100, 30, 50, "AI")
        c.angle += (Math.random()-0.5)*0.02;
        cars.push(c);
    }
    return cars;
}

function randomTraffic(road, trafficArray) {
    for (let i = 0; i < 20; i++) {
        const randomNumber = Math.floor(Math.random() * 3);
        const carToAdd = new Car(road.getLaneCenter(randomNumber), (-100 - (150*i)), 30, 50, "DUMMY", 2);
        trafficArray.push(carToAdd);
    }
}

function checkPassed(car, traffic) {

    let passedCount = 0;

    for (let i = 0; i < traffic.length; i++) {
        if (car.y < traffic[i].y) {
            passedCount++;
        }
    }

    return passedCount;
}

function checkStuck(car, traffic) {
    const TIMEOUT_FRAMES = 600;

    // ensure fields exist (in case of non-AI cars)
    if (car.frameAge == null) car.frameAge = 0;
    if (car.maxPasses == null) car.maxPasses = 0;

    car.frameAge++;

    const passedNow = checkPassed(car, traffic);

    // reset timer only when making *new* progress
    if (passedNow > car.maxPasses) {
        car.frameAge = 0;
        car.maxPasses = passedNow;
    }

    if (car.frameAge > TIMEOUT_FRAMES) {
        // only register car as stuck if it is not already damaged
        // and also check if the car has passed all traffic
        if (!car.damaged && car.maxPasses < traffic.length) {
            car.damaged = true;
            car.isStuck = true;
        }
    }
}

function pickBestCar(cars) {

    const eligibleCars = cars.filter(c => !c.isStuck);

    if (eligibleCars.length == 0) {
        return cars[0];
    }

    return eligibleCars.find(
        c => c.y == Math.min(
            ...eligibleCars.map(c => c.y)
        )
    );
}

function animate() {

    aiCanvas.height = window.innerHeight - 100;
    networkCanvas.height = window.innerHeight - 100;
    playerCanvas.height = window.innerHeight - 100;

    // animate AI Section
    animateAiSection();

    // animate player section
    animatePlayerSection();

    requestAnimationFrame(animate);
}

function animatePlayerSection() {

    // update player traffic
    for (let i = 0; i < playerTraffic.length; i++) {
        playerTraffic[i].update(playerRoad.borders, []);
    }
    // update player car
    playerCar.update(playerRoad.borders, playerTraffic);

    // follow player car
    playerCtx.save();
    playerCtx.translate(0, -playerCar.y+playerCanvas.height*0.7);
    // draw player road
    playerRoad.draw(playerCtx);
    // draw traffic as red
    for (let i = 0; i < playerTraffic.length; i++) {
        playerTraffic[i].draw(playerCtx, "red");
    }
    // draw player car solid blue
    playerCar.draw(playerCtx, "blue", true);
    // restore ctx
    playerCtx.restore();

    // if player car is disabled reset player state
    if (playerCar.damaged) {
        resetPlayerState();
        console.log("player car out of comission");
    }

    // check if the player won
    if (playerCar.maxPasses >= playerTraffic.length) {
        console.log("player won!");
    }
}

function animateAiSection() {

    // disable stuck cars
    for (let i = 0; i < aiCars.length; i++) {
        checkStuck(aiCars[i], aiTraffic);
    }
    let damagedCount = 0;
    for (let i = 0; i < aiCars.length; i++) {
        if (aiCars[i].damaged == true) {
            damagedCount++;
        }
    }

    // if all cars are disabled save the best car and reset the simulation
    if (damagedCount == aiCount) {
        save();
        resetAiState();
    }

    // update ai road traffic
    for (let i = 0; i < aiTraffic.length; i++) {
        aiTraffic[i].update(aiRoad.borders, []);
    }
    // update ai road cars
    for (let i = 0; i < aiCars.length; i++) {
        aiCars[i].update(aiRoad.borders, aiTraffic);
    }
    // find the best car (the car that travelled the furthest)
    bestCar = pickBestCar(aiCars);

    // check if the AI won
    if (bestCar.maxPasses >= aiTraffic.length) {
        console.log("ai won!");
    }

    // follow bestCar
    aiCtx.save();
    aiCtx.translate(0, -bestCar.y+aiCanvas.height*0.7);
    // draw road
    aiRoad.draw(aiCtx);
    // draw traffic as red
    for (let i = 0; i < aiTraffic.length; i++) {
        aiTraffic[i].draw(aiCtx, "red");
    }
    // draw all cars except for bestCar transparently
    aiCtx.globalAlpha = 0.2;
    for (let i = 0; i < aiCars.length; i++) {
        aiCars[i].draw(aiCtx, "blue");
    }
    // draw the best car solid blue
    aiCtx.globalAlpha = 1;
    bestCar.draw(aiCtx, "blue", true);
    // restore ctx
    aiCtx.restore();
    // draw vizualizer
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
}