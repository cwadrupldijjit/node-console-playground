import readline, { Key } from 'readline';
import colors from 'ansi-colors';

const { greenBright, redBright, blueBright } = colors;

const obstacles: Obstacle[] = [];
let [ width, height ] = process.stdout.getWindowSize();
const bit = {
    character: '•',
    weight: 1,
    position: {
        x: 3,
        y: Math.floor(height / 2),
    },
    velocity: {
        x: 0,
        y: 0,
    },
};
const obstacleFrequency = 15;
// this tracks the delta in window dimensions between frames
const windowAdjustments = {
    x: 0,
    y: 0,
};
let collisionDetected = false;
let score = 0;
const frameInterval = 75;
let float = 0;

// prepare to receive keypress events (to re-enable the ctrl + c manual process killing)
readline.emitKeypressEvents(process.stdin);

if (process.platform == 'win32') {
    // due to platform differences, particularly in some terminal environments on Windows, the "stdin" pipe needs to be resumed in order for resize events to work
    process.stdin.resume();
}
// "raw mode" means that nodejs-handled events are no longer filtered out or handled
process.stdin.setRawMode(true);
// enabled via readline call above, this event is so I can handle the ctrl + c event
process.stdin.on('keypress', (str: string, key: Key) => {
    if (key.name?.toLowerCase() == 'c' && key.ctrl) {
        process.exit(0);
    }
    
    if (str == ' ') {
        float = 3;
        bit.position.y -= 2;
    }
});

const getCursorPositionCode = '\u001b[6n';

process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);

process.stdout.write('\n'.repeat(height));

await run();

function getCursorPosition() {
    return new Promise((resolve) => {
        process.stdin.once('readable', () => {
            const rawResult = process.stdin.read();
            // the stringify escapes the escape codes so that the result can be parsed;
            // the escape sequence looks similar to "\u001b[9;1R", where x=9 and y=1
            const result = JSON.stringify(rawResult);
            const { groups: pos } = result.match(/\[(?<x>\d+);(?<y>\d+)/);
            resolve(pos);
        });
        process.stdout.write(getCursorPositionCode);
    });
}

function updateWindowSize() {
    const previousWidth = width;
    const previousHeight = height;
    
    ([ width, height ] = process.stdout.getWindowSize());
    
    windowAdjustments.x = previousWidth - width;
    windowAdjustments.y = previousHeight - height;
}

// this and the "clearScreen" function are promise wrappers for the native methods;
// I originally tried util.promisify, but it wasn't working right and it very well could mean that I wasn't using it properly
function setCursorPosition(x: number, y: number) {
    return new Promise<void>((resolve) => {
        process.stdout.cursorTo(x, y, resolve);
    });
}

function clearScreen() {
    return new Promise<void>((resolve) => {
        process.stdout.clearScreenDown(resolve);
    });
}

async function run() {
    updateWindowSize();
    
    updateLocations();
    
    await setCursorPosition(0, 0);
    await clearScreen();
    
    await render();
    
    if (collisionDetected) {
        await end();
    }
    
    await sleep(frameInterval);
    
    process.nextTick(run);
}

function updateLocations() {
    if (float) {
        float--;
    }
    else {
        bit.position.y += 1;
    }
    
    if (!obstacles.length || obstacles.at(-1).x <= width - obstacleFrequency) {
        generatePipe();
    }
    
    for (const obstacle of obstacles) {
        obstacle.x--;
        
        if (obstacle.x <= 0) {
            obstacles.splice(obstacles.indexOf(obstacle), 1);
        }
        
        if (obstacle.x == bit.position.x) {
            const gapStart = getRelativeGapStart(obstacle);
            collisionDetected = bit.position.y < gapStart || bit.position.y > gapStart + obstacle.gapHeight;
            
            if (!collisionDetected) {
                score++;
            }
        }
    }
    
    if (!collisionDetected && (bit.position.y < 0 || bit.position.y >= height)) {
        collisionDetected = true;
    }
}

async function render() {
    for (const obstacle of obstacles) {
        await renderPipe(obstacle);
    }
    
    const bitText = collisionDetected ? redBright('✕') : blueBright(bit.character);
    
    await setCursorPosition(bit.position.x, bit.position.y);
    process.stdout.write(bitText);
    
    await setCursorPosition(width, height);
}

async function end() {
    await setCursorPosition(width - 1, height - 1);
    process.stdout.write('\n');
    console.log('Final score:', score);
    
    process.exit(0);
}

function generatePipe() {
    const gapHeight = Math.min(Math.max(Math.floor(Math.random() * height), 5), 10);
    const gapPosition = Math.floor(Math.random() * height) - Math.floor(gapHeight / 2);
    
    obstacles.push({
        originalHeight: height,
        gapHeight,
        gapPosition,
        x: width - 1,
    });
}

async function renderPipe(obstacle: Obstacle) {
    const gapStart = getRelativeGapStart(obstacle);
    const gapEnd = gapStart + obstacle.gapHeight;
    
    for (let y = 0; y < height; y++) {
        if (y < gapStart || y > gapEnd) {
            await setCursorPosition(obstacle.x, y);
            process.stdout.write(greenBright('|'));
        }
    }
}

function getRelativeGapStart(obstacle: Obstacle) {
    const comparativeHeight = height - obstacle.originalHeight;
    
    return obstacle.gapPosition + Math.floor(comparativeHeight / 2);
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

interface Obstacle {
    /* this is used to adjust the gap's position based on the current height */
    originalHeight: number;
    gapHeight: number;
    /* this is the originally-generated position of the top of the gap */
    gapPosition: number;
    x: number;
}
