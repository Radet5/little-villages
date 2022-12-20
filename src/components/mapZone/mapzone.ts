import type { VecPair, Vec } from '@thi.ng/vectors/api'
import * as VECTORS from '@thi.ng/vectors';
import * as GEOM from '@thi.ng/geom';
import { getUniqueEdges, areThesePointsEquivalent } from '../../utils';
import { Vec2 } from '@thi.ng/vectors';

export enum LocationType {
  none,
  lot,
  ward,
  village,
}
export interface MapZoneInterface {
  name: string,
  id: string,
  boundaries: Array<Vec>,
  centroid: Vec,
  edges: Array<VecPair>,
  streets: Array<Array<Vec>>,
  intersections: Array<Vec>,
  connectionMatrix: Array<Array<number>>,
  intersectionLookup: { [xLookup: number]: { [yLookup: number]: number}};
  locationType: LocationType;
  getIntersectionPositionByIndex: (index: number) => Vec2;
}
export class MapZone implements MapZoneInterface {
  protected _name: string;
  protected _id: string;
  protected _boundaries: Array<Vec> = [];
  protected _edges: Array<VecPair> = [];
  protected _streets: Array<Array<Vec>> = [];
  protected _intersections: Array<Vec> = [];
  protected _connectionMatrix: Array<Array<number>> = [];
  protected _intersectionLookup: { [xLookup: number]: { [yLookup: number]: number}} = {}
  private _locationType: LocationType;

  constructor( name: string, id: string, locationType: LocationType ) {
    this._name = name;
    this._id = id;
    this._locationType = locationType;
  }

  get name() {return this._name;}
  get id() {return this._id;}
  get boundaries() {return this._boundaries;}
  get locationType() {return this._locationType;}

  get centroid() {
    let centroid: Vec = [];
    if (this._boundaries.length > 0) {
        const shape = new GEOM.Polygon(this._boundaries);
        centroid = GEOM.centroid(shape) || [] as Vec;
    }
    return centroid;
  }

  get edges() {return this._edges;}
  get streets() {return this._streets;}
  get intersections() {return this._intersections;}
  get connectionMatrix() {return this._connectionMatrix;}
  get intersectionLookup() {return this._intersectionLookup;}

  set name(name) {this._name = name}
  set id(id) {this._id = id}
  set boundaries(boundaries) {this._boundaries = boundaries.map(point => [Math.trunc(point[0]), Math.trunc(point[1])])}
  set intersections(intersections) {this._intersections = intersections}
  set connectionMatrix(connectionMatrix) {this._connectionMatrix = connectionMatrix}


  getIntersectionPositionByIndex(index: number) {
    const intersection = this._intersections[index];
    return new VECTORS.Vec2([intersection[0], intersection[1]]);
  }

  protected initIntersectionLookup() {
      this.intersections.forEach((corner, i) => {
        if (!this.intersectionLookup[corner[0]]) this.intersectionLookup[corner[0]] = {};
        const xMap = this.intersectionLookup[corner[0]];
        xMap[corner[1]] = i;
      });
  };

  public calcStreets(bounds?: Array<Vec>) {
    const uniqueEdges = getUniqueEdges(this.edges);
    if (bounds) {
        this._streets = uniqueEdges.filter(edge => this.filterOutBoundaryEdges(edge, bounds))
    } else {
        this._streets = uniqueEdges;
    }
  }

  buildConnectionMatrix() {
    this._connectionMatrix = this.intersections.map((fromCorner) => {
      return this.intersections.map(toCorner => {
        const connection = this.streets.find((street) => {
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
          return VECTORS.dist(fromCorner, toCorner);
        }
        return -1;
      });
    });
  }

  protected filterOutBoundaryEdges(edge: Array<Vec>, bounds: Array<Vec>) {
    const nodeA = edge[0];
    const nodeB = edge[1];
    const xMin = bounds[0][0];
    const yMin = bounds[0][1];
    const xMax = bounds[2][0];
    const yMax = bounds[2][1];
    if (nodeA[0] == nodeB[0] && (nodeA[0] == xMin || nodeA[0] == xMax)) return false;
    if (nodeA[1] == nodeB[1] && (nodeA[1] == yMin || nodeA[1] == yMax)) return false;
    return true;
  }
}