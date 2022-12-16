import type { VecPair, Vec } from '@thi.ng/vectors/api'
import type { DVMesh } from '@thi.ng/geom-voronoi';
import { getUniqueNodes } from '../../utils';
import { MapZone } from "./mapzone";

export class Village extends MapZone {
  constructor(name: string, id: string, mesh: DVMesh<number>, bounds: Array<Array<number>>) {
      super(name, id);
      this.calcEdges(mesh, bounds);
      this.calcStreets(bounds);
      this._intersections = getUniqueNodes(this.edges);
      this.buildConnectionMatrix();

      console.log("Number of Streets:", this.streets.length);
      //console.log("Streets:", streets);
      console.log("number street corners", this.intersections.length);

      console.log("bigolMap size", this.connectionMatrix.length);
  }

  private calcEdges(mesh: DVMesh<number>, bounds: Array<Array<number>>) {
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