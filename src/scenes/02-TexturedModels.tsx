import { Scene } from '../common/game';
import ShaderProgram from '../common/shader-program';
import Mesh from '../common/mesh';
import * as MeshUtils from '../common/mesh-utils';
import Camera from '../common/camera';
import FlyCameraController from '../common/camera-controllers/fly-camera-controller';
import { vec3, mat4,vec2,vec4, mat3 } from 'gl-matrix';
import { Vector, Selector } from '../common/dom-utils';
import { createElement, StatelessProps, StatelessComponent } from 'tsx-create-element';

export default class TexturedModelsScene extends Scene {
    program: ShaderProgram;
    camera: Camera;
    controller: FlyCameraController;
    meshes: {[name: string]: Mesh} = {};
    textures: {[name: string]: WebGLTexture} = {};
    anisotropy_ext: EXT_texture_filter_anisotropic;
    anisotropic_filtering: number = 0; 
    VAO: WebGLVertexArrayObject;
    positionVBO: WebGLBuffer;
    colorVBO: WebGLBuffer;
    EBO: WebGLBuffer;
    numberOfCrafts0: number = 3;
    numberOfCrafts1: number = 5;
    diedCrafts0:boolean[] = new Array<boolean>(this.numberOfCrafts0);
    diedCrafts1:boolean[] = new Array<boolean>(this.numberOfCrafts1);
    TotaldiedCrafts:number = 0;
    options: {[name:string]:number};
    width:number; // world width
    hight:number; //// world hight
    velocity0:number; // radial velocity of craft 0
    velocity1:number; // radial velocity of craft 1
    MoonPosition:number[] = new Array<number>(3);
    audios:{[name:string]:any}={};

    public load(): void {
        this.game.loader.load({
            ["texture.vert"]:{url:'shaders/texture.vert', type:'text'},
            ["texture.frag"]:{url:'shaders/texture.frag', type:'text'},
            ["moon-texture"]:{url:'images/moon.jpg', type:'image'},
            ["craft0-model"]:{url:'models/Craft0/Craft0.obj', type:'text'},
            ["craft1-model"]:{url:'models/Craft1/Craft1.obj', type:'text'},
            ["craft0-texture"]:{url:'models/Craft0/Craft0.png', type:'image'},
            ["craft1-texture"]:{url:'models/Craft1/Craft1.png', type:'image'},
            ["target-model"]:{url:'models/Target/Target.obj', type:'text'},
            ["target-texture"]:{url:'models/Target/Target.png', type:'image'},
            ["ground-texture"]:{url:'images/asphalt.jpg', type:'image'},
            ["panel-model"]:{url:'models/Panel/panel.obj', type:'text'},
            ["panel-texture"]:{url:'models/Panel/panel.png', type:'image'},
            ["options"]:{url:'data/options.json', type:'json'}


        });
    } 
    

    //arrayname = new Array<vec3>();

    public start(): void {


        this.options = this.game.loader.resources["options"];
        this.numberOfCrafts0 = this.options["Blue Crafts Number"];
        this.numberOfCrafts1 = this.options["White Crafts Number"];
        this.velocity0 = this.options["Blue Crafts Radial Velocity"];
        this.velocity1 = this.options["White Crafts Radial Velocity"];
        this.width = this.options["World Width"];
        this.hight = this.options["World Hight"];
        //this.MoonPosition = new vec3();
        this.audios['hit'] = new Audio('audios/hit.mp3'); 
        this.audios['win'] = new Audio('audios/win.mp3'); 
        this.audios['lose'] = new Audio('audios/lose.mp3'); 
        this.audios['shot'] = new Audio('audios/shot.mp3'); 
        
        for (let index = 0; index < this.numberOfCrafts0; index++) 
            this.diedCrafts0[index] = false;
            
        for (let index = 0; index < this.numberOfCrafts1; index++) 
            this.diedCrafts1[index] = false;
            
        

        this.program = new ShaderProgram(this.gl);
        this.program.attach(this.game.loader.resources["texture.vert"], this.gl.VERTEX_SHADER);
        this.program.attach(this.game.loader.resources["texture.frag"], this.gl.FRAGMENT_SHADER);
        this.program.link();

        this.meshes['moon'] = MeshUtils.Sphere(this.gl);
        this.meshes['ground'] = MeshUtils.Plane(this.gl, {min:[0,0], max:[this.width,this.width]});
        this.meshes['craft0'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["craft0-model"]);
        this.meshes['craft1'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["craft1-model"]);
        this.meshes['panel'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["panel-model"]);
        this.meshes['target'] = MeshUtils.LoadOBJMesh(this.gl, this.game.loader.resources["target-model"]);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        
        this.textures['moon'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['moon']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['moon-texture']);
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

        this.textures['panel'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['panel']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['panel-texture']);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);

        this.textures['target'] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['target']);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.game.loader.resources['target-texture']);
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


        this.anisotropy_ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
        if(this.anisotropy_ext) this.anisotropic_filtering = this.gl.getParameter(this.anisotropy_ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);

        this.camera = new Camera();
        this.camera.type = 'perspective';
        this.camera.position = vec3.fromValues(0,1,0);
        this.camera.direction = vec3.fromValues(0,0,-2);
        this.camera.aspectRatio = this.gl.drawingBufferWidth/this.gl.drawingBufferHeight;
        
        this.MoonPosition[0] = this.options["Moon Xposition"]+this.camera.position[0]+this.camera.direction[0];
        this.MoonPosition[1] = this.options["Moon Yposition"]+this.camera.position[1]+this.camera.direction[1];
        this.MoonPosition[2] = this.options["Moon Zposition"]+this.camera.position[2]+this.camera.direction[2];



        this.controller = new FlyCameraController(this.camera, this.game.input);
        this.controller.movementSensitivity = 0.01;
        this.controller.width = this.width;
        this.controller.hight = this.hight;

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.frontFace(this.gl.CCW);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.clearColor(0,0,0.15,1);

        this.setupControls();
    }

    public draw(deltaTime: number): void {

        let shot = this.controller.update(deltaTime);
        if(shot == 1)
            this.audios['shot'].play();


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
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['ground'].draw(this.gl.TRIANGLES);

        for(let i = 0; i < this.numberOfCrafts0 ; i++ ){
           if (!(this.diedCrafts0[i]))
           {
                let craftMat = mat4.clone(VP);

                let x = -this.width/2 + i*this.controller.width/this.numberOfCrafts0 + Math.cos(performance.now()*this.velocity0);
                let y = this.controller.minHight + i*this.numberOfCrafts0/this.controller.hight + Math.cos(performance.now()*this.velocity0);
                let z = -20+ -5*Math.sin(performance.now()*this.velocity0) - 5*i + (i+1)*performance.now()/5000;
            
                mat4.translate(craftMat, craftMat, [x , y, z ]);
                mat4.scale(craftMat, craftMat, [0.01, 0.01, 0.01]);
                mat4.rotateY(craftMat,craftMat,performance.now()*this.velocity0);

                let p = vec2;
                p[0]=x;
                p[1]=y;
                if(shot == 1)               
                    this.checkCollision(p, i, 0);
                if(z >= this.camera.direction[2]+this.camera.position[2]-1){
                    this.audios['lose'].play();
                    this.end;
                }
                                

                this.program.setUniformMatrix4fv("MVP", false, craftMat);
                this.program.setUniform4f("tint", [1, 1, 1, 1]);

                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['craft0']);
                this.program.setUniform1i('texture_sampler', 0);

                if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

                this.meshes['craft0'].draw(this.gl.TRIANGLES);
           }
        }

        for(let i = 0; i < this.numberOfCrafts1; i++ ){
            if (!(this.diedCrafts1[i]))
            {
                let craftMat = mat4.clone(VP);
        
            
                let x = -this.width/2 + i*this.controller.width/this.numberOfCrafts1 + 5*Math.cos(performance.now()*this.velocity1);
                let y = this.controller.minHight + i*this.numberOfCrafts1/this.controller.hight + Math.sin(performance.now()*this.velocity1);
                let z = -10+ -5*Math.sin(performance.now()*this.velocity1) - 5*i + (i+1)*performance.now()/5000;
                
                let p = vec2;
                p[0]=x;
                p[1]=y;


                mat4.translate(craftMat, craftMat, [x , y, z ]);
                mat4.scale(craftMat, craftMat, [0.03, 0.03, 0.03]);
                mat4.rotateY(craftMat,craftMat,performance.now()*this.velocity1);

                if(shot == 1)
                    this.checkCollision(p, i,1);
                if(z >= this.camera.direction[2]+this.camera.position[2]-1){
                    this.audios['lose'].play();
                    this.end();
                }
        
                
                
        
                this.program.setUniformMatrix4fv("MVP", false, craftMat);
                this.program.setUniform4f("tint", [1, 1, 1, 1]);
        
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['craft1']);
                this.program.setUniform1i('texture_sampler', 0);

                if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);
        
                this.meshes['craft1'].draw(this.gl.TRIANGLES);
            }
        }
    




        let targetMat = mat4.clone(VP);
       
        mat4.translate(targetMat, targetMat, [this.camera.position[0]+this.camera.direction[0],this.camera.position[1]+this.camera.direction[1],this.camera.direction[2]+this.camera.position[2]]);
        mat4.scale(targetMat, targetMat, [0.05, 0.05, 0.05]);

        this.program.setUniformMatrix4fv("MVP", false, targetMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['target']);
        this.program.setUniform1i('texture_sampler', 0);
        // If anisotropic filtering is supported, we send the parameter to the texture paramters.
        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['target'].draw(this.gl.TRIANGLES);

        let moonMat = mat4.clone(VP);
        mat4.translate(moonMat, moonMat, this.MoonPosition);
        mat4.rotateZ(moonMat, moonMat, Math.PI/8);
        mat4.rotateY(moonMat, moonMat, performance.now()/1000);

        this.program.setUniformMatrix4fv("MVP", false, moonMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['moon']);
        this.program.setUniform1i('texture_sampler', 0);

        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['moon'].draw(this.gl.TRIANGLES);
      
        let panelMat = mat4.clone(VP);
        mat4.translate(panelMat, panelMat, [this.camera.position[0]+this.camera.direction[0],this.camera.position[1]+this.camera.direction[1]-3,this.camera.direction[2]+this.camera.position[2]+1]);
        mat4.scale(panelMat, panelMat, [0.03, 0.02, 0.01]);
        mat4.rotateY(panelMat, panelMat, -Math.PI/2);

        this.program.setUniformMatrix4fv("MVP", false, panelMat);
        this.program.setUniform4f("tint", [1, 1, 1, 1]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures['panel']);
        this.program.setUniform1i('texture_sampler', 0);

        if(this.anisotropy_ext) this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropy_ext.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropic_filtering);

        this.meshes['panel'].draw(this.gl.TRIANGLES);


    }

    public checkCollision(craftMat,i:number,id:number): void {

            let x = this.camera.direction[0] + this.camera.position[0];
            let y = this.camera.direction[1] + this.camera.position[1];

            let xcraft = craftMat[0];
            let ycraft = craftMat[1];

            let range = 1;
            if(x <= xcraft+range && x >= xcraft-range && y <= ycraft+range && y >= ycraft-range)
               {    
                    this.audios['hit'].play();
                    this.TotaldiedCrafts = this.TotaldiedCrafts + 1;
                    if(id == 0)
                        this.diedCrafts0[i] = true;
                    else
                        this.diedCrafts1[i] = true;
               }
            
               if(this.TotaldiedCrafts >= this.numberOfCrafts0 + this.numberOfCrafts1)
               {
                   this.audios['win'].play();
                   this.end();    
               }
       

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


    ///////////////////////////////////////////////////////////
    ////// ADD CONTROL TO THE WEBPAGE ////////////////////////
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