import * as PIXI from 'pixi.js';
import { dist, direction, Vec2 } from '@thi.ng/vectors';
import { Vec } from '@thi.ng/vectors/api';

import { shortestPath } from '../../../utils';
import { Container } from 'pixi.js';

import type { SpriteLoader, VillagerAnimationSet } from '../../spriteloader/spriteloader';
import { Village } from '../../mapZone/village';
import { MapZoneInterface, LocationType } from '../../mapZone/mapzone';

enum Age {
    child = "child",
    adult = "adult",
    old = "old",
};

enum GenderPresentation {
    femme = "Femme",
    masc = "Masc",
};

export class Villager {
  
  private speed: number = 0.5;
  private _position: Vec2 = new Vec2 ([0, 0]);
  private spriteLoader: SpriteLoader;
  private animations: VillagerAnimationSet;
  private sprites: Container;
  private targetIndex:number = 0;
  private path: { toType: LocationType, indicies: Array<number>, toObject: MapZoneInterface } | null = null;
  private location: {id: string, type: LocationType, nodeIndex: number, object: MapZoneInterface};
  private destination: {id: string, type: LocationType, index: number, location: Vec} = {id: "", type: LocationType.none, index: -1, location: [0,0]};
  private _village: Village;

  private age: Age;
  private genderPresentation: GenderPresentation;

  constructor(spriteLoader: SpriteLoader, village: Village) {
    this._village = village;
    this.location = {
      id: this.village.id,
      type: LocationType.village,
      nodeIndex: Math.trunc(Math.random() * this.village.intersections.length),
      object: this.village,
    };
    this.sprites = new PIXI.Container();
    this.position = this.village.getIntersectionPositionByIndex(this.location.nodeIndex);
    this.spriteLoader = spriteLoader;
    this.age = this.rollForAge();
    if (this.age == Age.old) this.speed *= 0.60;
    else if (this.age == Age.child) this.speed *= 1.25;
    this.genderPresentation = this.rollForGenderPres();
    this.animations = this.spriteLoader.getVillagerAnimationSet(this.age + this.genderPresentation);
    this.initSprite();
  }

  get village() {return this._village;}
  get position() {return this._position;}
  set village(newVillage) {
    this._village = newVillage;
    this.refreshMapInfo();
  }
  set position(position: Vec2) {
    this._position = position;
    this.sprites.position = position;
  }

  public refreshMapInfo() {
    if (this.location.type == LocationType.ward) {
      const rebuiltWard = this.village.getWardById(this.location.id);
      if (rebuiltWard) {
        this.location.object = rebuiltWard;
      } else console.warn("uhoh can't get rebuilt ward info");
    }
    this.location.nodeIndex = this.findClosestNode();
    this.position = this.location.object.getIntersectionPositionByIndex(this.location.nodeIndex);
    this.destination =  {id: "", type: LocationType.none, index: -1, location: [0,0]};
    this.targetIndex = 0
    this.path = null;
  }

  public getSprites() {
    return this.sprites;
  }

  private findClosestPointTo(points: Array<Vec>, testPoint: Vec) {
    let bestDistance = Infinity;
    let closestNodeIndex = -1;
    points.forEach((node, i) => {
      const distance = dist(testPoint, node);
      if (distance < bestDistance) {
        bestDistance = distance;
        closestNodeIndex = i;
      }
    });
    return closestNodeIndex;
  }

  private findClosestPoint(points: Array<Vec>) {
    return this.findClosestPointTo(points, this.position);
  }

  private findClosestNode() {
    return this.findClosestPoint(this.location.object.intersections)
  }

  private initSprite() {
    Object.keys(this.animations).forEach(key => {
        const sprite = this.animations[key];
        switch (key) {
            case "walk":
                sprite.animationSpeed = 0.50 * this.speed;
                break;
            default:
                sprite.animationSpeed = 0.1;
                break;
        }
        sprite.anchor.set(0.5, 0.85);
        this.sprites.addChild(sprite)
        sprite.play();
    });
    this.sprites.scale.x = -0.5;
    this.sprites.scale.y = 0.5;
  }

  private rollForAge() {
    //return Age.child;
    const diceRoll = Math.trunc(Math.random() * 3);
    let age: Age;
    switch (diceRoll) {
        case 0:
            age = Age.child;
            break;
        case 1:
            age = Age.adult;
            break;
        default:
            age = Age.old
            break;
    }

    return age;
  }

  private rollForGenderPres() {
    const diceRoll = Math.trunc(Math.random() * 2);
    let genderPresentation: GenderPresentation;
    switch (diceRoll) {
        case 0:
            genderPresentation = GenderPresentation.masc;
            break;
        default:
            genderPresentation = GenderPresentation.femme;
            break;
    }

    return genderPresentation;
  }

  private pickDestination() {
    const startIndex = this.location.nodeIndex;
    if (this.destination.type == LocationType.none) {

      //Test stuff for finding way to an specific lot:
      const ward = this.village.getRandomWard();
      let lotNumber;
      let lot;
      if (ward) {
        lotNumber = Math.trunc(Math.random()*(ward.getLotCount()-1));
        lot = ward.getLot(lotNumber);
        const destLocation = lot[this.findClosestPoint(lot)];
        this.destination = {id: ward.id, type: LocationType.ward, location: destLocation, index: ward.intersectionLookup[destLocation[0]][destLocation[1]] };

        //console.log(`Heading to ${ward.name} ${lotNumber}`)
        this.findPath(startIndex, ward);
      }
      this.targetIndex = 0;
    } else if (this.location.type == LocationType.ward) {
      this.findPath(startIndex, this.location.object);
    } else if (this.location.type == LocationType.village) {
      const ward = this.village.getWardById(this.destination.id);
      if (ward) {
        this.findPath(startIndex, ward);
      }
    }
  }

  private findPath(startIndex: number, toObject: MapZoneInterface) {
    if (this.location.type == LocationType.village) {
      if (this.destination.type == LocationType.ward || this.destination.type == LocationType.lot) {
        const entranceNodes = toObject.boundaries.filter((node) => {
          return this.village.intersectionLookup[node[0]] && this.village.intersectionLookup[node[0]][node[1]]
        })
        //TODO: Use shortest path length rather than shortest direct distance:
        const closestEntranceNode = entranceNodes[this.findClosestPoint(entranceNodes)];
        if (!this.village.intersectionLookup[closestEntranceNode[0]]) debugger;
        const endIndex = this.village.intersectionLookup[closestEntranceNode[0]][closestEntranceNode[1]];
        this.path = {
          toType: LocationType.ward,
          indicies: shortestPath(startIndex, endIndex, this.village.connectionMatrix, this.village.intersections),
          toObject: toObject,
        };
      }
    } else if (this.location.type == LocationType.ward) {
      if (this.destination.type == LocationType.ward) { //check if already in same ward, if so navb to index else nav to village
        if (this.destination.id == this.location.id) {
          const endIndex = this.location.object.intersectionLookup[this.destination.location[0]][this.destination.location[1]];
          this.path = {
            toType: this.destination.type,
            indicies: shortestPath(startIndex, endIndex, toObject.connectionMatrix, toObject.intersections),
            toObject: toObject,
          }
        } else {//redirect to village
          //nodes not registered as intersections aren't even an option
          //villager picks the closest node to the destination.
          const exitNodes = this.location.object.boundaries.filter((node) => {
            return this.village.intersectionLookup[node[0]] && this.village.intersectionLookup[node[0]][node[1]]
          });
          const closestExitNode = exitNodes[this.findClosestPointTo(exitNodes, this.destination.location)];
          const endIndex = this.location.object.intersectionLookup[closestExitNode[0]][closestExitNode[1]];
          this.path ={
            toType: LocationType.village,
            indicies: shortestPath(startIndex, endIndex, this.location.object.connectionMatrix, this.location.object.intersections),
            toObject: this.village,
          }
        }
      }
    }
  }

  private move(delta: number) {
    if (!this.path) return;

    let nextNodePosition = [0,0] as Vec;

    nextNodePosition = this.location.object.intersections[this.path.indicies[this.targetIndex]];


    const distanceToTarget = dist(this.position, nextNodePosition);

    const dir = new Vec2;
    direction(dir, this.position, nextNodePosition);
    if (dir.buf[0] < 0 && this.sprites.scale.x > 0) this.sprites.scale.x *= -1;
    if (dir.buf[0] > 0 && this.sprites.scale.x < 0) this.sprites.scale.x *= -1;

    const newPosition = new Vec2 ([this.position.x + dir.buf[0] * this.speed * delta, this.position.y + dir.buf[1] * this.speed * delta]);
    this.position = newPosition;

    if (distanceToTarget < 1) {
      if (this.targetIndex < this.path.indicies.length - 1) {
        this.location.nodeIndex = this.path.indicies[this.targetIndex];
        this.targetIndex++;
        //console.log("next node", this.targetIndex, this.path, this.destination);
      }
      else {
        //console.log("path complete");
        this.location.nodeIndex = this.path.indicies[this.targetIndex];
        this.targetIndex = 0;
        if (this.location.type == this.destination.type && this.location.nodeIndex == this.destination.index) {
          this.path = null;
          this.destination = {id: "", type: LocationType.none, index: -1, location: [0,0]};
        } else {
          const currentNodeLocation = this.location.object.intersections[this.location.nodeIndex];
          this.location.object = this.path.toObject;
          this.location.nodeIndex = this.location.object.intersectionLookup[currentNodeLocation[0]][currentNodeLocation[1]];
          this.location.type = this.path.toType;
          this.location.id = this.path.toObject.id;
          this.pickDestination();
        }
      }
    }
  }

  private decide(delta: number) {
    if (!this.path) {
        this.animations.idle.visible = true;
        this.animations.walk.visible = false;
        const number = Math.random();
        if (number > 0.999) this.pickDestination();
        //this.pickDestination();
    } else {
        this.animations.walk.visible = true;
        this.animations.idle.visible = false;
        this.move(delta);
    }
  }

  public update(delta: number) {
    this.decide(delta);
  }

}
