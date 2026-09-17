import * as PIXI from 'pixi.js';
import {
  getRandomPoints,
} from './utils';
import { SpriteLoader } from './components/spriteloader/spriteloader';
import { Villager } from './components/actors/villager/villager';
import { Village } from './components/mapZone/village';
import { MapRenderer } from './components/map-renderer/map-renderer';


main();

async function main() {
  // Create the application helper and add its render target to the page
  const seed = "bongo";
  const population = 29;
  const villageDimensions = { width: 1000, height: 820 };
  const xOff = 200;
  const yOff = 50;
  // The village is generated in fixed world coordinates. The stage is scaled to fit
  // whatever viewport we get, so generation never depends on the size of the screen.
  const world = {
    width: villageDimensions.width + xOff * 2,
    height: villageDimensions.height + yOff * 2,
  };
  const bounds = [
    [0+xOff, 0+yOff],
    [0+xOff, villageDimensions.height+yOff],
    [villageDimensions.width+xOff, villageDimensions.height+yOff],
    [villageDimensions.width+xOff, 0+yOff],
  ]
  let app = new PIXI.Application( {
    resizeTo: window,
    backgroundColor: 0x785534,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });
  document.body.appendChild(app.view as HTMLCanvasElement);

  // Scale the whole stage to fit the viewport, letterboxed and centred.
  function fitToViewport() {
    const scale = Math.min(window.innerWidth / world.width, window.innerHeight / world.height);
    app.stage.scale.set(scale);
    app.stage.position.set(
      (window.innerWidth - world.width * scale) / 2,
      (window.innerHeight - world.height * scale) / 2,
    );
  }
  fitToViewport();
  window.addEventListener('resize', fitToViewport);

  // Generate a list of random points
  const voronoiPoints = getRandomPoints(seed, 10, villageDimensions, { x: xOff, y: yOff });

  // Generate the voronoi diagram
  const village = new Village(seed, "Evansville", "0", voronoiPoints, bounds);

  // Create a PIXI.Graphics object to draw the voronoi diagram
  const graphics = new PIXI.Graphics();

  //voronoiPoints.forEach((point) => {
  //  graphics.lineStyle(1, 0x000000, 1);
  //  graphics.drawCircle(point[0], point[1], 2);
  //});

  const cityDrawing = new PIXI.Container();
  cityDrawing.interactive = true;

  cityDrawing.on('pointerdown', onClick);

  const mapRenderer = new MapRenderer();

  mapRenderer.drawVillage(graphics, village, bounds, villageDimensions);
  let text = mapRenderer.renderWardNames(village);
  //const numbers = mapRenderer.renderIntersectionNumbers(village);
  //text.addChild(numbers);

  cityDrawing.addChild(graphics);
  //Add the graphics to the stage
  app.stage.addChild(cityDrawing);
  app.stage.addChild(text);

  const spriteLoader = new SpriteLoader();
  await spriteLoader.loadSpriteSheet();
  const villagers: Array<Villager> = [];
  for (let i = 0; i < population; i++) {
    const villager = new Villager(spriteLoader, village);
    villagers.push(villager);

    app.stage.addChild(villager.getSprites());
  }

  function onClick(e: PIXI.FederatedPointerEvent) {
    // toLocal maps screen coordinates into stage coordinates, so this keeps
    // working at whatever scale and offset fitToViewport has applied.
    const point = app.stage.toLocal(e.global);
    village.addWard([point.x, point.y]);

    villagers.forEach(villager => {
      villager.refreshMapInfo();
    })
    graphics.clear();
    mapRenderer.drawVillage(graphics, village, bounds, villageDimensions);
    text.children.forEach((child) => child.destroy());
    text.removeChildren();
    text = mapRenderer.renderWardNames(village);
    //const numbers = mapRenderer.renderIntersectionNumbers(village);
    //text.addChild(numbers);
    app.stage.addChild(text);
  }


  // Add a ticker callback to move the sprite back and forth
  //let elapsed = 0.0;

  app.ticker.add((delta: number) => {
    //elapsed += delta;
    villagers.forEach(v => v.update(delta));
    //sprite.x = 100.0 + Math.cos(elapsed/50.0) * 200.0;
  });
};
