import {defs, tiny} from "../examples/common.js"

const {
    Vector, vec, vec3, vec4
} = tiny;

const collision_helper = {};

export {collision_helper};

const Collision_Helper = collision_helper.Collision_Helper =
    class Collision_Helper {
        constructor() {

        }

        static distance(point1, point2) {
            return (point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2 + (point1[2] - point2[2]) ** 2;
        }

        static euclidean_distance(point1, point2) {
            return Math.sqrt(this.distance(point1, point2));
        }

        static get_farthest_points(positions) {
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

        static has_sphere_collision(points, center, radius, leeway) {
            let res = false;
            for (let point of points) {
                let temp = this.euclidean_distance(point, center);
                if (temp + leeway <= radius) {
                    res = true;
                }
            }
            return res;
        }

        static has_square_collision(point, maxx, minx, maxz, minz, leewayx = 0, leewayy = 0) {
            let x = point[0];
            let z = point[2];
            if (x + leewayx < maxx && x - leewayx > minx && z + leewayy < maxz && z - leewayy > minz) {
                return true;
            }
            return false;
        }

        static get_obj_positions(object, trans) {
            return new Promise(resolve => {
                setTimeout(() => {
                    let res = [];
                    let temp = object.arrays.position;
                    temp.forEach(point => res.push(trans.times(point.to4(true))));
                    resolve(res);
                }, 500);
            });
        }

        static async get_xz_boundaries_helper(object, transformation) {
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
    }