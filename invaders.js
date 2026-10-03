import {
  CANVAS_WIDTH,
  INVADER_COLUMNS,
  INVADER_ROWS,
  INVADER_WIDTH,
  INVADER_HEIGHT,
  INVADER_GUTTER_X,
  INVADER_GUTTER_Y,
  INVADER_TOP_MARGIN,
  INVADER_STEP_DISTANCE,
  INVADER_STEP_INTERVAL,
  INVADER_ROW_DROP,
} from './gameConfig.js';

const FORMATION_WIDTH =
  INVADER_COLUMNS * INVADER_WIDTH + (INVADER_COLUMNS - 1) * INVADER_GUTTER_X;
const FORMATION_START_X = (CANVAS_WIDTH - FORMATION_WIDTH) / 2;

const INVADER_COLOR = '#39ff14';

function createFleet() {
  const fleet = [];
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLUMNS; col++) {
      fleet.push({
        x: FORMATION_START_X + col * (INVADER_WIDTH + INVADER_GUTTER_X),
        y: INVADER_TOP_MARGIN + row * (INVADER_HEIGHT + INVADER_GUTTER_Y),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
        alive: true,
      });
    }
  }
  return fleet;
}

const fleet = createFleet();

// 1 steps right, -1 steps left. Flipped by dropAndReverse() whenever the
// leading edge would cross a canvas wall.
let direction = 1;
let stepTimer = 0;

// Every invader in column 0 (or column INVADER_COLUMNS - 1) shares that
// column's x, and a step shifts the whole fleet by the same delta, so row 0's
// first/last invaders keep marking the formation's left/right edges no
// matter which invaders elsewhere have died.
function leadingLeftX() {
  return fleet[0].x;
}

function leadingRightX() {
  return fleet[INVADER_COLUMNS - 1].x + INVADER_WIDTH;
}

function dropAndReverse() {
  direction *= -1;
  for (const invader of fleet) {
    invader.y += INVADER_ROW_DROP;
  }
}

function step() {
  if (direction > 0 && leadingRightX() + INVADER_STEP_DISTANCE > CANVAS_WIDTH) {
    dropAndReverse();
    return;
  }
  if (direction < 0 && leadingLeftX() - INVADER_STEP_DISTANCE < 0) {
    dropAndReverse();
    return;
  }

  const dx = direction * INVADER_STEP_DISTANCE;
  for (const invader of fleet) {
    invader.x += dx;
  }
}

function update(dt) {
  stepTimer += dt;
  while (stepTimer >= INVADER_STEP_INTERVAL) {
    stepTimer -= INVADER_STEP_INTERVAL;
    step();
  }
}

function draw(ctx) {
  ctx.fillStyle = INVADER_COLOR;
  for (const invader of fleet) {
    if (invader.alive) {
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    }
  }
}

// collision.js reads/writes `alive` on these entries directly; it imports
// nothing from here and just gets the array handed to it by game.js.
export const Invaders = {
  fleet,
  update,
  draw,
};
