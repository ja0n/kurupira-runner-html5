import * as PIXI from 'pixi.js';
import { Composite, Common } from 'matter-js';

let Singleton;

export default class RenderKurupira {
  constructor() {
    if (!Singleton) Singleton = this;
    return Singleton;
  }
  create(options, data) {
    var defaults = {
      // controller: this,
      element: null,
      canvas: null,
      options: {
        width: 800,
        height: 600,
        background: '#fafafa',
        wireframeBackground: '#222',
        hasBounds: false,
        enabled: true,
        wireframes: true,
        showSleeping: true,
        showDebug: false,
        showBroadphase: false,
        showBounds: false,
        showVelocity: true,
        showCollisions: false,
        showAxes: false,
        showPositions: false,
        showAngleIndicator: false,
        showIds: false,
        showShadows: false
      }
    };

    var render = Common.extend(defaults, options),
    transparent = !render.options.wireframes && render.options.background === 'transparent';

    render.data = data;

    // init pixi
    render.context = new PIXI.autoDetectRenderer(render.options.width, render.options.height, {
      view: render.canvas,
      transparent: transparent,
      // antialias: true,
      backgroundColor: options.background
    });

    render.canvas = render.context.view;
    render.container = new PIXI.Container();
    render.bounds = render.bounds || {
      min: {
        x: 0,
        y: 0
      },
      max: {
        x: render.options.width,
        y: render.options.height
      }
    };

    // caches
    render.textures = {};
    render.sprites = {};
    render.primitives = {};

    // use a sprite batch for performance
    render.spriteContainer = new PIXI.Container();
    render.container.addChild(render.spriteContainer);

    // insert canvas
    if (Common.isElement(render.element)) {
      render.element.appendChild(render.canvas);
    } else {
      Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', 'warn');
    }

    // prevent menus on canvas
    render.canvas.oncontextmenu = function() {
      return false;
    };
    render.canvas.onselectstart = function() {
      return false;
    };

    return render;
  }
  clear(render) {
    var container = render.container,
    spriteContainer = render.spriteContainer;

    // clear stage container
    while (container.children[0]) {
      container.removeChild(container.children[0]);
    }

    // clear sprite batch
    while (spriteContainer.children[0]) {
      spriteContainer.removeChild(spriteContainer.children[0]);
    }

    var bgSprite = render.sprites['bg-0'];

    // clear caches
    render.textures = {};
    render.sprites = {};
    render.primitives = {};

    // set background sprite
    render.sprites['bg-0'] = bgSprite;
    if (bgSprite)
    container.addChildAt(bgSprite, 0);

    // add sprite batch back into container
    render.container.addChild(render.spriteContainer);

    // reset background state
    render.currentBackground = null;

    // reset bounds transforms
    container.scale.set(1, 1);
    container.position.set(0, 0);
  }
  setBackground(render, background) {
    if (render.currentBackground !== background) {
      var isColor = background.indexOf && background.indexOf('#') !== -1,
      bgSprite = render.sprites['bg-0'];

      if (isColor) {
        // if solid background color
        var color = Common.colorToNumber(background);
        render.context.backgroundColor = color;

        // remove background sprite if existing
        if (bgSprite)
        render.container.removeChild(bgSprite);
      } else {
        // initialise background sprite if needed
        if (!bgSprite) {
          var texture = _getTexture(render, background);

          bgSprite = render.sprites['bg-0'] = new PIXI.Sprite(texture);
          bgSprite.position.x = 0;
          bgSprite.position.y = 0;
          render.container.addChildAt(bgSprite, 0);
        }
      }

      render.currentBackground = background;
    }
  }
  world(render) {
    const { engine, context, container, options } = render;
    const { world } = engine;
    var bodies = Composite.allBodies(world),
    allConstraints = Composite.allConstraints(world),
    constraints = [],
    i;

    if (options.wireframes) {
      this.setBackground(render, options.wireframeBackground);
    } else {
      this.setBackground(render, options.background);
    }

    // handle bounds
    var boundsWidth = render.bounds.max.x - render.bounds.min.x,
    boundsHeight = render.bounds.max.y - render.bounds.min.y,
    boundsScaleX = boundsWidth / render.options.width,
    boundsScaleY = boundsHeight / render.options.height;

    if (options.hasBounds) {
      // Hide bodies that are not in view
      for (i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        body.render.sprite.visible = Bounds.overlaps(body.bounds, render.bounds);
      }

      // filter out constraints that are not in view
      for (i = 0; i < allConstraints.length; i++) {
        var constraint = allConstraints[i],
        bodyA = constraint.bodyA,
        bodyB = constraint.bodyB,
        pointAWorld = constraint.pointA,
        pointBWorld = constraint.pointB;

        if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
        if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);

        if (!pointAWorld || !pointBWorld)
        continue;

        if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
        constraints.push(constraint);
      }

      // transform the view
      container.scale.set(1 / boundsScaleX, 1 / boundsScaleY);
      container.position.set(-render.bounds.min.x * (1 / boundsScaleX), -render.bounds.min.y * (1 / boundsScaleY));
    } else {
      constraints = allConstraints;
    }

    for (i = 0; i < bodies.length; i++)
      this.body(engine, bodies[i]);

    for (i = 0; i < constraints.length; i++)
      this.constraint(engine, constraints[i]);

    engine.normal.forEach(actor => {
      // actor.act(engine);
      this.staticBody(engine, actor);
    });

    context.render(container);
  }
  constraint(engine, constraint) {
    var render = engine.render,
    bodyA = constraint.bodyA,
    bodyB = constraint.bodyB,
    pointA = constraint.pointA,
    pointB = constraint.pointB,
    container = render.container,
    constraintRender = constraint.render,
    primitiveId = 'c-' + constraint.id,
    primitive = render.primitives[primitiveId];

    // initialise constraint primitive if not existing
    if (!primitive)
    primitive = render.primitives[primitiveId] = new PIXI.Graphics();

    // don't render if constraint does not have two end points
    if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
      primitive.clear();
      return;
    }

    // add to scene graph if not already there
    if (Common.indexOf(container.children, primitive) === -1)
    container.addChild(primitive);

    // render the constraint on every update, since they can change dynamically
    primitive.clear();
    primitive.beginFill(0, 0);
    primitive.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);

    if (bodyA) {
      primitive.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
    } else {
      primitive.moveTo(pointA.x, pointA.y);
    }

    if (bodyB) {
      primitive.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
    } else {
      primitive.lineTo(pointB.x, pointB.y);
    }

    primitive.endFill();
  }
  body(engine, body) {
    var render = engine.render,
    bodyRender = body.render;

    if (!bodyRender.visible)
    return;

    if (bodyRender.sprite && bodyRender.sprite.texture) {
      var spriteId = 'b-' + body.id,
      sprite = render.sprites[spriteId],
      spriteContainer = render.spriteContainer;

      // initialise body sprite if not existing
      if (!sprite)
      sprite = render.sprites[spriteId] = _createBodySprite(render, body);

      // add to scene graph if not already there
      if (Common.indexOf(spriteContainer.children, sprite) === -1)
      spriteContainer.addChild(sprite);

      // update body sprite
      sprite.position.x = body.position.x;
      sprite.position.y = body.position.y;
      sprite.rotation = body.angle;
      sprite.scale.x = bodyRender.sprite.xScale || 1;
        sprite.scale.y = bodyRender.sprite.yScale || 1;

      // if (bodyRender.sprite.xScale)
      //   sprite.scale.x = bodyRender.sprite.xScale || 1;
      // else if(body.width || body.radiu)
      //   sprite.width = body.width || body.radius * 2;
      //
      // if (bodyRender.sprite.yScale)
      //   sprite.scale.y = bodyRender.sprite.yScale || 1;
      // else if(body.height || body.radius)
      //   sprite.height = body.height || body.radius * 2;

    } else {
      var primitiveId = 'p-' + body.id,
      primitive = render.primitives[primitiveId],
      container = render.container;

      // initialise body primitive if not existing
      if (!primitive) {
        primitive = render.primitives[primitiveId] = _createBodyPrimitive(render, body);
        primitive.initialAngle = body.angle;
      }

      // add to scene graph if not already there
      if (Common.indexOf(container.children, primitive) === -1)
      container.addChild(primitive);

      // update body primitive
      primitive.position.x = body.position.x;
      primitive.position.y = body.position.y;
      primitive.rotation = body.angle - primitive.initialAngle;
    }
  }
  staticBody(engine, body) {
    // console.log(body);
    var render = engine.render;
    var spriteId = 's-' + body.id;
    var sprite = render.sprites[spriteId],
    spriteContainer = render.spriteContainer;

    // initialise body sprite if not existing
    if (!sprite)
    sprite = render.sprites[spriteId] = _createNormalSprite(render, body);

    body.act.forEach(behavior => behavior.call(body, engine));

    sprite.position.x = body.x;
    sprite.position.y = body.y;

    // add to scene graph if not already there
    if (Common.indexOf(spriteContainer.children, sprite) === -1)
    spriteContainer.addChild(sprite);
    // bodyRender = body.render;
  }
}

var _createNormalSprite = function(render, body) {
  var bodyRender = body.render,
    texturePath = bodyRender.sprite.texture,
    texture = _getTexture(render, texturePath),
    sprite = new PIXI.Sprite(texture);

  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.width = body.width || body.radius;
  sprite.height = body.height || body.radius;

  return sprite;
};

var _createBodySprite = function(render, body) {
  var bodyRender = body.render,
    texturePath = bodyRender.sprite.texture,
    texture = _getTexture(render, texturePath),
    sprite = new PIXI.Sprite(texture);

  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  console.log(body);
  sprite.width = body.width || body.circleRadius * 2;
  sprite.height = body.height || body.circleRadius * 2;
  console.log('width', sprite.width, body.width, body.circleRadius * 2);

  return sprite;
};

var _createBodyPrimitive = function(render, body) {
  var bodyRender = body.render,
    options = render.options,
    primitive = new PIXI.Graphics(),
    fillStyle = Common.colorToNumber(bodyRender.fillStyle),
    strokeStyle = Common.colorToNumber(bodyRender.strokeStyle),
    strokeStyleIndicator = Common.colorToNumber(bodyRender.strokeStyle),
    strokeStyleWireframe = Common.colorToNumber('#bbb'),
    strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C'),
    part;

  primitive.clear();

  // handle compound parts
  for (var k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
    part = body.parts[k];

    if (!options.wireframes) {
      primitive.beginFill(fillStyle, 1);
      primitive.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
    } else {
      primitive.beginFill(0, 0);
      primitive.lineStyle(1, strokeStyleWireframe, 1);
    }

    primitive.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);

    for (var j = 1; j < part.vertices.length; j++) {
      primitive.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
    }

    primitive.lineTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);

    primitive.endFill();

    // angle indicator
    if (options.showAngleIndicator || options.showAxes) {
      primitive.beginFill(0, 0);

      if (options.wireframes) {
        primitive.lineStyle(1, strokeStyleWireframeIndicator, 1);
      } else {
        primitive.lineStyle(1, strokeStyleIndicator);
      }

      primitive.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
      primitive.lineTo(((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2 - body.position.x), ((part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2 - body.position.y));

      primitive.endFill();
    }
  }

  return primitive;
};

var _getTexture = function(render, imagePath) {
  var texture = render.textures[imagePath];

  if (!texture)
    texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);

  return texture;
};
