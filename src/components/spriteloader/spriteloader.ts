import * as PIXI from 'pixi.js';
import { AnimatedSprite, Spritesheet } from 'pixi.js';
import { villagerSpritesheetData } from './data/villager-spritesheet-data';
export interface VillagerAnimationSet {
    walk: AnimatedSprite;
    idle: AnimatedSprite;
    [string: string]: AnimatedSprite
}

export class SpriteLoader {
    spritesheet: Spritesheet | {animations:{[string: string]: []}} = {animations:{something: []}};;

    public getVillagerAnimationSet(type: string) {
        let animations = {
                    walk: new PIXI.AnimatedSprite(this.spritesheet.animations.femmeWalk),
                    idle: new PIXI.AnimatedSprite(this.spritesheet.animations.femmeIdle)
                };
        if (this.spritesheet) {
            switch (type) {
                case "oldMasc":
                    animations = {
                        walk: new PIXI.AnimatedSprite(this.spritesheet.animations.oldMascWalk),
                        idle: new PIXI.AnimatedSprite(this.spritesheet.animations.oldMascIdle)
                    };
                    break;
                case "childMasc":
                    animations = {
                        walk: new PIXI.AnimatedSprite(this.spritesheet.animations.childMascWalk),
                        idle: new PIXI.AnimatedSprite(this.spritesheet.animations.childMascIdle)
                    };
                    break;
                case "adultMasc":
                    animations = {
                        walk: new PIXI.AnimatedSprite(this.spritesheet.animations.mascWalk),
                        idle: new PIXI.AnimatedSprite(this.spritesheet.animations.mascIdle)
                    };
                    break;
                case "oldFemme":
                    animations = {
                        walk: new PIXI.AnimatedSprite(this.spritesheet.animations.oldFemmeWalk),
                        idle: new PIXI.AnimatedSprite(this.spritesheet.animations.oldFemmeIdle)
                    };
                    break;
                case "childFemme":
                    animations = {
                        walk: new PIXI.AnimatedSprite(this.spritesheet.animations.childFemmeWalk),
                        idle: new PIXI.AnimatedSprite(this.spritesheet.animations.childFemmeIdle)
                    };
                    break;
                default:
                    animations = {
                        walk: new PIXI.AnimatedSprite(this.spritesheet.animations.femmeWalk),
                        idle: new PIXI.AnimatedSprite(this.spritesheet.animations.femmeIdle)
                    };
                    break;
            }

        }
        return animations;
    }

    public async loadSpriteSheet() {

        const spritesheet = new PIXI.Spritesheet(
            PIXI.BaseTexture.from(villagerSpritesheetData.meta.image),
            villagerSpritesheetData
        );

        // Generate all the Textures asynchronously
        await spritesheet.parse();

        this.spritesheet = spritesheet;
    }
}