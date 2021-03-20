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
            ball: new Cube(),
            ground: new Square(),
            background: new Square(),
            volcano: new Shape_From_File("assets/mount.obj"),
            island: new Shape_From_File("assets/ground.obj"),
            sky: new Shape_From_File("assets/sky.obj"),
            c1: new Shape_From_File("assets/character1.obj"),
            c2: new Shape_From_File("assets/character2.obj"),
        }
        //this.shapes.island.arrays.texture_coord.forEach( (v, i, l) =>
        //    l[i] = vec(200*v[0], 100*v[1]))

        this.materials = {
            phong: new Material(new defs.Phong_Shader(), {
                color: hex_color("#f5f53c"),
                ambient: 1, diffusivity: 1, specularity: 1,
            }),
            water: new Material(new Textured_Phong(), {
                color: hex_color("#474fae"),
                ambient: .4, diffusivity: .5, specularity: .5, texture: new Texture("assets/lake.png")
            }),
            face: new Material(new Textured_Phong(), {
                color: hex_color("#ddd6c3"),
                ambient: 0.7, diffusivity: 0.8
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
        for (let i = 0; i < 230; i++) {
            let surface = surfaces[i];
            if (this.Is_Inside(surface[0][0], surface[0][2],
                surface[1][0], surface[1][2],
                surface[2][0], surface[2][2], x, z)) {
                    return surface;
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

    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // place the camera 5 unit back from the origin
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 1000);
        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const light_position = vec4(-10, 10, 10, 1);
        /*
        let light_trans = Mat4.rotation(t/3, 0, 1, 0)
        let light_position = light_trans.times(vec4(-50, 30, 0, 1));
        let ball_trans = Mat4.rotation(t/3, 0, 1, 0)
            .times(Mat4.translation(-60, 30, 0))
            .times(Mat4.scale(3, 3, 3))
        this.shapes.ball.draw(context, program_state, ball_trans, this.materials.phong)
         */
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 10000)];

        let lake_trans = Mat4.translation(-19, -3.5, -3)
            .times(Mat4.scale(20, 5, 14))
        this.shapes.ball.draw(context, program_state, lake_trans, this.materials.water)


        let vol_trans = Mat4.translation(-15, 8, -20).times(Mat4.scale(15, 15, 15))
        this.shapes.volcano.draw(context, program_state, vol_trans, this.vol)
        let island_trans = Mat4.scale(this.island_scale, this.island_scale, this.island_scale)
        this.shapes.island.draw(context, program_state, island_trans, this.island)
        this.sky_trans = Mat4.translation(0, 30, 0).times(Mat4.scale(400, 400, 400))
        this.shapes.sky.draw(context, program_state, this.sky_trans, this.sky)

        let ground_trans = Mat4.rotation(Math.PI/2,1,0,0).times(Mat4.scale(100,100,1));
        this.shapes.ground.draw(context,program_state,ground_trans, this.materials.water);

        // When the program initiate, island_vertex_raw is empty somehow (async???), cause segfault
        // So run the script after few seconds.
        if (t > 0.6 && t < 0.7) {
            this.island_vertex = this.shapes.island.arrays.position.map(x => [x[0]*this.island_scale, x[1]*this.island_scale, x[2]*this.island_scale])
            let surface_indices = this.shapes.island.indices;
            this.surfaces = []
            for (let i= 0; i < 979; i+=3) { // surface_indices has 981 items
                this.surfaces.push([this.island_vertex[surface_indices[i]],
                    this.island_vertex[surface_indices[i + 1]],
                    this.island_vertex[surface_indices[i + 2]]])
            }
            this.surfaces = this.surfaces.filter(x => x[0][1] > 0 && x[1][1] > 0 && x[2][1] > 0)
        }
        if (t > 2.0) {
            let character_xz = [-t, t];

            //need to move character up by 2.5 unit
            let y_base = 2.5;

            let surface = this.find_Surface(this.surfaces, character_xz[0], character_xz[1]);
            let character_y = this.get_y(surface, character_xz[0], character_xz[1]) + y_base;
            let cha_trans = Mat4.translation(character_xz[0], character_y, character_xz[1]);
            if(t % 1 > 0.5) {
                this.shapes.c1.draw(context, program_state, cha_trans, this.character)
            } else {
                this.shapes.c2.draw(context, program_state, cha_trans, this.character)
            }


        }





    }
}