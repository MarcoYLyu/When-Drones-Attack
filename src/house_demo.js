import {defs, tiny} from './examples/common.js';
import {comps} from './helpers/helper.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Axis_Arrows, Textured_Phong, Regular_2D_Polygon, Cube, Square} = defs
const {Roof, House, Collision_Helper} = comps;


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
            man: new Cube(),
            target: new Square(),
        }

        const man_data_members = {
            roll: 0,
            radians_per_frame: 1 / 200,
            meters_per_frame: 20,
            thrust: vec3(0, 0, 0)
        }

        Object.assign(this, man_data_members);

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
        //this.initial_man_transformation = Mat4.translation(5, 0, 30.3);
        this.initial_man_transformation = Mat4.translation(0, 0, 0);
        this.current_man_position = vec4(0, 0, 0, 1);
        this.moving = false;
        this.itr = 0;
    }

    make_control_panel() {
        this.key_triggered_button("forward", ["w"], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("backward", ["s"], () => this.thrust[2] = 1,
        undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("left", ["a"], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0);
        this.new_line();
        this.key_triggered_button("left", ["d"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
    }


    get_man_transformation(mouse_from_center, radians_per_frame, meters_per_frame, leeway = 30) {
        const offsets_from_dead_box = {
            plus: [mouse_from_center[0] + leeway, mouse_from_center[1] + leeway],
            minus: [mouse_from_center[0] - leeway, mouse_from_center[1] - leeway]
        };

        let o = offsets_from_dead_box,
            velocity = ((o.minus[0] > 0 && o.minus[0]) || (o.plus[0] < 0 && o.plus[0])) * radians_per_frame;
        let temp = this.initial_man_transformation.times(Mat4.rotation(-velocity * 0.7, 0, 1, 0))
                    .times(Mat4.rotation(-0.1 * this.roll, 0, 0, 1))
                    .times(Mat4.translation(...this.thrust.times(meters_per_frame)));
        
        this.initial_man_transformation = temp;
        return temp;
    }

    get_mouse_picking_location(cur_pos, mouse_vec, altitude) {
        if (mouse_vec[0] == 0) {
            return cur_pos;
        }
        // target_pos = cur_pos + t * mouse_vec
        let t = (altitude - cur_pos[1]) / mouse_vec[1];
        let x = cur_pos[0] + mouse_vec[0] * t;
        let z = cur_pos[2] + mouse_vec[2] * t;

        // we don't want it to go back.
        if (t < 0) {
            return cur_pos;
        }
        return vec4(x, altitude, z, 1);
    }

    has_used_wasd() {
        return !this.thrust.every(e => e == 0);
    }

    async display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

            // Initialize mousepicking controls.
            this.children.push(context.scratchpad.mouse_controls = new defs.Mousepick_Controls((mouse_vec) => {
                // Intersection detection code goes here.
                return "Nothing";
            }));
        }

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let speed = 0.01;
        let mouse_vec = context.scratchpad.mouse_controls.mouse_vec().normalized();
        let camera_obj_x = 0;
        let camera_obj_y = 2;
        let camera_obj_z = 6;

        const m = this.meters_per_frame;
        const r = this.radians_per_frame;
        let man_transformation = this.get_man_transformation(context.scratchpad.controls.get_mouse_position(), dt * r, dt * m);

        let cur_pos = this.current_man_position;
        let target_pos = this.get_mouse_picking_location(vec4(cur_pos[0], cur_pos[1] + camera_obj_y, cur_pos[2], 1), mouse_vec, 0);
        let temp_moving_vec = target_pos.minus(vec4(cur_pos[0], cur_pos[1] + camera_obj_y, cur_pos[2], 1));

        if (context.scratchpad.mouse_controls.click) {
            this.moving_vec = temp_moving_vec;
            console.log("cur_pos: " + cur_pos);
            console.log("target_pos: " + target_pos);

            context.scratchpad.mouse_controls.click = false;
            this.moving = true;
        }

        if (this.moving) {
            if (this.itr >= 1 / speed || this.has_used_wasd() || this.moving_vec.norm() == 0) {
                this.itr = 0;
                this.moving = false;
            } else {
                this.initial_man_transformation = Mat4.translation(this.moving_vec[0] * speed, 0, this.moving_vec[2] * speed).times(this.initial_man_transformation);
                man_transformation = this.initial_man_transformation;
                this.itr += 1;
            }
        }

        this.current_man_position = man_transformation.times(vec4(0, 0, 0, 1));
        let camera_pos = man_transformation.times(vec4(camera_obj_x, camera_obj_y, camera_obj_z, 1));

        let posx = this.current_man_position[0];
        let posy = this.current_man_position[1];
        let posz = this.current_man_position[2];
        let camerax = camera_pos[0];
        let cameray = camera_pos[1];
        let cameraz = camera_pos[2];
        program_state.set_camera(Mat4.look_at(vec3(camerax, cameray, cameraz), vec3(posx, posy, posz), vec3(0, 1, 0)));
        
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];

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
        
        if (!this.onlyonce) {
            this.onlyonce = true;
            let boundary = await Collision_Helper.get_xz_boundaries_helper(this.shapes.house, Mat4.translation(8, 0, 0));
            this.house_maxx = boundary[0];
            this.house_minx = boundary[1];
            this.house_maxz = boundary[2];
            this.house_minz = boundary[3];
        }

        if (Collision_Helper.has_square_collision(this.current_man_position, this.house_maxx, this.house_minx, this.house_maxz, this.house_minz)) {
            this.initial_man_transformation = this.previous_man_transformation;
        } else {
            this.previous_man_transformation = man_transformation;
        }
        let temp = target_pos.minus(this.current_man_position);
        this.shapes.man.draw(context, program_state, this.initial_man_transformation.times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.roof);
        
        if (temp_moving_vec.norm() !== 0.0) {
            this.shapes.target.draw(context, program_state, Mat4.translation(temp[0], temp[1], temp[2]).times(this.initial_man_transformation)
                                                                .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
                                                                .times(Mat4.translation(0, 0, 1)), this.materials.roof);
        }
    }
}