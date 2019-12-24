import Camera from '../camera';
import Input from '../input';
import { vec3, vec2 } from 'gl-matrix';
import { Key } from 'ts-key-enum';

// This is a controller to simulate a flying Camera
// The controls are:
// Hold Left-Mouse-Button and Drag to rotate camera
// Hold Left-Mouse-Button + WASD to move and QE to go up or down
// Mouse Wheel to zoom in or out 
// Press T to toggle between Perspective and Orthographic

export default class FlyCameraController {
    camera: Camera;
    input: Input;
    width: number = 100;
    hight: number = 10;
    minHight: number = 2;
    yaw: number = 0;
    pitch: number = 0;

    yawSensitivity: number = 0.001;
    pitchSensitivity: number = 0.001;
    movementSensitivity: number = 0.001;
    fastMovementSensitivity: number = 0.01;

    constructor(camera: Camera, input: Input){
        this.camera = camera;
        camera.up = vec3.fromValues(0, 1, 0);
        this.input = input;
        
        const direction = camera.direction;
        this.yaw = Math.atan2(direction[2], direction[0]);
        this.pitch = Math.atan2(direction[1], vec2.len([direction[0], direction[1]]));
    }

    public update(deltaTime: number) {


            
            const movement = vec3.create();

            if(this.input.isKeyDown("d")) movement[0] += 1;
            if(this.input.isKeyDown("a")) movement[0] -= 1;
            if(this.input.isKeyDown("w")) movement[1] += 1;
            if(this.input.isKeyDown("s")) movement[1] -= 1;
            if(this.input.isKeyDown(" ")) return 1;

            if(this.camera.position[0] > this.width/2 && movement[0] > 0 ||  this.camera.position[0] < -this.width/2 && movement[0] < 0)
                movement[0] = 0;
            
            else if(this.camera.position[1] > this.hight && movement[1] > 0 ||  this.camera.position[1] < this.minHight  && movement[1] < 0)
            movement[1] = 0;

            vec3.normalize(movement, movement);
                        
            let movementSensitivity = this.input.isKeyDown(Key.Shift)?this.fastMovementSensitivity:this.movementSensitivity;
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.direction, movement[2]*movementSensitivity*deltaTime);
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.right, movement[0]*movementSensitivity*deltaTime);
            vec3.scaleAndAdd(this.camera.position, this.camera.position, this.camera.up, movement[1]*movementSensitivity*deltaTime);

        if(this.input.isKeyJustDown("t")){
            if(this.camera.type === 'orthographic') this.camera.type = 'perspective';
            else this.camera.type = 'orthographic';
        }
        if(this.camera.type === 'perspective'){            
            this.camera.perspectiveFoVy -= this.input.WheelDelta[1] * 0.001;
            this.camera.perspectiveFoVy = Math.min(Math.PI, Math.max(Math.PI/8, this.camera.perspectiveFoVy));
        } else if(this.camera.type === 'orthographic') {
            this.camera.orthographicHeight -= this.input.WheelDelta[1] * 0.01;
            this.camera.perspectiveFoVy = Math.max(0.001, this.camera.perspectiveFoVy);

        }

        return 0;
    }
}