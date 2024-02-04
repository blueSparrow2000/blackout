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

// player info 
let frontEndPlayer
let listen = true // very important for event listener 
let PLAYERSPEEDFRONTEND = 0
const PLAYERRADIUS = 16 
// semaphores
let fireTimeout
let reloadTimeout
let interactTimeout
const INTERACTTIME = 300

const LobbyBGM = new Audio("/sound/Lobby.mp3")
const shothitsound = new Audio("/sound/shothit.mp3")
const playerdeathsound = new Audio("/sound/playerdeath.mp3")
const interactSound = new Audio("/sound/interact.mp3")


const mapImage = new Image();
mapImage.src = "/tiles1.png"

const charImage = new Image();
charImage.src = "/character.png"


// resolution upgrade - retina display gives value 2
//const devicePixelRatio = window.devicePixelRatio || 1 //defaut 1

const canvasEl = document.getElementById('canvas');
canvasEl.width = window.innerWidth//SCREENWIDTH* devicePixelRatio//window.innerWidth* devicePixelRatio
canvasEl.height = window.innerHeight//SCREENHEIGHT* devicePixelRatio//window.innerHeight* devicePixelRatio
const canvas = canvasEl.getContext("2d");
//canvas.scale(devicePixelRatio,devicePixelRatio) 

const pointEl = document.querySelector('#pointEl')

// map info
let groundMap = [[]];
let decalMap = [[]];
const TILE_SIZE = 128;
const TILES_IN_ROW = 23;


// get socket
const socket = io();//io(`ws://localhost:5000`);

socket.on('connect', ()=>{
    console.log("connected!");
})

socket.on('map', (loadedMap)=>{
    groundMap = loadedMap.ground;
    decalMap = loadedMap.decals;
})

// initialize server variables
let gunInfoFrontEnd = {}
let gunInfoKeysFrontEnd = []

let frontEndGunSounds = {}
let frontEndGunReloadSounds = {}

let frontEndConsumableSounds = {}
let consumableInfoKeysFrontEnd = []
socket.on('serverVars',( {gunInfo, consumableInfo, PLAYERSPEED})=>{
    PLAYERSPEEDFRONTEND = PLAYERSPEED
  
    // gun infos
    gunInfoKeysFrontEnd = Object.keys(gunInfo)
    for (let i=0;i<gunInfoKeysFrontEnd.length;i++){
      const gunkey = gunInfoKeysFrontEnd[i]
      gunInfoFrontEnd[gunkey] = gunInfo[gunkey]
  
      // load sounds
      frontEndGunSounds[gunkey] =  new Audio(`/sound/${gunkey}.mp3`)
      if (gunkey !== 'fist' && gunkey !== 'knife' && gunkey !== 'bat'){ // these three dont have reload sounds
        frontEndGunReloadSounds[gunkey] = new Audio(`/reloadSound/${gunkey}.mp3`)
      }
    }
  
    // consumable infos
    consumableInfoKeysFrontEnd = Object.keys(consumableInfo)
    for (let i=0;i<consumableInfoKeysFrontEnd.length;i++){
      const conskey = consumableInfoKeysFrontEnd[i]
      gunInfoFrontEnd[conskey] = consumableInfo[conskey]
  
      // load sounds
      frontEndConsumableSounds[conskey] =  new Audio(`/consumeSound/${conskey}.mp3`)
    }

  
    console.log("front end got the variables from the server")
  })

  
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
if (!frontEndPlayers[socket.id]) return // if player does not exist
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
if (!frontEndPlayers[socket.id]) return // if player does not exist
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
    cursorX = (event.clientX)
    cursorY = (event.clientY)
})

function getAngle(event){
  const angle = Math.atan2(event.clientY - canvasEl.height/2, event.clientX - canvasEl.width/2)
  return angle
}
function shootCheck(event){
  if (!gunInfoFrontEnd){ // if gun info is undefined, do not fire bullet
    return
  }
  if (!frontEndPlayer){return}


  // get currently holding item
  let inventoryPointer = frontEndPlayer.currentSlot - 1 // current slot is value between 1 to 4
  if (!inventoryPointer) {inventoryPointer = 0} // default 0
  let currentHoldingItemId = frontEndPlayer.inventory[inventoryPointer] // if it is 0, it is fist
  let currentHoldingItem = frontEndItems[currentHoldingItemId]

  if (!currentHoldingItem) {return} // undefined case

  if ((currentHoldingItem.itemtype==='consumable')){ // eat
    // dont need to check amount since we will delete item if eaten
    const currentItemName = currentHoldingItem.name
    const CONSUMERATE = 1000

    if (!listen) {return} // not ready to eat
    listen = false // block
  
    const consumeSound = frontEndConsumableSounds[currentItemName]// new Audio(`/consumeSound/${currentItemName}.mp3`)
    consumeSound.play()

    fireTimeout = window.setTimeout(function(){ if (!frontEndPlayer) {clearTimeout(fireTimeout);return}; socket.emit('consume',{
      itemName: currentHoldingItem.name,
      playerId: socket.id,
      healamount: currentHoldingItem.healamount,
      deleteflag: true, // current version, delete right away
      itemid: currentHoldingItemId,
      currentSlot: frontEndPlayer.currentSlot,
    }) ;
      clearTimeout(fireTimeout);
      listen = true},CONSUMERATE)
    return
  }

  if (!(currentHoldingItem.itemtype==='gun' || currentHoldingItem.itemtype==='melee')){ // not a gun/melee, dont shoot
    console.log("this item is not a gun/consumable/melee. It is undefined or something else")
    return
  }

  if ((!(currentHoldingItem.itemtype==='melee')) && currentHoldingItem.ammo <= 0){ // no ammo - unable to shoot
    reloadGun() // auto reload when out of ammo
    return
  }

  const currentGunName = currentHoldingItem.name
  const guninfGET = gunInfoFrontEnd[currentGunName]
  const GUNFIRERATE = guninfGET.fireRate
  
  if (!listen) {return} // not ready to fire
  listen = false // block

  socket.emit("shoot", {angle:getAngle(event),currentGun:currentGunName})

  if (!(currentHoldingItem.itemtype==='melee')){ // not malee, i.e. gun!
    // decrease ammo here!!!!!
    currentHoldingItem.ammo -= 1 
    //console.log(`${currentGunName} ammo: ${currentHoldingItem.ammo}`)
  }

  //console.log("fired")
  fireTimeout = window.setTimeout(function(){ if (!frontEndPlayer) {clearTimeout(fireTimeout);return};clearTimeout(fireTimeout);listen = true},GUNFIRERATE)
  //console.log("ready to fire")
}
addEventListener('click', (event) => {
  shootCheck(event)
  //socket.emit("shoot", {angle:getAngle(event),currentGun:"s686"})
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
      shootCheck({clientX:cursorX, clientY:cursorY})
  } else if (Movement){
  // update frequent keys at once (Movement only)
      socket.emit('movingUpdate', {WW: keys.w.pressed, AA: keys.a.pressed, SS: keys.s.pressed, DD: keys.d.pressed, x:cursorX, y:cursorY})

  } else if(keys.space.pressed){ // always fire hold = true since space was pressed
      socket.emit('holdUpdate',{x:cursorX, y:cursorY})
      shootCheck({clientX:cursorX, clientY:cursorY})
  } else{ // builtin
      socket.emit('playermousechange', {x:cursorX,y:cursorY}) // report mouseposition every TICK, not immediately
  } 
},TICKRATE)


function reloadGun(){
  if (!gunInfoFrontEnd){ // if gun info is undefined, do not reload
    return
  }
  // reload only when player is created
  if (!frontEndPlayer){return}

  let inventoryPointer = frontEndPlayer.currentSlot - 1 // current slot is value between 1 to 4
  if (!inventoryPointer) {inventoryPointer = 0} // default 0
  
  let currentHoldingItemId = frontEndPlayer.inventory[inventoryPointer] // if it is 0, it is fist
  let currentHoldingItem = frontEndItems[currentHoldingItemId]
  //check currentHolding is a gun or not
  if (!(currentHoldingItem.itemtype==='gun')){ // not a gun, dont reload
    return
  }

  if (currentHoldingItem.ammo === currentHoldingItem.magSize){ // full ammo - unable to reload
    //console.log("ammo full!")
    return
  }

  const CHECKammotype = currentHoldingItem.ammotype

  const currentGunName = currentHoldingItem.name
  const GUNRELOADRATE = gunInfoFrontEnd[currentGunName].reloadTime

  //console.log("reload commit")
  if (!listen) {return} // not ready to reload
  listen = false // block
  //console.log("reloading!")

  let reloadSound = frontEndGunReloadSounds[currentGunName] //new Audio(`/reloadSound/${currentGunName}.mp3`)
  reloadSound.play()
  // reload ammo here!!!!!

  frontEndPlayer.reloading = true

  reloadTimeout = window.setTimeout(function(){
    //console.log(`${currentGunName} ammo: ${currentHoldingItem.ammo}`);
    clearTimeout(reloadTimeout); if (frontEndPlayer) {currentHoldingItem.restock(socket.id); frontEndPlayer.reloading = false; listen = true};
    }, GUNRELOADRATE)
  
}

// reload
socket.on('reload',()=>{
  reloadGun()
})


function dropItem(currentHoldingItemId, backEndItems){
  if (currentHoldingItemId===0){// fist - nothing to do
    return
  }
  const droppingItem = backEndItems[currentHoldingItemId]
  //let frontEndPlayer = frontEndPlayers[socket.id]
  let curItemGET = frontEndItems[currentHoldingItemId]
  if (droppingItem.itemtype === 'gun'){
    // empty out the gun (retrieve the ammo back)
    // frontEndPlayer.getAmmo(curItemGET.ammotype,curItemGET.ammo)
    // reset ammo
    // curItemGET.ammo = 0
  } else if(droppingItem.itemtype === 'consumable'){
    // nothing to do since consumables do not stack currently...
  } else if(droppingItem.itemtype === 'melee'){
    //console.log("NOT IMPLEMENTED!")
  }

  // change onground flag
  // update ground location
  socket.emit('updateitemrequestDROP',{itemid:currentHoldingItemId,
    requesttype:'dropitem',
    groundx:frontEndPlayer.x, 
    groundy:frontEndPlayer.y
  })

}

function interactItem(itemId,backEndItems){
  //console.log(frontEndPlayers[socket.id].inventory)
  // current slot item 
  //let frontEndPlayer = frontEndPlayers[socket.id]
  let inventoryPointer = frontEndPlayer.currentSlot - 1 // current slot is value between 1 to 4
  if (!inventoryPointer) {inventoryPointer = 0} // default 0
  
  let currentHoldingItemId = frontEndPlayer.inventory[inventoryPointer] // if it is 0, it is fist
  let currentHoldingItem = frontEndItems[currentHoldingItemId]

  //console.log("interact commit")
  if (!listen) {return} // not ready to interact
  listen = false 
  //console.log("interacting!")


  interactSound.play()

  // interact here!
  // make the item unpickable for other players => backenditem onground switch to false
  const pickingItem = backEndItems[itemId]

  if(pickingItem.itemtype === 'gun' || pickingItem.itemtype === 'consumable' || pickingItem.itemtype === 'melee'){
    //console.log(`itemId: ${itemId} / inventorypointer: ${inventoryPointer}`)
    dropItem(currentHoldingItemId, backEndItems)
    socket.emit('updateitemrequest',{itemid:itemId, requesttype:'pickupinventory',currentSlot: frontEndPlayer.currentSlot,playerId:socket.id})
    frontEndPlayer.inventory[inventoryPointer] = itemId // front end should also be changed
  } else if (pickingItem.itemtype === 'armor'){
    //drop current armor - to be updated
    const currentwearingarmorID = frontEndPlayer.wearingarmorID
    //console.log(currentwearingarmorID)
    if (currentwearingarmorID > 0 ){
      // get item id and drop it
      socket.emit('updateitemrequestDROP',{itemid:currentwearingarmorID,
        requesttype:'dropitem',
        groundx:frontEndPlayer.x, 
        groundy:frontEndPlayer.y
      })
    }
    frontEndPlayer.wearingarmorID = itemId
    socket.emit('updateitemrequest',{itemid:itemId, requesttype:'weararmor',playerId:socket.id})
  }

  interactTimeout = window.setTimeout(function(){
    clearTimeout(interactTimeout);
    if (frontEndPlayer){listen = true;    // reload when pick up
    reloadGun()}}, INTERACTTIME)
}

// iteract
socket.on('interact',(backEndItems)=>{
    if (!frontEndPlayer){return}

    // client collision check - reduce server load
    for (const id in backEndItems){
      // Among frontEndItems: pick the first item that satisfies the below conditions
      // only when item is near - collision check with player and item!
      // only when item is onground
      const item = backEndItems[id]
      const itemSizeObj = item.size
      let itemRadius = Math.max(itemSizeObj.length, itemSizeObj.width)
      if (item.itemtype==='gun'){
        itemRadius = itemRadius/2
      }
      const DISTANCE = Math.hypot(item.groundx - frontEndPlayer.x, item.groundy - frontEndPlayer.y)
      //console.log(`${item.name} DISTANCE: ${DISTANCE}`)
      if (item.onground && (DISTANCE < itemRadius + frontEndPlayer.radius)) {
        //console.log(`${item.name} is near the player!`)
        interactItem(id,backEndItems)
        break
      }


    }

})



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
        for (let i=0;i<inventorySize;i++){
          const backEndItem = backEndPlayer.inventory[i]
          let isItem = instantiateItem(backEndItem,backEndItem.myID) // add item to frontenditem on index: backEndItem.myID
          frontEndInventory[i] = backEndItem.myID // put itemsId to frontenditem list - like a pointer
        }
        
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

            frontEndPlayerOthers.x = parseInt(backEndPlayer.x)
            frontEndPlayerOthers.y = parseInt(backEndPlayer.y)

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
            const divToDelete = document.querySelector(`div[data-id="${id}"]`)
            divToDelete.parentNode.removeChild(divToDelete)
        
            // if I dont exist
            if (id === myPlayerID) {     // reshow the start button interface
                const mePlayer = frontEndPlayers[myPlayerID]
        
                pointEl.innerHTML = mePlayer.score
                playerdeathsound.play()
                document.querySelector('#usernameForm').style.display = 'block'
                socket.emit('playerdeath',{playerId: id, armorID: mePlayer.wearingarmorID})
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
    for (const id in backEndProjectiles) {
      const backEndProjectile = backEndProjectiles[id]
      const gunName = backEndProjectile.gunName
  
      if (!frontEndProjectiles[id]){ // new projectile
        frontEndProjectiles[id] = new Projectile({
          x: backEndProjectile.x, 
          y: backEndProjectile.y, 
          radius: backEndProjectile.radius, 
          color: frontEndPlayers[backEndProjectile.playerId]?.color, // only call when available
          velocity: backEndProjectile.velocity,
          gunName
        })
  
          // player close enough should hear the sound (when projectile created) - for me
          const me = frontEndPlayers[myPlayerID]
          if (me){
  
            const DISTANCE = Math.hypot(backEndProjectile.x - me.x, backEndProjectile.y - me.y)
            const thatGunSoundDistance = 900
            if (gunName && (DISTANCE-100 < thatGunSoundDistance) ){ 
              let gunSound = frontEndGunSounds[gunName].cloneNode(true) //new Audio(`/sound/${gunName}.mp3`)
              if (DISTANCE > 100){
                gunSound.volume = Math.round( 10*(thatGunSoundDistance - (DISTANCE-100))/thatGunSoundDistance ) / 10
              }
              gunSound.play()
              gunSound.remove()
            }
          }
  
      } else { // already exist
        let frontEndProj = frontEndProjectiles[id]
        frontEndProj.x = backEndProjectile.x
        frontEndProj.y = backEndProjectile.y

      }
    
    }
    // remove deleted projectiles
    for (const frontEndProjectileId in frontEndProjectiles){
      if (!backEndProjectiles[frontEndProjectileId]){
       delete frontEndProjectiles[frontEndProjectileId]
      }
    }
  
  
    /////////////////////////////////////////////////// 4.OBJECTS //////////////////////////////////////////////////
    for (const id in backEndObjects) {
      const backEndObject = backEndObjects[id]
  
      if (!frontEndObjects[id]){ // new 
        if (backEndObject.objecttype === 'wall'){
          frontEndObjects[id] = new Wall({
            objecttype: backEndObject.objecttype, 
            health: backEndObject.health, 
            objectinfo: backEndObject.objectinfo,
          })
        } else if(backEndObject.objecttype === 'hut'){
          frontEndObjects[id] = new Hut({
            objecttype: backEndObject.objecttype, 
            health: backEndObject.health, 
            objectinfo: backEndObject.objectinfo,
          })
        }
  
  
      } else { // already exist
        // update health attributes if changed
        frontEndObjects[id].health = backEndObject.health
  
      }
    }
    // remove deleted 
    for (const Id in frontEndObjects){
      if (!backEndObjects[Id]){
       delete frontEndObjects[Id]
      }
    }
  
    /////////////////////////////////////////////////// 5.ITEMS //////////////////////////////////////////////////
    for (const id in backEndItems) {
      if (!frontEndItems[id]){ // new
        const backEndItem = backEndItems[id]
        instantiateItem(backEndItem,id)
      } else { // already exist
        // update items attributes
        const backEndItem = backEndItems[id]
        let frontEndItem = frontEndItems[id]
        frontEndItem.groundx = backEndItem.groundx
        frontEndItem.groundy = backEndItem.groundy
        frontEndItem.onground = backEndItem.onground
      }
    }
    // remove deleted 
    for (const frontEndItemId in frontEndItems){
      if (!backEndItems[frontEndItemId]){
       delete frontEndItems[frontEndItemId]
      }
    }
  
})

// init cam
let camX = 100
let camY = 100

const centerX = parseInt(canvasEl.width/2)
const centerY = parseInt(canvasEl.height/2)

canvas.font ='italic bold 12px sans-serif'
function loop(){
    canvas.clearRect(0,0,canvasEl.width, canvasEl.height)  

    // CAMERA 
    if (frontEndPlayer){ // if exists
        camX = frontEndPlayer.x - centerX
        camY = frontEndPlayer.y - centerY
    }

    // GROUND TILES
    for (let row = 0;row < groundMap.length;row++){
        for (let col = 0;col < groundMap[0].length;col++){
            const { id } = groundMap[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;

            canvas.drawImage(mapImage, 
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,TILE_SIZE,
                col*TILE_SIZE - camX, 
                row*TILE_SIZE - camY,
                TILE_SIZE,TILE_SIZE
                );
        }
    }
    
    // ITEMS
    for (const id in frontEndItems){
      const item = frontEndItems[id]
      item.draw(canvas, camX, camY)
    }
  
    // PROJECTILES
    for (const id in frontEndProjectiles){ 
        const frontEndProjectile = frontEndProjectiles[id]
        frontEndProjectile.draw(canvas, camX, camY)
    }

    // ENEMIES
    for (const id in frontEndEnemies){ 
      const frontEndEnemy = frontEndEnemies[id]
      frontEndEnemy.draw(canvas, camX, camY)
    }


    // WALLS
    for (const id in frontEndObjects){
      const obj = frontEndObjects[id]
      obj.draw(canvas, camX, camY)
    }

    // PLAYERS
    canvas.fillStyle = 'white'
    if (frontEndPlayer){ // draw myself in the center
        canvas.drawImage(charImage, centerX - PLAYERRADIUS, centerY - PLAYERRADIUS)
        canvas.fillText(`HP: ${Math.round(frontEndPlayer.health * 100) / 100}`,centerX - 4 - PLAYERRADIUS, centerY - PLAYERRADIUS)
    }

    for (const id in frontEndPlayers){
        if (id !== socket.id){
            const currentPlayer = frontEndPlayers[id]
            canvas.drawImage(charImage, currentPlayer.x - camX- PLAYERRADIUS, currentPlayer.y - camY- PLAYERRADIUS)
            currentPlayer.displayName(canvas, camX, camY)
        }
    }

    // PLANTS AND BUSHES
    for (let row = 0;row < groundMap.length;row++){
        for (let col = 0;col < groundMap[0].length;col++){
            const { id } = decalMap[row][col] ?? {id:undefined};
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;

            canvas.drawImage(mapImage, 
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,TILE_SIZE,
                col*TILE_SIZE - camX, 
                row*TILE_SIZE - camY,
                TILE_SIZE,TILE_SIZE
                );
        }
    }

    // OTHERS

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

// START (button clicked)
document.querySelector('#usernameForm').addEventListener('submit', (event) => {
    event.preventDefault()
    LobbyBGM.pause()
    LobbyBGM.currentTime = 0
    pointEl.innerHTML = 0 // init score
    document.querySelector('#usernameForm').style.display = 'none' // unblock the screen

    // init player info
    resetKeys()
    listen = true // initialize the semaphore
    const playerX = MAPWIDTH * Math.random()
    const playerY = MAPHEIGHT * Math.random()
    const playerColor =  `hsl(${Math.random()*360},100%,70%)`
    
    socket.emit('initGame', {username: document.querySelector('#usernameInput').value, playerX, playerY, playerColor})
 })
  

 function instantiateItem(backendItem,id){ // switch case
  if (backendItem.itemtype==='gun'){
    //console.log('gun dropped!')
    frontEndItems[id] = new Gun({groundx:backendItem.groundx, 
      groundy:backendItem.groundy, 
      size:backendItem.size, 
      name:backendItem.name, 
      onground: backendItem.onground, 
      color: backendItem.color,
      iteminfo:{ammo:backendItem.iteminfo.ammo ,ammotype: backendItem.iteminfo.ammotype }
    })
    frontEndItems[id].magSize = gunInfoFrontEnd[backendItem.name].magSize
    frontEndItems[id].reloadTime = gunInfoFrontEnd[backendItem.name].reloadTime
    return true
  } else if (backendItem.itemtype==='consumable') {
    frontEndItems[id] = new Consumable({groundx:backendItem.groundx, 
      groundy:backendItem.groundy, 
      size:backendItem.size, 
      name:backendItem.name, 
      onground: backendItem.onground, 
      color: backendItem.color,
      iteminfo:{amount:backendItem.iteminfo.amount , healamount:backendItem.iteminfo.healamount }
    })
    return true
  } else if (backendItem.itemtype==='melee') { // same with guns?
    frontEndItems[id] = new Melee({groundx:backendItem.groundx, 
      groundy:backendItem.groundy, 
      size:backendItem.size, 
      name:backendItem.name, 
      onground: backendItem.onground, 
      color: backendItem.color,
      iteminfo: {ammo:backendItem.iteminfo.ammo ,ammotype: backendItem.iteminfo.ammotype}
    })
    return true
  } else if (backendItem.itemtype==='armor') {
    frontEndItems[id] = new Armor({groundx:backendItem.groundx, 
      groundy:backendItem.groundy, 
      size:backendItem.size, 
      name:backendItem.name, 
      onground: backendItem.onground, 
      color: backendItem.color,
      iteminfo:{amount:backendItem.iteminfo.amount }
    })
  }else{
    console.log("not implemented item or invalid name")
    // undefined or etc.
    return false
  }
}