// Here, we import the things we need from other script files 
import Game from './common/game';
import TexturedModelsScene from './scenes/02-TexturedModels';

// First thing we need is to get the canvas on which we draw our scenes
const canvas: HTMLCanvasElement = document.querySelector("#app");

// Then we create an instance of the game class and give it the canvas
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
const game = new Game(canvas);

// Here we list all our scenes and our initial scene
const scenes = {
    "Textured Models": TexturedModelsScene,
};
const initialScene = "Textured Models";

// Then we add those scenes to the game object and ask it to start the initial scene
game.addScenes(scenes);
game.startScene(initialScene);
