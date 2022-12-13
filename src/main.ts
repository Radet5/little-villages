import * as PIXI from 'pixi.js';
import type { VecPair } from '@thi.ng/vectors/api'
import { dist, direction, Vec2 } from "@thi.ng/vectors";
import { DVMesh } from "@thi.ng/geom-voronoi";
import { getRandomPoints, getUniqueEdges, getUniqueNodes, areThesePointsEquivalent, shortestPath } from './utils';

import spriteIMG from './assets/sprites/4 Woman/Woman.png';

// Create the application helper and add its render target to the page
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
  backgroundColor: 0x1099bc,
  antialias: true,
});
document.body.appendChild(app.view as HTMLCanvasElement);

// Generate a list of random points
const voronoiPoints = getRandomPoints("bongo", 40, villageDimensions, { x: xOff, y: yOff });

//voronoiPoints.forEach((point) => {
//  graphics.lineStyle(1, 0x000000, 1);
//  graphics.drawCircle(point[0], point[1], 2);
//});

// Generate the voronoi diagram
const mesh = new DVMesh(voronoiPoints);
const edges =  mesh.edges(true, [bounds[0], bounds[2]]).map((edge) => {
  return [
    [
      Math.trunc(edge[0][0]),
      Math.trunc(edge[0][1])
    ], [
      Math.trunc(edge[1][0]),
      Math.trunc(edge[1][1])
    ]
  ] as VecPair;
});

const streets = getUniqueEdges(edges).filter((edge) => {
  //remove boundary edges
  const nodeA = edge[0];
  const nodeB = edge[1];
  const xMin = bounds[0][0];
  const yMin = bounds[0][1];
  const xMax = bounds[2][0];
  const yMax = bounds[2][1];
  if (nodeA[0] == nodeB[0] && (nodeA[0] == xMin || nodeA[0] == xMax)) return false;
  if (nodeA[1] == nodeB[1] && (nodeA[1] == yMin || nodeA[1] == yMax)) return false;
  return true;
});
const streetCorners = getUniqueNodes(streets);

console.log("Number of Streets:", streets.length);
//console.log("Streets:", streets);
console.log("number street corners", streetCorners.length);

const streetCornersLookup: { [xLookup: number]: { [yLookup: number]: number}} = {};
streetCorners.forEach((corner, i) => {
  streetCornersLookup[corner[0]] = { [corner[1]]: i };
});

const villageMap: Array<Array<number>> = streetCorners.map((fromCorner) => {
  return streetCorners.map(toCorner => {
    const connection = streets.find((street) => {
      if(areThesePointsEquivalent(street[0], fromCorner)) {
        if(areThesePointsEquivalent(street[1], toCorner)) {
          return true;
        }
      } else if(areThesePointsEquivalent(street[1], fromCorner)) {
        if(areThesePointsEquivalent(street[0], toCorner)) {
          return true
        }
      }
      return false;
    });
    if (connection) {
      return dist(fromCorner, toCorner);
    }
    return -1;
  });
});

console.log("bigolMap size", villageMap.length);

// Create a PIXI.Graphics object to draw the voronoi diagram
const graphics = new PIXI.Graphics();

graphics.lineStyle(3, 0x777777);
graphics.drawRoundedRect(bounds[0][0], bounds[0][1], villageDimensions.width, villageDimensions.height, 40);

// Draw the streets
graphics.lineStyle(8, 0x99431f);
streets.forEach((street) => {
  const nodeA = street[0];
  const nodeB = street[1];
  graphics.moveTo(nodeA[0], nodeA[1]);
  graphics.lineTo(nodeB[0], nodeB[1]);
});

graphics.lineStyle(2, 0x99431f);
mesh.edges(true).forEach((edge) => {
  graphics.moveTo(edge[0][0], edge[0][1]);
  graphics.lineTo(edge[1][0], edge[1][1]);
  //console.log(edge);
});


const text = new PIXI.Container;
streetCorners.forEach((point, i) => {
  graphics.lineStyle(1, 0xcc5a2a);
  graphics.beginFill(0x99431f);
  graphics.drawCircle(point[0], point[1], 8);
  graphics.endFill();

  const basicText = new PIXI.Text(i);
  basicText.x = point[0];
  basicText.y = point[1] + 10;

  text.addChild(basicText);
});

const startIndex = Math.trunc(Math.random() * streetCorners.length);
const endIndex = Math.trunc(Math.random() * streetCorners.length);
const startNode = streetCorners[startIndex];
const endNode = streetCorners[endIndex];
graphics.beginFill(0x22aa22);
graphics.drawCircle(startNode[0], startNode[1], 4);
graphics.endFill();

graphics.beginFill(0x2222aa);
graphics.drawCircle(endNode[0], endNode[1], 4);
graphics.endFill();

const path = shortestPath(startIndex, endIndex, villageMap, streetCorners);
console.log(path);

graphics.lineStyle(2, 0x8888ff);
path.forEach((nodeIndex, i) => {
  const node = streetCorners[nodeIndex];
  if (i == 0) graphics.moveTo(node[0], node[1])
  else graphics.lineTo(node[0], node[1]);
})

//Add the graphics to the stage
app.stage.addChild(graphics);
app.stage.addChild(text);

// Create the sprite and add it to the stage
let sprite = PIXI.Sprite.from(spriteIMG);
sprite.width = 30;
sprite.height = 30;
sprite.anchor.set(0.3, 0.7);
sprite.position.x = startNode[0];
sprite.position.y = startNode[1];
app.stage.addChild(sprite);

// Add a ticker callback to move the sprite back and forth
//let elapsed = 0.0;

let targetIndex = 1;
app.ticker.add(() => {
  //elapsed += delta;
  const position = new Vec2([sprite.position.x, sprite.position.y]);
  const dir = new Vec2;
  const distanceToTarget = dist(position, streetCorners[path[targetIndex]])
  direction(dir, position, streetCorners[path[targetIndex]]);
  sprite.position.x += dir.buf[0];
  sprite.position.y += dir.buf[1];
  if (distanceToTarget < 1) {
    if (targetIndex < path.length - 1) targetIndex++;
    else {
      targetIndex = 0;
      path.reverse();
    }
  }
  //sprite.x = 100.0 + Math.cos(elapsed/50.0) * 200.0;
});