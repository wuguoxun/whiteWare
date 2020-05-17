class Play extends Phaser.Scene {
  constructor() {
    super("playScene");
  }

  create() {

    this.cameras.main.fadeIn(2000, 255, 255, 255);
    this.input.keyboard.enabled = true;
    this.obstacleSpeed = -450;
    // this.obstacleSpeed = -1500;
    this.obstacleMin = 200;
    this.obstacleMax = 300;
    this.obstacleSpreadMin = 850;
    this.obstacleSpreadMax = -2500;
    this.JUMP_VELOCITY = -750;
    this.MAX_JUMPS = 1;
    this.SCROLL_SPEED = 7;
    this.collisionOn = true;
    this.SCORE_MULTIPLIER = 1;
    this.physics.world.gravity.y = 3000;
    // score control
    this.scoreArray = [0, 35, 75, 130, 190, 250, 300, 350, 400]; // keep track of level threshold
    // this.scoreArray = [0, 50, 100, 150, 200, 250, 300, 350, 400]; // tester track
    this.trueScore = 0;
    this.level = 1;
    this.levelMax = 9;
    this.fox_sprite = ['fox1', 'fox2', 'fox3', 'fox4', 'fox5', 'fox6', 'fox7', 'fox8', 'fox9'];
    this.run = this.fox_sprite[0] + '_run';
    if (!bgMusic.isPlaying) {
      bgMusic = this.sound.add(`${this.fox_sprite[this.level - 1]}_ost`, {
        volume: bg_volume,
        loop: true
      });
      bgMusic.play();
    }

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.trueScore += Math.floor(this.scoreTimer.getOverallProgress() * 5 * this.SCORE_MULTIPLIER);
      },
      loop: true
    });

    this.backgroundImage = this.add.tileSprite(0, 0, game.config.width, game.config.height, `${this.fox_sprite[this.level - 1]}_bg`).setOrigin(0).setDepth(-99999);

    // create player sprite
    this.fox = this.physics.add.sprite(game.config.width / 5, game.config.height - 35, 'fox_atlas', `${this.fox_sprite[this.level - 1]}_sprite1`).setOrigin(1);

    // make ground tiles group (actual ground)
    this.ground = this.add.group();
    for (let i = 0; i < game.config.width; i += tileSize) {
      let groundTile = this.physics.add.sprite(i, game.config.height - 25, 'blank_tile').setOrigin(0);
      groundTile.body.immovable = true;
      groundTile.body.allowGravity = false;
      this.ground.add(groundTile);
    }

    // pseudo ground
    this.groundScroll = this.add.tileSprite(0, game.config.height - tileSize, game.config.width, tileSize, `${this.fox_sprite[this.level - 1]}_tile`).setOrigin(0).setScale(1.1);

    // add physics collider
    this.physics.add.collider(this.fox, this.ground);

    // add obstacles
    // set up barrier group and add first barrier to kick things off
    this.obstacles = this.add.group({
      runChildUpdate: true // make sure update runs on group children
    });

    // set up Phaser-provided cursor key input
    cursors = this.input.keyboard.createCursorKeys();

    this.obstacleClock = this.time.addEvent({
      delay: 3000,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });

    // score display
    let scoreConfig = {
      fontFamily: 'Courier',
      fontSize: '25px',
      strokeThickness: 3,
      color: '#843605',
      align: 'left',
      padding: {
        top: 5,
        bottom: 5,
      },
    };
    this.scoreText = this.add.text(69, 54, this.trueScore + 'CE', scoreConfig);
    this.endText = this.add.text(69, 254, '', scoreConfig);
    this.disText = this.add.text(69, 154, '', scoreConfig);

    this.tutorials = this.add.sprite(game.config.width / 2, game.config.height / 2, 'tutorial');
    this.tutorials.alpha = 0;
    //fade tutorials in
    this.tweens.add({
      targets: this.tutorials,
      duration: 2000,
      alpha: 1
    });

    //fade tutorials out
    this.tweens.add({
      targets: this.tutorials,
      duration: 2000,
      alpha: 0,
      delay: 3000
    });

    keyENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.gamePaused = false;
    this.gameOver = false;

    this.add.image(0, 0, 'dream_border').setOrigin(0).setDepth(9999);

    // open in the same window (like clicking a link)  window.location.href = "http://www.google.com";
    // open in a new window instead (this will likely be blocked by popup blockers though)

  } // end of create()

  // spawnObstacle() {
  //     if (!this.gamePaused && !this.gameOver){
  //         // this.currentTime = new Date();
  //         // console.log(this.currentTime.getHours() + ":" + this.currentTime.getMinutes() + ":" + this.currentTime.getSeconds());
  //         let obstacle = new Obstacle(this, this.obstacleSpeed, 'obstacle', `${this.fox_sprite[this.level-1]}_obs`);     // create new obstacle
  //         obstacle.setDepth(-999);
  //         obstacle.body.setSize(60, 60, 200, 0);
  //         this.obstacles.add(obstacle);
  //     }
  // }


  update() {
    if (Phaser.Input.Keyboard.JustDown(keyB)) {
      window.location.href = "https://storymaps.arcgis.com/stories/ea7898fb21794c23a792fe4f08431e47";
    }


    if (Phaser.Input.Keyboard.JustDown(keyESC)) {
      bgMusic.stop();
      this.gamePaused = false;
      this.scene.start("menuScene");
    }


    if (!this.gamePaused && !this.gameOver) {
      this.backgroundImage.tilePositionX += this.SCROLL_SPEED;
      this.groundScroll.tilePositionX += this.SCROLL_SPEED;

      this.obstacleClock.delay = Phaser.Math.Between(this.obstacleMin, this.obstacleMax) * Phaser.Math.Between(10, 50) * Phaser.Math.Between(1, 2);

      this.jumpUpdate();

      if (this.level < this.levelMax && this.trueScore >= this.scoreArray[this.level]) {
        // update level qualities
        // console.log(`Level Up: ${this.level + 1} @ ${this.scoreArray[this.level]}m`);

        // this.SCORE_MULTIPLIER *= 1.2;
        this.level += 1;
        if (this.level < 2) {
          this.disText.text = '';
        } else
        if (this.level === 2) {
          this.disText.text = 'Whiteware trades to the western world start at ChangAn City';
        } else
        if (this.level === 3) {
          this.disText.text = 'The Chinese developed the earliest forms of the white earthenware';
        } else
        if (this.level === 4) {
          this.disText.text = 'Development of porcelain came to most coveted technical skills';
        } else
        if (this.level === 5) {
          this.disText.text = 'The use of the silk road to connect China to the Islamic world';
        } else
        if (this.level === 6) {
          this.disText.text = 'latter began the remodeling of the original porcelain';
        } else
        if (this.level === 7) {
          this.disText.text = 'It were increasingly used in the western world';
        } else
        if (this.level === 8) {
          this.disText.text = 'The original whiteware from china has gone through redesigning';
        } else
        if (this.level === 9) {
          this.disText.text = 'It come up with other forms of porcelain that serve different communities in various ways';
          this.endText.text = 'Hit B going to Learning Page OR Hit ESC Return To Main Menu';
        }

        this.cameras.main.flash(2500);
        this.obstacles.clear(true, true);
        this.obstacleSpeed -= 150;
        this.obstacleClock.delay -= 220;
        this.obstacleMin -= 5;
        this.SCROLL_SPEED += 1;

        // update music
        this.tweens.add({ // fade out
          targets: bgMusic,
          volume: 0,
          ease: 'Linear',
          duration: 1500,
        });
        bgMusic = this.sound.add(`${this.fox_sprite[this.level - 1]}_ost`, {
          volume: 0,
          loop: true
        });
        bgMusic.play();
        this.tweens.add({ // fade in
          targets: bgMusic,
          volume: bg_volume,
          ease: 'Linear',
          duration: 1500
        });

        // update bg

        this.backgroundImage.destroy();
        this.backgroundImage = this.add.tileSprite(0, 0, game.config.width, game.config.height, `${this.fox_sprite[this.level - 1]}_bg`).setOrigin(0).setDepth(-99999);

        // update fox sprite
        this.fox.destroy();
        this.run = this.fox_sprite[this.level - 1] + '_run';
        this.fox = this.physics.add.sprite(game.config.width / 5 + 100, game.config.height - 25, 'fox_atlas', `${this.fox_sprite[this.level - 1]}_sprite1`).setOrigin(1);
        this.physics.add.collider(this.fox, this.ground);

        // update ground
        this.groundScroll.destroy();
        this.groundScroll = this.add.tileSprite(0, game.config.height - tileSize, game.config.width, tileSize, `${this.fox_sprite[this.level - 1]}_tile`).setOrigin(0).setScale(1.1);

        // i-frame buffer
        this.collisionOn = false;
        this.time.delayedCall(3000, () => {
          this.collisionOn = true;
        });
      }
      this.scoreText.text = this.trueScore + 639 + 'CE';

      // check for collisions
      if (!collisionDebug && this.collisionOn) {
        this.physics.world.collide(this.fox, this.obstacles, this.foxCollision, null, this);
      }
    }

    if (!this.gamePaused && Phaser.Input.Keyboard.JustDown(keyP)) {
      // console.log("Game Paused");
      this.physics.world.gravity.y = 0;
      this.fox.body.velocity.y = 0;
      this.scoreTimer.paused = true;
      this.anims.pauseAll();
      this.add.tween({
        targets: bgMusic,
        volume: 0,
        duration: 200,
        onComplete: () => {
          bgMusic.pause();
        }
      });
      this.cameras.main.alpha = 0.5;
      this.gamePaused = true;
    } else if (this.gamePaused && Phaser.Input.Keyboard.JustDown(keyP)) {
      // console.log("Game Unpaused");
      this.physics.world.gravity.y = 3000;
      this.scoreTimer.paused = false;
      this.anims.resumeAll();
      bgMusic.resume();
      this.add.tween({
        targets: bgMusic,
        volume: bg_volume,
        duration: 500
      });
      this.cameras.main.alpha = 1;
      this.gamePaused = false;
    }
  } // end of update()


  foxCollision() {
    // console.log("Game Over");
    this.input.keyboard.enabled = false;
    this.gameOver = true; // turn off collision checking
    // this.sound.play('death', { volume: 0.3 });  // play death sound

    this.tweens.add({ // fade out
      targets: bgMusic,
      volume: 0,
      ease: 'Linear',
      duration: 400,
    });
    bgMusic = this.sound.add('death_ost', {
      volume: 0,
      loop: true
    });
    bgMusic.play();
    this.tweens.add({ // fade in
      targets: bgMusic,
      volume: bg_volume,
      ease: 'Linear',
      duration: 1000
    });

    this.fox.alpha = 0;
    // death sequence
    this.sound.play("death_sfx", {
      volume: 0.1
    });
    let death = this.add.sprite(this.fox.x, this.fox.y, 'death').setOrigin(1);
    death.anims.play('death'); // explosion animation

    this.cameras.main.fadeOut(2000, 255, 255, 255);
    this.time.delayedCall(2000, () => {
      this.scene.start("gameOverScene");
    });
  }


  jumpUpdate() {
    // check if fox is grounded
    this.fox.isGrounded = this.fox.body.touching.down;
    // if so, we have jumps to spare
    if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.fox.isGrounded) {
      this.sound.play('jump_sfx', {
        volume: 2
      });
    }

    if (this.fox.isGrounded) {
      this.fox.anims.play(this.run, true);
      this.jumps = this.MAX_JUMPS;
      this.jumping = false;
    }
    if (!this.fox.isGrounded && Phaser.Input.Keyboard.DownDuration(cursors.down, 250)) {
      this.fox.body.velocity.y = -1.3 * this.JUMP_VELOCITY;
    }
    // allow steady velocity change up to a certain key down duration
    if (this.jumps > 0 && Phaser.Input.Keyboard.DownDuration(cursors.up, 250)) {
      this.fox.body.velocity.y = this.JUMP_VELOCITY;
      this.jumping = true;
    }
    // finally, letting go of the UP key subtracts a jump
    if (this.jumping && Phaser.Input.Keyboard.UpDuration(cursors.up)) {
      this.jumps--;
      this.jumping = false;
    }
  }
}
