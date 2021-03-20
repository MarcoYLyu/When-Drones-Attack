import { defs, tiny } from "../examples/common.js";

const {
  Shape,
  Mat4,
} = tiny;
const { Cube, Subdivision_Sphere } = defs;

const actors_helper = {};

export { actors_helper };

const Alien = actors_helper.Alien = class Alien extends Shape {
  constructor() {
    super("position", "normal", "texture_coord");

    const subdivisions = 5;
    const arm_scale = Mat4.scale(0.5, 0.3, 0.5);

    // Central saucer.
    Subdivision_Sphere.insert_transformed_copy_into(
      this,
      [2],
      Mat4.scale(1, 0.7, 1),
    );

    // Create arms, one in each "corner" of the shape.
    [[-1, 0, 1], [1, 0, 1], [1, 0, -1], [-1, 0, -1]].forEach((t) => (
      Subdivision_Sphere.insert_transformed_copy_into(
        this,
        [subdivisions],
        Mat4.translation(...t).times(arm_scale),
      )
    ));
  }
};

const Player = actors_helper.Player = class Player extends Shape {
  constructor() {
    super("position", "normal", "texture_coord");
    Cube.insert_transformed_copy_into(this, [], Mat4.scale(0.35, 0.5, 0.25));
    Subdivision_Sphere.insert_transformed_copy_into(
      this,
      [5],
      Mat4.translation(0, 0.85, 0).times(Mat4.scale(0.35, 0.35, 0.25)),
    );
  }
};
