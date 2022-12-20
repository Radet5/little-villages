import * as PIXI from 'pixi.js';
import {
  getRandomPoints,
} from './utils';
import { SpriteLoader } from './components/spriteloader/spriteloader';
import { Villager } from './components/actors/villager/villager';
import { Village } from './components/mapZone/village';
import { MapRenderer } from './components/map-renderer/map-renderer';

import { Viewport } from 'pixi-viewport';

main();

async function main() {
  // Create the application helper and add its render target to the page
  const seed = "bongo";
  const population = 29;
  const villageDimensions = { width: 1000, height: 820 };
  const resolution = { width: 1380, height: 920 };
  const xOff = 200;
  const yOff = 50;
  const bounds = [
    [0+xOff, 0+yOff],
    [0+xOff, villageDimensions.height+yOff],
    [villageDimensions.width+xOff, villageDimensions.height+yOff],
    [villageDimensions.width+xOff, 0+yOff],
  ]
  let app = new PIXI.Application( {
    ...resolution,
    backgroundColor: 0x785534,
    antialias: true,
  });
  document.body.appendChild(app.view as HTMLCanvasElement);

  const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: resolution.width,
    worldHeight: resolution.height,

    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  });

  // add the viewport to the stage
  app.stage.addChild(viewport)

  // activate plugins
  viewport
      .drag()
      .pinch()
      .wheel()

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
  //cityDrawing.interactive = true;

  //cityDrawing.on('pointerdown', onClick);

  const mapRenderer = new MapRenderer();

  mapRenderer.drawVillage(graphics, village, bounds, villageDimensions);
  let text = mapRenderer.renderWardNames(village);
  //const numbers = mapRenderer.renderIntersectionNumbers(village);
  //text.addChild(numbers);

  cityDrawing.addChild(graphics);
  //Add the graphics to the stage
  viewport.addChild(cityDrawing);
  viewport.addChild(text);

  const spriteLoader = new SpriteLoader();
  await spriteLoader.loadSpriteSheet();
  const villagers: Array<Villager> = [];
  for (let i = 0; i < population; i++) {
    const villager = new Villager(spriteLoader, village);
    villagers.push(villager);

    viewport.addChild(villager.getSprites());
  }

  function onClick(e: PIXI.FederatedPointerEvent) {
    console.log(e);
    if (app.view.getBoundingClientRect) {
      const rect = app.view.getBoundingClientRect()
      const xPos = e.client.x - rect.x;
      const yPos = e.client.y - rect.y;
      console.log(xPos, yPos);
      village.addWard([xPos, yPos]);

      villagers.forEach(villager => {
        villager.refreshMapInfo();
      })
    }
    graphics.clear();
    mapRenderer.drawVillage(graphics, village, bounds, villageDimensions);
    text.children.forEach((child) => child.destroy());
    text.removeChildren();
    text = mapRenderer.renderWardNames(village);
    //const numbers = mapRenderer.renderIntersectionNumbers(village);
    //text.addChild(numbers);
    viewport.addChild(text);
  }


  // Add a ticker callback to move the sprite back and forth
  //let elapsed = 0.0;

  app.ticker.add((delta: number) => {
    //elapsed += delta;
    villagers.forEach(v => v.update(delta));
    //sprite.x = 100.0 + Math.cos(elapsed/50.0) * 200.0;
  });
};
