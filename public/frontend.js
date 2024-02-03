// frontend constants
const TICKRATE = 15
const SCREENWIDTH = 1024
const SCREENHEIGHT = 576

const MAPWIDTH = 128*30
const MAPHEIGHT = 128*30

let cursorX = 0
let cursorY = 0

const frontEndPlayers = {} 
const frontEndProjectiles = {} 
const frontEndItems = {}
const frontEndEnemies = {}
const frontEndObjects = {}


const LobbyBGM = new Audio("/sound/Lobby.mp3")
const shothitsound = new Audio("/sound/shothit.mp3")
const playerdeathsound = new Audio("/sound/playerdeath.mp3")


const mapImage = new Image();
mapImage.src = "/tiles1.png"

const charImage = new Image();
charImage.src = "/character.png"


// resolution upgrade - retina display gives value 2
const devicePixelRatio = window.devicePixelRatio || 1 //defaut 1

const canvasEl = document.getElementById('canvas');
canvasEl.width = window.innerWidth//SCREENWIDTH* devicePixelRatio//window.innerWidth* devicePixelRatio
canvasEl.height = window.innerHeight//SCREENHEIGHT* devicePixelRatio//window.innerHeight* devicePixelRatio
const canvas = canvasEl.getContext("2d");
canvas.scale(devicePixelRatio,devicePixelRatio) 

const pointEl = document.querySelector('#pointEl')

// map info
let map = [[]];
const TILE_SIZE = 128;
const TILES_IN_ROW = 23;

// get socket
const socket = io();//io(`ws://localhost:5000`);

socket.on('connect', ()=>{
    console.log("connected!");
})

socket.on('map', (loadedMap)=>{
    map = loadedMap;
})

// player info 
let frontEndPlayer
let listen = true // very important for event listener 


const keys = {
    w:{
      pressed: false
    },
    a:{
      pressed: false
    },
    s:{
      pressed: false
    },
    d:{
      pressed: false
    },
    digit1:{ // weapon slot 1
      pressed: false
    },
    digit2:{ // weapon slot 1
      pressed: false
    },
    digit3:{ // fist slot
      pressed: false
    },
    digit4:{ // medkit slot
      pressed: false
    },
    f:{ // interact - grab/change items of current slot etc
      pressed: false
    },
    space:{ // hold fire
      pressed: false
    },
    g:{ // minimap
      pressed: false
    },
    r:{ // reload
      pressed: false
    },
  }


  window.addEventListener('keydown', (event) => {
    //if (!frontEndPlayers[socket.id]) return // if player does not exist
  
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.w.pressed = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        keys.a.pressed = true
        break
      case 'KeyS':
      case 'ArrowDown':
        keys.s.pressed = true
        break
      case 'KeyD':
      case 'ArrowRight':
        keys.d.pressed = true
        break
      case 'Digit1':
        keys.digit1.pressed = true
        break
      case 'Digit2':
        keys.digit2.pressed = true
        break
      case 'Digit3':
        keys.digit3.pressed = true
        break
      case 'Digit4':
        keys.digit4.pressed = true
        break
      case 'KeyF':
        keys.f.pressed = true
        break
      case 'Space':
        keys.space.pressed = true
        break
      case 'KeyG':
        keys.g.pressed = true
        break
      case 'KeyR':
        keys.r.pressed = true
        break
    }
  })
  
  window.addEventListener('keyup',(event)=>{
    //if (!frontEndPlayers[socket.id]) return // if player does not exist
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.w.pressed = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        keys.a.pressed = false
        break
      case 'KeyS':
      case 'ArrowDown':
        keys.s.pressed = false
        break
      case 'KeyD':
      case 'ArrowRight':
        keys.d.pressed = false
        break
      case 'Digit1':
        keys.digit1.pressed = false
        break
      case 'Digit2':
        keys.digit2.pressed = false
        break
      case 'Digit3':
        keys.digit3.pressed = false
        break
      case 'Digit4':
        keys.digit4.pressed = false
        break
      case 'KeyF':
        keys.f.pressed = false
        break
      case 'Space':
        keys.space.pressed = false
        break
      case 'KeyG':
        keys.g.pressed = false
        break
      case 'KeyR':
        keys.r.pressed = false
        break
    }
  })
  
  addEventListener('mousemove', (event) => {
    const {top, left} = canvasEl.getBoundingClientRect()
    // update mousepos if changed
    cursorX = (event.clientX-left)
    cursorY = (event.clientY-top)
  })

  
  // periodically request backend server
  setInterval(()=>{
    if (keys.digit1.pressed){
      socket.emit('keydown',{keycode:'Digit1'})
    }
    if (keys.digit2.pressed){
      socket.emit('keydown',{keycode:'Digit2'})
    }
    if (keys.digit3.pressed){
      socket.emit('keydown',{keycode:'Digit3'})
    }
    if (keys.digit4.pressed){
      socket.emit('keydown',{keycode:'Digit4'})
    }
    if (keys.f.pressed){
      socket.emit('keydown',{keycode:'KeyF'})
    }
    // dont have to emit since they are seen by me(a client, not others)
    if (keys.g.pressed){
      socket.emit('keydown',{keycode:'KeyG'})
    }
    if (keys.r.pressed){ // reload lock? click once please... dont spam click. It will slow your PC
      socket.emit('keydown',{keycode:'KeyR'})
    }
  
    const Movement = keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed
  
    if (Movement && keys.space.pressed){ // always fire hold = true since space was pressed
    // update frequent keys at once (Movement & hold shoot)
      socket.emit('moveNshootUpdate', {WW: keys.w.pressed, AA: keys.a.pressed,SS: keys.s.pressed,DD: keys.d.pressed, x:cursorX, y:cursorY})
  
    } else if (Movement){
    // update frequent keys at once (Movement only)
      socket.emit('movingUpdate', {WW: keys.w.pressed, AA: keys.a.pressed, SS: keys.s.pressed, DD: keys.d.pressed, x:cursorX, y:cursorY})
  
    } else if(keys.space.pressed){ // always fire hold = true since space was pressed
      socket.emit('holdUpdate',{x:cursorX, y:cursorY})
  
    } else{ // builtin
      socket.emit('playermousechange', {x:cursorX,y:cursorY}) // report mouseposition every TICK, not immediately
    } 
  },TICKRATE)




// backend -> front end signaling
socket.on('updateFrontEnd',({backEndPlayers, backEndEnemies, backEndProjectiles, backEndObjects, backEndItems})=>{
    /////////////////////////////////////////////////// 1.PLAYER //////////////////////////////////////////////////
    const myPlayerID = socket.id

    for (const id in backEndPlayers){
      const backEndPlayer = backEndPlayers[id]
  
      // add player from the server if new
      if (!frontEndPlayers[id]){
        // Item: inventory management
        const inventorySize = backEndPlayer.inventory.length
        let frontEndInventory = []
        // for (let i=0;i<inventorySize;i++){
        //   const backEndItem = backEndPlayer.inventory[i]
        //   let isItem = instantiateItem(backEndItem,backEndItem.myID) // add item to frontenditem on index: backEndItem.myID
        //   frontEndInventory[i] = backEndItem.myID // put itemsId to frontenditem list - like a pointer
        // }
        
        frontEndPlayers[id] = new Player({
          x: backEndPlayer.x, 
          y: backEndPlayer.y, 
          radius: backEndPlayer.radius, 
          color: backEndPlayer.color,
          username: backEndPlayer.username,
          health: backEndPlayer.health,
          currentSlot: 1,
          inventory: frontEndInventory,
          currentPos: {x:cursorX,y:cursorY}, // client side prediction mousepos
          score: backEndPlayer.score,
          wearingarmorID: backEndPlayer.wearingarmorID
        })
  
          document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}"> > ${backEndPlayer.username} </div>`
  
      } else {      // player already exists
            let frontEndPlayerOthers = frontEndPlayers[id] 

            frontEndPlayerOthers.x = backEndPlayer.x
            frontEndPlayerOthers.y = backEndPlayer.y

            // update players attributes
            frontEndPlayerOthers.health = backEndPlayer.health
            frontEndPlayerOthers.score = backEndPlayer.score
            frontEndPlayerOthers.wearingarmorID = backEndPlayer.wearingarmorID
    
            // inventory attributes
            frontEndPlayerOthers.currentSlot = backEndPlayer.currentSlot
            // Item: inventory management
            const inventorySize = backEndPlayer.inventory.length
            for (let i=0;i<inventorySize;i++){
                const backEndItem = backEndPlayer.inventory[i]
                frontEndPlayerOthers.inventory[i] = backEndItem.myID
            }
    
            if (id === myPlayerID){ // client side prediction - mouse pointer
                frontEndPlayerOthers.cursorPos = {x:cursorX,y:cursorY}
    
            }else{
                frontEndPlayerOthers.cursorPos = backEndPlayer.mousePos
            }
  
      }
    }
  
    frontEndPlayer = frontEndPlayers[myPlayerID] // assign global variable
  
    // remove player from the server if current player does not exist in the backend
    for (const id in frontEndPlayers){
        if (!backEndPlayers[id]){
            console.log("WTF")
            const divToDelete = document.querySelector(`div[data-id="${id}"]`)
            divToDelete.parentNode.removeChild(divToDelete)
        
            // if I dont exist
            if (id === myPlayerID) {     // reshow the start button interface
                const mePlayer = frontEndPlayers[myPlayerID]
        
                pointEl.innerHTML = mePlayer.score
                playerdeathsound.play()
                document.querySelector('#usernameForm').style.display = 'block'
                LobbyBGM.play()
            }
            else{ // other player died
                shothitsound.play()
            }
        
            delete frontEndPlayers[id]
            return // pass below steps since I died
        }
    }
    /////////////////////////////////////////////////// 2.ENEMIES //////////////////////////////////////////////////
    // for (const id in backEndEnemies) {
    //   const backEndEnemy = backEndEnemies[id]
  
    //   if (!frontEndEnemies[id]){ // new 
    //     frontEndEnemies[id] = new Enemy({
    //       x: backEndEnemy.x, 
    //       y: backEndEnemy.y, 
    //       radius: backEndEnemy.radius, 
    //       color: backEndEnemy.color, 
    //       velocity: backEndEnemy.velocity,
    //       damage: backEndEnemy.damage,
    //       health: backEndEnemy.health,
    //       wearingarmorID: backEndEnemy.wearingarmorID
    //     })
  
    //   } else { // already exist
    //     let frontEndEnemy = frontEndEnemies[id]
    //     frontEndEnemy.health = backEndEnemy.health
    //     frontEndEnemy.x = backEndEnemy.x
    //     frontEndEnemy.y = backEndEnemy.y
    //   }
    
    // }
    // // remove deleted enemies
    // for (const frontEndEnemyId in frontEndEnemies){
    //   if (!backEndEnemies[frontEndEnemyId]){
    //    delete frontEndEnemies[frontEndEnemyId]
    //   }
    // }
  
    /////////////////////////////////////////////////// 3.PROJECTILES //////////////////////////////////////////////////
    // for (const id in backEndProjectiles) {
    //   const backEndProjectile = backEndProjectiles[id]
    //   const gunName = backEndProjectile.gunName
  
    //   if (!frontEndProjectiles[id]){ // new projectile
    //     frontEndProjectiles[id] = new Projectile({
    //       x: backEndProjectile.x, 
    //       y: backEndProjectile.y, 
    //       radius: backEndProjectile.radius, 
    //       color: frontEndPlayers[backEndProjectile.playerId]?.color, // only call when available
    //       velocity: backEndProjectile.velocity,
    //       gunName
    //     })
  
    //       // player close enough should hear the sound (when projectile created) - for me
    //       const me = frontEndPlayers[myPlayerID]
    //       if (me){
  
    //         const DISTANCE = Math.hypot(backEndProjectile.x - me.x, backEndProjectile.y - me.y)
    //         const thatGunSoundDistance = gunInfoFrontEnd[gunName].projectileSpeed * 20
    //         if (gunName && (DISTANCE-100 < thatGunSoundDistance) ){ 
    //           let gunSound = frontEndGunSounds[gunName].cloneNode(true) //new Audio(`/sound/${gunName}.mp3`)
    //           if (DISTANCE > 100){
    //             gunSound.volume = Math.round( 10*(thatGunSoundDistance - (DISTANCE-100))/thatGunSoundDistance ) / 10
    //           }
    //           gunSound.play()
    //           gunSound.remove()
    //         }
    //       }
  
    //   } else { // already exist
    //     let frontEndProj = frontEndProjectiles[id]
    //     frontEndProj.x = backEndProjectile.x
    //     frontEndProj.y = backEndProjectile.y

    //   }
    
    // }
    // // remove deleted projectiles
    // for (const frontEndProjectileId in frontEndProjectiles){
    //   if (!backEndProjectiles[frontEndProjectileId]){
    //    delete frontEndProjectiles[frontEndProjectileId]
    //   }
    // }
  
  
    /////////////////////////////////////////////////// 4.OBJECTS //////////////////////////////////////////////////
    // for (const id in backEndObjects) {
    //   const backEndObject = backEndObjects[id]
  
    //   if (!frontEndObjects[id]){ // new 
    //     if (backEndObject.objecttype === 'wall'){
    //       frontEndObjects[id] = new Wall({
    //         objecttype: backEndObject.objecttype, 
    //         health: backEndObject.health, 
    //         objectinfo: backEndObject.objectinfo,
    //       })
    //     } else if(backEndObject.objecttype === 'hut'){
    //       frontEndObjects[id] = new Hut({
    //         objecttype: backEndObject.objecttype, 
    //         health: backEndObject.health, 
    //         objectinfo: backEndObject.objectinfo,
    //       })
    //     }
  
  
    //   } else { // already exist
    //     // update health attributes if changed
    //     frontEndObjects[id].health = backEndObject.health
  
    //   }
    // }
    // // remove deleted 
    // for (const Id in frontEndObjects){
    //   if (!backEndObjects[Id]){
    //    delete frontEndObjects[Id]
    //   }
    // }
  
    /////////////////////////////////////////////////// 5.ITEMS //////////////////////////////////////////////////
    // for (const id in backEndItems) {
    //   if (!frontEndItems[id]){ // new
    //     const backEndItem = backEndItems[id]
    //     instantiateItem(backEndItem,id)
    //   } else { // already exist
    //     // update items attributes
    //     const backEndItem = backEndItems[id]
    //     let frontEndItem = frontEndItems[id]
    //     frontEndItem.groundx = backEndItem.groundx
    //     frontEndItem.groundy = backEndItem.groundy
    //     frontEndItem.onground = backEndItem.onground
    //   }
    // }
    // // remove deleted 
    // for (const frontEndItemId in frontEndItems){
    //   if (!backEndItems[frontEndItemId]){
    //    delete frontEndItems[frontEndItemId]
    //   }
    // }
  
  })


canvas.font ='italic bold 12px sans-serif'
function loop(){
    canvas.clearRect(0,0,canvas.width, canvas.height)    
    for (let row = 0;row < map.length;row++){
        for (let col = 0;col < map[0].length;col++){
            const { id } = map[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;

            canvas.drawImage(mapImage, 
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,TILE_SIZE,
                col*TILE_SIZE, 
                row*TILE_SIZE,
                TILE_SIZE,TILE_SIZE
                );
        }
    }

    canvas.fillStyle = 'white'
    for (const id in frontEndPlayers){
        const currentPlayer = frontEndPlayers[id]
        canvas.drawImage(charImage, currentPlayer.x, currentPlayer.y)
        currentPlayer.displayName(canvas)

    }


    window.requestAnimationFrame(loop);

}

window.requestAnimationFrame(loop);


function resetKeys(){
    let keysKey = Object.keys(keys)
    for (let i=0;i<keysKey.length;i++){
      const keykey = keysKey[i]
      keys[keykey].pressed = false
    }
}

// start button clicked
document.querySelector('#usernameForm').addEventListener('submit', (event) => {
    event.preventDefault()
  
    // sound
    LobbyBGM.pause()
    LobbyBGM.currentTime = 0
  
    pointEl.innerHTML = 0 // init score

    document.querySelector('#usernameForm').style.display = 'none'

    resetKeys()
    listen = true // initialize the semaphore
    
    const playerX = 0 //MAPWIDTH * Math.random()
    const playerY = 0 //MAPHEIGHT * Math.random()
    const playerColor =  `hsl(${Math.random()*360},100%,70%)`
    
    socket.emit('initGame', {username: document.querySelector('#usernameInput').value, playerX, playerY, playerColor})
  })
  