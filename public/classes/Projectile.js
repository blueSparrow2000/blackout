class Projectile {
    constructor({x, y, radius,velocity, color = 'black',gunName}) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.velocity = velocity
      this.gunName = gunName
    }
  
    draw(canvas, camX, camY) {
        canvas.beginPath()
        canvas.moveTo(this.x - this.velocity.x - camX, this.y - this.velocity.y - camY)
        canvas.lineTo(this.x - camX,this.y - camY)
        canvas.stroke()
    }

  }
  