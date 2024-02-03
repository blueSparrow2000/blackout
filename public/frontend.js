const mapImage = new Image();
mapImage.src = "/tiles1.png"

const canvasEl = document.getElementById('canvas');
canvasEl.width = window.innerWidth
canvasEl.height = window.innerHeight
const canvas = canvasEl.getContext("2d");

console.log(canvasEl);

const socket = io(`ws://localhost:5000`);

let map = [[]];
const TILE_SIZE = 128;

socket.on('connect', ()=>{
    console.log("connected!");
})

socket.on('map', (loadedMap)=>{
    map = loadedMap;
})


const TILES_IN_ROW = 23;

function loop(){
    canvas.clearRect(0,0,canvas.width, canvas.height)    
    for (let row = 0;row<map.length;row++){
        for (let col = 0;col<map.length;col++){
            const { id } = map[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;

            canvas.drawImage(mapImage, 
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,TILE_SIZE,
                col*TILE_SIZE, 
                row*TILE_SIZE,
                TILE_SIZE,TILE_SIZE,

                );
        }
    }

    window.requestAnimationFrame(loop);

}

window.requestAnimationFrame(loop);