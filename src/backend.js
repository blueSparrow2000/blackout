// server constants
const TICKRATE = 15
const SCREENWIDTH = 1024
const SCREENHEIGHT = 576
const ITEMRADIUS = 16

// map info
const TILES_IN_ROW = 23;
const TILE_SIZE = 128;
const MAPTILENUM = 30
const MAPWIDTH = TILE_SIZE*MAPTILENUM
const MAPHEIGHT =TILE_SIZE*MAPTILENUM

const collide = require('line-circle-collision')

const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const loadMap = require("./mapLoader")

// Server Data
const backEndPlayers = {}
const deadPlayerPos = {}
const backEndEnemies = {}
const backEndProjectiles = {}
const backEndItems = {}
const backEndVehicles = {}
backEndItems[0] = {
    itemtype: 'melee', groundx:0, groundy:0, size:{length:5, width:5}, name:'fist', color:'black', iteminfo:{ammo:'inf', ammotype:'bio'} ,onground:false, myID: 0, deleteRequest:false
}
const backEndObjects = {}
let enemyId = 0
let projectileId = 0
let itemsId = 0 
let objectId = 0
let vehicleId = 0


// player attributes
const INVENTORYSIZE = 4
const PLAYERRADIUS = 16 
const PLAYERSPEED = 2 // pixel
const PLAYERHEALTH = 8
const PLAYERHEALTHMAX = 8
const GUNHEARRANGE = 700
const PLAYER_JOIN_DELAY = 1000

//to check if there exists any player left
let USERCOUNT = [0]

// for bullets
const FRICTION = 0.999//0.992
const HIGHFRICTION = 0.98

// enemy setting (manual)
const SPAWNENEMYFLAG = true
let ENEMYSPAWNRATE = 30000
let ENEMYNUM = 2
let ENEMYCOUNT = 0

const GROUNDITEMFLAG = true
let GHOSTENEMY = false

const ENTITYDISTRIBUTIONS = ["test", "battleRoyale"]
const ENTITYDISTRIBUTION_MARK = 1


const gunInfo = {
    // 'railgun':{travelDistance:0, damage: 3, shake:0, num: 1, fireRate: 1000, projectileSpeed:0, magSize:2, reloadTime: 1800, ammotype:'battery', size: {length:50, width:5}}, // pierce walls and entities
    // 'CrossBow':{travelDistance:650, damage: 10, shake:0, num: 1, fireRate: 100, projectileSpeed:8, magSize: 1, reloadTime: 1400, ammotype:'bolt', size: {length:21, width:2}}, 
    // 'GuideGun':{travelDistance:800, damage: 3, shake:0, num: 1, fireRate: 2100, projectileSpeed:6, magSize: 5, reloadTime: 1800, ammotype:'superconductor', size: {length:35, width:8}}, 
    'grenadeLauncher':{travelDistance:576, damage: 3, shake:0, num: 1, fireRate: 1600, projectileSpeed:13, magSize: 3, reloadTime: 1800, ammotype:'fragment', size: {length:25, width:4}}, 
    'fragment':{travelDistance:192, damage: 2, shake:3, num: 1, fireRate: 100, projectileSpeed:8, magSize: 5, reloadTime: 1400, ammotype:'fragment', size: {length:13, width:1}}, 

    'M1':{travelDistance:1472, damage: 5, shake:0, num: 1, fireRate: 1600, projectileSpeed:42, magSize: 5, reloadTime: 4000, ammotype:'7mm', size: {length:42, width:3}}, 
    'mk14':{travelDistance:1088, damage: 3, shake:1, num: 1, fireRate: 600, projectileSpeed:32, magSize:14, reloadTime: 3300, ammotype:'7mm', size: {length:34, width:2} }, 
    'SLR':{travelDistance:1216, damage: 3.5, shake:1, num: 1, fireRate: 350, projectileSpeed:36, magSize: 10, reloadTime: 2700, ammotype:'7mm', size: {length:38, width:2}}, 
    'AWM':{travelDistance:1600, damage: 9, shake:0, num: 1, fireRate: 2000, projectileSpeed:30, magSize:  7, reloadTime: 4000, ammotype:'7mm', size: {length:50, width:3}}, 

    'pistol':{travelDistance:576, damage: 1, shake:3, num: 1, fireRate: 300, projectileSpeed:15, magSize:15, reloadTime: 1100, ammotype:'5mm', size: {length:17, width:2}}, 
    'M249':{travelDistance:832, damage: 1, shake:1, num: 1, fireRate: 75, projectileSpeed:23, magSize:150, reloadTime: 7400, ammotype:'5mm', size: {length:28, width:6}},
    'VSS':{travelDistance:1088, damage: 1, shake:1, num: 1, fireRate: 100, projectileSpeed:19, magSize:10, reloadTime: 2300, ammotype:'5mm' , size: {length:27, width:2}}, 
    'ak47':{travelDistance:704, damage: 1, shake:1, num: 1, fireRate: 110, projectileSpeed:21, magSize:30, reloadTime: 1000, ammotype:'5mm', size: {length:28, width:3}}, 
    'FAMAS':{travelDistance:576, damage: 1, shake:2, num: 1, fireRate: 80, projectileSpeed:17, magSize: 30, reloadTime: 3200, ammotype:'5mm', size: {length:22, width:3}}, 
    
    's686':{travelDistance:320, damage: 1, shake:5, num: 5, fireRate: 180, projectileSpeed:10, magSize:2, reloadTime: 1200, ammotype:'12G', size: {length:13, width:5}},
    'DBS':{travelDistance:448, damage: 1, shake:3, num: 3, fireRate: 400, projectileSpeed:13, magSize:14, reloadTime: 6000, ammotype:'12G', size: {length:16, width:5}},
    'usas12':{travelDistance:448, damage: 1, shake:3, num: 2, fireRate: 180, projectileSpeed:14, magSize:5, reloadTime: 2300, ammotype:'12G', size: {length:18, width:4}},
    
    'ump45':{travelDistance:700, damage: 0.5, shake:2, num: 1, fireRate: 90, projectileSpeed:15, magSize:25, reloadTime: 2800, ammotype:'45ACP', size: {length:19, width:4}},
    'vector':{travelDistance:600, damage: 0.5, shake:1, num: 1, fireRate: 50, projectileSpeed:17, magSize:19, reloadTime: 2600, ammotype:'45ACP', size: {length:18, width:3}},
    'mp5':{travelDistance:650, damage: 0.5, shake:1, num: 1, fireRate: 70, projectileSpeed:19, magSize:30, reloadTime: 2100, ammotype:'45ACP', size: {length:20, width:3}},
    
    'fist':{travelDistance:24, damage: 0.2, shake:0, num: 1, fireRate: 300, projectileSpeed:6, magSize:0, reloadTime: 0, ammotype:'bio', size: {length:24, width:4}},
    'knife':{travelDistance:32, damage: 0.4, shake:0, num: 1, fireRate: 200, projectileSpeed:8, magSize:0, reloadTime: 0, ammotype:'sharp', size: {length:28, width:2}},
    'bat':{travelDistance:48, damage: 1, shake:0, num: 1, fireRate: 500, projectileSpeed:6, magSize:0, reloadTime: 0, ammotype:'hard', size: {length:36, width:3}},
}
const defaultGuns = ['pistol']//[] 

const consumableTypes = ['bandage','medkit']
const consumableInfo = {
'bandage': {size:{length:8, width:8}, color: 'gray', healamount: 2 },
'medkit': {size:{length:12, width:12}, color: 'gray', healamount: PLAYERHEALTHMAX},
}

const armorTypes = ['absorb', 'reduce']
const armorInfo = {
'absorb':{color: 'DarkTurquoise',size:{length:12, width:12}, amount:5, radius:1},
'reduce':{color: 'DeepSkyBlue',size:{length:12, width:12}, amount:5, radius:2},
}

function armorEffect(armorID, damage){
  if (armorID <= 0){ // no armor
    return damage
  }
  const armortype = backEndItems[armorID].name
  switch (armortype){
    case 'absorb': // absorb 0.2 damage: immune to fist
    //console.log("absorb")
      if (damage>0.5){ // absorb more
        return Math.max(damage - 0.4, 0)
      }
      return Math.max(damage - 0.2, 0)
    case 'reduce': // reduce 10% of damage
    //console.log("reduce")
      if (damage>3){// reduce 30% of damage if large
        return (7*damage)/10
      }
      return (9*damage)/10
    default:
      console.log("Item ID is malfunctioning")
      return damage
  }
}

// GROUND drop items
if (GROUNDITEMFLAG){
  if (ENTITYDISTRIBUTIONS[ENTITYDISTRIBUTION_MARK]==="test"){
    makeObjects("wall", 30, {orientation: 'vertical',start:{x:1000,y:1000}, end:{x:1000,y:2000}, width:20, color: 'gray'})
    makeObjects("wall", 30, {orientation: 'horizontal',start:{x:1000,y:2000}, end:{x:1500,y:2000}, width:20, color: 'gray'})
    makeObjects("wall", 30, {orientation: 'vertical',start:{x:1500,y:1000}, end:{x:1500,y:2000}, width:20, color: 'gray'})
    makeObjects("wall", 30, {orientation: 'horizontal',start:{x:1000,y:1000}, end:{x:1500,y:1000}, width:20, color: 'gray'})
  
    makeObjects("hut", 1000, {center:{x:1250,y:1500}, radius: 50, color:'gray'})
  
    const groundItemSpawnLoc = {x:500, y:500}
    const groundgunList = [ 'M1', 'mk14', 'SLR','AWM',    'VSS', 'M249', 'ak47', 'FAMAS',    's686','DBS', 'usas12',     'ump45','vector','mp5']
    const groundGunAmount = groundgunList.length
    for (let i=0;i<groundGunAmount; i++){
      makeNdropItem('gun', groundgunList[i], {x:groundItemSpawnLoc.x + Math.round(60*(i - groundGunAmount/2)), y:groundItemSpawnLoc.y} )
    }
    
    const groundConsList = ['bandage','bandage','bandage','bandage','bandage','medkit']
    const groundConsAmount = groundConsList.length
    for (let i=0;i<groundConsAmount; i++){
      makeNdropItem('consumable', groundConsList[i], {x:groundItemSpawnLoc.x + Math.round(50*(i - groundConsAmount/2)), y:groundItemSpawnLoc.y - 100})
    }
  
    const groundArmorAmount = armorTypes.length
    for (let i=0;i<groundArmorAmount; i++){
      makeNdropItem( 'armor', armorTypes[i], {x:groundItemSpawnLoc.x + Math.round(50*(i - groundArmorAmount/2)), y:groundItemSpawnLoc.y - 150})
    }
  
    const groundMeleeList = ['knife','bat']
    const groundMeleeAmount = groundMeleeList.length
    for (let i=0;i<groundMeleeAmount; i++){
      makeNdropItem('melee', groundMeleeList[i], {x:groundItemSpawnLoc.x + Math.round(50*(i - groundMeleeAmount/2)), y:groundItemSpawnLoc.y - 200})
    }
  }

  if (ENTITYDISTRIBUTIONS[ENTITYDISTRIBUTION_MARK]==="battleRoyale"){
    // special tile locations in map1
    const TILESLOC = {"house1":{row:13,col:2},"house2":{row:2,col:24},"house3":{row:5,col:24},"rock1":{row:0,col:29},"rock2":{row:6,col:15}, "forest1":{row:21,col:27},"forest2":{row:22,col:25},"tree1":{row:21,col:12},"tree2":{row:21,col:4},"tree3":{row:16,col:14},"tree4":{row:17,col:21},"tree5":{row:13,col:23},"sandroad1":{row:28,col:0},"sandroad2":{row:28,col:29}}
    

    function getCoordTilesCenter(location){
      return {x:location.col*TILE_SIZE + Math.round(TILE_SIZE/2), y:location.row*TILE_SIZE + Math.round(TILE_SIZE/2)}
    }

    function getCoordTiles(location){
      return {x:location.col*TILE_SIZE, y:location.row*TILE_SIZE}
    }

    spawnVehicle({x:200,y:400})
    spawnVehicle({x:500,y:3000})
    spawnVehicle({x:200+100,y:400},'tank')
    spawnVehicle({x:500+100,y:3000},'tank')


    makeHouse(getCoordTiles(TILESLOC["house1"]))
    makeHouse(getCoordTiles(TILESLOC["house2"]))
    makeHouse(getCoordTiles(TILESLOC["house3"]))
    makeNdropItem('gun', 'ump45', getCoordTilesCenter(TILESLOC["house1"]))
    makeNdropItem('scope', "1", getCoordTilesCenter(TILESLOC["house1"]))
    makeNdropItem('gun', 'vector', getCoordTilesCenter(TILESLOC["house2"]))
    makeNdropItem('gun', 'mp5', getCoordTilesCenter(TILESLOC["house3"]))

    // some guns 
    const rock1loc = getCoordTilesCenter(TILESLOC["rock1"])
    makeNdropItem('gun', 'AWM', rock1loc)
    makeNdropItem('scope', "2", rock1loc) // scope 3 is laggy to other PCs
    // console.log(rockloc)
    // console.log(MAPWIDTH)
    const rock2loc = getCoordTilesCenter(TILESLOC["rock2"])
    makeNdropItem('gun', 'M249', rock2loc)
    makeNdropItem('scope', "1", rock2loc)

    const sandroad1loc = getCoordTilesCenter(TILESLOC["sandroad1"])
    makeNdropItem('gun', 'usas12', sandroad1loc)

    const sandroad2loc = getCoordTilesCenter(TILESLOC["sandroad2"])
    makeNdropItem('gun', 's686', sandroad2loc)

    const tree2loc = getCoordTilesCenter(TILESLOC["tree2"])
    makeNdropItem('gun', 'grenadeLauncher', tree2loc)
    

    makeNdropItem('gun', 'FAMAS', getCoordTilesCenter(TILESLOC["tree3"]))
    makeNdropItem('melee', 'knife', getCoordTilesCenter(TILESLOC["tree4"]))
    makeNdropItem('gun', 'ak47', getCoordTilesCenter(TILESLOC["tree5"]))


    // some health packs
    const tree1loc = getCoordTilesCenter(TILESLOC["tree1"])
    makeNdropItem('consumable', 'medkit',tree1loc)

    // some armors
    const forest1loc = getCoordTilesCenter(TILESLOC["forest1"])
    makeNdropItem( 'armor', 'absorb', forest1loc)

    const forest2loc = getCoordTilesCenter(TILESLOC["forest2"])
    makeNdropItem( 'armor', 'reduce', forest2loc)
    makeNdropItem('scope', "1", forest2loc)

  }

}



function itemBorderCheck(xCoord, yCoord){
  let xInBorder = xCoord
  let yInBorder = yCoord

  if (xCoord < 0){
    xInBorder = 0
  }else if (xCoord > MAPWIDTH){
    xInBorder = MAPWIDTH
  }
  if ( yCoord < 0){
    yInBorder = 0
  } else if( yCoord > MAPHEIGHT){
    yInBorder = MAPHEIGHT
  }
  return [xInBorder, yInBorder]
}

function itemBorderUpdate(item){
  if (item.groundx < 0){
    item.groundx = 0
  }else if (item.groundx > MAPWIDTH){
    item.groundx = MAPWIDTH
  }
  if (item.groundy < 0){
    item.groundy = 0
  } else if(item.groundy > MAPHEIGHT){
    item.groundy = MAPHEIGHT
  }
}


function addProjectile(angle,currentGun,playerID,location){
  projectileId++
  const guninfoGET = gunInfo[currentGun]
  const shakeProj = guninfoGET.shake
  const bulletSpeed = guninfoGET.projectileSpeed
  const velocity = { // with shake!
    x: Math.cos(angle) * bulletSpeed + (Math.random()-0.5) * shakeProj,
    y: Math.sin(angle) * bulletSpeed + (Math.random()-0.5) * shakeProj
  }
  const radius = 5

  const travelDistance = guninfoGET.travelDistance
  const projDamage =  guninfoGET.damage

  backEndProjectiles[projectileId] = {
    x:location.x, y:location.y,radius,velocity, speed:bulletSpeed, playerId: playerID, gunName:currentGun, travelDistance, projDamage
  }
}

function safeDeleteProjectile(projID){
  const backEndProjectile = backEndProjectiles[projID]
  // if name is grenadeLauncher, explode and damage surrounding enemies and players!backEndProjectile.name
  // console.log(backEndProjectile.gunName)
  if (backEndProjectile.gunName==='grenadeLauncher'){
    explosion(backEndProjectile,12,backEndProjectile.playerId)
  }

  delete backEndProjectiles[projID]
}


function safeDeletePlayer(playerId){
  // drop all item before removing
  const backEndPlayer = backEndPlayers[playerId]
  const inventoryItems = backEndPlayer.inventory
   
  for (let i=0;i<inventoryItems.length;i++){
    const curitemID = inventoryItems[i].myID
    if (curitemID===0){ // no fist
      continue
    }
    let backEndItem = backEndItems[curitemID]
    backEndItem.onground = true
    backEndItem.groundx = backEndPlayer.x + (Math.random() - 0.5)*100
    backEndItem.groundy = backEndPlayer.y + (Math.random() - 0.5)*100
    itemBorderUpdate(backEndItem)
  }

  deadPlayerPos[playerId] = {x:backEndPlayer.x,y:backEndPlayer.y}

  delete backEndPlayers[playerId]
}



function Moveplayer(playerGIVEN, WW, AA, SS, DD){
    const vehicleID = playerGIVEN.ridingVehicleID
    if (vehicleID>0){ // if riding something
      const maxSpeedVehicle = backEndVehicles[vehicleID].speed
      playerGIVEN.speed = Math.min(maxSpeedVehicle, playerGIVEN.speed + 0.11)
    }

    if (WW){
      playerGIVEN.y -= playerGIVEN.speed
    }
    if (AA){
      playerGIVEN.x -= playerGIVEN.speed
    }
    if (SS){
      playerGIVEN.y += playerGIVEN.speed
    }
    if (DD){
      playerGIVEN.x += playerGIVEN.speed
    }
    const playerSides = {
      left: playerGIVEN.x - playerGIVEN.radius,
      right: playerGIVEN.x + playerGIVEN.radius,
      top: playerGIVEN.y - playerGIVEN.radius,
      bottom: playerGIVEN.y + playerGIVEN.radius
    }
  
    if (playerSides.left<0){ // restore position for backend
      playerGIVEN.x = playerGIVEN.radius
    }
    if (playerSides.right>MAPWIDTH){ // restore position for backend
      playerGIVEN.x = MAPWIDTH - playerGIVEN.radius
    }
    if (playerSides.top<0){ // restore position for backend
      playerGIVEN.y = playerGIVEN.radius
    }
    if (playerSides.bottom>MAPHEIGHT){ // restore position for backend
      playerGIVEN.y = MAPHEIGHT - playerGIVEN.radius
    }
  
    // check boundary with objects also
    borderCheckWithObjects(playerGIVEN)
  }
  

async function main(){
    const {ground2D, decals2D} = await loadMap();

    io.on("connect", (socket) => {
        console.log("user connected",socket.id);
        socket.emit('map',{ground:ground2D, decals: decals2D})
        // give server info to a frontend
        socket.emit('serverVars', {gunInfo, consumableInfo})

        // remove player when disconnected (F5 etc.)
        socket.on('disconnect',(reason) => {
            console.log(reason)
            delete backEndPlayers[socket.id]
        })

        // player death => put ammos to the ground!
        socket.on('playerdeath',({playerId,armorID,scopeID,vehicleID})=>{
          let deadplayerGET = deadPlayerPos[playerId]
          if (!deadplayerGET){return}
          // DROP armor
          if (armorID>0){
            let itemToUpdate = backEndItems[armorID]
            itemToUpdate.onground = true
            itemToUpdate.groundx = deadplayerGET.x
            itemToUpdate.groundy = deadplayerGET.y
          }
          // DROP scope
          if (scopeID>0){
            let itemToUpdate = backEndItems[scopeID]
            itemToUpdate.onground = true
            itemToUpdate.groundx = deadplayerGET.x
            itemToUpdate.groundy = deadplayerGET.y
          }
          // vehicle unoccupy
          if (backEndVehicles[vehicleID]){//exist
            getOffVehicle(playerId,vehicleID)
          }


          delete deadPlayerPos[playerId]

        })



        // initialize game when clicking button (submit name)
        socket.on('initGame',({username,playerX, playerY, playerColor})=>{
            // initialize inventory with fist
            let inventory =  new Array(INVENTORYSIZE).fill().map(() => (backEndItems[0])) // array points to references - fist can be shared for all players

            // default item for a player if exists
            for (let i=0;i<defaultGuns.length; i++){
              makeNdropItem('gun', defaultGuns[i], {x:0 ,y:0},onground=false)
              inventory[i] = backEndItems[itemsId]
            }

            playerJoinTimeout = setTimeout(function(){
            clearTimeout(playerJoinTimeout);
            backEndPlayers[socket.id] = {
                x:playerX,
                y:playerY,
                color: playerColor,
                radius: PLAYERRADIUS,
                score: 0,
                health: PLAYERHEALTH,
                username,
                inventory, // size 4
                currentSlot: 1, // 1~4
                mousePos: {x:0,y:0},
                wearingarmorID: -1,
                wearingscopeID: -1,
                getinhouse: false,
                speed:PLAYERSPEED, // not passed to frontend
                ridingVehicleID:-1,
            };
            USERCOUNT[0]++;
            } ,PLAYER_JOIN_DELAY)

        })

        // aux function for shoot
        function shootProjectile(angle,currentGun){
          if (!backEndPlayers[socket.id]) return // player not defined

          const gunName = currentGun
            
          for (let i=0;i< gunInfo[currentGun].num;i++){
            addProjectile(angle,currentGun,socket.id, backEndPlayers[socket.id])
          }
        }
        socket.on('shoot', ({angle,currentGun})=>{
          shootProjectile(angle,currentGun)
        } )


          // eat
        socket.on('consume',({itemName,playerId,healamount,deleteflag, itemid,currentSlot}) => {
          let curplayer = backEndPlayers[playerId]
          if (!curplayer) {return}
          function APIdeleteItem(){
            // change player current holding item to fist
            curplayer.inventory[currentSlot-1] = backEndItems[0]
            // delete safely
            backEndItems[itemid].deleteflag = deleteflag
            //delete backEndItems[itemid]
          }

          if (itemName === 'medkit'){
            curplayer.health = PLAYERHEALTHMAX
            APIdeleteItem()
          } else if (curplayer.health + healamount <= PLAYERHEALTHMAX){
            curplayer.health += healamount
            APIdeleteItem()
          }
          
        })
        
        // change gound item info from client side
        socket.on('updateitemrequest', ({itemid, requesttype,currentSlot=1, playerId=0})=>{
          let itemToUpdate = backEndItems[itemid]
          if (!itemToUpdate) {return}
          if (requesttype === 'pickupinventory'){
            itemToUpdate.onground = false
            if (backEndPlayers[playerId]){
              backEndPlayers[playerId].inventory[currentSlot-1] = backEndItems[itemid]// reassign item (only me)
            }
            //console.log(backEndPlayers[playerId].inventory[currentSlot-1].myID)
          } else if (requesttype === 'weararmor'){
            backEndPlayers[playerId].wearingarmorID = itemid
            itemToUpdate.onground = false
          }  else if (requesttype === 'scopeChange'){
            backEndPlayers[playerId].wearingscopeID = itemid
            itemToUpdate.onground = false
          } 
        })

        socket.on('updateitemrequestDROP', ({itemid, requesttype,currentSlot=1, groundx=0, groundy=0, playerId=0})=>{
          let itemToUpdate = backEndItems[itemid]
          if (!itemToUpdate) {return}
          if(requesttype==='dropitem' || (!itemid)){ // not fist
            itemToUpdate.onground = true
            itemToUpdate.groundx = groundx
            itemToUpdate.groundy = groundy
            //console.log(`dropped: ${itemToUpdate.name}`)
          }

        })

        // house in-outs
        socket.on('houseEnter',() => {
          backEndPlayers[socket.id].getinhouse = true
        })
        socket.on('houseLeave',() => {
          backEndPlayers[socket.id].getinhouse = false
        })

        socket.on('getOffVehicle',({vehicleID})=>{
          getOffVehicle(socket.id,vehicleID)
        })
        socket.on('getOnVehicle',({vehicleID})=>{
          getOnVehicle(socket.id,vehicleID)
        })
        ///////////////////////////////// Frequent key-downs update ///////////////////////////////////////////////
        // update frequent keys at once (Movement & hold shoot)  //always fire hold = true since space was pressed
        socket.on('moveNshootUpdate', ({WW, AA, SS, DD, x, y})=>{
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
            // Movement analysis
            Moveplayer(backEndPlayer, WW, AA, SS, DD)
        })

        // update frequent keys at once (Movement only)
        socket.on('movingUpdate', ({WW, AA, SS, DD, x, y})=>{
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
            // Movement analysis
            Moveplayer(backEndPlayer, WW, AA, SS, DD)
        })

        // always fire hold = true since space was pressed
        socket.on('holdUpdate', ({x, y}) => {
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
        })

        // hear player's mouse pos changes 
        socket.on('playermousechange', ({x,y})=>{
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
        })

        ///////////////////////////////// Non-Frequent key-downs update ////////////////////////////////////////////
        socket.on('keydown',({keycode}) => {
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){ // if player was removed, do nothing
            return
            }

            // NOT A MOVEMENT
            switch(keycode) {
            case 'Digit1':
                //console.log('Digit1 presssed')
                backEndPlayer.currentSlot = 1
                break
            case 'Digit2':
                //console.log('Digit2 presssed')
                backEndPlayer.currentSlot = 2
                break
            case 'Digit3':
                //console.log('Digit3 presssed')
                backEndPlayer.currentSlot = 3
                break
            case 'Digit4':
                //console.log('Digit4 presssed')
                backEndPlayer.currentSlot = 4
                break
            case 'KeyF':
                //console.log('f presssed')
                socket.emit('interact',{backEndItems,backEndVehicles})
                break
            case 'KeyG':
                //console.log('g presssed')
                break
            case 'KeyR':
                //console.log('r presssed')
                socket.emit('reload')
                break
            default:
                break
            }
        })
      });


}


app.use(express.static("public"));
httpServer.listen(5000);

main();

let GLOBALCLOCK = 0
// backend ticker - update periodically server info to clients
setInterval(() => {
  GLOBALCLOCK += TICKRATE
  // enemy spawn mechanism
  if ((GLOBALCLOCK > ENEMYSPAWNRATE) && (SPAWNENEMYFLAG) && (USERCOUNT[0]>0)){
    for (let i=0;i<ENEMYNUM;i++){
      spawnEnemies()
    }
    GLOBALCLOCK = 0 // init
  }

  // update players - speed info
  for (const id in backEndPlayers){
    let playerGET = backEndPlayers[id]
    if (playerGET.ridingVehicleID>0){// riding something
      // lower the speed!
      playerGET.speed = Math.max(0, playerGET.speed - 0.1)
    }
  }


  // update projectiles
  for (const id in backEndProjectiles){
    let BULLETDELETED = false
    let projGET = backEndProjectiles[id]
    const gunNameOfProjectile = projGET.gunName
    const PROJECTILERADIUS = projGET.radius
    let myspeed = projGET.speed

    if (gunNameOfProjectile !== 'AWM'){
      if (gunNameOfProjectile === 'grenadeLauncher' || gunNameOfProjectile === 'fragment'){
        projGET.velocity.x *= HIGHFRICTION
        projGET.velocity.y *= HIGHFRICTION
        myspeed *= HIGHFRICTION
      }else{
        projGET.velocity.x *= FRICTION
        projGET.velocity.y *= FRICTION
        myspeed *= FRICTION
      }
    }

    projGET.x += projGET.velocity.x
    projGET.y += projGET.velocity.y

    projGET.travelDistance -= myspeed
    // travel distance check for projectiles
    if (projGET.travelDistance <= 0){
      BULLETDELETED = true
      safeDeleteProjectile(id)
      continue // dont reference projectile that does not exist
    }

    // boundary check for projectiles
    if (projGET.x - PROJECTILERADIUS >= MAPWIDTH ||
        projGET.x + PROJECTILERADIUS <= 0 ||
        projGET.y - PROJECTILERADIUS >= MAPHEIGHT ||
        projGET.y + PROJECTILERADIUS <= 0 
      ) {
      BULLETDELETED = true
      safeDeleteProjectile(id)
      continue // dont reference projectile that does not exist
    }

    let COLLISIONTOLERANCE = Math.floor(gunInfo[gunNameOfProjectile].projectileSpeed/6) -1 // px
    
    // collision with objects
    for (const objid in backEndObjects) {
      const backEndObject = backEndObjects[objid]
      const objInfo = backEndObject.objectinfo


      let collisionDetectedObject 
      if (backEndObject.objecttype==='wall'){
        collisionDetectedObject = collide([objInfo.start.x,objInfo.start.y], [objInfo.end.x,objInfo.end.y], [projGET.x, projGET.y], PROJECTILERADIUS + objInfo.width/2 + COLLISIONTOLERANCE)
      } else if(backEndObject.objecttype==='hut'){
        const DISTANCE = Math.hypot(projGET.x - objInfo.center.x, projGET.y - objInfo.center.y)
        collisionDetectedObject = (DISTANCE < PROJECTILERADIUS + objInfo.radius) // + COLLISIONTOLERANCE no tolerance
      } else{
        console.log("invalid object-projectile interaction: undefined or other name given to obj")
      }

      if (collisionDetectedObject) {
        // who got hit
        if (backEndObjects[objid]){ // safe
          backEndObjects[objid].health -= projGET.projDamage
          //console.log(`Object: ${objid} has health: ${backEndObjects[objid].health} remaining`)
          if (backEndObjects[objid].health <= 0){ //check
            safeDeleteObject(objid)
          } 
        }
        BULLETDELETED = true
        safeDeleteProjectile(id)
        break // only one obj can get hit by a projectile
      }
    }

    if (BULLETDELETED){ // dont check below if collided
      continue
    }

    // collision detection with players
    for (const playerId in backEndPlayers) {
    let backEndPlayer = backEndPlayers[playerId]
    const DISTANCE = Math.hypot(projGET.x - backEndPlayer.x, projGET.y - backEndPlayer.y)
        if ((projGET.playerId !== playerId) && (DISTANCE < PROJECTILERADIUS + PLAYERRADIUS + COLLISIONTOLERANCE)) {
            // who got hit
            if (backEndPlayer){ // safe
            const armoredDamage = armorEffect(backEndPlayer.wearingarmorID, projGET.projDamage)
            //const armoredDamage = projGET.projDamage
            if (DISTANCE < PROJECTILERADIUS + PLAYERRADIUS + COLLISIONTOLERANCE/2){ // accurate/nice timming shot 
                backEndPlayer.health -= armoredDamage
            } else{ // not accurate shot
                backEndPlayer.health -= armoredDamage/2
            }
            if (backEndPlayer.health <= 0){ //check again
                // who shot projectile
                if (backEndPlayers[projGET.playerId]){ // safe
                backEndPlayers[projGET.playerId].score ++
                }
                safeDeletePlayer(playerId)} 
            }
            // delete projectile after inspecting who shot the projectile & calculating damage
            BULLETDELETED = true
            safeDeleteProjectile(id)
            break // only one player can get hit by a projectile
        }
    }
    // collision detection with enemies
    if (BULLETDELETED){ // dont check for loop with enemy 
      continue
    }
    for (const enemyId in backEndEnemies) {
      let backEndEnemy = backEndEnemies[enemyId]
      const DISTANCE = Math.hypot(projGET.x - backEndEnemy.x, projGET.y - backEndEnemy.y)
      if ((DISTANCE < PROJECTILERADIUS + backEndEnemy.radius + COLLISIONTOLERANCE)) {
        // who got hit
        if (backEndEnemy){ // safe
          const armoredDamage = armorEffect(backEndEnemy.wearingarmorID, projGET.projDamage)
            if (DISTANCE < PROJECTILERADIUS + backEndEnemy.radius + COLLISIONTOLERANCE/2){ // accurate/nice timming shot 
              backEndEnemy.health -= armoredDamage
            } else{ // not accurate shot
              backEndEnemy.health -= armoredDamage/2
            }
            if (backEndEnemy.health <= 0){ //check again
              if (backEndPlayers[projGET.playerId]){ // safe
                backEndPlayers[projGET.playerId].score ++
              }
              safeDeleteEnemy(enemyId)} 
        }
        // delete projectile after inspecting who shot the projectile & calculating damage
        BULLETDELETED = true
        safeDeleteProjectile(id)
        break // only one enemy can get hit by a projectile
      }
    }
    if (BULLETDELETED){ // dont check below
      continue
    }

    // collision check with vehicles
    for (const vehicleId in backEndVehicles) {
      let backEndVehicle = backEndVehicles[vehicleId]
      const DISTANCE = Math.hypot(projGET.x - backEndVehicle.x, projGET.y - backEndVehicle.y)
      if ((DISTANCE < PROJECTILERADIUS + backEndVehicle.radius + COLLISIONTOLERANCE)) {
        // who got hit
        if (backEndVehicle){ // safe
            backEndVehicle.health -= projGET.projDamage
            if (backEndVehicle.health <= 0){ //check again
              safeDeleteVehicle(vehicleId)} 
        }
        // delete projectile after inspecting who shot the projectile & calculating damage
        BULLETDELETED = true
        safeDeleteProjectile(id)
        break // only one enemy can get hit by a projectile
      }
    }
    if (BULLETDELETED){ // dont check below
      continue
    }
    // other

  }

  // update objects
  for (const id in backEndObjects){
    const objinfo = backEndObjects[id].objectinfo
    if (objinfo.health <= 0){
      safeDeleteObject(id)
    }
  }

  // update items - dont have to be done fast
  for (const id in backEndItems){
    if (backEndItems[id].deleteRequest){
      delete backEndItems[id]
    }
  }

  // update vehicles
  for (const id in backEndVehicles){
    let vehicle = backEndVehicles[id]
    if (vehicle){ 
      if (vehicle.occupied){ // occupied then update position accordingly to the player who is riding
        updateVehiclePos(vehicle)
      }
    }
  }

  // update enemies
  for (const id in backEndEnemies){
    let enemy = backEndEnemies[id]
    const enemyRad = enemy.radius

    if (enemy.homing){ 
      const targetplayer = backEndPlayers[enemy.homingTargetId]
      if (targetplayer){// initial target still exists
        const angle = Math.atan2(
          targetplayer.y - enemy.y,
          targetplayer.x - enemy.x
        )
        
        enemy.x += enemy.speed * Math.cos(angle)
        enemy.y += enemy.speed * Math.sin(angle)
      }
      else{  // initial target died => dont move for a moment and walk randomly
        enemy.homing = false 
      }
    } else{ // just walk random direction
      enemy.x += enemy.velocity.x
      enemy.y += enemy.velocity.y
    }

    if (enemy.x - enemyRad >= MAPWIDTH ||
      enemy.x + enemyRad <= 0 ||
      enemy.y - enemyRad >= MAPHEIGHT ||
      enemy.y + enemyRad <= 0 
      ) {
        safeDeleteEnemy(id,leaveDrop = false)
      continue // dont reference enemy that does not exist
    }

    // collision detection
    for (const playerId in backEndPlayers) {
      let backEndPlayer = backEndPlayers[playerId]
      const DISTANCE = Math.hypot(enemy.x - backEndPlayer.x, enemy.y - backEndPlayer.y)
      if ((DISTANCE < enemyRad + backEndPlayer.radius)) {
        // who got hit
        if (backEndPlayer){ // safe
          const armoredDamage = armorEffect(backEndPlayer.wearingarmorID, enemy.damage)
          backEndPlayer.health -= armoredDamage
          if (backEndPlayer.health <= 0){ //check alive
            safeDeletePlayer(playerId)} 
        }
        // delete enemy after calculating damage
        safeDeleteEnemy(id,leaveDrop = false)
        break // only one player can get hit by an enemy
      }
    }
    // boundary check with objects!
    if (!GHOSTENEMY){
      borderCheckWithObjects(enemy)
    }
  }

    io.emit('updateFrontEnd',{backEndPlayers, backEndEnemies, backEndProjectiles, backEndObjects, backEndItems,backEndVehicles})
}, TICKRATE)




function makeNdropItem(itemtype, name, groundloc,onground=true){
  const groundx = groundloc.x
  const groundy = groundloc.y

  itemsId++
  let size
  let color
  let iteminfo 

  //different value
  if (itemtype === 'gun' || itemtype === 'melee'){
    const guninfoGET = gunInfo[name]
    size = guninfoGET.size
    color = 'white'
    let ammo = 0
    if (itemtype === 'melee'){
      color = 'black'
      ammo = 'inf'
    }
    const ammotype = guninfoGET.ammotype 
    iteminfo = {ammo,ammotype}

  } else if(itemtype === 'consumable'){
    const consumableinfoGET = consumableInfo[name]
    size = consumableinfoGET.size
    color = consumableinfoGET.color
    const amount = 1
    const healamount = consumableinfoGET.healamount
    iteminfo =  {amount,healamount}

  } else if(itemtype==='armor'){
    const armorinfoGET = armorInfo[name]
    size = armorinfoGET.size
    color = armorinfoGET.color
    const amount = armorinfoGET.amount
    iteminfo = {amount}
  } else if(itemtype==='scope'){
    size = {length:12, width:12}
    color = 'white'
    iteminfo = {scopeDist:parseInt(name)}
  } 
  
  else{
    console.log("invalid itemtype requested in makeNdropItem")
    return 
  }

  backEndItems[itemsId] = {
    itemtype, name, groundx, groundy, size, color, iteminfo, onground, myID: itemsId, deleteRequest:false
  }
}



// safely create object
function makeObjects(objecttype, health, objectinfo){
  objectId++

  let objectsideforbackend = {}

  if (objecttype === 'wall'){
    if (objectinfo.orientation==='vertical'){
      objectsideforbackend = {
        left: objectinfo.start.x - objectinfo.width/2,
        right: objectinfo.start.x + objectinfo.width/2,
        top: objectinfo.start.y,
        bottom: objectinfo.end.y,
        centerx: objectinfo.start.x, // same with end.x
        centery: ( objectinfo.start.y + objectinfo.end.y )/2
      }
    }else if(objectinfo.orientation==='horizontal'){
      objectsideforbackend = {
        left: objectinfo.start.x,
        right: objectinfo.end.x,
        top: objectinfo.start.y - objectinfo.width/2,
        bottom: objectinfo.start.y + objectinfo.width/2,
        centerx: ( objectinfo.start.x + objectinfo.end.x )/2,
        centery: objectinfo.start.y // same with end.y
      }
    }

  }
  //console.log(`new obj ID: ${objectId}`)

  backEndObjects[objectId] = {
    objecttype , myID:objectId, deleteRequest:false, health, objectinfo, objectsideforbackend
  }
}

function makeBox(location){ // location is top left corner
  const WALLWIDTH = 20
  makeObjects("wall", 30, {orientation: 'vertical',start:{x:location.x+WALLWIDTH,y:location.y}, end:{x:location.x+WALLWIDTH,y:location.y+200}, width:WALLWIDTH, color: 'gray'})
  makeObjects("wall", 30, {orientation: 'vertical',start:{x:location.x+300-WALLWIDTH,y:location.y}, end:{x:location.x+300-WALLWIDTH,y:location.y+200}, width:WALLWIDTH, color: 'gray'})
  makeObjects("wall", 30, {orientation: 'horizontal',start:{x:location.x,y:location.y}, end:{x:location.x+300,y:location.y}, width:WALLWIDTH, color: 'gray'})
  makeObjects("wall", 30, {orientation: 'horizontal',start:{x:location.x,y:location.y+200}, end:{x:location.x+300,y:location.y+200}, width:WALLWIDTH, color: 'gray'})
  
}

function makeHouse(location){ // location is top left corner
  const WALLWIDTH_HALF = 10
  const WALLWIDTH = WALLWIDTH_HALF*2
  const HOUSEWIDTH = TILE_SIZE*2
  const HOUSEHEIGHT = TILE_SIZE
  const DOORLEN = 40
  makeObjects("wall", 30, {orientation: 'vertical',start:{x:location.x+WALLWIDTH_HALF,y:location.y+DOORLEN}, end:{x:location.x+WALLWIDTH_HALF,y:location.y+HOUSEHEIGHT}, width:WALLWIDTH, color: 'gray'})
  makeObjects("wall", 30, {orientation: 'vertical',start:{x:location.x+HOUSEWIDTH-WALLWIDTH_HALF,y:location.y}, end:{x:location.x+HOUSEWIDTH-WALLWIDTH_HALF,y:location.y+HOUSEHEIGHT}, width:WALLWIDTH, color: 'gray'})
  makeObjects("wall", 30, {orientation: 'horizontal',start:{x:location.x,y:location.y}, end:{x:location.x+HOUSEWIDTH,y:location.y}, width:WALLWIDTH, color: 'gray'})
  makeObjects("wall", 30, {orientation: 'horizontal',start:{x:location.x,y:location.y+HOUSEHEIGHT}, end:{x:location.x+HOUSEWIDTH,y:location.y+HOUSEHEIGHT}, width:WALLWIDTH, color: 'gray'})
  
}

function safeDeleteObject(id){
  //console.log(`obj removed ID: ${id}`)
  delete backEndObjects[id]
}

function borderCheckWithObjects(entity){
  if (!entity) {return} // no need to check
  for (const id in backEndObjects){
    const obj = backEndObjects[id]

    if (obj.objecttype === 'wall'){
      const objSides = obj.objectsideforbackend
      const entitySides = {
        left: entity.x - entity.radius,
        right: entity.x + entity.radius,
        top: entity.y - entity.radius,
        bottom: entity.y + entity.radius
      }
      if (entity){// only when entity exists
        // LR check (hori)
        if (objSides.top < entity.y && entity.y < objSides.bottom){
          if (objSides.centerx < entity.x && entitySides.left < objSides.right){ // restore position for backend
            entity.x = entity.radius + objSides.right
          }
          if (objSides.centerx >= entity.x && entitySides.right > objSides.left){ // restore position for backend
            entity.x = objSides.left - entity.radius
          }
        } 

        //TB check (verti)
        if (objSides.left < entity.x && entity.x < objSides.right){
          if (objSides.centery < entity.y && entitySides.top < objSides.bottom){ // restore position for backend
            entity.y = objSides.bottom + entity.radius
          }
          if (objSides.centery >= entity.y && entitySides.bottom > objSides.top){ // restore position for backend
            entity.y = objSides.top - entity.radius
          }
        }
      }
    } 
    
    if(obj.objecttype === 'hut'){
      const objinfoGET = obj.objectinfo
      // 'hut': {center:{x:,y:}, radius: 20, color:, health:}
      const radiusSum = objinfoGET.radius + entity.radius
      const xDist = entity.x - objinfoGET.center.x
      const yDist = entity.y - objinfoGET.center.y 
      const Dist = Math.hypot(xDist,yDist)

      if (Dist < radiusSum){
        const angle = Math.atan2(
          yDist,
          xDist
        )
        entity.x = objinfoGET.center.x + Math.cos(angle) * radiusSum
        entity.y = objinfoGET.center.y + Math.sin(angle) * radiusSum
      }
    }
  }

}





function spawnEnemies(){
  enemyId++
  ENEMYCOUNT ++
  const factor = 1 +  Math.random()  // 1~2
  const radius = Math.round(factor*16) // 16~32
  const speed = 3 - factor // 1~2
  let x = 64
  let y = 64

  // if (Math.random() < 0.5) {
  //     x = Math.random() < 0.5 ? 0 - radius : MAPWIDTH + radius
  //     y = Math.random() * MAPHEIGHT
  // }else{
  //     x = Math.random() * MAPWIDTH
  //     y = Math.random() < 0.5 ? 0 - radius : MAPHEIGHT + radius
  // }


  let homing = false
  let homingTargetId = -1
  //let colorfactor = 100 + Math.round(factor*40)

  if (Math.random() > 0.5){ // 50% chance of homing!
    homing = true
    //colorfactor = Math.round(factor*40)
    const backEndPlayersKey = Object.keys(backEndPlayers)
    const playerNum = backEndPlayersKey.length

    if (playerNum===0){
      //console.log('No players')
      idx = 0
      homing = false
    }else{
      //console.log(`${playerNum} Players playing`)
      idx = Math.round(Math.random()* (playerNum - 1) ) // 0 ~ #player - 1
    }
    homingTargetId = backEndPlayersKey[idx]
  }
  // back ticks: ~ type this without shift!

  const color = "CadetBlue" //`hsl(${colorfactor},50%,50%)` // [0~360, saturation %, lightness %]
  const angle = Math.atan2(MAPHEIGHT/2 - y, MAPWIDTH/2 - x)
  const velocity = {
      x: Math.cos(angle)*speed,
      y: Math.sin(angle)*speed
  }

  const damage = 1
  const myID = enemyId
  const health = factor*2 -1
  const wearingarmorID = -1 //none

  // (new Enemy({ex, ey, eradius, ecolor, evelocity}))
  backEndEnemies[enemyId] = {
    x,y,radius,velocity, myID, color, damage, health, homing, homingTargetId, speed, wearingarmorID
  }
  //console.log(`spawned enemy ID: ${enemyId}`)
}


const enemyDropGuns = ['M249', 'VSS', 'ak47', 'FAMAS']

function safeDeleteEnemy(enemyid, leaveDrop = true){
  const enemyInfoGET = backEndEnemies[enemyid]
  if (!backEndEnemies[enemyid]) {return} // already removed somehow
  if (leaveDrop){
    const idxGUN = Math.round(Math.random()*(enemyDropGuns.length-1)) // 0 ~ 3
    const chance = Math.random()
    if (chance < 0.01){ // 1% chance to drop medkit
      makeNdropItem( 'consumable', 'medkit', {x:enemyInfoGET.x, y:enemyInfoGET.y})
    } else if (0.01 < chance && chance < 0.03){ // 2% chance to drop bandage
      makeNdropItem( 'consumable', 'bandage', {x:enemyInfoGET.x, y:enemyInfoGET.y})
    } else if (chance>0.999){ // 0.1% to drop guns
      makeNdropItem( 'gun', enemyDropGuns[idxGUN], {x:enemyInfoGET.x, y:enemyInfoGET.y})
    } 
  } 
  ENEMYCOUNT--
  delete backEndEnemies[enemyid]
}

function spawnVehicle(location, type='car'){ // currently only makes cars
  vehicleId++
  const x = location.x
  const y = location.y
  
  let radius = 24
  let color = "Aquamarine"
  let warningcolor = "Crimson"
  let damage = 5 // bump into damage
  let health = 30
  let speed = 6 // for a car

  if (type==='car'){
    // do nothing
  } else if(type==='tank'){
    radius = 32
    color = "Olive"
    warningcolor = "IndianRed"
    damage = 10 // bump into damage
    health = 60
    speed = 3 
  }


  backEndVehicles[vehicleId] = {
    x,y,radius,velocity:0, myID:vehicleId, color, warningcolor, damage, health, speed, type,occupied:false,ridingPlayerID:-1
  }
}

function getOnVehicle(playerID,vehicleID){
  if (backEndVehicles[vehicleID].occupied){ // if already occupied, block others 
    return 
  }
  if (backEndPlayers[playerID].ridingVehicleID>0){ // if player is already riding a vehicle, dont ride again
    return
  }
  backEndPlayers[playerID].ridingVehicleID = vehicleID
  // backEndPlayers[playerID].speed = backEndVehicles[vehicleID].speed

  // transport to vehicle center
  backEndPlayers[playerID].x = backEndVehicles[vehicleID].x
  backEndPlayers[playerID].y = backEndVehicles[vehicleID].y

  backEndVehicles[vehicleID].occupied = true
  backEndVehicles[vehicleID].ridingPlayerID = playerID
  //console.log(`player ${playerID} got on ${vehicleID}`)
}

function getOffVehicle(playerID,vehicleID=-1){ // vehicleID should be given if player cannot give vehicle id (e.g. death)
  let TrueVehicleID =-1

  if (backEndPlayers[playerID]){ // if player alive
    TrueVehicleID = backEndPlayers[playerID].ridingVehicleID // get the true vehicle ID since we can get one

    if (!(backEndPlayers[playerID].ridingVehicleID>0)){ // if player is not riding a vehicle (false alarm)
      return
    }
    backEndPlayers[playerID].ridingVehicleID = -1
    backEndPlayers[playerID].speed = PLAYERSPEED
  }

  if (TrueVehicleID===-1){ // use vehicleID given instead - when we cannot get id from player
    TrueVehicleID = vehicleID
  }

  backEndVehicles[TrueVehicleID].occupied = false
  backEndVehicles[TrueVehicleID].ridingPlayerID = -1
  //console.log(`player ${playerID} got off ${TrueVehicleID}`)
}

function safeDeleteVehicle(vehicleid){
  const vehicle = backEndVehicles[vehicleid]
  if (vehicle.occupied){ // vehicle.ridingPlayerID must exist
    getOffVehicle(vehicle.ridingPlayerID,vehicleid)
  }

  // explode
  explosion(vehicle, 18)

  delete backEndVehicles[vehicleid]
}

function updateVehiclePos(vehicle){
  const riderID = vehicle.ridingPlayerID
  const rider = backEndPlayers[riderID]
  if (rider){ // rider exist
    vehicle.x = rider.x
    vehicle.y = rider.y
  }

}

function explosion(location,BLASTNUM,playerID=0){
  for (let i=0;i< BLASTNUM;i++){
    addProjectile( (2*Math.PI/BLASTNUM)*i,'fragment',playerID, location)// damaging all players nearby
  }
}