class OneDmovement extends Phaser.Scene {
  constructor() {
    super('1Dmovement');
    this.my = {sprite: {}, text: {}};

    this.activeShipsCount = 0;

    this.isInvulnerable = false;
    this.invulnerabilityDuration = 1000;

    this.score = 0;
    this.lives = 3;
    this.ladybugs = [];

    this.waveDelay = 25000;
    this.waveActive = false;
    this.waveShips = [];

    this.animalHits = {
      snail: 0,
      frog: 0,
      mouse: 0,
      worm: 0
    };

    // Game variables
    this.lifeX = 40;
    this.lifeY = 30;
    this.animalX = 100;
    this.animalY = 555;
    this.uiX = 0;
    this.uiY = -130;
    this.bgX = 400;
    this.bgY = 450;
    this.floorX = 30;
    this.floorY = 610;
    this.bodyX = 400;
    this.bodyY = 450;
    this.moveSpeed = 20;
    this.shootSpeed = 45;
    this.isShooting = false;
    
    this.graphics;
    this.pathPoints = []; 
    this.enemyShips = []; 
    this.yellowShips = []; 
    this.shipDelayPink = 5500;
    this.shipDelayYellow = 7000;
    this.shipDuration = 20000;
    
    this.shipStartPositions = [
      {x: 100, y: 100},
      {x: 200, y: 100},
      {x: 300, y: 100},
      {x: 400, y: 100}, 
      {x: 500, y: 100}
    ];
    
    this.yellowShipStartPositions = [
      {x: 100, y: 150},
      {x: 200, y: 150},
      {x: 300, y: 150},
      {x: 400, y: 150}, 
      {x: 500, y: 150}
    ];
    
    this.enemyBullets = []; 
    this.yellowBullets = []; 
    this.enemyShootDelay = 3000;
  }

  preload() {
    this.load.setPath("./assets/");
    //Game assets
    this.load.image("GrassBlock", "slimeBlock.png");
    this.load.image("EmittedSprite", "slimeGreen_squashed.png");
    this.load.image("Bottom", "grassBlock.png");
    this.load.image("LayerOne", "Background-Blue.png");
    this.load.image("Board","UI Board.png");
    this.load.image("Snail","snail.png");
    this.load.image("Frog","frog.png");
    this.load.image("Mouse","mouse.png");
    this.load.image("Worm","worm.png");
    this.load.image("Worm_white","worm_hit.png");
    this.load.image("Snail_white","snail_hit.png");
    this.load.image("Frog_white","frog_hit.png");
    this.load.image("Mouse_white","mouse_hit.png");
    this.load.image("LadyBug", "ladyBug.png");
    this.load.image("LadyBug_white", "ladyBug_hit.png");
    
    //Path assets
    this.load.image("enemyPinkShip", "shipPink_manned.png");
    this.load.image("enemyYellowShip", "shipYellow_manned.png");

    //Enemy shooter sprites
    this.load.image("shootPink","alienPink_badge1.png");
    this.load.image("shootYellow","alienYellow_badge2.png");

    //Burst
    this.load.image("burst","laserBlue_burst.png");

    //Audio
    this.load.audio('pepSound2', 'pepSound2.ogg');
    this.load.audio('laser2', 'laser2.ogg');

    document.getElementById('description').innerHTML = '<h2>1D Movement Shooter<br>Space - Shoot<br>Absorb enemy bullets to protect the wildlife!<br>A - move left // D - move right</h2>'
  }

  create() {
    this.createBackground();
    this.createPathSystem();
    this.createPlayer();
    this.setupInput();
    this.createLivesDisplay();

    this.textScore();
    
    this.createInitialShips();
    this.activeShipsCount = this.enemyShips.length + this.yellowShips.length;
    this.setupWave();
    this.createInitialYellowShips();
    
    this.startShipMovementSequence();
    this.startYellowShipMovementSequence();
  }

  setupWave() {
    const lastYellowShipFinishTime = 
      (this.yellowShipStartPositions.length - 1) * this.shipDelayYellow + 
      this.shipDuration;
    
    this.time.delayedCall(lastYellowShipFinishTime, () => {
      this.spawnWave();
    });
}
  
spawnWave() {
    if (this.waveActive) return;
    this.waveActive = true;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        this.time.delayedCall((row * 5 + col) * 1000, () => {
          const x = 100 + (col * 150);
          const y = 50 + (row * 50);

          const pinkPath = [
            { x: x, y: y },
            { x: 750, y: 100 },
            { x: 750, y: 200 },
            { x: 50, y: 200 },
            { x: 50, y: 250 },
            { x: 750, y: 250 },
            { x: 750, y: 350 },
            { x: 50, y: 350 },
            { x: 50, y: 450 },
            { x: 950, y: 450 }
          ];
          
          const pinkPoints = [];
          pinkPath.forEach(point => {
            pinkPoints.push(point.x);
            pinkPoints.push(point.y);
          });
          
          const pinkCurve = new Phaser.Curves.Spline(pinkPoints);
          
          const ship = this.add.follower(
            pinkCurve,
            x,
            y,
            "enemyPinkShip"
          );
          ship.setScale(0.35).setDepth(10);
          ship.isMoving = true;
          this.waveShips.push(ship);
          
          this.startEnemyShooting(ship);
          
          ship.startFollow({
            from: 0,
            to: 1,
            duration: this.shipDuration,
            ease: 'Sine.easeInOut',
            repeat: 0,
            rotateToPath: true,
            onComplete: () => {
              ship.isMoving = false;
              if (ship.shootTimer) {
                ship.shootTimer.destroy();
              }
              ship.destroy();
            }
          });
        });
      }
    }
    
    for (let col = 0; col < 5; col++) {
      this.time.delayedCall((2 * 5 + col) * 1000, () => {
        const x = 100 + (col * 150);
        const y = 200;

        const yellowPath = [
          { x: x, y: y },
          { x: 750, y: 150 },
          { x: 10, y: 270 },
          { x: 750, y: 370 },
          { x: 10, y: 450 },
          { x: 950, y: 450 }
        ];
        
        const yellowPoints = [];
        yellowPath.forEach(point => {
          yellowPoints.push(point.x);
          yellowPoints.push(point.y);
        });
        
        const yellowCurve = new Phaser.Curves.Spline(yellowPoints);
        
        const ship = this.add.follower(
          yellowCurve,
          x,
          y,
          "enemyYellowShip"
        );
        ship.setScale(0.35).setDepth(10);
        ship.isMoving = true;
        this.waveShips.push(ship);
        
        this.startYellowEnemyShooting(ship);

        ship.startFollow({
          from: 0,
          to: 1,
          duration: this.shipDuration,
          ease: 'Sine.easeInOut',
          repeat: 0,
          rotateToPath: true,
          onComplete: () => {
            ship.isMoving = false;
            if (ship.shootTimer) {
              ship.shootTimer.destroy();
            }
            ship.destroy();
          }
        });
      });
    }
}
  
  createLivesDisplay() {
    for (let i = 0; i < 3; i++) {
      const ladybug = this.add.sprite(
        this.lifeX + (i * 40), 
        this.lifeY, 
        "LadyBug"
      ).setScale(0.5);
      this.ladybugs.push(ladybug);
    }
  }

  textScore(){
    this.my.text.scoreText = this.add.text (700, 20, 'Score: 0', {
      fontFamily: 'Optima',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setDepth(20);
  }

  createInitialShips() {
    this.shipStartPositions.forEach((pos, index) => {
      const ship = this.add.sprite(pos.x, pos.y, "enemyPinkShip");
      ship.setScale(.35).setDepth(10).setAlpha(0.2);
      ship.isFollowing = false; // Not moving yet
      this.enemyShips.push(ship);
    });
  }

  createInitialYellowShips() {
    this.yellowShipStartPositions.forEach((pos, index) => {
      const ship = this.add.sprite(pos.x, pos.y, "enemyYellowShip");
      ship.setScale(.35).setDepth(10).setAlpha(0.2);
      ship.isFollowing = false; // Not moving yet
      this.yellowShips.push(ship);
    });
  }

  startShipMovementSequence() {
    // Start from right to left
    for (let i = this.shipStartPositions.length - 1; i >= 0; i--) {
      this.time.delayedCall(
        (this.shipStartPositions.length - 1 - i) * this.shipDelayPink,
        () => {
          if (i >= 0 && i < this.enemyShips.length) {
            this.startShipOnPath(this.enemyShips[i]);
          }
        }
      );
    }
  }

  startYellowShipMovementSequence() {
    for (let i = this.yellowShipStartPositions.length - 1; i >= 0; i--) {
      this.time.delayedCall(
        (this.yellowShipStartPositions.length - 1 - i) * this.shipDelayYellow,
        () => {
          if (i >= 0 && i < this.yellowShips.length) {
            this.startYellowShipOnPath(this.yellowShips[i]);
          }
        }
      );
    }
  }

  startShipOnPath(ship) {
    if (!ship.active) return;

    this.activeShipsCount++;

    const shipPath = [
      { x: ship.x, y: ship.y },
      { x: 750, y: 100 },
      { x: 750, y: 200 },
      { x: 50, y: 200 },
      { x: 50, y: 250 },
      { x: 750, y: 250 },
      { x: 750, y: 350 },
      { x: 50, y: 350 },
      { x: 50, y: 450 },
      { x: 950, y: 450 }
    ];
    
    const points = [];
    shipPath.forEach(point => {
      points.push(point.x);
      points.push(point.y);
    });
    
    const curve = new Phaser.Curves.Spline(points);

    const follower = this.add.follower(
      curve,
      ship.x,
      ship.y,
      "enemyPinkShip"
    );
    follower.setScale(0.35).setDepth(10);
    follower.isMoving = true;

    this.startEnemyShooting(follower);

    ship.destroy();

    follower.startFollow({
      from: 0,
      to: 1,
      duration: this.shipDuration,
      ease: 'Sine.easeInOut',
      repeat: 0,
      rotateToPath: true,
      onComplete: () => {
        this.activeShipsCount--; 
        this.checkWaveSpawn();
        
        follower.isMoving = false;
        if (follower.shootTimer) {
          follower.shootTimer.destroy();
        }
        follower.destroy();
      }
    });
    
    const index = this.enemyShips.indexOf(ship);
    if (index !== -1) {
      this.enemyShips[index] = follower;
    }
}

startYellowShipOnPath(ship) {
    if (!ship.active) return;

    this.activeShipsCount++;

    const yellowPathPoints = [
      { x: ship.x, y: ship.y },
      { x: 750, y: 150 },
      { x: 10, y: 270 },
      { x: 750, y: 370 },
      { x: 10, y: 450 },
      { x: 950, y: 450 },      
    ];
    
    const curve = new Phaser.Curves.Spline(yellowPathPoints);
    const follower = this.add.follower(
      curve,
      ship.x,
      ship.y,
      "enemyYellowShip"
    );
    follower.setScale(0.35).setDepth(10);
    follower.isMoving = true;
    
    this.startYellowEnemyShooting(follower);
    
    ship.destroy();

    follower.startFollow({
      from: 0,
      to: 1,
      duration: this.shipDuration,
      ease: 'Sine.easeInOut',
      repeat: 0,
      rotateToPath: true,
      onComplete: () => {
        this.activeShipsCount--;
        this.checkWaveSpawn();
        
        follower.isMoving = false;
        if (follower.shootTimer) {
          follower.shootTimer.destroy();
        }
        follower.destroy();
      }
    });
    
    const index = this.yellowShips.indexOf(ship);
    if (index !== -1) {
      this.yellowShips[index] = follower; 
    }
}

  startEnemyShooting(ship) {
    ship.shootTimer = this.time.addEvent({
      delay: this.enemyShootDelay,
      callback: () => {
        if (ship.active) {
          this.createEnemyBullet(ship);
        }
      },
      loop: true
    });
    
    this.time.delayedCall(() => {
      if (ship.active) {
        this.createEnemyBullet(ship);
      }
    });
  }

  startYellowEnemyShooting(ship) {
    ship.shootTimer = this.time.addEvent({
      delay: this.enemyShootDelay,
      callback: () => {
        if (ship.active) {
          this.createYellowEnemyBullet(ship);
        }
      },
      loop: true
    });
    
    this.time.delayedCall(() => {
      if (ship.active) {
        this.createYellowEnemyBullet(ship);
      }
    });
  }

  createEnemyBullet(ship) {
    const bullet = this.add.sprite(
      ship.x,
      ship.y + 30,
      "shootPink"
    );
    bullet.setScale(0.5).setDepth(15);
    
    this.tweens.add({
      targets: bullet,
      y: this.game.config.height + 50,
      duration: 2000,
      onComplete: () => {
        bullet.destroy();
      }
    });
    
    this.enemyBullets.push(bullet);
  }

  createYellowEnemyBullet(ship) {
    const bullet = this.add.sprite(
      ship.x,
      ship.y + 30,
      "shootYellow"
    );
    bullet.setScale(0.5).setDepth(15);
    
    this.tweens.add({
      targets: bullet,
      y: this.game.config.height + 50,
      duration: 2000,
      onComplete: () => {
        bullet.destroy();
      }
    });
    
    this.yellowBullets.push(bullet);
  }

  createPathSystem() {
    this.graphics = this.add.graphics();
    this.graphics.depth = -1;
  }

  createBackground() {
    let my = this.my;
  
    // Background
    my.sprite.background = this.add.sprite(this.bgX, this.bgY, "LayerOne");
    
    // UI Board
    my.sprite.UIboard = this.add.sprite(this.bgX, this.uiY, "Board");
    my.sprite.UIboard.angle = 90;
    my.sprite.UIboard.scale = 0.2;

    // Ground Animals
    my.sprite.floor_snail = this.add.sprite(this.animalX, this.animalY-2, "Snail");
    my.sprite.floor_frog = this.add.sprite(this.animalX+207, this.animalY-2, "Frog");
    my.sprite.floor_mouse = this.add.sprite(this.animalX+414, this.animalY, "Mouse");
    my.sprite.floor_worm = this.add.sprite(this.animalX+621, this.animalY+5, "Worm");

    // Floor tiles
    for (let i = 0; i < 12; i++) {
      my.sprite[`floor_${i}`] = this.add.sprite(this.floorX + (i * 69), this.floorY, "Bottom");
    }
  }

  createPlayer() {
    let my = this.my;
    my.sprite.player = this.add.sprite(this.bodyX, this.bodyY, "GrassBlock");
    my.sprite.player.depth = 20;
    my.sprite.player.scale = .55;
    my.sprite.shoot = null;
  }

  setupInput() {
    this.A_key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.D_key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.SpaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    this.updatePlayerMovement();
    this.updateShooting();
    this.updateEnemyBullets();
    this.updateYellowBullets();
    this.checkShipCollisions();
    this.checkWaveShipCollisions();
  }

  checkWaveSpawn() {
    if (this.activeShipsCount <= 0 && !this.waveActive) {
        this.spawnWave();
    }
}

  checkWaveShipCollisions() {
    this.waveShips.forEach(ship => {
      if (ship.active && this.my.sprite.player.active &&
          Phaser.Geom.Intersects.RectangleToRectangle(
            ship.getBounds(),
            this.my.sprite.player.getBounds()
          )) {
        this.handlePlayerHit(ship);
      }
    });
  }

  checkShipCollisions() {
    this.enemyShips.forEach(ship => {
      if (ship.active && ship.isMoving && this.my.sprite.player.active &&
          Phaser.Geom.Intersects.RectangleToRectangle(
            ship.getBounds(),
            this.my.sprite.player.getBounds()
          )) {
        this.handlePlayerHit(ship);
      }
    });

    this.yellowShips.forEach(ship => {
      if (ship.active && ship.isMoving && this.my.sprite.player.active &&
          Phaser.Geom.Intersects.RectangleToRectangle(
            ship.getBounds(),
            this.my.sprite.player.getBounds()
          )) {
        this.handlePlayerHit(ship);
      }
    });
  }

  updateEnemyBullets() {
    this.enemyBullets = this.enemyBullets.filter(bullet => bullet.active);

    this.enemyBullets.forEach(bullet => {
      if (!bullet.active) return;

      if (this.my.sprite.player.active && 
          Phaser.Geom.Intersects.RectangleToRectangle(
            bullet.getBounds(),
            this.my.sprite.player.getBounds()
          )) {
        bullet.destroy();
        console.log("Player hit by pink bullet!");
        return;
      }
      
      this.checkAnimalCollisions(bullet);
    });
  }

  updateYellowBullets() {
    this.yellowBullets = this.yellowBullets.filter(bullet => bullet.active);

    this.yellowBullets.forEach(bullet => {
      if (!bullet.active) return;

      if (this.my.sprite.player.active && 
          Phaser.Geom.Intersects.RectangleToRectangle(
            bullet.getBounds(),
            this.my.sprite.player.getBounds()
          )) {
        bullet.destroy();
        console.log("Player hit by yellow bullet!");
        return;
      }

      this.checkAnimalCollisions(bullet);
    });
  }

  checkAnimalCollisions(bullet) {
    const animals = [
        { name: 'snail', sprite: this.my.sprite.floor_snail, hitSprite: this.my.sprite.floor_Wsnail },
        { name: 'frog', sprite: this.my.sprite.floor_frog, hitSprite: this.my.sprite.floor_Wfrog },
        { name: 'mouse', sprite: this.my.sprite.floor_mouse, hitSprite: this.my.sprite.floor_Wmouse },
        { name: 'worm', sprite: this.my.sprite.floor_worm, hitSprite: this.my.sprite.floor_Wworm }
    ];

    animals.forEach(animal => {
        if (bullet.active && animal.sprite.active && 
            Phaser.Geom.Intersects.RectangleToRectangle(
                bullet.getBounds(),
                animal.sprite.getBounds()
            )) {

            bullet.destroy();

            const prevHits = this.animalHits[animal.name];

            this.animalHits[animal.name] = Math.min(this.animalHits[animal.name] + 1, 2);

            if (this.animalHits[animal.name] > prevHits) {

                this.score -= 5;

                this.my.text.scoreText.setText(`Score: ${this.score}`);

                if (this.animalHits[animal.name] === 1) {

                    animal.sprite.setAlpha(0.5);

                    animal.hitSprite.visible = true;

                    this.tweens.add({
                        targets: animal.hitSprite,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            animal.hitSprite.visible = false;
                            animal.hitSprite.alpha = 1;
                        }
                    });
                } else if (this.animalHits[animal.name] === 2) {
                    animal.sprite.destroy();
                    animal.hitSprite.destroy();
                }
            }
        }
    });
}

updatePlayerMovement() {
  let my = this.my;
  const sprite = my.sprite.player;
  const moveSpeed = this.moveSpeed;
  const spriteWidth = sprite.displayWidth * sprite.scaleX;
  const screenWidth = this.game.config.width;

  if (this.A_key.isDown) {
      const leftBoundary = spriteWidth / 2;
      if (sprite.x - leftBoundary > 0) {
          sprite.flipX = true;
          sprite.x -= moveSpeed;
      } else {
          sprite.x = leftBoundary;
      }
  }
  else if (this.D_key.isDown) {
      const rightBoundary = screenWidth - (spriteWidth / 2);
      if (sprite.x + (spriteWidth / 2) < screenWidth) {
          sprite.flipX = false;
          sprite.x += moveSpeed;
      } else {
          sprite.x = rightBoundary;
      }
  }
}

updateShooting() {
  let my = this.my;

  if (!my.sprite.bullet) {
    my.sprite.bullet = [];
    this.bulletPoolSize = 3;
    this.bulletsAvailable = this.bulletPoolSize;
  }

  const allBulletsGone = my.sprite.bullet.length === 0 && this.bulletsAvailable === 0;

  if (allBulletsGone) {
    this.bulletsAvailable = this.bulletPoolSize;
  }

  if (Phaser.Input.Keyboard.JustDown(this.SpaceBar) && this.bulletsAvailable > 0) {
    const bullet = this.add.sprite(
      my.sprite.player.x,
      my.sprite.player.y + 10,
      "EmittedSprite"
    );
    bullet.setAngle(90).setScale(0.5).setDepth(15);
    
    // Add to bullet array
    my.sprite.bullet.push(bullet);
    this.bulletsAvailable--;

    this.tweens.add({
      targets: bullet,
      y: -100,
      duration: 1000,
      onComplete: () => {
        const index = my.sprite.bullet.indexOf(bullet);
        if (index !== -1) {
          my.sprite.bullet.splice(index, 1);
        }
        bullet.destroy();
      }
    });

    const collisionCheck = this.time.addEvent({
      delay: 50,
      callback: () => {
        if (!bullet.active) {
          collisionCheck.destroy();
          return;
        }
        
        // Check if bullet is out of frame
        if (bullet.y < -bullet.displayHeight) {
          const index = my.sprite.bullet.indexOf(bullet);
          if (index !== -1) {
            my.sprite.bullet.splice(index, 1);
          }
          bullet.destroy();
          collisionCheck.destroy();
          return;
        }
        
        // Check against pink ships
        const hitPinkShip = this.enemyShips.find(ship => 
          ship.isMoving && 
          ship.active && 
          Phaser.Geom.Intersects.RectangleToRectangle(
            bullet.getBounds(),
            ship.getBounds()
          )
        );
        
        // Check against yellow ships
        const hitYellowShip = this.yellowShips.find(ship => 
          ship.isMoving && 
          ship.active && 
          Phaser.Geom.Intersects.RectangleToRectangle(
            bullet.getBounds(),
            ship.getBounds()
          )
        );
        
        // Check against wave ships
        const hitWaveShip = this.waveShips.find(ship => 
          ship.active && 
          Phaser.Geom.Intersects.RectangleToRectangle(
            bullet.getBounds(),
            ship.getBounds()
          )
        );
        
        if (hitPinkShip) {
          this.handleShipHit(hitPinkShip, bullet, collisionCheck, this.enemyShips);
        }
        
        if (hitYellowShip) {
          this.handleShipHit(hitYellowShip, bullet, collisionCheck, this.yellowShips);
        }
        
        if (hitWaveShip) {
          this.handleShipHit(hitWaveShip, bullet, collisionCheck, this.waveShips);
        }
      },
      loop: true
    });
  }
  my.sprite.bullet = my.sprite.bullet.filter(bullet => bullet.active);
}

  gameOver() {
    this.my.sprite.player.destroy();

    const gameOverText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'GAME OVER',
      { 
        fontFamily: 'Times New Roman',
        fontSize: '100px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 1
      }
    ).setOrigin(0.5);

    this.enemyShips.forEach(ship => {
      if (ship.active && ship.shootTimer) {
        ship.shootTimer.destroy();
      }
    });
    this.yellowShips.forEach(ship => {
      if (ship.active && ship.shootTimer) {
        ship.shootTimer.destroy();
      }
    });
    
    this.A_key.reset();
    this.D_key.reset();
    this.SpaceBar.reset();
  }

  handlePlayerHit(ship) {
    this.activeShipsCount--;
    this.checkWaveSpawn();

    if (this.isInvulnerable || !this.my.sprite.player.active) return;
    
    this.sound.play('pepSound2', { loop: false });

    this.isInvulnerable = true;

    if (ship.shootTimer) ship.shootTimer.destroy();
    ship.destroy();

    let shipArray;
    if (ship.texture.key === "enemyPinkShip") {
      shipArray = this.enemyShips.includes(ship) ? this.enemyShips : this.waveShips;
    } else if (ship.texture.key === "enemyYellowShip") {
      shipArray = this.yellowShips.includes(ship) ? this.yellowShips : this.waveShips;
    }
    
    if (shipArray) {
      const index = shipArray.indexOf(ship);
      if (index !== -1) {
        shipArray.splice(index, 1);
      }
    }
  
    this.lives--;
    if (this.ladybugs[this.lives]) {
        this.ladybugs[this.lives].destroy();
        this.ladybugs[this.lives] = null;
    }
  
    const player = this.my.sprite.player;
    const originalAlpha = player.alpha;

    this.tweens.add({
        targets: player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
            player.alpha = originalAlpha;
        }
    });

    const explosion = this.add.sprite(ship.x, ship.y, "burst");
    explosion.setScale(0.2).setTint(0xff0000);
    this.tweens.add({
        targets: explosion,
        scale: 0,
        alpha: 0,
        duration: 500,
        onComplete: () => explosion.destroy()
    });

    this.time.delayedCall(this.invulnerabilityDuration, () => {
        this.isInvulnerable = false;
    });

    if (this.lives <= 0) {
        this.gameOver();
    }
}

  handleShipHit(ship, bullet, collisionCheck, shipArray) {
    this.activeShipsCount--;
    this.checkWaveSpawn();

    if (ship.shootTimer) ship.shootTimer.destroy();
    ship.destroy();
    this.sound.play('laser2', { loop: false });
    bullet.destroy();
    this.isShooting = false;
    if (collisionCheck) collisionCheck.destroy();
    
    if (!shipArray) {
      const index = this.waveShips.indexOf(ship);
      if (index !== -1) {
        this.waveShips.splice(index, 1);
      }
    } else {
      const index = shipArray.indexOf(ship);
      if (index !== -1) {
        shipArray.splice(index, 1);
      }
    }
  
    if (ship.texture.key === "enemyPinkShip") {
      this.score += 10;
    } else if (ship.texture.key === "enemyYellowShip") {
      this.score += 15;
    }
    
    this.my.text.scoreText.setText(`Score: ${this.score}`);
  
    const explosion = this.add.sprite(ship.x, ship.y, "burst");
    explosion.setScale(0.7).setTint(0xff0000);
    this.tweens.add({
      targets: explosion,
      scale: 0,
      alpha: 0,
      duration: 500,
      onComplete: () => explosion.destroy()
    });
  }
}
