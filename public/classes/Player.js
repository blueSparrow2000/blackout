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
      canvas.fillText(this.username,this.x - this.username.length - camX ,this.y - this.radius*2 - camY)
      canvas.fillText(`HP: ${Math.round(this.health * 100) / 100}`,this.x - 4  - camX ,this.y - this.radius - camY)
    //   const itemName = currentHoldingItem.name
    //   c.fillText(`[${this.currentSlot}] ${itemName}`,this.x - 14 ,this.y + this.radius*3)
    
    }
  }
  