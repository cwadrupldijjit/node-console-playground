import colors from 'ansi-colors';
import * as food from './objects/food.js';
import * as snake from './objects/snake.js';
import { sleep } from './utilities/misc.js';
import { width, height, updateWindowSize, clearScreen, setCursorPosition } from './utilities/terminal.js';
import { addBinding } from './keybindings.js';

const { blueBright, cyanBright, redBright } = colors;

let gameEndHandlers: (() => void)[] = [];
let gamePausePromise: Promise<void> = null;
let resolveGamePausePromise: () => void = null;

export const GAME = {
    kill: false,
    get paused() {
        return Boolean(gamePausePromise)
    },
    frameFrequency: 100,
    
    init() {
        addBinding('escape', () => {
            if (GAME.paused) {
                GAME.resume();
            }
            else {
                GAME.pause();
            }
        });
        
        snake.init();
        food.resetFoodLocation();
    },
    
    async tick() {
        await clearScreen();
        updateWindowSize();
        
        let foodLocation = food.getLocation();
        
        if (foodLocation.x >= width || foodLocation.y >= height) {
            foodLocation = food.resetFoodLocation();
        }
        
        snake.tick();
        
        await setCursorPosition(foodLocation.x, foodLocation.y);
        process.stdout.write(blueBright('ଛ'));
        await snake.render();
        
        await setCursorPosition(width, height);
        
        await sleep(GAME.frameFrequency);
        
        await gamePausePromise;
        
        if (GAME.kill) {
            await renderGameOver();
            for (const handler of gameEndHandlers) {
                handler();
            }
            return;
        }
        
        process.nextTick(GAME.tick);
    },
    
    reset() {
        if (GAME.paused) {
            gamePausePromise = null;
            resolveGamePausePromise = null;
        }
        gameEndHandlers = [];
        GAME.frameFrequency = 1000;
        GAME.kill = false;
        
        food.resetFoodLocation();
        
        snake.reset();
    },
    
    async pause() {
        if (GAME.kill) return;
        
        gamePausePromise = new Promise<void>(async (resolve) => {
            resolveGamePausePromise = resolve;
            
            await renderPauseScreen();
        })
            .then(() => {
                gamePausePromise = null;
                resolveGamePausePromise = null;
            });
        snake.suspendInput();
    },
    
    resume() {
        if (GAME.kill) return;
        
        resolveGamePausePromise?.();
        snake.resumeInput();
    },
    
    onGameEnd(handler: () => void) {
        if (gameEndHandlers.includes(handler)) return;
        
        gameEndHandlers.push(handler);
    }
};

async function renderPauseScreen() {
    const message = `G A M E   P A U S E D`;
    
    await setCursorPosition(Math.floor(width / 2) - Math.floor(message.length / 2), Math.floor(height / 2));
    process.stdout.write(cyanBright(message));
    await setCursorPosition(width - 1, height - 1);
}

async function renderGameOver() {
    const messages = [
        'G A M E   O V E R',
        '',
        'Score: ' + snake.getScore(),
    ];
    
    for (const [ index, line ] of messages.entries()) {
        await setCursorPosition(Math.floor(width / 2) - Math.floor(line.length / 2), Math.floor(height / 2) - Math.floor(messages.length / 2) + index);
        process.stdout.write(redBright(line));
    }
}
