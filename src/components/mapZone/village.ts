import type { Vec, VecPair } from '@thi.ng/vectors/api'
import { v4 as uuidv4 } from 'uuid';
import { DVMesh } from '@thi.ng/geom-voronoi';
import { getUniqueNodes, seededRandomNumberList } from '../../utils';
import { MapZone, LocationType } from "./mapzone";
import { Ward } from './ward';

const wardNames = [[  "Amber",  "Green",  "Red",  "Yellow",  "Blue",  "White",  "Black",  "Gold",  "Silver",  "Bronze",  "Copper",  "Iron",  "Steel",  "Pearl",  "Emerald",  "Sapphire",  "Ruby", "Aldgate",  "Algate",  "Bassishaw",  "Bishopsgate",  "Bread",  "Broad",  "Cheap",  "Coleman",  "Cordwainer",  "Corn",  "Cripplegate",  "Farringdon",  "Fenchurch",  "Fetter",  "Gresham",  "Gropecunt",  "Lamb",  "Langbourn",  "Lime",  "Ludgate",  "Maiden",  "Newgate",  "Noble",  "Poultry",  "Tower",  "Vintry",  "Walbrook"],[  "Arcadia",  "Ashton",  "Baldwin",  "Belle",  "Briar",  "Brighton",  "Cedar",  "Coral",  "Ember",  "Finch",  "Garden",  "Harvest",  "Hazel",  "Heather",  "Holly"],[  "Meadow",  "Moor",  "Field",  "Glade",  "Grove",  "Wood",  "Ridge",  "Dell",  "Cove",  "Mountain",  "Falls",  "Spring",  "Stream",  "Lake",  "Forest",  "Valley"]]

export class Village extends MapZone {
  private _mesh: DVMesh<number>;
  private _wards: Array<Ward> = [];
  protected _intersectionLookup: { [xLookup: number]: { [yLookup: number]: number}} = {}
  protected _seed;
  constructor(seed: string, name: string, id: string, points: Array<Array<number>>, bounds: Array<Array<number>>) {
      super(name, id, LocationType.village);
      this._seed = seed;
      this.boundaries = bounds;
      this._mesh = new DVMesh(points);
      this.buildVillage();
  }

  get mesh() {return this._mesh}
  get seed() {return this._seed;}
  get wards() {return this._wards;}
  get intersectionLookup() {return this._intersectionLookup;}

  addWard(point: Array<number>) {
    this._mesh.add(point);
    this.buildVillage();
  }

  getWardById(id: string) {return this.wards.find(ward => ward.id == id);}
  getRandomWardId() {return this.wards[Math.trunc(Math.random()*(this.wards.length-1))].id;}
  getRandomWard() {return this.getWardById(this.getRandomWardId());}

  private buildVillage() {
      this.calcEdges(this.mesh, this.boundaries);
      this.calcStreets(this.boundaries);
      this._intersections = getUniqueNodes(this.edges);
      this.initIntersectionLookup();
      this.buildConnectionMatrix();

      console.log("Number of Streets:", this.streets.length);
      //console.log("Streets:", streets);
      console.log("number street corners", this.intersections.length);
      console.log("bigolMap size", this.connectionMatrix.length);
      this.buildWards();
      console.log(this);
  }

  private buildWards() {
    this._wards = [];
    this.mesh.voronoi(this._boundaries).forEach((cell, i) => {
      let name ="";
      wardNames.forEach((list, j) => {
        name += list[seededRandomNumberList(this._seed+this.name+"ward"+i+"word"+j, 1, 0, list.length-1)[0]];
        if (j < wardNames.length-1 && j != 0) name += " ";
      })

      const wardCount = this.mesh.voronoi(this._boundaries).length
      //the following area constants should eventually be determined by the village area
      const maxSubDivArea = Math.max(3000, 80000/wardCount);
      console.log(maxSubDivArea);
      const newWard = new Ward(
        name,
        seededRandomNumberList(this._seed+this.name+"ward"+i, 10).join(""),
        cell,
        maxSubDivArea,
      );

      this._wards.push(newWard);
    });

    this._wards.forEach((ward) => {
      ward.calcStreets(this.boundaries);
      ward.buildConnectionMatrix();
    });
    //console.log(this._wards);
  }

  private calcEdges(mesh: DVMesh<number>, bounds: Array<Vec>) {
    this._edges =  mesh.edges(true, [bounds[0], bounds[2]]).map((edge) => {
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
  }
}