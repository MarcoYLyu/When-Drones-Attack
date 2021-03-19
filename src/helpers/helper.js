import {collision_helper} from "./collision.js"
import {house_helper} from "./house.js"

let comps = Object.assign({}, {}, collision_helper);
comps = Object.assign({}, comps, house_helper);

export {comps};
