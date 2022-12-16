import * as GEOM from '@thi.ng/geom';
import * as VECTORS from '@thi.ng/vectors';
import { sutherlandHodgeman } from '@thi.ng/geom-clip-poly';
import { distanceFromLineToPoint, getUniqueNodes } from '../../utils';
import type { VecPair, Vec } from '@thi.ng/vectors/api'
import { OMBBFinder } from '../ombb-finder/ombb-finder';
import { MapZone } from "./mapzone";

export class Ward extends MapZone {
  private ombbFinder: OMBBFinder;
  private _maxSubdivArea;
  constructor(name: string, id: string, points: Array<Vec>, maxSubDivArea: number) {
    super(name, id);
    this.ombbFinder = new OMBBFinder();
    this._maxSubdivArea = maxSubDivArea;

    this.boundaries = points;

    const shape = new GEOM.Polygon(points);
    const {subDivisions} = this.recursiveSubDiv(shape, this._maxSubdivArea);
    this.calcEdges(subDivisions);
    this._intersections = getUniqueNodes(this.edges);
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

  private recursiveSubDiv(shape: GEOM.Polygon, maxSubDivArea: number): {subDivisions: Array<Array<Vec>>, bisectingLines: Array<Array<Vec>>} {
    const {subDivisions, bisectingLine} = this.subDivide(shape);
    let subDivisionsA: Array<Array<Vec>> = [];
    let bisectionsA: Array<Array<VECTORS.ReadonlyVec>> = [];
    const shapeA = new GEOM.Polygon(subDivisions[0]);
    const sizeA = GEOM.area(shapeA);
    if (sizeA > maxSubDivArea) {
      const results = this.recursiveSubDiv(shapeA, maxSubDivArea);
      subDivisionsA = results.subDivisions;
      bisectionsA = results.bisectingLines;
    }
    let subDivisionsB: Array<Array<Vec>> = [];
    let bisectionsB: Array<Array<VECTORS.ReadonlyVec>> = [];
    const shapeB = new GEOM.Polygon(subDivisions[1]);
    const sizeB = GEOM.area(shapeB);
    if (sizeB > maxSubDivArea) {
      const results = this.recursiveSubDiv(shapeB, maxSubDivArea);
      subDivisionsB = results.subDivisions;
      bisectionsB = results.bisectingLines;
    }

    return {subDivisions: [
      ...subDivisions,
      ...subDivisionsA,
      ...subDivisionsB
    ], bisectingLines: [
      bisectingLine,
      ...bisectionsA,
      ...bisectionsB
    ]}
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

  private subDivide(shape: GEOM.Polygon) {
    const line = this.findBisectingLine(shape);
    let clippedLine = sutherlandHodgeman(line.points, shape.points);
    if (!clippedLine[0]) {
        console.log("line", line)
        console.log("clipshape", shape)
        console.log("cl", clippedLine)
        throw("clipping bisection line to shape failed");
    }

    let subDivisions: Array<Array<Vec>> = [[], []];
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

    //Find subdiv 0
    let i = subDivIndices[0];
    subDivisions[0].push(shape.points[i]);
    subDivisions[0].push(clippedLine[0]);
    subDivisions[0].push(clippedLine[1]);
    i = subDivIndices[1] + 1;
    if (i >= shape.points.length) i = 0;
    let end = subDivIndices[0];
    while (i != end) {
      subDivisions[0].push(shape.points[i]);
      i++;
      if (i == shape.points.length) i = 0;
      if (i > 20) {
        console.error(end, i);
        throw("Cannot subdivide")
        break;
      }
    }

    //Find subdiv 1
    i = subDivIndices[1];
    subDivisions[1].push(shape.points[i]);
    subDivisions[1].push(clippedLine[1]);
    subDivisions[1].push(clippedLine[0]);
    i = subDivIndices[0] + 1;
    if (i >= shape.points.length) i = 0;
    end = subDivIndices[1];
    while (i != end) {
      subDivisions[1].push(shape.points[i]);
      i++;
      if (i == shape.points.length) i = 0;
      if (i > 20) {
        console.error(end, i);
        break;
      }
    }

    return {bisectingLine: [clippedLine[0], clippedLine[1]], subDivisions};
  }
}
