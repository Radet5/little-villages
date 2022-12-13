import * as PIXI from 'pixi.js';
import womanIMG from '../../../assets/sprites/4 Woman/Woman.png'
import manIMG from '../../../assets/sprites/3 Man/Man.png';
import oldWomanIMG from '../../../assets/sprites/2 Old_woman/Old_woman.png';
import oldManIMG from '../../../assets/sprites/1 Old_man/Old_man.png';
import girlIMG from '../../../assets/sprites/6 Girl/Girl.png';
import boyIMG from '../../../assets/sprites/5 Boy/Boy.png';
import { dist, direction, Vec2 } from '@thi.ng/vectors';
import { Vec } from '@thi.ng/vectors/api';

import { shortestPath } from '../../../utils';
import { AnimatedSprite, Container } from 'pixi.js';

import type { VillagerAnimationSet } from '../../spriteloader/spriteloader';

export class Villager {
  
  private speed: number = 0.5;
  private position: Vec2;
  private currentNodeIndex: number;
  private animations: VillagerAnimationSet;
  private sprites: Container;
  private targetIndex:number = 0;
  private path: Array<number> | null = null;
  private streetCorners;
  private villageMap;

  constructor(animationSet: VillagerAnimationSet, streetCorners: Array<Vec>, villageMap: Array<Array<number>>) {
    this.streetCorners = streetCorners;
    this.villageMap = villageMap;

    this.currentNodeIndex = Math.trunc(Math.random() * this.streetCorners.length);
    this.position = new Vec2([streetCorners[this.currentNodeIndex][0], streetCorners[this.currentNodeIndex][1]]);

    this.animations = animationSet;
    this.sprites = new PIXI.Container();
    this.initSprite();
  }

  public getSprites() {
    return this.sprites;
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
    this.sprites.position.x = this.position[0];
    this.sprites.position.y = this.position[1];
  }

  private pickDestination() {
    const startIndex = this.currentNodeIndex;
    const endIndex = Math.trunc(Math.random() * this.streetCorners.length);
    //const startNode = this.streetCorners[startIndex];
    //const endNode = this.streetCorners[endIndex];
    //graphics.beginFill(0x22aa22);
    //graphics.drawCircle(startNode[0], startNode[1], 4);
    //graphics.endFill();

    //graphics.beginFill(0x2222aa);
    //graphics.drawCircle(endNode[0], endNode[1], 4);
    //graphics.endFill();

    this.path = shortestPath(startIndex, endIndex, this.villageMap, this.streetCorners);
    this.targetIndex = 0;
    //console.log(this.path);

    ////graphics.lineStyle(2, 0x8888ff);
    //path.forEach((nodeIndex, i) => {
    //  const node = streetCorners[nodeIndex];
    //  if (i == 0) graphics.moveTo(node[0], node[1])
    //  else graphics.lineTo(node[0], node[1]);
    //})
  }

  private move(delta: number) {
    if (!this.path) return;

    const nextNodePosition = this.streetCorners[this.path[this.targetIndex]];
    const distanceToTarget = dist(this.position, nextNodePosition);

    const dir = new Vec2;
    direction(dir, this.position, nextNodePosition);
    if (dir.buf[0] < 0 && this.sprites.scale.x > 0) this.sprites.scale.x *= -1;
    if (dir.buf[0] > 0 && this.sprites.scale.x < 0) this.sprites.scale.x *= -1;

    this.position.x += dir.buf[0] * this.speed * delta;
    this.position.y += dir.buf[1] * this.speed * delta;
    this.sprites.position = this.position;

    if (distanceToTarget < 1) {
      if (this.targetIndex < this.path.length - 1) {
        this.targetIndex++;
      }
      else {
        this.currentNodeIndex = this.path[this.targetIndex];
        this.targetIndex = 0;
        this.path = null;
      }
    }
  }

  private decide(delta: number) {
    if (!this.path) {
        this.animations.idle.visible = true;
        this.animations.walk.visible = false;
        const number = Math.random();
        if (number > 0.999) this.pickDestination();
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
