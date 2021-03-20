import {defs, tiny} from "../examples/common.js";

const {
  Mat4, vec, vec4, Scene
} = tiny;

const mousepick_helper = {};

export { mousepick_helper };

const Mousepick_Controls = mousepick_helper.Mousepick_Controls =
    class Mousepick_Controls extends Scene {
        /**
         * Creates a new Mousepick_Controls module for the scene.
         * 
         * @param {(vec4, boolean) => String} checkCollision Given a vector in 4D space and the click
         * state, return some String describing what the ray intersects.
         */
        constructor(checkCollision = (() => "")) {
            super();

            this.checkCollision = checkCollision;
            this.selected = "";
            this.enabled_canvases = new Set();
            this.click = false;

            this.mouse = vec(0, 0);
            this.pos_world_far = vec4(0, 0, 0, 0);
            this.pos_world_near = vec4(0, 0, 0, 0);
            this.mouse_vec = () => this.pos_world_far.minus(this.pos_world_near);
        }

        /**
         * Registers mouse events to drawing canvas.
         * 
         * @param {HTMLCanvasElement} canvas Canvas to add event listeners to.
         */
        add_mouse_controls(canvas) {
            // Return the mouse position on the canvas within the range [0, 1].
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) => vec(
                (e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
                (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2)
            );

            // Register mouse movement on the canvas to update our anchor position.
            // Updates coordinates to be in NDCS: within the range [0, 1].
            canvas.addEventListener("mousemove", e => {
                e.preventDefault();
                this.mouse = mouse_position(e);
            });
            canvas.addEventListener("click", e => {
                e.preventDefault();
                this.click = true;
            });

            this.enabled_canvases.add(canvas);
        }

        display(context, program_state) {
            if (!this.enabled_canvases.has(context.canvas))
                this.add_mouse_controls(context.canvas);

            const P = program_state.projection_transform,
                  V = program_state.camera_inverse;

            // Computes our mouse near and far positions within the
            // perspective projection.
            const pos_ndc_near = vec4(...this.mouse, -1, 1),
                  pos_ndc_far = vec4(...this.mouse, 1, 1),
                  center_ndc_near = vec4(0, 0, -1, 1),
                  ndcs_to_world = Mat4.inverse(P.times(V)),
                  pos_world_near = ndcs_to_world.times(pos_ndc_near),
                  pos_world_far = ndcs_to_world.times(pos_ndc_far),
                  center_world_near = ndcs_to_world.times(center_ndc_near);
            pos_world_near.scale_by(1 / pos_world_near[3]);
            pos_world_far.scale_by(1 / pos_world_far[3]);
            center_world_near.scale_by(1 / center_world_near[3]);

            // Update our member variables, and check if we have
            // collided with any relevant objects in the scene.
            this.pos_world_far = pos_world_far;
            this.pos_world_near = pos_world_near;
            this.selected = this.checkCollision(this.mouse_vec(), false);
        }

        /**
         * Panel of readouts for mouse picking information.
         */
        make_control_panel() {
            // Reduces precision of Float32 vectors to something
            // printable.
            const roundVec = v => [...v].map(e => e.toFixed(2));

            this.control_panel.innerHTML += "Move your mouse around the scene to update the vector it creates.";
            this.new_line();
            this.new_line();
            this.live_string(e => e.textContent = `World position - near: (${roundVec(this.pos_world_near)})`);
            this.new_line();
            this.live_string(e => e.textContent = `World position - far: (${roundVec(this.pos_world_far)})`);
            this.new_line();
            this.new_line();
            this.live_string(e => e.textContent = `Formed mouse vector (world coordinates): (${roundVec(this.mouse_vec())})`)
            this.new_line();
        }
    }