import KurupiraRender from './Render';

// Matter.js module aliases
const { Engine, World, Bodies } = Matter;

const arrowCodes = { 37: "left", 38: "up", 39: "right", 40: "down" };
const pressed = {};

function createEventRunner(pressed, codes) {
  return function (event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
}

export default class Runner {
  constructor(data) {
    this._data = data;
    this._normalCounter = 0;
    this.pressed = {};
    this.engine = Engine.create({
      render: {
        element: document.body,
        controller: new KurupiraRender()
      },
      normal: [],
      pressed: {}
    });

    const handler = createEventRunner(this.engine.pressed, arrowCodes);
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);

    this.loadData(data);

  }

  addMouseConstraint () {
    const mouseConstraint = Matter.MouseConstraint.create(this.engine);
    World.add(this.engine.world, [mouseConstraint]);
  }

  loadData(data) {

    data.actors.forEach(actor => {
      if (actor.act)
        actor.act = actor.act.map(behavior => Function.apply(null, behavior));

      if (actor.physics) {
        const {  x, y, width, height, radius, ...cfg } = actor;
        switch (actor.physics.shape) {
          case 'rectangle':
            console.log( Bodies.rectangle(x, y, width, height, actor));
            World.add(this.engine.world, Bodies.rectangle(x, y, width, height, cfg));

            break;
          case 'circle':
            console.log( Bodies.circle(x, y, radius, cfg));
            World.add(this.engine.world, Bodies.circle(x, y, radius, cfg));
            break;
        }
        // World.add(this.engine.world, Bodies.rectangle(actor.x, actor.y, actor.width, actor.height, actor));
        return;
      }
      actor.id = this._normalCounter++;
      this.engine.normal.push(actor);
    });
  }

  get renderOptions() {
    return this.engine.render.options;
  }

  renderOptions(opt) {
    for (let prop in opt) {
      this.render.options[prop] = opt[prop];
    }
  }

  run() {
    Engine.run(this.engine);
  }

}