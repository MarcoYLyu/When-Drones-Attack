import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from './examples/obj-file-demo.js'
import {comps} from './helpers/helper.js';


const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Axis_Arrows, Textured_Phong, Regular_2D_Polygon, Cube, Square} = defs
const {Roof, House, Collision_Helper} = comps;

export class Background extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.shapes = {
            volcano: new Shape_From_File("assets/mount.obj"),
            island: new Shape_From_File("assets/ground.obj"),
            sky: new Shape_From_File("assets/sky.obj"),
            roof: new Roof(),
            house: new House(),
            ball: new Cube(),
            block: new Cube(),
            ground: new Square(),
            face: new Regular_2D_Polygon(1, 3),
            man: new Cube(),
            target: new Square(),
        }

        const man_data_members = {
            roll: 0,
            radians_per_frame: 1 / 200,
            meters_per_frame: 20,
            thrust: vec3(0, 0, 0)
        };
        Object.assign(this, man_data_members);

        this.materials = {
            phong: new Material(new defs.Phong_Shader(), {
                color: hex_color("#f5f53c"),
                ambient: 1, diffusivity: 1, specularity: 1,
            }),
            roof: new Material(new Textured_Phong(), {
                color: hex_color("#ea4e3e"),
                ambient: .2, diffusivity: 0.3,
                Texture: new Texture("assets/roof.png")
            }),
            water: new Material(new Textured_Phong(), {
                color: hex_color("#2a46e2"),
                ambient: .4, diffusivity: .5, specularity: .5, texture: new Texture("assets/lake.png")
            }),
            face: new Material(new Textured_Phong(), {
                color: hex_color("#ddd6c3"),
                ambient: 0.6, diffusivity: 0.8
            }),
            ground_texture: new Material(new Textured_Phong(), {
                color: hex_color("#835846"),
                ambient: 0.7, diffusivity: 0.1, specularity: 0.1,
                //texture: new Texture("assets/grass.jpg")
            }),
            bg: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/sky.jpg")
            }),
        }
        this.vol = new Material(new Textured_Phong(), {
            color: hex_color("#8c4100"), //#208f52
            ambient: .4, diffusivity: .6, specularity: .5, texture: new Texture("assets/mount.png")
        });
        this.island = new Material(new Textured_Phong(), {
            color: hex_color("#708a04"),
            ambient: .4, diffusivity: .6, specularity: .5, texture: new Texture("assets/land.png")
        });
        this.sky = new Material(new Textured_Phong(), {
            color: hex_color("#000000"),
            ambient: 1, diffusivity: 1, specularity: .1, texture: new Texture("assets/sky.jpg")
        });

        this.initial_camera_location = Mat4.look_at(vec3(0, 50, 100), vec3(0, 0, 0), vec3(0, 1, 0));

        // Movement members.
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

    /**
     * 
     * @param {Matrix} base_translation Some **translation** to move the entire island by.
     */
    draw_island(context, program_state, base_translation = Mat4.identity()) {
        const t = program_state.animation_time / 1000.0;

        const ball_trans = Mat4.rotation(t/3, 0, 1, 0)
                           .times(base_translation)
                           .times(Mat4.translation(-60, 30, 0))
                           .times(Mat4.scale(3, 3, 3));
        this.shapes.ball.draw(context, program_state, ball_trans, this.materials.phong)

        const lake_trans = base_translation
                         .times(Mat4.translation(-19, -3.5, -3)
                         .times(Mat4.scale(20, 5, 14)));
        this.shapes.ball.draw(context, program_state, lake_trans, this.materials.water)


        const vol_trans = base_translation.times(
                            Mat4.translation(-15, 8, -20)
                            .times(Mat4.scale(15, 15, 15))
                        );
        const island_trans = base_translation.times(Mat4.scale(30, 30, 30));
        this.shapes.volcano.draw(context, program_state, vol_trans, this.vol);
        this.shapes.island.draw(context, program_state, island_trans, this.island);
        const sky_trans = Mat4.translation(0, 30, 0)
                            .times(Mat4.scale(400, 400, 400))
        this.shapes.sky.draw(context, program_state, Mat4.scale(50, 50, 50), this.sky);
    }

    /**
     * 
     * @param {Matrix} base_translation Some base translation to move the entire home by.
     */
    draw_house(context, program_state, base_translation = Mat4.identity()) {
        let roof_transform = Mat4.scale(1.5, 1, 2)
        .times(Mat4.translation(0, 1, 0))
        .times(Mat4.rotation(Math.PI / 2, 0, 0, 1))
        .times(Mat4.scale(1, 1.16, 2))
        .times(Mat4.translation(0.5, 0, 0));

        let block_transform = Mat4.scale(1.5, 1, 2);

        let part2_transform = Mat4.translation(0.75, -0.5, 3).times(Mat4.scale(1.5, 0.5, 0.5));
        let part3_transform = Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(1.5, 0.5, 0.7)).times(Mat4.translation(0, -1, 3));

        this.shapes.roof.draw(context, program_state, base_translation.times(roof_transform), this.materials.roof);
        this.shapes.face.draw(context, program_state, base_translation.times(Mat4.translation(0, 0, 2).times(roof_transform)), this.materials.face);
        this.shapes.face.draw(context, program_state, base_translation.times(Mat4.translation(0, 0, -2).times(roof_transform)), this.materials.face);
        this.shapes.block.draw(context, program_state, base_translation.times(block_transform), this.materials.face);

        this.shapes.roof.draw(context, program_state, base_translation.times(part2_transform.times(roof_transform)), this.materials.roof);
        this.shapes.face.draw(context, program_state, base_translation.times(part2_transform.times(roof_transform).times(Mat4.translation(0, 0, 0.5))), this.materials.face);
        this.shapes.face.draw(context, program_state, base_translation.times(part2_transform.times(roof_transform).times(Mat4.translation(0, 0, -0.5))), this.materials.face);
        this.shapes.block.draw(context, program_state, base_translation.times(part2_transform.times(block_transform)), this.materials.face);

        this.shapes.roof.draw(context, program_state, base_translation.times(part3_transform.times(roof_transform)), this.materials.roof);
        this.shapes.face.draw(context, program_state, base_translation.times(part3_transform.times(roof_transform).times(Mat4.translation(0, 0, 0.5))), this.materials.face);
        this.shapes.face.draw(context, program_state, base_translation.times(part3_transform.times(roof_transform).times(Mat4.translation(0, 0, -0.5))), this.materials.face);
        this.shapes.block.draw(context, program_state, base_translation.times(part3_transform.times(block_transform)), this.materials.face);
    }

    async display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // place the camera 5 unit back from the origin
            
            this.children.push(context.scratchpad.mouse_controls = new defs.Mousepick_Controls());
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 2000);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const speed = 0.01;
        const mouse_vec = context.scratchpad.mouse_controls.mouse_vec().normalized();
        const camera_obj_x = 0;
        const camera_obj_y = 2;
        const camera_obj_z = 6;

        const m = this.meters_per_frame;
        const r = this.radians_per_frame;
        let man_transformation = this.get_man_transformation(context.scratchpad.controls.get_mouse_position(), dt * r, dt * m);

        const cur_pos = this.current_man_position;
        const target_pos = this.get_mouse_picking_location(vec4(cur_pos[0], cur_pos[1] + camera_obj_y, cur_pos[2], 1), mouse_vec, 0);
        const temp_moving_vec = target_pos.minus(vec4(cur_pos[0], cur_pos[1] + camera_obj_y, cur_pos[2], 1));

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

        const light_trans = Mat4.rotation(t/3, 0, 1, 0)
        const light_position = light_trans.times(vec4(-50, 30, 0, 1));
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 5000)];

        /**********
         * ISLAND *
         **********/
        this.draw_island(context, program_state, Mat4.translation(0, -5, 0));

        // Draw our house.
        this.draw_house(context, program_state, Mat4.translation(8, -1.5, 0));

        /***********************
         * COLLISION DETECTION *
         ***********************/
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
