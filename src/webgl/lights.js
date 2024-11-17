import { mat4, quat, vec3 } from "../math/helpers.js";
import { m4 } from "../math/utils.js";

export class Lights {
    constructor(pos, color, nodeKey) {
        this.position = vec3.set(vec3.create(), pos[0], pos[1], pos[2]);
        this.color = vec3.set(vec3.create(), color[0], color[1], color[2]);
        this.nodeKey = nodeKey;
    }

    getUniforms(node) {
        // const position = mat4.fromRotationTranslationScale(mat4.create(), quat.fromEuler(quat.create(), 0, 0, 0), this.position, vec3.fromValues(vec3.create(), 1, 1, 1));
        const position = m4.translation(this.position[0], this.position[1], this.position[2]);
        const update = mat4.copy(mat4.create(), position);
        const convert = mat4.multiply(update, update, node.worldMatrix);
        const new_position = [update[12], update[13], update[14]];
        // console.log(new_position);

        const x = {
            u_worldLightPosition: new_position,
            u_lightColor: this.color,
        };
        return x;
    }
}
