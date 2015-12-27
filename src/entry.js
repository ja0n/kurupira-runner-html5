import RenderKurupira from './RenderKurupiraNext';
import Handler from './Handler';

// Matter.js module aliases
const { Engine, World, Body, Vector, Composite, Bodies, MouseConstraint } = Matter;

const data = require('./model.json');

let Game = new Handler(data);

var mouse = MouseConstraint.create(Game.engine);
var boxC = Bodies.circle(250, 100, 40);
var roof = Bodies.rectangle(400, 10, 810, 10, { isStatic: true });
var ground = Bodies.rectangle(400, 400, 810, 10, { isStatic: true });
var leftWall = Bodies.rectangle(10, 100, 10, 600, { isStatic: true });
var rightWall = Bodies.rectangle(790, 100, 10, 600, { isStatic: true });


// add all of the bodies to the world
World.add(Game.engine.world, [ground, roof, leftWall, rightWall, boxC, mouse]);

// renderOptions.background = './img/wall-bg.jpg';
Game.renderOptions.showAngleIndicator = true;
Game.renderOptions.wireframes = false;

Game.run();

setTimeout(function() {
  Body.applyForce(boxC, Vector.create(0, 0), Vector.create(0.1, -0.2));
  // console.log(Composite.allBodies(engine.world));
}, 2000);
