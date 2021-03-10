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
        this.key_triggered_button("forward", ["w"], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("backward", ["s"], () => this.thrust[2] = 1,
        undefined, () => this.thrust[2] = 0);
        this.new_line();
        this.key_triggered_button("left", ["a"], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0);
        this.new_line();
        this.key_triggered_button("left", ["d"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
    }

    get_man_transformation(mouse_from_center, radians_per_frame, meters_per_frame, leeway = 70) {
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

    distance(point1, point2) {
        return (point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2 + (point1[2] - point2[2]) ** 2;
    }

    euclidean_distance(point1, point2) {
        return Math.sqrt(this.distance(point1, point2));
    }

    get_farthest_points(positions) {
        let point1;
        let point2;
        let dist = -1;
        for (let itr1 of positions) {
            for (let itr2 of positions) {
                let temp = this.distance(itr1, itr2);
                if (temp > dist) {
                    dist = temp;
                    point1 = itr1;
                    point2 = itr2;
                }
            }
        }
        return [point1, point2];
    }

    has_sphere_collision(points, center, radius, leeway) {
        let res = false;
        for (let point of points) {
            let temp = this.euclidean_distance(point, center);
            if (temp + leeway <= radius) {
                res = true;
            }
        }
        return res;
    }

    has_square_collision(point, maxx, minx, maxz, minz, leewayx = 0, leewayy = 0) {
        let x = point[0];
        let z = point[2];
        if (x + leewayx < maxx && x - leewayx > minx && z + leewayy < maxz && z - leewayy > minz) {
            return true;
        }
        return false;
    }
    
    get_obj_positions(object, trans) {
        return new Promise(resolve => {
            setTimeout(() => {
                let res = [];
                let temp = object.arrays.position;
                temp.forEach(point => res.push(trans.times(point.to4(true))));
                resolve(res);
            }, 500);
        });
    }

    async get_xz_boundaries_helper(object, transformation) {
        let temp = await this.get_obj_positions(object, transformation);   
        let maxz = -1;
        let minz = 100;
        let maxx = -1;
        let minx = 100;
        for (let point of temp) {
            maxx = Math.max(maxx, point[0]);
            minx = Math.min(minx, point[0]);
            maxz = Math.max(maxz, point[2]);
            minz = Math.min(minz, point[2]);
        }
        return [maxx, minx, maxz, minz];
    }

    async display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

            // Initialize mousepicking controls.
            this.children.push(new defs.Mousepick_Controls((mouse_vec) => {
                // Intersection detection code goes here.
                return "Nothing";
            }));

            // place the camera 5 unit back from the origin
            //program_state.set_camera(this.initial_camera_location);
        }

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const m = this.meters_per_frame;
        const r = this.radians_per_frame;
        let man_transformation = this.get_man_transformation(context.scratchpad.controls.get_mouse_position(), dt * r, dt * m);

        this.current_man_position = man_transformation.times(vec4(0, 0, 0, 1));
        let camera_pos = man_transformation.times(vec4(0, 3, 10, 1));

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
        this.shapes.man.draw(context, program_state, )

    }
}