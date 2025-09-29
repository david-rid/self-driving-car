class NeuralNetwork {
    constructor(neuronCounts) {
        this.levels = [];
        for (let i = 0; i < neuronCounts.length-1; i++) {
            this.levels.push( new Level(
                neuronCounts[i], neuronCounts[i+1]
            ));
        }
    }

    static feedForward(givenInputs, network) {
        let outputs = Level.feedForward(
            givenInputs, network.levels[0]
        );
        // loop through remaining levels
        for (let i = 1; i < network.levels.length; i++) {
            // feed forward result from last level
            outputs = Level.feedForward(
                outputs, network.levels[i]
            )
        }
        return outputs;
    }

    static mutate(network, amount = 1) {
        network.levels.forEach(level => {
            for (let i = 0; i < level.biases.length; i++) {
                level.biases[i] = lerp(
                    level.biases[i],
                    Math.random()*2-1,
                    amount
                )
            }
            
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    level.weights[i][j] = lerp(
                        level.weights[i][j],
                        Math.random()*2-1,
                        amount
                    );
                }
            }
        });
    }
}

class Level {
    constructor(inputCount, outputCount) {
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);

        this.weights = [];
        for (let i = 0; i < inputCount; i++) {
            this.weights[i] = new Array(outputCount);
        }

        Level.#randomize(this);
    }

    static #randomize(level) {
        
        // fill all weight values for each input node with random numbers -1 to 1
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                // random val between -1 and 1
                level.weights[i][j] = Math.random()*2-1;
            }
        }

        // fill bias values for each output node with random numbers -1 to 1
        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = Math.random()*2-1;
        }
    }

    static feedForward(givenInputs, level) {

        // replace values in level.inputs with given.inputs
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = givenInputs[i];
        }

        // for every output node
        for (let i = 0; i < level.outputs.length; i++) {
            let sum = 0;
            // calculate sum like so:
            // multiply each input node value by output node i value
            // add all the values up
            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j]*level.weights[j][i];
            }

            // if sum is greater than bias value for output node i value
            if (sum > level.biases[i]) { 
                // turn neuron "on"
                level.outputs[i] = 1;
            } else {
                // turn neuron "off"
                level.outputs[i] = 0;
            }
        }

        return level.outputs;
    }
}