import { Vec } from '@thi.ng/vectors';
//  Adapted from David Geier's Rotating Calipers Iplementation
//  https://geidav.wordpress.com/2014/01/23/computing-oriented-minimum-bounding-boxes-in-2d/
//  https://github.com/geidav/ombb-rotating-calipers

const ON = 0;
const LEFT = 1;
const RIGHT = 2;
const ALMOST_ZERO = 0.00001;

export class OMBBFinder {
    public calcOMBB(points: Array<Vec>): Array<Vec> {
        const convexHull = this.CalcConvexHull(points.map(point => new Vector(point)));
        const oobb = CalcOmbb(convexHull); // draws OOBB candidates
        return oobb.map(point => [point.x, point.y]);
    }

    private GetSideOfLine(lineStart: Vector, lineEnd: Vector, point: Vector) {
        const d = (lineEnd.x-lineStart.x)*(point.y-lineStart.y)-(lineEnd.y-lineStart.y)*(point.x-lineStart.x);
        return (d > ALMOST_ZERO ? LEFT : (d < -ALMOST_ZERO ? RIGHT : ON));
    }

    // returns convex hull in CW order
    // (required by Rotating Calipers implementation)
    private CalcConvexHull(points: Array<Vector>) {
        // bad input?
        if (points.length < 3)
            return points;

        // find first hull point
        let hullPt = points[0];
        const convexHull = [];

        for (let i=1; i<points.length; i++) {
            // perform lexicographical compare
            if (points[i].x < hullPt.x)
                hullPt = points[i];
            else if (Math.abs(points[i].x-hullPt.x) < ALMOST_ZERO) // equal
                if (points[i].y < hullPt.y)
                    hullPt = points[i];
        }

        // find remaining hull points
        let endPt = points[0];
        do {
            convexHull.unshift(hullPt.clone());
            endPt = points[0];

            for (let j=1; j<points.length; j++) {
                const side = this.GetSideOfLine(hullPt, endPt, points[j]);

                // in case point lies on line take the one further away.
                // this fixes the collinearity problem.
                if (endPt.equals(hullPt) || (side == LEFT || (side == ON && hullPt.distance(points[j]) > hullPt.distance(endPt))))
                    endPt = points[j];
            }

            hullPt = endPt;
        } while (!endPt.equals(convexHull[convexHull.length-1]));

        return convexHull;
    }
}


function IntersectLines(start0: Vector, dir0: Vector, start1: Vector, dir1: Vector) {
    const dd = dir0.x*dir1.y-dir0.y*dir1.x;
    // dd=0 => lines are parallel. we don't care as our lines are never parallel.
    const dx = start1.x-start0.x;
    const dy = start1.y-start0.y;
    const t = (dx*dir1.y-dy*dir1.x)/dd;
    return new Vector([start0.x+t*dir0.x, start0.y+t*dir0.y]);
}

// computes the minimum area enclosing rectangle
// (aka oriented minimum bounding box)
function CalcOmbb(convexHull: Array<Vector>) {
    // initialize attributes
    let BestObbArea = Number.MAX_VALUE;
    let BestObb: Array<Vector> = [];

    const UpdateOmbb = function(leftStart: Vector, leftDir: Vector, rightStart: Vector, rightDir: Vector, topStart: Vector, topDir: Vector, bottomStart: Vector, bottomDir: Vector) {
        const obbUpperLeft = IntersectLines(leftStart, leftDir, topStart, topDir);
        const obbUpperRight = IntersectLines(rightStart, rightDir, topStart, topDir);
        const obbBottomLeft = IntersectLines(bottomStart, bottomDir, leftStart, leftDir);
        const obbBottomRight = IntersectLines(bottomStart, bottomDir, rightStart, rightDir);
        const distLeftRight = obbUpperLeft.distance(obbUpperRight);
        const distTopBottom = obbUpperLeft.distance(obbBottomLeft);
        const obbArea = distLeftRight*distTopBottom;

        if (obbArea < BestObbArea) {
            BestObb = [obbUpperLeft, obbBottomLeft, obbBottomRight, obbUpperRight];
            BestObbArea = obbArea;
        }

    }

    // compute directions of convex hull edges
    const edgeDirs = [];

    for (let i=0; i<convexHull.length; i++) {
        edgeDirs.push(convexHull[(i+1)%convexHull.length].diff(convexHull[i]));
        edgeDirs[i].normalize();
    }

    // compute extreme points
    const minPt = new Vector([Infinity, Infinity]);
    const maxPt = new Vector([-Infinity, -Infinity]);
    let leftIdx = 0, rightIdx = 0, topIdx = 0, bottomIdx = 0;

    for (let i=0; i<convexHull.length; i++) {
        const pt = convexHull[i];

        if (pt.x < minPt.x) {
            minPt.x = pt.x;
            leftIdx = i;
        }

        if (pt.x > maxPt.x) {
            maxPt.x = pt.x;
            rightIdx = i;
        }

        if (pt.y < minPt.y) {
            minPt.y = pt.y;
            bottomIdx = i;
        }

        if (pt.y > maxPt.y) {
            maxPt.y = pt.y;
            topIdx = i;
        }
    }

    // initial caliper lines + directions
    //
    //        top
    //      <-------
    //      |      A
    //      |      | right
    // left |      |
    //      V      |
    //      ------->
    //       bottom
    let leftDir = new Vector([0.0, -1]);
    let rightDir = new Vector([0, 1]);
    let topDir = new Vector([-1, 0]);
    let bottomDir = new Vector([1, 0]);

    // execute rotating caliper algorithm
    for (let i=0; i<convexHull.length; i++) {
        // of course the acos() can be optimized.
        // but it's a JS prototype anyways, so who cares.
        const phis = // 0=left, 1=right, 2=top, 3=bottom
        [
            Math.acos(leftDir.dot(edgeDirs[leftIdx])),
            Math.acos(rightDir.dot(edgeDirs[rightIdx])),
            Math.acos(topDir.dot(edgeDirs[topIdx])),
            Math.acos(bottomDir.dot(edgeDirs[bottomIdx])),
        ];

        const lineWithSmallestAngle = phis.indexOf(Math.min.apply(Math, phis));
        switch (lineWithSmallestAngle) {
            case 0: // left
                leftDir = edgeDirs[leftIdx].clone();
                rightDir = leftDir.clone();
                rightDir.negate();
                topDir = leftDir.orthogonal();
                bottomDir = topDir.clone();
                bottomDir.negate();
                leftIdx = (leftIdx+1)%convexHull.length;
                break;
            case 1: // right
                rightDir = edgeDirs[rightIdx].clone();
                leftDir = rightDir.clone();
                leftDir.negate();
                topDir = leftDir.orthogonal();
                bottomDir = topDir.clone();
                bottomDir.negate();
                rightIdx = (rightIdx+1)%convexHull.length;
                break;
            case 2: // top
                topDir = edgeDirs[topIdx].clone();
                bottomDir = topDir.clone();
                bottomDir.negate();
                leftDir = bottomDir.orthogonal();
                rightDir = leftDir.clone();
                rightDir.negate();
                topIdx = (topIdx+1)%convexHull.length;
                break;
            case 3: // bottom
                bottomDir = edgeDirs[bottomIdx].clone();
                topDir = bottomDir.clone();
                topDir.negate();
                leftDir = bottomDir.orthogonal();
                rightDir = leftDir.clone();
                rightDir.negate();
                bottomIdx = (bottomIdx+1)%convexHull.length;
                break;
        }

        UpdateOmbb(convexHull[leftIdx], leftDir, convexHull[rightIdx], rightDir, convexHull[topIdx], topDir, convexHull[bottomIdx], bottomDir);
    }

    return BestObb;
}


class Vector
{
    public x: number;
    public y: number;

    constructor(vec: Vec) {
        this.x = vec[0];
        this.y = vec[1];
    }

    public min (vec: Vector) {
        this.x = Math.min(this.x, vec.x);
        this.y = Math.min(this.y, vec.y);
    }

    max (vec: Vector) {
        this.x = Math.max(this.x, vec.x);
        this.y = Math.max(this.y, vec.y);
    }

    public midpoint(vec: Vector) {
        return new Vector([(this.x+vec.x)*0.5, (this.y+vec.y)*0.5]);
    }

    public clone() {
        return new Vector([this.x, this.y]);
    }

    public normalize() {
        const len = this.length();
        this.x /= len;
        this.y /= len;
    }

    public normalized() {
        const vec = new Vector([this.x, this.y]);
        vec.normalize();
        return vec;
    }

    public negate() {
        this.x = -this.x;
        this.y = -this.y;
    }

    public sqrLength() {
        return this.x * this.x + this.y * this.y;
    }

    public length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public scale(len: number) {
        this.x *= len;
        this.y *= len;
    }

    public add(vec: Vector) {
        this.x += vec.x;
        this.y += vec.y;
    }

    public sub(vec: Vector) {
        this.x -= vec.x;
        this.y -= vec.y;
    }

    public diff(vec: Vector) {
        return new Vector([this.x-vec.x, this.y-vec.y]);
    }

    public distance(vec: Vector) {
        const x = this.x-vec.x;
        const y = this.y-vec.y;
        return Math.sqrt(x*x+y*y);
    }

    public dot(vec: Vector) {
        return this.x*vec.x+this.y*vec.y;
    }

    public equals(vec: Vector) {
        return this.x == vec.x && this.y == vec.y;
    }

    public orthogonal() {
        return new Vector([this.y, -this.x]);
    }

    distanceToLine (v0: Vector, v1: Vector) {
        const sqrLen = v1.diff(v0).sqrLength();
        const u = ((this.x-v0.x)*(v1.x-v0.x)+(this.y-v0.y)*(v1.y-v0.y))/sqrLen;
        const v1c = v1.diff(v0);
        v1c.scale(u);
        const pl = v0.clone();
        pl.add(v1c);
        return this.distance(pl);
    }
};
