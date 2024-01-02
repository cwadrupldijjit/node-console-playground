import readline, { Key } from 'readline';
import { GAME } from './game-state.js';

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);

if (process.platform == 'win32') {
    process.stdin.resume();
}

const bindings: Record<string, ((rawString: string, key: Key) => void)[]> = {};

process.stdin.on('keypress', (str: string, key: Key) => {
    if (key.name?.toLowerCase() == 'c' && key.ctrl) {
        GAME.kill = true;
        return;
    }
    
    const lower = key.name?.toLowerCase();
    
    if (!(lower in bindings)) {
        return;
    }
    
    for (const listener of bindings[lower]) {
        listener(str, key);
    }
});

export function addBinding(keys: string | string[], handler: (rawString: string, key: Key) => void) {
    return registerBinding(keys, handler);
}

export function registerBinding(providedKeys: string | string[], handler: (rawString: string, key: Key) => void) {
    const keys = Array.isArray(providedKeys) ? providedKeys : [ providedKeys ];
    const removeListeners: (() => void)[] = [];
    
    for (const key of keys) {
        const lower = key.toLowerCase();
        
        if (!(lower in bindings)) {
            bindings[lower] = [];
        }
        
        if (bindings[lower].includes(handler)) {
            removeListeners.push(null);
            continue;
        }
        
        bindings[lower].push(handler);
        
        removeListeners.push(removeBinding.bind(null, lower, handler));
    }
    
    return removeListeners;
}

export function removeBinding(providedKeys: string | string[], handler?: (rawString: string, key: Key) => void) {
    const keys = Array.isArray(providedKeys) ? providedKeys : [ providedKeys ];
    
    for (const key of keys) {
        const lower = key.toLowerCase();
        
        if (!(lower in bindings)) {
            continue;
        }
        
        if (handler && bindings[lower].includes(handler)) {
            bindings[lower].splice(bindings[lower].indexOf(handler), 1);
        }
        
        if (!handler || !bindings[lower].length) {
            delete bindings[lower];
        }
    }
}
