let settings = {
    particles: {
      length:   9999, 
      duration:   4,
      velocity: 80, 
      effect: -1.3, 
      size:      8, 
    },
  };
  /*
   */
  (function(){let b=0;let c=["ms","moz","webkit","o"];for(let a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f)},f);b=d+f;return g}}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d)}}}());

  let PointToYou = (function() {
    function PointToYou(x, y) {
      this.x = (typeof x !== 'undefined') ? x : 0;
      this.y = (typeof y !== 'undefined') ? y : 0;
    }
    PointToYou.prototype.clone = function() {
      return new PointToYou(this.x, this.y);
    };
    PointToYou.prototype.length = function(length) {
      if (typeof length == 'undefined')
        return Math.sqrt(this.x * this.x + this.y * this.y);
      this.normalize();
      this.x *= length;
      this.y *= length;
      return this;
    };
    PointToYou.prototype.normalize = function() {
      let length = this.length();
      this.x /= length;
      this.y /= length;
      return this;
    };
    return PointToYou;
  })();
  /*
   * Particle
   */
  let Particle = (function() {
    function Particle() {
      this.position = new PointToYou();
      this.velocity = new PointToYou();
      this.acceleration = new PointToYou();
      this.age = 0;
    }
    Particle.prototype.initialize = function(x, y, dx, dy) {
      this.position.x = x;
      this.position.y = y;
      this.velocity.x = dx;
      this.velocity.y = dy;
      this.acceleration.x = dx * settings.particles.effect;
      this.acceleration.y = dy * settings.particles.effect;
      this.age = 0;
    };
    Particle.prototype.update = function(deltaTime) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.velocity.x += this.acceleration.x * deltaTime;
      this.velocity.y += this.acceleration.y * deltaTime;
      this.age += deltaTime;
    };
    Particle.prototype.draw = function(context, image) {
      function ease(t) {
        return (--t) * t * t + 1;
      }
      let size = image.width * ease(this.age / settings.particles.duration);
      context.globalAlpha = 1 - this.age / settings.particles.duration;
      context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
    };
    return Particle;
  })();
  /*
   * ParticlePool 
   */
  let ParticlePool = (function() {
    let particles,
        firstActive = 0,
        firstFree   = 0,
        duration    = settings.particles.duration;
   
    function ParticlePool(length) {
      particles = new Array(length);
      for (let i = 0; i < particles.length; i++)
        particles[i] = new Particle();
    }
    ParticlePool.prototype.add = function(x, y, dx, dy) {
      particles[firstFree].initialize(x, y, dx, dy);
           firstFree++;
      if (firstFree   == particles.length) firstFree   = 0;
      if (firstActive == firstFree       ) firstActive++;
      if (firstActive == particles.length) firstActive = 0;
    };
    ParticlePool.prototype.update = function(deltaTime) {
      let i;
     
  
      if (firstActive < firstFree) {
        for (i = firstActive; i < firstFree; i++)
          particles[i].update(deltaTime);
      }
      if (firstFree < firstActive) {
        for (i = firstActive; i < particles.length; i++)
          particles[i].update(deltaTime);
        for (i = 0; i < firstFree; i++)
          particles[i].update(deltaTime);
      }
     
 
      while (particles[firstActive].age >= duration && firstActive != firstFree) {
        firstActive++;
        if (firstActive == particles.length) firstActive = 0;
      }
     
     
    };
    ParticlePool.prototype.draw = function(context, image) {
      if (firstActive < firstFree) {
        for (i = firstActive; i < firstFree; i++)
          particles[i].draw(context, image);
      }
      if (firstFree < firstActive) {
        for (i = firstActive; i < particles.length; i++)
          particles[i].draw(context, image);
        for (i = 0; i < firstFree; i++)
          particles[i].draw(context, image);
      }
    };
    return ParticlePool;
  })();

  (function(canvas) {
    let context = canvas.getContext('2d'),
        particles = new ParticlePool(settings.particles.length),
        particleRate = settings.particles.length / settings.particles.duration, // particles/sec
        time;
   
    function pointOnHeart(t) {
      return new PointToYou(
        160 * Math.pow(Math.sin(t), 3),
        130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
      );
    }
   
    let image = (function() {
      let canvas  = document.createElement('canvas'),
          context = canvas.getContext('2d');
      canvas.width  = settings.particles.size;
      canvas.height = settings.particles.size;

      function to(t) {
        let point = pointOnHeart(t);
        point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
        point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
        return point;
      }
      // create the path
      context.beginPath();
      let t = -Math.PI;
      let point = to(t);
      context.moveTo(point.x, point.y);
      while (t < Math.PI) {
        t += 0.01; // baby steps!
        point = to(t);
        context.lineTo(point.x, point.y);
      }
      context.closePath();
      // create the fill
      context.fillStyle = '#FFA07A';
    //   context.fillStyle = '#F000';
      context.fill();
      // create the image
      let image = new Image();
      image.src = canvas.toDataURL();
      return image;
    })();
   
    // render that thing!
    function render() {
      // next animation frame
      requestAnimationFrame(render);
     
      // update time
      let newTime   = new Date().getTime() / 1000,
          deltaTime = newTime - (time || newTime);
      time = newTime;
     
      // clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
     
      // create new particles
      let amount = particleRate * deltaTime;
      for (let i = 0; i < amount; i++) {
        let pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
        let dir = pos.clone().length(settings.particles.velocity);
        particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
      }
     
      // update and draw particles
      particles.update(deltaTime);
      particles.draw(context, image);
    }
   
    // handle (re-)sizing of the canvas
    function onResize() {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    window.onresize = onResize;
   
    // delay rendering bootstrap
    setTimeout(function() {
      onResize();
      render();
    }, 10);
  })(document.getElementById('heart'));