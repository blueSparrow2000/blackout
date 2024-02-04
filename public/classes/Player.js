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
      canvas.lineWidth = 8
      canvas.strokeStyle = 'red'
      canvas.beginPath()
      canvas.moveTo(xReal - HEALTHBARHALFLEN, yReal)
      canvas.lineTo(xReal - HEALTHBARHALFLEN + HPlen, yReal)
      canvas.stroke()
    }

    drawGun(canvas, camX, camY, locX, locY, currentHoldingItem, thisguninfo,canvasEl){
      canvas.strokeStyle = 'black'
      // player with socket.id (me)
      let xReal = locX
      let yReal = locY
      if (locX===-1){ // other player
        xReal = this.x - camX 
        yReal = this.y - camY
      }

      if (currentHoldingItem.itemtype==='gun'){
        const itemSize = currentHoldingItem.size
        const itemlength = itemSize.length*2
        const gunmainwidth = itemSize.width*2
        let angle = Math.atan2(
          (this.cursorPos.y) - canvasEl.height/2,
          (this.cursorPos.x) - canvasEl.width/2
        )
        if (locX===-1){// other player
          let angle = Math.atan2(
            (this.cursorPos.y) - this.y,
            (this.cursorPos.x) - this.x
          )
        }
        const direction = { 
          x: Math.cos(angle) ,
          y: Math.sin(angle) 
        }
        canvas.beginPath()
        canvas.moveTo(xReal, yReal)
        canvas.lineTo(xReal + direction.x * itemlength, yReal + direction.y * itemlength)
        canvas.lineWidth = gunmainwidth
        canvas.stroke()

        if (thisguninfo.ammotype === '12G'){ // 12 gauge shotgun - draw one more rect
          const bodysize = itemlength - 4
          const bodywidth = gunmainwidth + thisguninfo.num*2
          canvas.beginPath()
          canvas.moveTo(xReal, yReal)
          canvas.lineTo(xReal + direction.x * bodysize, yReal + direction.y * bodysize)
          canvas.lineWidth = bodywidth
          canvas.stroke()

        } else if(thisguninfo.projectileSpeed >= 30){ // snipters except VSS (can shoot all across the screen)
          const tipsize = 4
          const tipstart = itemlength- tipsize
          const tipwidth = parseInt(gunmainwidth + thisguninfo.damage/2)
          const bodylen = itemlength - 40

          // body part
          canvas.beginPath()
          canvas.moveTo(xReal, yReal)
          canvas.lineTo(xReal + direction.x * bodylen, yReal + direction.y * bodylen)
          canvas.lineWidth = gunmainwidth + 2
          canvas.stroke()


          canvas.beginPath()
          canvas.moveTo(xReal + direction.x * tipstart, yReal + direction.y * tipstart)
          canvas.lineTo(xReal + direction.x * itemlength, yReal + direction.y * itemlength)
          canvas.lineWidth = tipwidth
          canvas.stroke()

        } else if(thisguninfo.ammotype==='5mm'){
          const cylotip = 4
          const tipstart = 24
          const tipwidth = gunmainwidth + (thisguninfo.projectileSpeed-18)

          canvas.beginPath()
          canvas.moveTo(xReal + direction.x * tipstart, yReal + direction.y * tipstart)
          canvas.lineTo(xReal + direction.x * (itemlength-cylotip), yReal + direction.y * (itemlength-cylotip))

          canvas.lineWidth = tipwidth
          canvas.stroke()
        }

      }


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
  