
const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");
const buttons = document.getElementById("buttons");

let expression = "";
let resultShown = false;

function updateDisplay() {
    display.value = expression || "0";
}

function addValue(value) {
    const isOperator = ["+", "-", "*", "/", "^", "%"].includes(value);

    if (resultShown && !isOperator) {
        expression = "";
    }

    expression += value;
    resultShown = false;
    updateDisplay();
}

function clearCalculator() {
    expression = "";
    expressionDisplay.textContent = "";
    resultShown = false;
    updateDisplay();
}

function deleteLast() {
    expression = expression.slice(0, -1);
    resultShown = false;
    updateDisplay();
}

function toggleSign() {
    if (!expression) {
        expression = "-";
    } else if (resultShown) {
        expression = String(-Number(expression));
    } else {
        expression = `-(${expression})`;
    }

    resultShown = false;
    updateDisplay();
}

function squareValue() {
    if (expression) {
        expression = `(${expression})^2`;
        resultShown = false;
        updateDisplay();
    }
}

function tokenize(input) {
    const tokens = [];
    const pattern = /\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?|([a-zA-Z]+)|(.)?)/gy;
    let position = 0;

    while (position < input.length) {
        pattern.lastIndex = position;
        const match = pattern.exec(input);

        if (!match || match.index !== position || !match[0].length) {
            throw new Error("Invalid expression");
        }

        position = pattern.lastIndex;

        if (match[1] !== undefined) {
            const number = Number(
                match[1] + (match[2] !== undefined ? `e${match[2]}` : "")
            );

            tokens.push({ type: "number", value: number });
        } else if (match[3] !== undefined) {
            tokens.push({ type: "name", value: match[3].toLowerCase() });
        } else if (match[4] !== undefined && !/\s/.test(match[4])) {
            if ("+-*/^()%".includes(match[4])) {
                tokens.push({ type: match[4], value: match[4] });
            } else {
                throw new Error("Invalid character");
            }
        }
    }

    return tokens;
}

function evaluate(input) {
    const tokens = tokenize(input);
    let index = 0;

    function peek() {
        return tokens[index];
    }

    function consume(type) {
        if (!peek() || peek().type !== type) {
            throw new Error("Incomplete expression");
        }

        return tokens[index++];
    }

    function parseExpression() {
        let value = parseTerm();

        while (peek() && ["+", "-"].includes(peek().type)) {
            const operator = tokens[index++].type;
            const right = parseTerm();

            value = operator === "+" ? value + right : value - right;
        }

        return value;
    }

    function parseTerm() {
        let value = parseUnary();

        while (peek() && ["*", "/"].includes(peek().type)) {
            const operator = tokens[index++].type;
            const right = parseUnary();

            if (operator === "/" && right === 0) {
                throw new Error("Cannot divide by zero");
            }

            value = operator === "*" ? value * right : value / right;
        }

        return value;
    }

    function parseUnary() {
        if (peek() && peek().type === "+") {
            index++;
            return parseUnary();
        }

        if (peek() && peek().type === "-") {
            index++;
            return -parseUnary();
        }

        return parsePower();
    }

    function parsePower() {
        const value = parsePostfix();

        if (peek() && peek().type === "^") {
            index++;
            return Math.pow(value, parseUnary());
        }

        return value;
    }

    function parsePostfix() {
        let value = parsePrimary();

        while (peek() && peek().type === "%") {
            index++;
            value /= 100;
        }

        return value;
    }

    function parsePrimary() {
        if (peek() && peek().type === "number") {
            return consume("number").value;
        }

        if (peek() && peek().type === "(") {
            consume("(");
            const value = parseExpression();
            consume(")");
            return value;
        }

        if (peek() && peek().type === "name") {
            const name = consume("name").value;

            if (name === "pi") {
                return Math.PI;
            }

            consume("(");
            const value = parseExpression();
            consume(")");

            if (name === "sin") return Math.sin(value * Math.PI / 180);
            if (name === "cos") return Math.cos(value * Math.PI / 180);
            if (name === "tan") return Math.tan(value * Math.PI / 180);
            if (name === "log") return Math.log10(value);
            if (name === "sqrt") return Math.sqrt(value);

            throw new Error("Unknown function");
        }

        throw new Error("Invalid expression");
    }

    const answer = parseExpression();

    if (index !== tokens.length || !Number.isFinite(answer)) {
        throw new Error("Invalid calculation");
    }

    return answer;
}

function calculate() {
    if (!expression) return;

    try {
        const answer = evaluate(expression);

        expressionDisplay.textContent = expression + " =";
        expression = String(Number(answer.toPrecision(12)));
        resultShown = true;
        updateDisplay();
    } catch (error) {
        expressionDisplay.textContent = error.message;
        expression = "";
        resultShown = false;
        updateDisplay();
    }
}

buttons.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (!button) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value !== undefined) {
        addValue(value);
        return;
    }

    if (action === "clear") clearCalculator();
    if (action === "delete" || action === "backspace") deleteLast();
    if (action === "sign") toggleSign();
    if (action === "square") squareValue();
    if (action === "equals") calculate();
});

updateDisplay();
