import { height, width } from '../utilities/terminal.js';
import * as snake from './snake.js';

let x = 0;
let y = 0;

export function resetFoodLocation() {
    let locationValid = false;
    do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        
        if (!snake.doesCoordinateContainSegment(x, y)) {
            locationValid = true;
        }
    }
    while(!locationValid);
    
    return getLocation();
}

export function willSnakeEatFood() {
    const snakeHeadLocation = snake.getHeadLocation();
    
    if (Math.abs(snakeHeadLocation.x - x) >= 2 || Math.abs(snakeHeadLocation.y - y) >= 2) {
        return false;
    }
    
    const snakeHeadDirection = snake.getCurrentDirection();
    
    return (snakeHeadDirection == 'north' && snakeHeadLocation.x == x && snakeHeadLocation.y == y + 1) ||
        (snakeHeadDirection == 'south' && snakeHeadLocation.x == x && snakeHeadLocation.y == y - 1) ||
        (snakeHeadDirection == 'east' && snakeHeadLocation.y == y && snakeHeadLocation.x == x - 1) ||
        (snakeHeadDirection == 'west' && snakeHeadLocation.y == y && snakeHeadLocation.x == x + 1);
}

export function getLocation() {
    return {
        x,
        y,
    };
}
