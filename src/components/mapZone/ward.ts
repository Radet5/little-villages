import * as GEOM from '@thi.ng/geom';
import * as VECTORS from '@thi.ng/vectors';
import { sutherlandHodgeman } from '@thi.ng/geom-clip-poly';
import { distanceFromLineToPoint, getUniqueNodes, getUniqueEdges } from '../../utils';
import type { VecPair, Vec } from '@thi.ng/vectors/api'
import { OMBBFinder } from '../ombb-finder/ombb-finder';
import { MapZone, LocationType } from "./mapzone";

export class Ward extends MapZone {
  private ombbFinder: OMBBFinder;
  private _lots: Array<Array<Vec>>;
  private _maxSubdivArea;
  constructor(name: string, id: string, points: Array<Vec>, maxSubDivArea: number) {
    super(name, id, LocationType.ward);
    this.ombbFinder = new OMBBFinder();
    this._maxSubdivArea = maxSubDivArea;

    this.boundaries = points;

    const shape = new GEOM.Polygon(points);
    const subDivisions = this.subDivide(shape, this._maxSubdivArea);
    this._lots = subDivisions.map(sub => sub.map(edge => [Math.trunc(edge[0]), Math.trunc(edge[1])]));
    this.calcEdges(this.lots);
    this._intersections = getUniqueNodes(this.edges);
    this.initIntersectionLookup();
  }

  get lots() {return this._lots;}

  getLotCount() {return this._lots.length;}
  getLot(index: number) {return this.lots[index];}

  public calcStreets(bounds?: Array<Vec>) {
    const uniqueEdges = getUniqueEdges(this.edges);
    if (bounds) {
      this._streets = uniqueEdges.filter(edge => this.filterOutBoundaryEdges(edge, bounds))
    } else {
      this._streets = uniqueEdges;
    }
    //Sub division of wards causes streets to be double-mapped. This fixes that for many cases.
    let alreadySeen: Array<number> = [];
    let indicies: Array<Array<number>> = [];
    this.streets.forEach((outerStreet,i) => {
      indicies[i] = [];
      this.streets.forEach((street,j) => {
        if (distanceFromLineToPoint(outerStreet, street[0]) == 0 && distanceFromLineToPoint(outerStreet, street[1]) == 0) {
          if (i != j && !alreadySeen.includes(j)) {
            if (i > j) {
              if (!indicies[j].includes(i)) {
                alreadySeen.push(j);
                indicies[i].push(j);
              }
            } else {
              alreadySeen.push(j);
              indicies[i].push(j);
            }
          }
        }
      });
    });
    if (indicies.length > 0) {
      let indiciesToRemove: Array<number> = [];
      let segsToAdd: Array<Array<Vec>> = [];
      indicies.forEach((indexArr,i) => {
        if (indexArr.length > 0) {
          let curIndicies: Array<number> = [];
          let streets = [this.streets[i]]
          indiciesToRemove.push(i);
          indexArr.forEach((index) => {
            streets.push(this.streets[index]);
            curIndicies.push(index);
          });
          //console.log(streets);
          const x = streets[0][0][0];
          const y = streets[0][0][1];
          const points = getUniqueNodes(streets as Array<VecPair>);
          //check by all vert vs hor
          if (streets.every((street => street[0][0] == x && street[1][0] == x))) {
            //arrange points in order and then create new segments all along the total length.
            points.sort((pointA, pointB) => pointA[1] - pointB[1]);
          } else if (streets.every((street => street[0][1] == y && street[1][1] == y))) {
            //arrange points in order and then create new segments all along the total length.
            points.sort((pointA, pointB) => pointA[0] - pointB[0]);
          } else {
            points.sort((pointA, pointB) => pointA[0] - pointB[0]);
          }
          //console.log(points);
          //add these new segs to an array
          points.forEach((point,k) => {
            if (k < points.length - 1) {
              segsToAdd.push([point, points[k+1]]);
            }
          })
          //mark down segments to be deleted
          indiciesToRemove = [...indiciesToRemove, ...curIndicies];
        }
      });
      //sort to be deleted indicies and removes the largest to smallest
      indiciesToRemove.sort((a,b) => b - a);
      indiciesToRemove.forEach(index => this.streets.splice(index,1));
      //add new segments
      segsToAdd.forEach((segment) => this.streets.push(segment));
    }
  }

  private calcEdges(subDivisions: Array<Array<Vec>>) {
    const wardEdges: Array<VecPair> = [];
    subDivisions.forEach((subDivPoints) => {
      const subDiv = new GEOM.Polygon(subDivPoints);
      for (const edge of GEOM.edges(subDiv)) {
        wardEdges.push(
          [
            [
              Math.trunc(edge[0][0]),
              Math.trunc(edge[0][1])
            ], [
              Math.trunc(edge[1][0]),
              Math.trunc(edge[1][1])
            ]
          ] as VecPair
        );
      }
    });

    this._edges = wardEdges;
  }

  private findBisectingLine(shape: GEOM.Polygon) {
    const ombb = this.ombbFinder.calcOMBB(shape.points);
    let pointA: VECTORS.Vec, pointB:VECTORS.Vec;
    if (VECTORS.dist(ombb[0], ombb[1]) > VECTORS.dist(ombb[1], ombb[2])) {//wide
      //graphics.lineStyle(2, 0xaaffaa, 1);
      pointA = VECTORS.divN(null, VECTORS.add2(null, ombb[0], ombb[1]), 2);
      pointB = VECTORS.divN(null, VECTORS.add2(null, ombb[3], ombb[2]), 2);
    } else {//tall
      //graphics.lineStyle(2, 0xffaaaa, 1);
      pointA = VECTORS.divN(null, VECTORS.add2(null, ombb[0], ombb[3]), 2);
      pointB = VECTORS.divN(null, VECTORS.add2(null, ombb[1], ombb[2]), 2);
    }
    return new GEOM.Line([pointA, pointB]);
  }

  private subDivide(shape: GEOM.Polygon, maxSubDivArea: number) {
    const line = this.findBisectingLine(shape);
    let clippedLine = sutherlandHodgeman(line.points, shape.points);
    if (!clippedLine[0]) {
        console.log("line", line)
        console.log("clipshape", shape)
        console.log("cl", clippedLine)
        throw("clipping bisection line to shape failed");
    }

    let subDivIndices: Array<number> = [];
    let subDivDistances: Array<number> = [Infinity, Infinity];
    //Find which edges are touching the bisecting line
    shape.points.forEach((pointA, i) => {
      let pointB: VECTORS.Vec;
      if (i < shape.points.length - 1) pointB = shape.points[i+1];
      else pointB = shape.points[0];

      const edge = [pointA, pointB];
      let distance = distanceFromLineToPoint(edge, clippedLine[0]);
      if (distance < subDivDistances[0]) {
        subDivIndices[0] = i;
        subDivDistances[0] = distance;
      }
      distance = distanceFromLineToPoint(edge, clippedLine[1]);
      if (distance < subDivDistances[1]) {
        subDivIndices[1] = i;
        subDivDistances[1] = distance;
      }
    });

    //console.log("splitIndicies", subDivIndices);

    //Find subdiv A
    let subDivA: Array<Vec> = [];
    let i = subDivIndices[0];
    subDivA.push(shape.points[i]);
    subDivA.push(clippedLine[0]);
    subDivA.push(clippedLine[1]);
    i = subDivIndices[1] + 1;
    if (i >= shape.points.length) i = 0;
    let end = subDivIndices[0];
    while (i != end) {
      subDivA.push(shape.points[i]);
      i++;
      if (i == shape.points.length) i = 0;
      if (i > 20) {
        console.error(end, i);
        throw("Cannot subdivide")
        break;
      }
    }

    let branchA: Array<Array<Vec>>;
    const shapeA = new GEOM.Polygon(subDivA);
    const sizeA = GEOM.area(shapeA);
    if (sizeA > maxSubDivArea) {
      branchA = this.subDivide(shapeA, maxSubDivArea);
    } else {
        branchA = [subDivA];
    }

    //Find subdiv B
    let subDivB: Array<Vec> = [];
    i = subDivIndices[1];
    subDivB.push(shape.points[i]);
    subDivB.push(clippedLine[1]);
    subDivB.push(clippedLine[0]);
    i = subDivIndices[0] + 1;
    if (i >= shape.points.length) i = 0;
    end = subDivIndices[1];
    while (i != end) {
      subDivB.push(shape.points[i]);
      i++;
      if (i == shape.points.length) i = 0;
      if (i > 20) {
        console.error(end, i);
        break;
      }
    }

    let branchB: Array<Array<Vec>>;
    const shapeB = new GEOM.Polygon(subDivB);
    const sizeB = GEOM.area(shapeB);
    if (sizeB > maxSubDivArea) {
      branchB = this.subDivide(shapeB, maxSubDivArea);
    } else {
        branchB = [subDivB];
    }

    return [...branchA, ...branchB];
  }
}
