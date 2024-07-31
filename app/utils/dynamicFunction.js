const vm = require('vm');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomOperator() {
    const operators = ['+', '-', '*', '/'];
    return operators[Math.floor(Math.random() * operators.length)];
}

function generateRandomAction() {
    const a = getRandomInt(1, 100);
    const b = getRandomInt(1, 100);
    const operator = getRandomOperator();
    return `${a} ${operator} ${b}`;
}

function createDynamicFunction() {
    const action = generateRandomAction();
    const code = `function dynamicAction() { return ${action}; } dynamicAction();`;

    return function() {
        return vm.runInNewContext(code);
    };
}

module.exports = createDynamicFunction;
