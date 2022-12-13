import * as PIXI from 'pixi.js';
import { AnimatedSprite, Spritesheet } from 'pixi.js';
import womanSpriteSheet from '../../art/assets/sprites/4 Woman/woman_spritesheet.png';

export interface VillagerAnimationSet {
    walk: AnimatedSprite;
    idle: AnimatedSprite;
    [string: string]: AnimatedSprite
}

export class SpriteLoader {
    private spritesheet: Spritesheet;

    public getVillagerAnimationSet(type: string) {
        let animations = {
                    walk: new PIXI.AnimatedSprite(this.spritesheet.animations.walk),
                    idle: new PIXI.AnimatedSprite(this.spritesheet.animations.idle)
                };
        switch (type) {
            default:
                animations = {
                    walk: new PIXI.AnimatedSprite(this.spritesheet.animations.walk),
                    idle: new PIXI.AnimatedSprite(this.spritesheet.animations.idle)
                };
                break;
        }

        return animations;
    }

    public async loadSpriteSheet() {
        const womanSpritesheetData = {
            "frames": {
                "Woman_attack_01.png": {
                    "frame": {"x":63, "y":0, "w":17, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":17,"h":33},
                    "sourceSize": {"w":17,"h":33}
                },
                "Woman_attack_02.png": {
                    "frame": {"x":23, "y":48, "w":21, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":21,"h":33},
                    "sourceSize": {"w":21,"h":33}
                },
                "Woman_attack_03.png": {
                    "frame": {"x":0, "y":48, "w":22, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":22,"h":33},
                    "sourceSize": {"w":22,"h":33}
                },
                "Woman_attack_04.png": {
                    "frame": {"x":97, "y":68, "w":14, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":14,"h":33},
                    "sourceSize": {"w":14,"h":33}
                },
                "Woman_death_01.png": {
                    "frame": {"x":34, "y":0, "w":18, "h":26},
                    "spriteSourceSize": {"x":0,"y":0,"w":18,"h":26},
                    "sourceSize": {"w":18,"h":26}
                },
                "Woman_death_02.png": {
                    "frame": {"x":0, "y":24, "w":29, "h":23},
                    "spriteSourceSize": {"x":0,"y":0,"w":29,"h":23},
                    "sourceSize": {"w":29,"h":23}
                },
                "Woman_death_03.png": {
                    "frame": {"x":0, "y":10, "w":33, "h":13},
                    "spriteSourceSize": {"x":0,"y":0,"w":33,"h":13},
                    "sourceSize": {"w":33,"h":13}
                },
                "Woman_death_04.png": {
                    "frame": {"x":0, "y":0, "w":33, "h":9},
                    "spriteSourceSize": {"x":0,"y":0,"w":33,"h":9},
                    "sourceSize": {"w":33,"h":9}
                },
                "Woman_hurt_01.png": {
                    "frame": {"x":23, "y":82, "w":20, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":20,"h":33},
                    "sourceSize": {"w":20,"h":33}
                },
                "Woman_hurt_02.png": {
                    "frame": {"x":44, "y":82, "w":18, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":18,"h":33},
                    "sourceSize": {"w":18,"h":33}
                },
                "Woman_idle_01.png": {
                    "frame": {"x":81, "y":0, "w":16, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":16,"h":33},
                    "sourceSize": {"w":16,"h":33}
                },
                "Woman_idle_02.png": {
                    "frame": {"x":81, "y":34, "w":15, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":15,"h":33},
                    "sourceSize": {"w":15,"h":33}
                },
                "Woman_idle_03.png": {
                    "frame": {"x":80, "y":69, "w":16, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":16,"h":33},
                    "sourceSize": {"w":16,"h":33}
                },
                "Woman_idle_04.png": {
                    "frame": {"x":45, "y":27, "w":17, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":17,"h":33},
                    "sourceSize": {"w":17,"h":33}
                },
                "Woman_walk_01.png": {
                    "frame": {"x":97, "y":34, "w":15, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":15,"h":33},
                    "sourceSize": {"w":15,"h":33}
                },
                "Woman_walk_02.png": {
                    "frame": {"x":113, "y":0, "w":13, "h":34},
                    "spriteSourceSize": {"x":0,"y":0,"w":13,"h":34},
                    "sourceSize": {"w":13,"h":34}
                },
                "Woman_walk_03.png": {
                    "frame": {"x":63, "y":69, "w":16, "h":35},
                    "spriteSourceSize": {"x":0,"y":0,"w":16,"h":35},
                    "sourceSize": {"w":16,"h":35}
                },
                "Woman_walk_04.png": {
                    "frame": {"x":0, "y":82, "w":22, "h":33},
                    "spriteSourceSize": {"x":0,"y":0,"w":22,"h":33},
                    "sourceSize": {"w":22,"h":33}
                },
                "Woman_walk_05.png": {
                    "frame": {"x":63, "y":34, "w":17, "h":34},
                    "spriteSourceSize": {"x":0,"y":0,"w":17,"h":34},
                    "sourceSize": {"w":17,"h":34}
                },
                "Woman_walk_06.png": {
                    "frame": {"x":112, "y":68, "w":13, "h":35},
                    "spriteSourceSize": {"x":0,"y":0,"w":13,"h":35},
                    "sourceSize": {"w":13,"h":35}
                }
            
            },
            "meta": {
                "image": womanSpriteSheet,
                "size": {"w": 127, "h": 116},
                "scale": "1"
            },
            animations: {
                walk: ['Woman_walk_01.png', 'Woman_walk_02.png', 'Woman_walk_03.png', 'Woman_walk_04.png', 'Woman_walk_05.png', 'Woman_walk_06.png', ],
                idle: ['Woman_idle_01.png', 'Woman_idle_02.png', 'Woman_idle_03.png', 'Woman_idle_04.png']
            }
        }

        const spritesheet = new PIXI.Spritesheet(
            PIXI.BaseTexture.from(womanSpritesheetData.meta.image),
            womanSpritesheetData
        );

        // Generate all the Textures asynchronously
        await spritesheet.parse();

        this.spritesheet = spritesheet;
    }
}