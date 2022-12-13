import type { Vec, VecPair } from '@thi.ng/vectors/api'
import { dist } from "@thi.ng/vectors";

export const range = (n: number, m = 0) =>
  Array(n)
    .fill(m)
    .map((i, j) => i + j);

//https://newbedev.com/seeding-the-random-number-generator-in-javascript
function xmur3(str: string) {
  for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)),
      (h = (h << 13) | (h >>> 19));
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

//Tommy Ettinger (tommy.ettinger@gmail.com) 2017 Public Domain
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seededRandomNumberList = (seed: string, length: number, min = 0, max = 100) => {
  const getSeed = xmur3(seed);
  const random = mulberry32(getSeed());
  return range(length).map(() => Math.floor(random() * (max - min) + min));
};

export function getRandomPoints(seed: string, numberOfPoints: number, canvasSize: { width: number, height: number }, offset: { x: number, y: number} = { x:0, y:0 }) {
  // Create an empty array to store the points
  const points = [];
  const xs = seededRandomNumberList(seed+'x', numberOfPoints, 0 + offset.x, canvasSize.width + offset.x)
  const ys = seededRandomNumberList(seed+'y', numberOfPoints, 0 + offset.y, canvasSize.height + offset.y)

  for (let i = 0; i < numberOfPoints; i++) {
      const x = xs[i];
      const y = ys[i];

      // Add the point to the array
      points.push([x, y]);
  }

  // Return the array of points
  return points;
}

export function areThesePointsEquivalent(pointA: Vec, pointB: Vec) {
  return pointA[0] == pointB[0] && pointA[1] == pointB[1];
};

export function areTheseEdgesEquivalent(edgeA: VecPair, edgeB: VecPair) {
  if (areThesePointsEquivalent(edgeA[0], edgeB[0]) || areThesePointsEquivalent(edgeA[0], edgeB[1])) {
    if (areThesePointsEquivalent(edgeA[1], edgeB[0]) || areThesePointsEquivalent(edgeA[1], edgeB[1])) {
      return true
    }
  }
  return false;
};

export function getUniqueEdges(edges: Array<VecPair>) {
  const uniqueEdges: Array<VecPair> = [];

  // Loop through the array of edges
  edges.forEach((edge) => {

    // Check if the edge already exists in the array of unique edges
    if (!uniqueEdges.some(uniqueEdge => areTheseEdgesEquivalent(uniqueEdge, edge))) {
      // If it doesn't, add it to the array of unique edges
      uniqueEdges.push(edge);
    }
  });

  return uniqueEdges;
}

export function getUniqueNodes(edges: Array<VecPair>) {
  const uniqueNodes: Array<Vec> = [];

  // Loop through the array of edges
  edges.forEach((edge) => {
    // Check if the first node of the edge already exists in the array of unique nodes
    if (!uniqueNodes.some(node => areThesePointsEquivalent(node, edge[0]))) {
      // If it doesn't, add it to the array of unique nodes
      uniqueNodes.push(edge[0]);
    }

    // Check if the second node of the edge already exists in the array of unique nodes
    if (!uniqueNodes.some(node => areThesePointsEquivalent(node, edge[1]))) {
      // If it doesn't, add it to the array of unique nodes
      uniqueNodes.push(edge[1]);
    }
  });

  return uniqueNodes;
}

export function shortestPath(start: number, end: number, map: number[][], nodes?: Array<Vec>): number[] {
  const vistedNodes: Array<number> = [];
  const distances = map.map(() => { 
    return Infinity;
  });
  const previous = map.map(() => { 
    return -1;
  });

  let currentNode = start;
  //distances[distances.findIndex((entry) => entry.nodeIndex == currentNode)].distance = 0;
  distances[currentNode] = 0;

  let i = 1;
  while (i <= map.length) {
    vistedNodes.push(currentNode);
    const adjacentNodes: Array<number> = [];
    const currentNodeMap = map[currentNode];
    currentNodeMap.forEach((distance, index) => {
      if(distance > -1) {
        adjacentNodes.push(index);
      }
    });

    //console.log(currentNode, ' => ', adjacentNodes);

    adjacentNodes.forEach((nodeIndex) => {
      const existingTotalDistance = distances[nodeIndex];
      const immediateDistance = currentNodeMap[nodeIndex];
      const proposedTotalDistance = immediateDistance + distances[currentNode];

      if (existingTotalDistance > proposedTotalDistance) {
        distances[nodeIndex] = proposedTotalDistance;
        previous[nodeIndex] = currentNode;
      }
    })

    //pick newsxt
    let nextNode = -1;
    distances.forEach((distance, nodeIdex) => {
      if (!vistedNodes.includes(nodeIdex)) {
        if (nodes) {
          if (nextNode == -1 || distance + dist(nodes[nodeIdex], nodes[end]) < distances[nextNode] + dist(nodes[nextNode], nodes[end])) {
            nextNode = nodeIdex
          }
        } else {
          if (nextNode == -1 || distance < distances[nextNode]) {
            nextNode = nodeIdex
          }
        }
      }
    });

    if (currentNode == end) break;

    currentNode = nextNode;
    i++;

  }

  //console.log("Steps taken:", i);

  const path: Array<number> = [];

  while (currentNode != -1) {
    path.push(currentNode);
    currentNode = previous[currentNode];
  }

  //console.log("Total Distance", distances[end]);

  return path.reverse();
}
