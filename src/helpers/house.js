import {defs, tiny} from "../examples/common.js"

const {vec3, Vector, Vector3, Shape, Texture, Mat4, color, hex_color, Material} = tiny;
const {Cube, Cylindrical_Tube, Regular_2D_Polygon} = defs;

const house_helper = {};

export {house_helper};

const Roof = house_helper.Roof =
    class Roof extends Shape {
        constructor() {
            super("position", "normal", "texture_coord");

            Cylindrical_Tube.insert_transformed_copy_into(this, [3, 3]);
        }
    }

const Prism = house_helper.Prism =
    class Prism extends Shape {
        constructor(rows, columns, texture_range) {
            super("position", "normal", "texture_coord");

            Cylindrical_Tube.insert_transformed_copy_into(this, [rows, columns, texture_range]);
            Regular_2D_Polygon.insert_transformed_copy_into(this, [1, columns], Mat4.translation(0, 0, .5));
            Regular_2D_Polygon.insert_transformed_copy_into(this, [1, columns], Mat4.translation(0, 0, -.5));
        }
    }

const Blockwroof = house_helper.Blockwroof =
    class Blockwroof extends Shape {
        constructor() {
            super("position", "normal", "texture_coord");

            Cube.insert_transformed_copy_into(this, [], Mat4.scale(1.5, 1, 2));
            Prism.insert_transformed_copy_into(this, [3, 3], Mat4.scale(1.5, 1, 2)
            .times(Mat4.translation(0, 1, 0))
            .times(Mat4.rotation(Math.PI / 2, 0, 0, 1))
            .times(Mat4.scale(1, 1.16, 2))
            .times(Mat4.translation(0.5, 0, 0)));
        }
    }

const House = house_helper.House =
    class House extends Shape {
        constructor() {
            super("position", "normal", "texture_coord");

            Blockwroof.insert_transformed_copy_into(this, [], Mat4.identity());
            Blockwroof.insert_transformed_copy_into(this, [], Mat4.translation(0.75, -0.5, 3).times(Mat4.scale(1.5, 0.5, 0.5)));
            Blockwroof.insert_transformed_copy_into(this, [], Mat4.rotation(Math.PI / 2, 0, 1, 0).times(Mat4.scale(1.5, 0.5, 0.7)).times(Mat4.translation(0, -1, 3)));
        }
    }