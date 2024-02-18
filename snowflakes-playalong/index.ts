import readline, { type Key } from 'readline';
import colors from 'ansi-colors';

const snowflakeColors: (keyof typeof colors)[] = [ 'blue', 'cyan', 'red', 'white', 'green', 'yellow' ];

// prepare to receive keypress events (to re-enable the ctrl + c manual process killing)
readline.emitKeypressEvents(process.stdin);

// start "raw mode"
process.stdin.setRawMode(true);

// handle input
process.stdin.on('keypress', (str, key: Key) => {
    if (key.name?.toLowerCase() == 'c' && key.ctrl) {
        process.exit(0);
    }
});

// compatibility for Windows (sans WSL)
if (process.platform == 'win32') {
    // due to platform differences, particularly in some terminal environments on Windows, the "stdin" pipe needs to be resumed in order for resize events to work
    process.stdin.resume();
}

const snowflakes = [];

const numberOfSnowflakes = 100;

// print loop
setInterval(async () => {
    await clearScreen();
    
    const [ width, height ] = process.stdout.getWindowSize();
    
    if (snowflakes.length < numberOfSnowflakes) {
        snowflakes.push({
            x: Math.floor(Math.random() * width),
            y: 0,
            color: snowflakeColors[Math.floor(Math.random() * snowflakeColors.length)],
        });
    }
    
    for (const snowflake of snowflakes) {
        snowflake.y++;
        
        const driftAmount = Math.floor(Math.random() * 6) - 3;
        
        snowflake.x += driftAmount;
        
        if (snowflake.y >= height) {
            snowflakes.shift();
            continue;
        }
        
        await setCursorPosition(snowflake.x, snowflake.y);
        process.stdout.write(colors[snowflake.color]('*'));
    }
    
    await setCursorPosition(width - 1, height - 1);
}, 50);

// set cursor implementation
function setCursorPosition(x, y) {
    return new Promise<void>((resolve) => {
        process.stdout.cursorTo(x, y, resolve);
    });
}

// clear screen implementation
async function clearScreen() {
    await setCursorPosition(0, 0);
    
    return new Promise<void>((resolve) => {
        process.stdout.clearScreenDown(resolve);
    });
}

// should spawn snowflake
