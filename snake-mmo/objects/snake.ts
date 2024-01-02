import colors from 'ansi-colors';
import { Key } from 'readline';
import { GAME } from '../game-state.js';
import { height, width, setCursorPosition } from '../utilities/terminal.js';
import * as food from './food.js';
import { registerBinding, removeBinding } from '../keybindings.js';

const { redBright, yellowBright } = colors;

const segments: Segment[] = [];

const segmentCharacters = [
    '◉',
    '│',
    '─',
    '┐',
    '┌',
    '└',
    '┘',
] as const;

let direction: 'north' | 'south' | 'east' | 'west' = 'north';
let collided = false;
const initialSegmentLength = 3
let initialSegmentsToGenerate = initialSegmentLength;

export function init() {
    registerKeybindings();
}

function registerKeybindings() {
    registerBinding(['w', 'k', 'up'], keybindingUp);
    registerBinding(['a', 'h', 'left'], keybindingLeft);
    registerBinding(['s', 'j', 'down'], keybindingDown);
    registerBinding(['d', 'l', 'right'], keybindingRight);
}

export function reset() {
    direction = 'north';
    collided = false;
    initialSegmentsToGenerate = initialSegmentLength;
    segments.splice(0);
}

export function suspendInput() {
    removeBinding(['w', 'k', 'up'], keybindingUp);
    removeBinding(['a', 'h', 'left'], keybindingLeft);
    removeBinding(['s', 'j', 'down'], keybindingDown);
    removeBinding(['d', 'l', 'right'], keybindingRight);
}

export function resumeInput() {
    registerKeybindings();
}

export function doesCoordinateContainSegment(x: number, y: number) {
    return segments.some(s => s.x == x && s.y == y);
}

export function getCurrentDirection() {
    return direction;
}

export function getScore() {
    return Math.max(0, segments.length - initialSegmentLength);
}

export function setCurrentDirection(dir: typeof direction) {
    const head = segments[0];
    const next = segments[1];
    
    if (
        (dir == 'north' && next.y < head.y) ||
        (dir == 'south' && next.y > head.y) ||
        (dir == 'east' && next.x > head.x) ||
        (dir == 'west' && next.x < head.x)
    ) {
        return;
    }
    
    direction = dir;
}

export function didCollide() {
    return collided;
}

export function getHeadLocation() {
    const { x, y } = segments[0];
    return { x, y };
}

export function tick() {
    const nextCoords = {
        x: 0,
        y: 0,
    };
    const previousHead = segments[0];
    
    // initial head not yet spawned
    if (!previousHead) {
        nextCoords.x = Math.floor(width / 2);
        nextCoords.y = Math.floor(height / 2);
    }
    else if (direction == 'north') {
        nextCoords.x = previousHead.x;
        nextCoords.y = previousHead.y - 1;
    }
    else if (direction == 'south') {
        nextCoords.x = previousHead.x;
        nextCoords.y = previousHead.y + 1;
    }
    else if (direction == 'east') {
        nextCoords.x = previousHead.x + 1;
        nextCoords.y = previousHead.y;
    }
    else if (direction == 'west') {
        nextCoords.x = previousHead.x - 1;
        nextCoords.y = previousHead.y;
    }
    
    const newHead: Segment = {
        char: segmentCharacters[SegmentCharacter.head],
        ...nextCoords,
    };
    
    if (newHead.x >= width || newHead.y >= height || newHead.x < 0 || newHead.y < 0 || doesCoordinateContainSegment(newHead.x, newHead.y)) {
        GAME.kill = true;
        collided = true;
    }
    
    segments.unshift(newHead);
    
    if (previousHead) {
        // due to the "unshift" above, previous head is now at index 1; should now no longer be a head segment
        previousHead.char = getSegmentChar(1);
    }
    
    if (initialSegmentsToGenerate) {
        initialSegmentsToGenerate--;
        return;
    }
    
    const foodLocation = food.getLocation();
    
    // only remove the final element if the snake head is not at the current location
    if (foodLocation.x != newHead.x || foodLocation.y != newHead.y) {
        segments.pop();
    }
    else {
        food.resetFoodLocation();
    }
}

export async function render() {
    const headSegment = segments[0];
    const lastSegment = segments.at(-1);
    
    // reverse() is called here so that the head can be rendered last
    for (const [ index, segment ] of Array.from(segments.entries()).reverse()) {
        await setCursorPosition(segment.x, segment.y);
        
        let char: typeof segmentCharacters[number] | '✕' = segment.char;
        
        if (headSegment != segment && segment == lastSegment) {
            if (segment.x != segments[index - 1].x) {
                char = segmentCharacters[SegmentCharacter.leftRight];
            }
            else {
                char = segmentCharacters[SegmentCharacter.topBottom];
            }
        }
        else if (collided && segment == headSegment) {
            char = '✕';
        }
        else {
            char = segment.char;
        }
        
        process.stdout.write(collided && segment == headSegment ? redBright(char) : yellowBright(char));
    }
}

function getSegmentChar(segmentIndex: number) {
    const segment = segments[segmentIndex];
    
    const nextDirection = getSegmentDirection(segment, segments[segmentIndex - 1]);
    const previousDirection = segmentIndex != segments.length - 1 ? getSegmentDirection(segment, segments[segmentIndex + 1]) : null;
    
    if ((!previousDirection && [ 'left', 'right' ].includes(nextDirection)) || (nextDirection == 'left' && previousDirection == 'right') || (nextDirection == 'right' && previousDirection == 'left')) {
        return segmentCharacters[SegmentCharacter.leftRight];
    }
    else if ((!previousDirection && [ 'top', 'bottom' ].includes(nextDirection)) || (nextDirection == 'top' && previousDirection == 'bottom') || (nextDirection == 'bottom' && previousDirection == 'top')) {
        return segmentCharacters[SegmentCharacter.topBottom];
    }
    else if ((nextDirection == 'left' && previousDirection == 'bottom') || (nextDirection == 'bottom' && previousDirection == 'left')) {
        return segmentCharacters[SegmentCharacter.leftBottom];
    }
    else if ((nextDirection == 'right' && previousDirection == 'bottom') || (nextDirection == 'bottom' && previousDirection == 'right')) {
        return segmentCharacters[SegmentCharacter.rightBottom];
    }
    else if ((nextDirection == 'right' && previousDirection == 'top') || (nextDirection == 'top' && previousDirection == 'right')) {
        return segmentCharacters[SegmentCharacter.rightTop];
    }
    else if ((nextDirection == 'left' && previousDirection == 'top') || (nextDirection == 'top' && previousDirection == 'left')) {
        return segmentCharacters[SegmentCharacter.leftTop];
    }
}

function getSegmentDirection(currentSegment: Segment, otherSegment: Segment) {
    if (otherSegment.x == currentSegment.x && otherSegment.y > currentSegment.y) {
        return 'bottom';
    }
    if (otherSegment.x == currentSegment.x && otherSegment.y < currentSegment.y) {
        return 'top';
    }
    if (otherSegment.x > currentSegment.x) {
        return 'right';
    }
    return 'left';
}

function keybindingUp(str: string, key: Key) {
    setCurrentDirection('north');
}

function keybindingLeft(str: string, key: Key) {
    setCurrentDirection('west');
}

function keybindingDown(str: string, key: Key) {
    setCurrentDirection('south');
}

function keybindingRight(str: string, key: Key) {
    setCurrentDirection('east');
}

enum SegmentCharacter {
    head,
    topBottom,
    leftRight,
    leftBottom,
    rightBottom,
    rightTop,
    leftTop,
}

interface Segment {
    x: number;
    y: number;
    char: typeof segmentCharacters[number];
}
