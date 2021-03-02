import {defs, tiny} from './examples/common.js';
import {comps} from './house.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Axis_Arrows, Textured_Phong, Regular_2D_Polygon, Cube} = defs
const {Roof, House} = comps;


export class House_Demo extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            roof1: new Roof(),
            face1: new Regular_2D_Polygon(1, 3),
            face2: new Regular_2D_Polygon(1, 3),
            block1: new Cube(),
            block2: new Cube(),
            block3: new Cube(),
            roof2: new Roof(),
            roof3: new Roof(),
            face3: new Regular_2D_Polygon(1, 3),
            face4: new Regular_2D_Polygon(1, 3),
            face5: new Regular_2D_Polygon(1, 3),
            face6: new Regular_2D_Polygon(1, 3),
            house: new House(),
        }
        // appear four times
        /*
        this.shapes.box_2.arrays.texture_coord = Vector.cast(
            [0, 0], [2, 0], [0, 2], [2, 2],
            [0, 0], [2, 0], [0, 2], [2, 2],
            [0, 0], [2, 0], [0, 2], [2, 2],
            [0, 0], [2, 0], [0, 2], [2, 2],
            [0, 0], [2, 0], [0, 2], [2, 2],
            [0, 0], [2, 0], [0, 2], [2, 2],
        )
        */


        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff")
            }),
            roof: new Material(new Textured_Phong(), {
                color: hex_color("#ea4e3e"),
                ambient: .2, diffusivity: 0.3,
                Texture: new Texture("assets/roof.png")
            }),
            face: new Material(new Textured_Phong(), {
                color: hex_color("#ddd6c3"),
                ambient: 0.7, diffusivity: 0.8
            }),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: .5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png")
            }),
        }

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

        let roof_transform = Mat4.scale(1.5, 1, 2)
        .times(Mat4.translation(0, 1, 0))
        .times(Mat4.rotation(Math.PI / 2, 0, 0, 1))
        .times(Mat4.scale(1, 1.16, 2))
        .times(Mat4.translation(0.5, 0, 0));

        let block_transform = Mat4.scale(1.5, 1, 2);

        let part2_transform = Mat4.translation(0.75, -0.5, 3).times(Mat4.scale(1.5, 0.5, 0.5));
        let part3_transform = Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(1.5, 0.5, 0.7)).times(Mat4.translation(0, -1, 3));

        this.shapes.roof1.draw(context, program_state, roof_transform, this.materials.roof);
        this.shapes.face1.draw(context, program_state, Mat4.translation(0, 0, 2).times(roof_transform), this.materials.face);
        this.shapes.face2.draw(context, program_state, Mat4.translation(0, 0, -2).times(roof_transform), this.materials.face);
        this.shapes.block1.draw(context, program_state, block_transform, this.materials.face);

        this.shapes.roof2.draw(context, program_state, part2_transform.times(roof_transform), this.materials.roof);
        this.shapes.face3.draw(context, program_state, part2_transform.times(roof_transform).times(Mat4.translation(0, 0, 0.5)), this.materials.face);
        this.shapes.face4.draw(context, program_state, part2_transform.times(roof_transform).times(Mat4.translation(0, 0, -0.5)), this.materials.face);
        this.shapes.block2.draw(context, program_state, part2_transform.times(block_transform), this.materials.face);

        this.shapes.roof3.draw(context, program_state, part3_transform.times(roof_transform), this.materials.roof);
        this.shapes.face3.draw(context, program_state, part3_transform.times(roof_transform).times(Mat4.translation(0, 0, 0.5)), this.materials.face);
        this.shapes.face3.draw(context, program_state, part3_transform.times(roof_transform).times(Mat4.translation(0, 0, -0.5)), this.materials.face);
        this.shapes.block3.draw(context, program_state, part3_transform.times(block_transform), this.materials.face);

        this.shapes.house.draw(context, program_state, Mat4.translation(8, 0, 0), this.materials.face.override({color: hex_color("#ffff00")}));
    }
}