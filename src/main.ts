import * as PIXI from 'pixi.js';
import type { VecPair, Vec } from '@thi.ng/vectors/api'
import * as VECTORS from "@thi.ng/vectors";
import { DVMesh } from "@thi.ng/geom-voronoi";
import { v4 as uuidv4 } from 'uuid';
import {
  getRandomPoints,
  getUniqueEdges,
  getUniqueNodes,
  areThesePointsEquivalent,
  vecArrayToRawData,
  seededRandomNumberList,
} from './utils';
import { SpriteLoader } from './components/spriteloader/spriteloader';
import { Villager } from './components/actors/villager/villager';
import { Ward } from './components/mapZone/ward';
import { Village } from './components/mapZone/village';

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

// Generate a list of random points
const voronoiPoints = getRandomPoints(seed, 40, villageDimensions, { x: xOff, y: yOff });

// Generate the voronoi diagram
const mesh = new DVMesh(voronoiPoints);
const village = new Village("Evansville", "0", mesh, bounds);

let wards: Array<Ward> = [];

const wardNames = [[  "Amber",  "Green",  "Red",  "Yellow",  "Blue",  "White",  "Black",  "Gold",  "Silver",  "Bronze",  "Copper",  "Iron",  "Steel",  "Pearl",  "Emerald",  "Sapphire",  "Ruby", "Aldgate",  "Algate",  "Bassishaw",  "Bishopsgate",  "Bread",  "Broad",  "Cheap",  "Coleman",  "Cordwainer",  "Corn",  "Cripplegate",  "Farringdon",  "Fenchurch",  "Fetter",  "Gresham",  "Gropecunt",  "Lamb",  "Langbourn",  "Lime",  "Ludgate",  "Maiden",  "Newgate",  "Noble",  "Poultry",  "Tower",  "Vintry",  "Walbrook"],[  "Arcadia",  "Ashton",  "Baldwin",  "Belle",  "Briar",  "Brighton",  "Cedar",  "Coral",  "Ember",  "Finch",  "Garden",  "Harvest",  "Hazel",  "Heather",  "Holly"],[  "Meadow",  "Moor",  "Field",  "Glade",  "Grove",  "Wood",  "Ridge",  "Dell",  "Cove",  "Mountain",  "Falls",  "Spring",  "Stream",  "Lake",  "Forest",  "Valley"]]

mesh.voronoi(bounds).forEach((cell, i) => {
  let name ="";
  wardNames.forEach((list, j) => {
    name += list[seededRandomNumberList(seed+"village0ward"+i+"word"+j, 1, 0, list.length-1)[0]];
    if (j < wardNames.length-1 && j != 0) name += " ";
  })

  const newWard = new Ward(
    name,
    uuidv4(),
    cell
  );
  
  wards.push(newWard);
});

wards.forEach((ward) => {
  ward.calcStreets(bounds);
  ward.buildConnectionMatrix();
});
console.log(wards);


const streetCornersLookup: { [xLookup: number]: { [yLookup: number]: number}} = {};
village.intersections.forEach((corner, i) => {
  streetCornersLookup[corner[0]] = { [corner[1]]: i };
});

// Create a PIXI.Graphics object to draw the voronoi diagram
const graphics = new PIXI.Graphics();

//voronoiPoints.forEach((point) => {
//  graphics.lineStyle(1, 0x000000, 1);
//  graphics.drawCircle(point[0], point[1], 2);
//});

graphics.lineStyle(3, 0x777777);
graphics.drawRoundedRect(bounds[0][0], bounds[0][1], villageDimensions.width, villageDimensions.height, 40);

// Draw the ward streets
graphics.lineStyle(1, 0x303742, 0.2);
wards.forEach(ward => ward.streets.forEach((street) => {
  const nodeA = street[0];
  const nodeB = street[1];
  graphics.moveTo(nodeA[0], nodeA[1]);
  graphics.lineTo(nodeB[0], nodeB[1]);
}));
// Draw the main streets
graphics.lineStyle(8, 0x303742);
village.streets.forEach((street) => {
  const nodeA = street[0];
  const nodeB = street[1];
  graphics.moveTo(nodeA[0], nodeA[1]);
  graphics.lineTo(nodeB[0], nodeB[1]);
});

graphics.lineStyle(2, 0x303742);
mesh.edges(true).forEach((edge) => {
  graphics.moveTo(edge[0][0], edge[0][1]);
  graphics.lineTo(edge[1][0], edge[1][1]);
  //console.log(edge);
});


const text = new PIXI.Container;
village.intersections.forEach((point, i) => {
  graphics.lineStyle(1, 0x384252);
  graphics.beginFill(0x21262e);
  graphics.drawCircle(point[0], point[1], 8);
  graphics.endFill();

  const basicText = new PIXI.Text(i);
  basicText.x = point[0];
  basicText.y = point[1] + 10;

  //text.addChild(basicText);
});

wards.forEach((ward) => {
  const tx = new PIXI.Text(ward.name, { fontSize: 9, fontWeight: "800", fill: "0x1a1d24" });
  tx.x = ward.centroid[0] - (tx.width/2);
  tx.y = ward.centroid[1] - 15;
  text.addChild(tx);
  graphics.lineStyle(1, 0xc000f5);
  graphics.drawCircle(ward.centroid[0], ward.centroid[1], 1);
});

//Add the graphics to the stage
app.stage.addChild(graphics);
app.stage.addChild(text);

const spriteLoader = new SpriteLoader();
await spriteLoader.loadSpriteSheet();
const villagers: Array<Villager> = [];
for (let i = 0; i < population; i++) {
  const villager = new Villager(spriteLoader, village.intersections, village.connectionMatrix);
  villagers.push(villager);

  app.stage.addChild(villager.getSprites());
}


// Add a ticker callback to move the sprite back and forth
//let elapsed = 0.0;

app.ticker.add((delta: number) => {
  //elapsed += delta;
  villagers.forEach(v => v.update(delta));
  //sprite.x = 100.0 + Math.cos(elapsed/50.0) * 200.0;
});