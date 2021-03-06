const { World, Body, Vector, Bodies } = Runner.Matter;;

fetch('./model.json')
  .then(resp => resp.json())
  .then(data => {
    const Game = new Runner(data);
    const gameWorld = Game.engine.world;

    Game.mergeOptions({
      showAngleIndicator: true,
      wireframes: false,
    });

    Game.addMouseConstraint();

    addWalls();
    addCircle();

    Game.run();

    function addWalls () {
      const roof = Bodies.rectangle(400, 10, 810, 10, { isStatic: true });
      const ground = Bodies.rectangle(400, 400, 810, 10, { isStatic: true });
      const leftWall = Bodies.rectangle(10, 100, 10, 600, { isStatic: true });
      const rightWall = Bodies.rectangle(790, 100, 10, 600, { isStatic: true });

      World.add(gameWorld, [ground, roof, leftWall, rightWall]);
    }

    function addCircle () {
      const circle = Bodies.circle(250, 100, 40);

      setTimeout(function() {
        Body.applyForce(circle, Vector.create(0, 0), Vector.create(0.95, -0.5));
      }, 2000);

      World.add(gameWorld, [circle]);
    }
  });
