import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from './examples/obj-file-demo.js'


const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Axis_Arrows, Textured_Phong, Regular_2D_Polygon, Cube, Square} = defs

export class Background extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.shapes = {
            ground: new Square(),
            background: new Square(),
            volcano: new Shape_From_File("assets/mount.obj")
        }
        this.shapes.ground.arrays.texture_coord.forEach( (v, i, l) =>
            l[i] = vec(20*v[0], 10*v[1]))

        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#70734f")
            }),
            face: new Material(new Textured_Phong(), {
                color: hex_color("#ddd6c3"),
                ambient: 0.7, diffusivity: 0.8
            }),
            ground_texture: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/grass.jpg")
            }),
            bg: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/sky.jpg")
            }),
        }
        this.vol = new Material(new defs.Textured_Phong(1), {
            color: color(.5, .5, .5, 1),
            ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/rock.jpg")
        });

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {

    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // place the camera 5 unit back from the origin
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        let ground_trans = Mat4.rotation(Math.PI / 2, 1, 0, 0)
            .times(Mat4.scale(100, 50, 55));
        this.shapes.ground.draw(context, program_state, ground_trans, this.materials.ground_texture)

        let back_trans = Mat4.translation(0,0,-50).times(Mat4.scale(100,100, 100))
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

        let vol_trans = Mat4.translation(0, 12, -40).times(Mat4.scale(30, 30, 30))
        this.shapes.volcano.draw(context, program_state, vol_trans, this.vol)
    }
}