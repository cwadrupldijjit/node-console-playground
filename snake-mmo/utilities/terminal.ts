export let [ width, height ] = process.stdout.getWindowSize();

// this tracks the delta in window dimensions between frames
export const windowAdjustments = {
    x: 0,
    y: 0,
};

export function updateWindowSize() {
    const previousWidth = width;
    const previousHeight = height;
    
    ([ width, height ] = process.stdout.getWindowSize());
    
    windowAdjustments.x = previousWidth - width;
    windowAdjustments.y = previousHeight - height;
}

// this and the "clearScreen" function are promise wrappers for the native methods;
// I originally tried util.promisify, but it wasn't working right and it very well could mean that I wasn't using it properly
export function setCursorPosition(x: number, y: number) {
    return new Promise<void>((resolve) => {
        process.stdout.cursorTo(x, y, resolve);
    });
}

export async function clearScreen() {
    await setCursorPosition(0, 0);
    
    return new Promise<void>((resolve) => {
        process.stdout.clearScreenDown(resolve);
    });
}
