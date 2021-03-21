import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from './examples/obj-file-demo.js'
import {comps} from './helpers/helper.js';


const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Axis_Arrows, Textured_Phong, Regular_2D_Polygon, Cube, Square} = defs
const {Alien, Roof, House, Collision_Helper, Mousepick_Controls} = comps;

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
            c1: new Shape_From_File("assets/character1.obj"),
            c2: new Shape_From_File("assets/character2.obj"),
            roof: new Roof(),
            house: new House(),
            ball: new Cube(),
            block: new Cube(),
            ground: new Square(),
            face: new Regular_2D_Polygon(1, 3),
            man: new Cube(),
            target: new Square(),
            alien: new Alien(),
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
                color: hex_color("#474fae"),
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
            color: hex_color("#385101"), //#208f52
            ambient: .4, diffusivity: .3, specularity: .3, texture: new Texture("assets/gray.jpg")
        });
        this.island = new Material(new defs.Phong_Shader(), {
            color: hex_color("#4da036"),
            ambient: .7, diffusivity: .4, specularity: .4
        });
        this.sky = new Material(new Textured_Phong(), {
            color: hex_color("#000000"),
            ambient: 1, diffusivity: 1, specularity: .1, texture: new Texture("assets/sky.jpg")
        });
        this.character = new Material(new Textured_Phong(), {
            color: hex_color("#9d9898"),
            ambient: .5, diffusivity: .5, specularity: .5, texture: new Texture("assets/gray.jpg")
        });

        this.island_scale = 60;
        // the map function doesn't work, it worked initially
        //this.island_vertex = this.shapes.island.arrays.position.map(x => [x[0]*this.island_scale, x[1]*this.island_scale, x[2]*this.island_scale])

        //this.island_vertex = []
        //for (let i = 0; i < 751; i++) {
        //    let x = island_vertex_raw[i]
        //    this.island_vertex.push([x[0]*this.island_scale, x[1]*this.island_scale, x[2]*this.island_scale])
        //}


        this.initial_camera_location = Mat4.look_at(vec3(0, 50, 100), vec3(0, 0, 0), vec3(0, 1, 0));

        // Movement members.
        this.initial_man_transformation = Mat4.translation(0, 0, 10);
        this.current_man_position = vec4(0, 0, 0, 1);
        this.moving = false;
        this.itr = 0;

        // Cutscene status.
        this.cutscenePlayed = false;
        this.cutsceneStart = undefined;
    }

    Area_xz(x1, z1, x2, z2, x3, z3) {
        return Math.abs((x1 * (z2 - z3) + x2 * (z3 - z1)
            + x3 * (z1 - z2)) / 2.0)
    }

    Is_Inside(x1, z1, x2, z2, x3, z3, x, z) {
        let A = this.Area_xz (x1, z1, x2, z2, x3, z3)
        let A1 = this.Area_xz (x, z, x2, z2, x3, z3)
        let A2 = this.Area_xz (x1, z1, x, z, x3, z3)
        let A3 = this.Area_xz (x1, z1, x2, z2, x, z)
        let A_total = A1 + A2 + A3;

        if (A >= A_total-0.05 && A <= A_total+0.05){
            return true;
        } else {
            return false;
        }
    }

    find_Surface(surfaces, x, z) {
        if (surfaces) {
            for (let i = 0; i < 230; i++) {
                let surface = surfaces[i];
                if (this.Is_Inside(surface[0][0], surface[0][2],
                    surface[1][0], surface[1][2],
                    surface[2][0], surface[2][2], x, z)) {
                        return surface;
                    }
            }
        }
        // Bug if you can't find one
        return [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]]; //indicate error
    }

    get_y(surface, x, z) {
        let p1 = surface[0];
        let p2 = surface[1];
        let p3 = surface[2];
        let a = (p2[1]-p1[1])*(p3[2]-p1[2])-(p3[1]-p1[1])*(p2[2]-p1[2]);
        let b = (p2[2]-p1[2])*(p3[0]-p1[0])-(p3[2]-p1[2])*(p2[0]-p1[0]);
        let c = (p2[0]-p1[0])*(p3[1]-p1[1])-(p3[0]-p1[0])*(p2[1]-p1[1]);
        let d = -(a*p1[0] + b*p1[1] + c*p1[2]);
        return (-d-a*x-c*z) / b;
    }

    make_control_panel() {
        this.live_string(box => box.textContent = `Current stage: ${this.cutscenePlayed ? "Defend" : "Cutscene"}`);
        this.new_line();
        this.new_line();
        this.key_triggered_button("forward", ["w"], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("backward", ["s"], () => this.thrust[2] = 1,
        undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("left", ["a"], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0);
        this.new_line();
        this.key_triggered_button("left", ["d"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
        this.new_line();
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
                            Mat4.translation(-15, 9, -20)
                            .times(Mat4.scale(30, 30, 30))
                        );
        const island_trans = base_translation.times(Mat4.scale(this.island_scale, this.island_scale, this.island_scale));
        this.shapes.volcano.draw(context, program_state, vol_trans, this.vol);
        this.shapes.island.draw(context, program_state, island_trans, this.island);
        const sky_trans = Mat4.translation(0, 30, 0)
                            .times(Mat4.scale(500, 500, 500))
        this.shapes.sky.draw(context, program_state, sky_trans, this.sky);
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

    // Introductory cutscene. Alien destroys the player's house.
    cutscene(context, program_state) {
        const t = program_state.animation_time / 1000;

        // If we haven't started the cutscene yet, record it.
        if (!this.cutsceneStart) this.cutsceneStart = t;

        // Shakes the home.
        const displacement_speed = 50;
        const displacement_amount = -0.1;
        const house_displacement = displacement_amount + displacement_amount * Math.sin((t * displacement_speed) % (2 * Math.PI));

        // Controls the rotation and position of the alien.
        const rotation_speed = 5;
        const alien_size = vec3(2, 0.75, 3);
        const alien_position = vec3(8, -1.5 + 5, 0);
        const alien_angle = (t * rotation_speed) % (2 * Math.PI);

        // We have to fix our camera to the action.
        program_state.set_camera(Mat4.look_at(
            vec3(10, 5, 20),
            vec3(8, -1.5, 0),
            vec3(0, 1, 0)
        ));

        // Draw our primary actors.
        this.shapes.alien.draw(
            context,
            program_state,
            Mat4.translation(...alien_position)
                .times(Mat4.scale(...alien_size))
                .times(Mat4.rotation(alien_angle, 0, 1, 0)),
            this.materials.face.override({
                color: hex_color("#ff0000"),
            }),
        );
        this.draw_house(context, program_state, Mat4.translation(8, -1.5 - house_displacement, 0));

        // Check if we need to hand off to the game.
        if (t - this.cutsceneStart > 5.0) this.cutscenePlayed = true;
    }

    // The actual "game". Player moves around, can use mouse-picked movement, etc.
    async game(context, program_state) {
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

        //The Foot of Character is 2.5 unit below local origin, move 2.5 - 5 = -2.5 in y direction
        const y_base = -2.5;

        let surface = this.find_Surface(this.surfaces, posx, posz);
        let character_y = this.get_y(surface, posx, posz) + y_base;
        let cha_trans = Mat4.translation(posx, character_y, posz);
        if(t % 1 > 0.5) {
            this.shapes.c1.draw(context, program_state, cha_trans, this.character)
        } else {
            this.shapes.c2.draw(context, program_state, cha_trans, this.character)
        }

        program_state.set_camera(Mat4.look_at(vec3(camerax, cameray, cameraz), vec3(posx, posy, posz), vec3(0, 1, 0)));
            
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 1000);

        const light_trans = Mat4.rotation(t/3, 0, 1, 0)
        const light_position = light_trans.times(vec4(-50, 30, 0, 1));
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 5000)];

        // Draw our core components.
        this.draw_island(context, program_state, Mat4.translation(0, -5, 0));
        this.draw_house(context, program_state, Mat4.translation(8, 0.7, 0));

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
        //this.shapes.man.draw(context, program_state, this.initial_man_transformation.times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.roof);
            
        if (temp_moving_vec.norm() !== 0.0) {
            this.shapes.target.draw(context, program_state, Mat4.translation(temp[0], temp[1], temp[2]).times(this.initial_man_transformation)
                                                                .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
                                                                .times(Mat4.translation(0, 0, 1)), this.materials.roof);
        }
    }

    async display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // place the camera 5 unit back from the origin
            
            this.children.push(context.scratchpad.mouse_controls = new Mousepick_Controls());
        }

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 2000);

        const light_trans = Mat4.rotation(t/3, 0, 1, 0)
        const light_position = light_trans.times(vec4(-50, 30, 0, 1));
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 5000)];

        // The island is a constant fixture in our scene.
        this.draw_island(context, program_state, Mat4.translation(0, -10, 0));

        // Play the cutscene first.
        if (!this.cutscenePlayed)
            return this.cutscene(context, program_state);

        // Register our island vertices to the program.
        // Apply scale transformation to island vertices.
        this.island_vertex = this.shapes.island.arrays.position.map(x => [x[0]*this.island_scale, x[1]*this.island_scale, x[2]*this.island_scale])
        let surface_indices = this.shapes.island.indices;
        this.surfaces = []
        for (let i= 0; i < 979; i+=3) { // surface_indices has 981 items
            this.surfaces.push([this.island_vertex[surface_indices[i]],
                this.island_vertex[surface_indices[i + 1]],
                this.island_vertex[surface_indices[i + 2]]]);
        }
        this.surfaces = this.surfaces.filter(x => x[0][1] > 0 && x[1][1] > 0 && x[2][1] > 0);

        // Display our game mode.
        this.game(context, program_state);
    }
}
