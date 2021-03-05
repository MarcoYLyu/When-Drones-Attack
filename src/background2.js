import {defs, tiny} from './examples/common.js';
import {comps} from './house.js'
import {Shape_From_File} from './examples/obj-file-demo.js'


const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Axis_Arrows, Textured_Phong, Phong_Shader, Regular_2D_Polygon, Cube, Square} = defs
const {Roof, House} = comps;

export class Background2 extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.shapes = {
            ground: new Square(),
            background: new defs.Subdivision_Sphere(4),
            block1: new Cube(),
            block2: new Cube(),
            block3: new Cube(),
            window1: new Square(),
            window2: new Square(),
            window3: new Square(),
            chimney1: new Cube(),
            chimney2: new Cube(),
            chimney3: new Cube(),
            house: new House(),
            road: new Square()
        }
        this.shapes.ground.arrays.texture_coord.forEach( (v, i, l) =>
            l[i] = vec(20*v[0], 10*v[1]))

        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#70734f")
            }),
            face: new Material(new Phong_Shader(), {
                color: hex_color("#807777"),
                ambient: 0.7, diffusivity: 0.8
            }),
            ground_texture: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/sand.jpg")
            }),
            bg: new Material(new Phong_Shader(), {
                color: hex_color("#87ceff"),
                ambient: 1, diffusivity: 1, specularity: 1,
                //texture: new Texture("assets/sky.jpg")
            }),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: .5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png")
            }),
            bricks: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: .2, diffusivity: 0.3,
                Texture: new Texture("assets/bricks.jpg")
            }),
            pavement: new Material(new Textured_Phong(), {
                color: hex_color("#808080"),
                ambient: .2, diffusivity: 0.3
            }),
            cracked: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.3,
                Texture: new Texture("assets/cracks.jpg")
            })
        }
        this.vol = new Material(new defs.Textured_Phong(1), {
            color: color(.5, .5, .5, 1),
            ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/rock.jpg")
        });

        this.intensity = 0;
        this.start = 0;
        this.transition = 0;
        this.cracked = 0;
        this.overlap = 0;
        this.overlap2 = 1;
        this.lighting = 0;
        this.initial_camera_location = Mat4.look_at(vec3(-5, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        this.key_triggered_button("Small Earthquake", ["s"], () => {
            this.intensity = 1;
            this.start = 0;
        });
        this.key_triggered_button("Large Earthquake", ["l"], () => {
            this.intensity = 2;
            this.start = 0;
        });
        this.key_triggered_button("Night to Day", ["n"], () => {
            if (this.transition > 10 && this.lighting) {
                this.transition = 0;
                this.lighting = 0;
            }
        });
        this.key_triggered_button("Day to Night", ["d"], () => {
            if (this.transition > 10 && !this.lighting) {
                this.transition = 0;
                this.lighting = 1;
            }
        });
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // place the camera 5 unit back from the origin
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 500);
        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        let ground_trans = Mat4.translation(0, -1, 0).times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
            .times(Mat4.scale(100, 50, 55));
        this.shapes.ground.draw(context, program_state, ground_trans, this.materials.ground_texture)

        let back_trans = Mat4.translation(0, 0, 0).times(Mat4.scale(250,250,250))
        if (this.transition < 10) {
            if (this.lighting) {
                this.materials.bg = this.materials.bg.override({ambient: 1 - 0.1*this.transition});
            } else {
                this.materials.bg = this.materials.bg.override({ambient: 0.1*this.transition});
            }
        }
        this.transition = this.transition + dt;
        this.shapes.background.draw(context, program_state, back_trans, this.materials.bg)
        /*
        let back_trans = Mat4.identity();
        let screens = 40.0;
        for (let i = 0; i < screens; i++) {
            back_trans = Mat4.rotation(Math.PI * i / (screens-1) - Math.PI / 2, 0, 1, 0)
                .times(Mat4.translation(0,10, -50))
                .times(Mat4.scale(50 * Math.tan(Math.PI / (2 * (screens-1))), 20, 20))
            this.shapes.background.draw(context, program_state, back_trans, this.materials.bg)
        }
        */

        let block_transform = Mat4.translation(-5, 0, 0).times(Mat4.scale(1.5, 2, 2));
        let brick_transform = Mat4.translation(3.5, 0, 0).times(Mat4.scale(0.25, 1, 0.25));
        let road_transform = Mat4.translation(5, -0.99, 5).times(Mat4.scale(100, 5, 1)).times(Mat4.rotation(Math.PI / 2, 1, 0, 0));

        let part2_transform = Mat4.translation(3.25, -0.5, 3).times(Mat4.scale(1.5, 0.5, 0.5));
        let part3_transform = Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(1.5, 0.5, 2.4)).times(Mat4.translation(5, -1, -0.5));

        let block2_transform = part2_transform.times(block_transform);
        let block3_transform = part3_transform.times(block_transform);

        let brick_transform2 = Mat4.translation(0, 1.75, 0).times(Mat4.scale(1, 0.75, 1)).times(brick_transform);
        let brick_transform3 = Mat4.translation(4 + 0.333 * (this.start - 6.25), 1.5, 0).times(Mat4.rotation(Math.PI * (6.75 - this.start)/6.6, 0, 0, 1)).times(Mat4.scale(0.25, 0.75, 0.25));

        if (this.intensity == 1) {
            if (this.start < 10) {
                road_transform = Mat4.translation(0.25*Math.sin(0.4*Math.PI*this.start), 0, 0).times(road_transform);
                block_transform = Mat4.translation(0.25*Math.sin(0.4*Math.PI*this.start), 0, 0).times(block_transform);
                block2_transform = Mat4.translation(0.25*Math.sin(0.4*Math.PI*this.start), 0, 0).times(block2_transform);
                block3_transform = Mat4.translation(0.25*Math.sin(0.4*Math.PI*this.start), 0, 0).times(block3_transform);
                brick_transform = Mat4.translation(0.25*Math.sin(0.4*Math.PI*this.start), 0, 0).times(brick_transform);
                brick_transform2 = Mat4.translation(0.25*Math.sin(0.4*Math.PI*this.start), 0, 0).times(brick_transform2);
                brick_transform2 = brick_transform2.times(Mat4.rotation(Math.PI/16 * Math.sin(-0.4*Math.PI*this.start), 0, 0, 1));
                this.start = this.start + dt;
            }
        } else if (this.intensity == 2) {
            if (this.start < 15) {
                road_transform = Mat4.translation(0.5*Math.sin(0.4*Math.PI*this.start), 0, 0).times(road_transform);
                block_transform = Mat4.translation(0.5*Math.sin(0.4*Math.PI*this.start), 0, 0).times(block_transform);
                block2_transform = Mat4.translation(0.5*Math.sin(0.4*Math.PI*this.start), 0, 0).times(block2_transform);
                block3_transform = Mat4.translation(0.5*Math.sin(0.4*Math.PI*this.start), 0, 0).times(block3_transform);
                brick_transform = Mat4.translation(0.5*Math.sin(0.4*Math.PI*this.start), 0, 0).times(brick_transform);
                brick_transform2 = Mat4.translation(0.5*Math.sin(0.4*Math.PI*this.start), 0, 0).times(brick_transform2);
                if (this.start < 6.35) {
                    brick_transform2 = brick_transform2.times(Mat4.rotation(Math.PI/12 * Math.sin(-0.4*Math.PI*this.start), 0, 0, 1));
                }
                if (this.start < 9.45 && this.start > 6.45) {
                    if (this.start > 6.45) {
                        this.overlap2 = 0;
                    }
                    brick_transform3 = Mat4.translation(0, -0.89*(this.start - 6.65), 0).times(brick_transform3);
                    this.overlap = 1;
                } else if (this.start > 9.45) {
                    this.cracked = 1;
                    this.overlap = 0;
                    this.overlap2 = 1;
                    brick_transform2 = Mat4.translation(5, -1, 0).times(Mat4.rotation(Math.PI/2, 0, 0, 1)).times(Mat4.scale(0.25, 0.75, 0.25));
                }
                this.start = this.start + dt;
            }
        }

        if (this.cracked) {   
            brick_transform2 = Mat4.translation(5, -1, 0).times(Mat4.rotation(Math.PI/2, 0, 0, 1)).times(Mat4.scale(0.25, 0.75, 0.25));
        }
        this.shapes.block1.draw(context, program_state, block_transform, this.materials.face);
        this.shapes.block2.draw(context, program_state, block2_transform, this.materials.face);
        this.shapes.block3.draw(context, program_state, block3_transform, this.materials.face);

        this.shapes.chimney1.draw(context, program_state, brick_transform, this.materials.bricks);
        if (this.overlap2 || this.cracked) {
            this.shapes.chimney2.draw(context, program_state, brick_transform2, this.materials.bricks);
        }
        if (this.overlap && !this.cracked) {
            this.shapes.chimney3.draw(context, program_state, brick_transform3, this.materials.bricks);
        }
        this.shapes.road.draw(context, program_state, road_transform, this.materials.pavement);

        //this.shapes.house.draw(context, program_state, Mat4.translation(8, 0, 0), this.materials.face.override({color: hex_color("#ffff00")}));
    }
}
