const { Engine, Runner, Bodies, World, Render, Body, Events } = Matter;
const horizontalCells = 13;
const verticalCells = 14;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width / horizontalCells;
const unitLengthY = height / verticalCells;
const engine = Engine.create();
//engine.world.gravity.y = 0;       //To enable/disable gravity for the ball
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine,
	options: {
		wireframes: false,
		width,
		height
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

//The Walls

const walls = [
	Bodies.rectangle(width / 2, 0, width, 10, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 10, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 10, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 10, height, { isStatic: true })
];
World.add(world, walls);

//The MAZE generation

const shuffle = (arr) => {
	let counter = arr.length - 1;
	while (counter > 0) {
		const idx = Math.floor(Math.random() * arr.length);
		counter--; //The length of the array is indexes+1. Therefore we have subtracted 1 before swapping
		const temp = arr[counter];
		arr[counter] = arr[idx];
		arr[idx] = temp;
	}
	return arr;
};
const grid = Array(verticalCells).fill(null).map(() => Array(horizontalCells).fill(false));

const verticals = Array(verticalCells).fill(null).map(() => Array(horizontalCells - 1).fill(false));

const horizontals = Array(verticalCells - 1).fill(null).map(() => Array(horizontalCells).fill(false));

const startRow = Math.floor(Math.random() * verticalCells);
const startCol = Math.floor(Math.random() * horizontalCells);

const cellTraversal = (row, column) => {
	//If a neighbor is visited, return
	if (grid[row][column]) {
		return;
	}
	//Mark this cell as visited
	grid[row][column] = true;
	//Assemble randomly oriented list of neighbors
	const neighbors = shuffle([
		[ row - 1, column, 'up' ],
		[ row, column + 1, 'right' ],
		[ row + 1, column, 'down' ],
		[ row, column - 1, 'left' ]
	]);
	//For each neighbor...
	for (let neighbor of neighbors) {
		const [ nextRow, nextCol, direction ] = neighbor;
		//See if the neighbor is out of bounds
		if (nextRow < 0 || nextCol < 0 || nextRow >= verticalCells || nextCol >= horizontalCells) {
			continue;
		}
		//if we have visited the neighbor, continue to the next neighbor  //Defensive coding //Checking twice
		if (grid[nextRow][nextCol]) {
			continue;
		}
		//Remove a wall from either horizontals or verticals
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}
		cellTraversal(nextRow, nextCol);
	}
};
cellTraversal(startRow, startCol);

horizontals.forEach((row, rowIdx) => {
	row.forEach((openSeg, colIdx) => {
		if (openSeg) {
			return;
		}
		const wall = Bodies.rectangle(
			unitLengthX * colIdx + unitLengthX / 2,
			unitLengthY * rowIdx + unitLengthY,
			unitLengthX,
			10,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: 'red'
				}
			}
		);

		World.add(world, wall);
	});
});
verticals.forEach((row, rowIdx) => {
	row.forEach((openSeg, colIdx) => {
		if (openSeg) {
			return;
		}
		const wall = Bodies.rectangle(
			unitLengthX * colIdx + unitLengthX,
			unitLengthY * rowIdx + unitLengthY / 2,
			10,
			unitLengthY,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: 'red'
				}
			}
		);
		World.add(world, wall);
	});
});
const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX / 2, unitLengthY / 2, {
	isStatic: true,
	label: 'goal',
	render: {
		fillStyle: 'green'
	}
});
World.add(world, goal);
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, Math.min(unitLengthX, unitLengthY) / 4, {
	label: 'ball'
});
World.add(world, ball);
document.addEventListener('keydown', (e) => {
	const { x, y } = ball.velocity;
	const initSpeed = 3;
	if (e.keyCode === 87) {
		Body.setVelocity(ball, { x, y: y - initSpeed });
	} else if (e.keyCode === 65) {
		Body.setVelocity(ball, { x: x - initSpeed, y });
	} else if (e.keyCode === 68) {
		Body.setVelocity(ball, { x: x + initSpeed, y });
	} else if (e.keyCode === 83) {
		Body.setVelocity(ball, { x, y: y + initSpeed });
	}
});

//Win condition

Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		labels = [ 'goal', 'ball' ];
		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			world.bodies.forEach((body) => {
				if (body.label === 'wall' || body.label === 'goal') {
					Body.setStatic(body, false);
					const winner = document.querySelector('.winner');
					winner.classList.remove('is-hidden');
				}
			});
		}
	});
});
const button = document.querySelector('button');
button.addEventListener('click', () => {
	window.location.reload();
});
