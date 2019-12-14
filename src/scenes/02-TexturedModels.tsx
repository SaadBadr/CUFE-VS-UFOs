import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4,vec2,vec4, mat3 } from 'gl-matrix';
import { Vector, Selector } from '../common/dom-utils';
import { createElement, StatelessProps, StatelessComponent } from 'tsx-create-element';

// In this scene we will draw a small scene with multiple textured models and we will explore Anisotropic filtering
export default class TexturedModelsScene extends Scene {
    program: ShaderProgram;
    camera: Camera;
    controller: FlyCameraController;
    meshes: {[name: string]: Mesh} = {};
    textures: {[name: string]: WebGLTexture} = {};
    anisotropy_ext: EXT_texture_filter_anisotropic; // This will hold the anisotropic filtering extension
    anisotropic_filtering: number = 0; // This will hold the maximum number of samples that the anisotropic filtering is allowed to read. 1 is equivalent to isotropic filtering.
//those varables for the rectangle i dont know why XD
    VAO: WebGLVertexArrayObject;
    positionVBO: WebGLBuffer;
    colorVBO: WebGLBuffer;
    EBO: WebGLBuffer;

    
    public load(): void {
        this.game.loader.load({
            ["texture.vert"]:{url:'shaders/texture.vert', type:'text'},
            ["texture.frag"]:{url:'shaders/texture.frag', type:'text'},
            ["house-model"]:{url:'models/House/House.obj', type:'text'},
            ["house-texture"]:{url:'models/House/House.jpeg', type:'image'},
            ["moon-texture"]:{url:'images/moon.jpg', type:'image'},
            ["craft0-model"]:{url:'models/Craft0/Craft0.obj', type:'text'},
            ["craft1-model"]:{url:'models/Craft1/Craft1.obj', type:'text'},
            ["craft0-texture"]:{url:'models/Craft0/Craft0.png', type:'image'},
            ["craft1-texture"]:{url:'models/Craft1/Craft1.png', type:'image'},
            ["gun-model"]:{url:'models/Gun/gun.obj', type:'text'},
            ["gun-texture"]:{url:'models/Gun/gun.png', type:'image'},
            ["ground-texture"]:{url:'images/asphalt.jpg', type:'image'},
            ["background1"]:{url:'images/backgrounds/background1.jpg', type:'image'}
        });
    } 
    
    public start(): void {
        this.program = new ShaderProgram(this.gl);
        this.program.attach(this.game.loader.resources["texture.vert"], this.gl.VERTEX_SHADER);
        this.program.attach(this.game.loader.resources["texture.frag"], this.gl.FRAGMENT_SHADER);
        this.program.link();

        this.meshes['moon'] = MeshUtils.Sphere(this.gl);
        this.meshes['ground'] = MeshUtils.Plane(this.gl, {min:[0,0], max:[100,100]});
        this.meshes['house'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["house-model"]);
        this.meshes['craft0'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["craft0-model"]);
        this.meshes['craft1'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["craft1-model"]);
        this.meshes['gun'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["gun-model"]);
        this.meshes['background'] = MeshUtils.Plane(this.gl, {min:[0,0], max:[2048,1536]});

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        
        this.textures['moon'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['moon']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['moon-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        // Instead of using a sampler, we send the parameter directly to the texture here.
        // While we prefer using samplers since it is a clear separation of responsibilities, anisotropic filtering is yet to be supported by sampler and this issue is still not closed on the WebGL github repository.  
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        
    //    this.textures['ground'] = this.gl.createTexture();
    //    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['ground']);
    //    const C0 = [26, 23, 15], C1 = [245, 232, 163];
    //    const W = 1024, H = 1024, cW = 256, cH = 256;
    //    let data = Array(W*H*3);
    //    for(let j = 0; j < H; j++){
    //        for(let i = 0; i < W; i++){
    //            data[i + j*W] = (Math.floor(i/cW) + Math.floor(j/cH))%2 == 0 ? C0 : C1;
    //        }
    //    }
    //    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
    //    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, W, H, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, new Uint8Array(data.flat()));
    //    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    //    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    //    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    //    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    //    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        

        this.textures['house'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['house']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['house-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);

        this.textures['gun'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['gun']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['gun-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);


        this.textures['craft0'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['craft0']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['craft0-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);

        this.textures['craft1'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['craft1']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['craft1-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);


        this.textures['ground'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['ground']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['ground-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);

        this.textures['background'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['background']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['background1']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);


        // Anisotropic filtering is not supported by WebGL by default so we need to ask the context for the extension.
        this.anisotropy_ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
        // The device does not support anisotropic fltering, the extension will be null. So we need to check before using it.
        // if it is supported, we will set our default filtering samples to the maximum value allowed by the device.
        if(this.anisotropy_ext) this.anisotropic_filtering = this.gl.getParameter(this.anisotropy_ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);

        this.camera = new Camera();
        this.camera.type = 'perspective';
        this.camera.position = vec3.fromValues(0,2,0);
        this.camera.direction = vec3.fromValues(-1,0,-2);
        this.camera.aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
       // this.controller = new FlyCameraController(this.camera, this.game.input);
       // this.controller.movementSensitivity = 0.01;
        

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.clearColor(0,0,0.15,1);

        this.setupControls();
    }
    
    public draw(deltaTime: number): void {
      //  this.controller.update(deltaTime);
        //this.time = this.time + 0.1;
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.program.use();

        let VP = this.camera.ViewProjectionMatrix;

        //ground:

        let groundMat = mat4.clone(VP);
        mat4.scale(groundMat, groundMat, [100, 1, 100]);

        this.program.setUniformMatrix4fv("MVP", false, groundMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['ground']);
        this.program.setUniform1i('texture_sampler', 0);
        // If anisotropic filtering is supported, we send the parameter to the texture paramters.
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['ground'].draw(this.gl.TRIANGLES);

        //background::

        let backgroundMat = mat4.clone(VP);
        mat4.scale(backgroundMat, backgroundMat, [100, 10000, 100]);
        mat4.translate(backgroundMat,backgroundMat,[0,1,0])
        this.program.setUniformMatrix4fv("MVP", false, groundMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['background']);
        this.program.setUniform1i('texture_sampler', 0);
        // If anisotropic filtering is supported, we send the parameter to the texture paramters.
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        //this.meshes['background'].draw(this.gl.TRIANGLES);





        let houseMat = mat4.clone(VP);
        mat4.translate(houseMat, houseMat, [-10, 0, -10]);

        this.program.setUniformMatrix4fv("MVP", false, houseMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['house']);
        this.program.setUniform1i('texture_sampler', 0);
        // If anisotropic filtering is supported, we send the parameter to the texture paramters.
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

       // this.meshes['house'].draw(this.gl.TRIANGLES);

        for(let i = 0; i < 2 ; i++){
        let craftMat = mat4.clone(VP);

        mat4.translate(craftMat, craftMat, [5*Math.cos(performance.now()/1000) + 5*i , 5, -20+ -5*Math.sin(performance.now()/1000) - 5*i]);
        mat4.scale(craftMat, craftMat, [0.01, 0.01, 0.01]);
        mat4.rotateY(craftMat,craftMat,performance.now()/500);


        this.program.setUniformMatrix4fv("MVP", false, craftMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['craft'+i.toString()]);
        this.program.setUniform1i('texture_sampler', 0);
        // If anisotropic filtering is supported, we send the parameter to the texture paramters.
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['craft'+i.toString()].draw(this.gl.TRIANGLES);


        }


        let gunMat = mat4.clone(VP);
    
        mat4.translate(gunMat, gunMat, [0,1.4,-2]);
        mat4.scale(gunMat, gunMat, [3, 3, 3]);
        mat4.rotateY(gunMat,gunMat,Math.PI/2);

        mat4.rotateY(gunMat, gunMat, this.game.input.MousePosition[0]/500);
        mat4.rotateZ(gunMat, gunMat, this.game.input.MousePosition[1]/500);


//        this.game.input.MousePosition;
//        mat4 vec = this.game.input.getMousePosition();
//        vec2.div(translation, translation, [this.game.canvas.width, this.game.canvas.height]);
//        vec2.add(translation, translation, [-0.5, -0.5]);
//        vec2.mul(translation, translation, [2, -2]); // In pixel coordinate y points down, while in NDC y points up so I multiply the y by -1




        this.program.setUniformMatrix4fv("MVP", false, gunMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['gun']);
        this.program.setUniform1i('texture_sampler', 0);
        // If anisotropic filtering is supported, we send the parameter to the texture paramters.
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['gun'].draw(this.gl.TRIANGLES);





        let moonMat = mat4.clone(VP);
        mat4.translate(moonMat, moonMat, [0, 10, -15]);
        mat4.rotateZ(moonMat, moonMat, Math.PI/8);
        mat4.rotateY(moonMat, moonMat, performance.now()/1000);

        this.program.setUniformMatrix4fv("MVP", false, moonMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['moon']);
        this.program.setUniform1i('texture_sampler', 0);
        // If anisotropic filtering is supported, we send the parameter to the texture paramters.
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['moon'].draw(this.gl.TRIANGLES);

        //this block is for getting the mouse position and draw a yellow rectangle in the mouse position
                let MatPlane = mat4.clone(this.camera.ViewProjectionMatrix);
                mat4.translate(MatPlane, MatPlane, [0, 4, 0]);
                // Now we will check if the user clicked the box
                // The first step is to get the mouse position in NDC (Normalized Device Coordinates)
                const mouse: vec2 = this.game.input.MousePosition;
                vec2.div(mouse, mouse, [this.game.canvas.width, this.game.canvas.height]);
                vec2.add(mouse, mouse, [-0.5, -0.5]);
                vec2.mul(mouse, mouse, [2, -2]); // In pixel coordinate y points down, while in NDC y points up so I multiply the y by -1
                // Then we apply the inverse of the MVP matrix to get vector in the local space of the object
                const mouseLocal: vec4 = vec4.fromValues(mouse[0], mouse[1], 0, 1);
                vec4.transformMat4(mouseLocal, mouseLocal, mat4.invert(mat4.create(), MatPlane));
                vec4.scale(mouseLocal, mouseLocal, 1/mouseLocal[3]);
                // Finally, we check if the mouse in the local space is inside our rectangle
                //draw a rectangle 
                const positions = new Float32Array([
                    mouseLocal[0],  mouseLocal[1], 0.0,
                    mouseLocal[0]+0.25,  mouseLocal[1], 0.0,
                    mouseLocal[0]+0.25,   mouseLocal[1]+0.25, 0.0,
                    mouseLocal[0],   mouseLocal[1]+0.25, 0.0,
                ]);

                const colors = new Uint8Array([
                    255,   255,   0, 255,
                    255, 255,   0, 255,
                    255,   255, 0, 255,
                    255,   255, 0, 255,
                ]);

                // This will be the data in the Elements Buffer. There are 6 elements since we draw 2 triangles
                // Each number in the elements buffer represent the index of the vertex needed to draw the triangle
                // We will use Uint32 but we can other unsigned integral types
                const elements = new Uint32Array([
                    0, 1, 2,
                    2, 3, 0
                ]);
            
                this.VAO = this.gl.createVertexArray();
                this.positionVBO = this.gl.createBuffer();
                this.colorVBO = this.gl.createBuffer();
                this.EBO = this.gl.createBuffer(); // We will create an additional buffer to store the elements
            
                this.gl.bindVertexArray(this.VAO);
            
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionVBO);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

                const positionAttrib = this.gl.getAttribLocation(this.program.program, "position");
                this.gl.enableVertexAttribArray(positionAttrib);
                this.gl.vertexAttribPointer(positionAttrib, 3, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorVBO);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);

                const colorAttrib = this.gl.getAttribLocation(this.program.program, "color");
                this.gl.enableVertexAttribArray(colorAttrib);
                this.gl.vertexAttribPointer(colorAttrib, 4, this.gl.UNSIGNED_BYTE, true, 0, 0);

                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.EBO); // Element buffers are bound to the ELEMENT_ARRAY_BUFFER target unlike the vertex buffers which are bound to ARRAY_BUFFER
                this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, elements, this.gl.STATIC_DRAW);

                // Besides storing "enableVertexAttribArray" and "vertexAttribPointer", the VAO will store "bindBuffer" if the target is "ELEMENT_ARRAY_BUFFER"
                this.gl.bindVertexArray(null);

                this.gl.useProgram(this.program.program);

                this.gl.bindVertexArray(this.VAO);
                // When using an Element buffer, we use "drawElements" instead of "drawArrays"
                // We have to define the data type of our elements here (unlike vertices where the data type is defined in "vertexAttribPointer")
                // the 2nd param is the number of elements to draw, and the 4th param is the index of the first vertex to start drawing from.
                this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_INT, 0);
                this.gl.bindVertexArray(null);
    }
    
    public end(): void {
        this.program.dispose();
        this.program = null;
        for(let key in this.meshes)
            this.meshes[key].dispose();
        this.meshes = {};
        for(let key in this.textures)
            this.gl.deleteTexture(this.textures[key]);
        this.textures = {};
        this.clearControls();
    }


    /////////////////////////////////////////////////////////
    ////// ADD CONTROL TO THE WEBPAGE (NOT IMPORTNANT) //////
    /////////////////////////////////////////////////////////
    private setupControls() {
        const controls = document.querySelector('#controls');
        
        

        controls.appendChild(
            <div>
                {!!this.anisotropy_ext?
                    <div className="control-row">
                        <label className="control-label">Anisotropic Filtering</label>
                        <input type="number" value={this.anisotropic_filtering} onchange={(ev: InputEvent)=>{this.anisotropic_filtering=Number.parseFloat((ev.target as HTMLInputElement).value)}}/>
                        <label className="conrol-label">Max: {this.gl.getParameter(this.anisotropy_ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}</label>
                    </div>
                    :
                    <div className="control-row">
                        <label className="control-label">Anisotropic Filtering is not supported on this device.</label>
                    </div>
                }
            </div>
            
        );
        
    }

    private clearControls() {
        const controls = document.querySelector('#controls');
        controls.innerHTML = "";
    }


}