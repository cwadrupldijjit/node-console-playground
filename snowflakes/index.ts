/*
This sample was drawn from research which led me to the following sources:
  - How to clear partial lines/sections of the console in node: https://stackoverflow.com/questions/17309749/node-js-console-log-is-it-possible-to-update-a-line-rather-than-create-a-new-l
  - GitHub issue for Windows Terminal about node not emitting resize events: https://github.com/microsoft/terminal/issues/3238
  - Referenced documentation which explains why resize doesn't work on Windows: https://nodejs.org/docs/v8.6.0/api/tty.html#tty_event_resize
  - Raw mode & handling the ctrl + c case: https://davidwalsh.name/node-raw-mode#:~:text=%2F%2F%20Readline%20lets%20us%20tap%20into%20the%20process,triggered%20a%20keypress%2C%20now%20do%20whatever%20we%20want%21

*/

import readline, { Key } from 'readline';
import colors from 'ansi-colors';

const possibleColors = [ 'blue', 'white', 'gray', 'cyan' ] as const;
const possibleSymbols = [ '*', '.', '+', 'x', '#', '`' ] as const;
const weight = 10;
// in ms
const refreshRate = 50;

const snowflakes: Snowflake[] = [];

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
});

// the "game loop" for the falling snow
setInterval(async () => {
    // start at the top
    await setCursorPosition(0, 0);
    // clear the screen from what it was before
    await clearScreen();
    
    // let it snow!
    await renderSnow();
}, refreshRate);

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

function shouldSpawnSnowflake() {
    // weight-affected probability for spawning a snowflake & quantity
    return snowflakes.length < (100 * weight) && (Math.random() * 100) < 85 * weight;
}

// reclaim space by removing snowflakes that has 
const snowflakesToRetire: Snowflake[] = [];

async function renderSnow() {
    const [ cols, rows ] = process.stdout.getWindowSize();
    
    // weight-altered spawn chance; allows for up to 5 snowflakes to spawn if the weight is 5
    for (let i = 0; i < weight; i++) {
        if (shouldSpawnSnowflake()) {
            // create snowflake with random color, symbol, and column/x, but let some general things stay the same
            snowflakes.push({
                x: Math.floor(Math.random() * cols),
                y: 0,
                color: getRandomColor(),
                size: 1,
                symbol: getRandomSymbol(),
                vector: {
                    dx: 0,
                    dy: 1,
                },
            });
        }
    }
    
    // (re)render each snowflake
    for (const snowflake of snowflakes) {
        await setCursorPosition(snowflake.x, snowflake.y);
        process.stdout.write(colors[snowflake.color](snowflake.symbol));
        
        // apply stored movement speed
        snowflake.x += snowflake.vector.dx;
        snowflake.y += snowflake.vector.dy;
        
        // detect if it's outside of the bounds of the terminal window, in which case, there's no reason for it to appear or be calculated further
        if (snowflake.x < 0 || snowflake.x >= cols || snowflake.y < 0 || snowflake.y >= rows) {
            snowflakesToRetire.push(snowflake);
        }
        else {
            // alter it for the next iteration to allow for drift
            snowflake.vector = maybeChangeVector(snowflake.vector);
        }
    }
    
    for (const snowflake of snowflakesToRetire) {
        snowflakes.splice(snowflakes.indexOf(snowflake), 1);
    }
    
    snowflakesToRetire.splice(0);
    await setCursorPosition(cols, rows);
}

function getRandomColor() {
    return possibleColors[Math.floor(Math.random() * possibleColors.length)];
}

function getRandomSymbol() {
    return possibleSymbols[Math.floor(Math.random() * possibleSymbols.length)];
}

function maybeChangeVector(vector: { dx: number, dy: number }) {
    return {
        dx: vector.dx + Math.floor(Math.random() * 3) - 1,
        dy: Math.floor(Math.random() * 2) + 1,
    };
}

interface Snowflake {
    x: number;
    y: number;
    color: typeof possibleColors[number];
    vector: {
        dx: number;
        dy: number;
    };
    symbol: typeof possibleSymbols[number];
    size: 1;
}
