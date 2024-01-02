import { fluvial } from 'fluvial';
import { cors } from '@fluvial/cors';
import { csp } from '@fluvial/csp';
import './keybindings.js';
import { GAME } from './game-state.js';
import { height, setCursorPosition, width } from './utilities/terminal.js';

const app = fluvial();

app.use(cors());
app.use(csp());

GAME.onGameEnd(async () => {
    await setCursorPosition(width - 1, height - 1);
    process.stdout.write('\n');
    process.exit(0);
});

GAME.init();
GAME.tick();

app.listen(5678, () => {
    console.log(`play snake at localhost:${5678}`);
});
