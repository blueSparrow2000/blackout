const HEALTHBARHALFLEN = 16

class Player{
    constructor({x, y, radius, color,username, health, currentSlot = 1,inventory, cursorPos = {y:0,x:0}, score, wearingarmorID=-1}) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.username = username
      this.health = health
      this.currentSlot = currentSlot
      this.inventory = inventory
      this.cursorPos = cursorPos
      this.ammoList = {'45ACP':50,'5mm':30,'7mm':10,'12G':14,'battery':2, 'bolt':8,'superconductor':10} //default amount of ammos
      this.reloading = false
      this.score = score
      this.wearingarmorID = wearingarmorID
    }

    displayName(canvas, camX, camY) {
      canvas.fillText(this.username,this.x - 2*this.username.length - camX ,this.y - this.radius*3 - camY)
    }
    displayHealth(canvas, camX, camY, locX, locY){
      // player with socket.id (me)
      let xReal = locX
      let yReal = locY
      if (locX===-1){ // other player
        xReal = this.x - camX 
        yReal = this.y - this.radius*2 - camY
      }

      //canvas.fillText(`HP: ${Math.round(this.health * 100) / 100}`,xReal,yReal)

      const HPlen = parseInt( HEALTHBARHALFLEN * this.health / 4) // max health is 8

      canvas.beginPath()
      canvas.moveTo(xReal - HEALTHBARHALFLEN, yReal)
      canvas.lineTo(xReal - HEALTHBARHALFLEN + HPlen, yReal)
      canvas.stroke()

    }
    displayAttribute(canvas, camX, camY, currentHoldingItem){
      const itemName = currentHoldingItem.name
      canvas.fillText(`[${this.currentSlot}] ${itemName}`,this.x - 14- camX ,this.y + this.radius*2- camY)
      
      if (currentHoldingItem){
        if (currentHoldingItem.itemtype === 'gun'){
          if (this.reloading){
            canvas.fillText('reloading...',this.x - 10 - camX,this.y + this.radius*3- camY)
          } else{
            canvas.fillText(`${currentHoldingItem.ammo}/${currentHoldingItem.magSize}`,this.x - 10 - camX,this.y + this.radius*3- camY)
          }
        }
      }
    }

  }
  