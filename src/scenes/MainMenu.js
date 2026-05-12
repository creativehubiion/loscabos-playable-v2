import { Scene } from "phaser";
import confetti from "canvas-confetti";
import { getScaleUtils } from "../utils/scaleUtils";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  init() {

  }

  create() {
    const { canvasWidth, canvasHeight, scaleFactor } = getScaleUtils(this, true);
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.scaleFactor = scaleFactor;
    this.isPlaneflewaway = false;
    this.bg = this.add.image(canvasWidth / 2, canvasHeight / 2, "bg1");
    this.bg.setOrigin(0.5);
    const bgScale = Math.max(canvasWidth / this.bg.width, canvasHeight / this.bg.height);
    this.bg.setScale(bgScale);

    this.page3();
    //this.page2();
    //this.page3();
    //this.createFinalPage();
  }

  page1() {
    // Lane starts invisible; fades in while the plane is flying up into frame.
    this.laneblue = this.add.image(this.canvasWidth * .47, this.canvasHeight * .7, "laneblue");
    this.laneblue.setOrigin(0.5, 1);
    this.laneblue.setScale((this.canvasWidth * 0.625) / this.laneblue.width);
    this.laneblue.setAlpha(0);
    this.fish = this.add.image(this.canvasWidth * .47, this.canvasHeight * .7, "fish");
    this.fish.setOrigin(0.5, 1);
    this.fish.setScale((this.canvasWidth * 1) / this.fish.width);
    this.fish.setAlpha(0);
    // Plane starts off-screen below; tweens up to its resting spot.
    const planeFinalY = this.canvasHeight * .84;
    this.plane = this.add.image(this.canvasWidth * .5, this.canvasHeight + 200, "plane");
    this.plane.setOrigin(0.5);
    this.plane.setScale((this.canvasWidth * 0.4) / this.plane.width).setAngle(0);

    // Overlay sits above the lane / plane composition; pre-hidden.
    this.overlay = this.add.image(this.canvasWidth * 0.5, this.canvasHeight * 0.5, "overlay");
    this.overlay.setOrigin(0.5);
    this.overlay.setScale((this.canvasWidth) / this.overlay.width);
    this.overlay.setAlpha(0);

    // Foreground content — staged in last.
    this.logo = this.add.image(this.canvasWidth / 2, this.canvasHeight * 0.325, "condorlogo");
    this.logo.setOrigin(0.5);
    this.logo.setScale((this.canvasWidth * 0.9) / this.logo.width);
    this.logo.setAlpha(0);

    this.txt1 = this.add.image(this.canvasWidth / 2, this.canvasHeight * 0.725, "txt1");
    this.txt1.setOrigin(0.5);
    this.txt1.setScale((this.canvasWidth * 0.5) / this.txt1.width);
    this.txt1.setAlpha(0);

    this.playnow = this.add.image(this.canvasWidth * .5, this.canvasHeight * 0.9, "playNow");
    this.playnow.setOrigin(0.5);
    this.playnow.setScale((this.canvasWidth * 0.55) / this.playnow.width);
    this.playnow.setAlpha(0);

    // 1) Plane flies up from below.
    this.tweens.add({
      targets: this.plane,
      y: planeFinalY,
      duration: 900,
      ease: "Cubic.easeOut",
    });

    // 2) Lane fades in mid-flight so it materialises *under* the rising plane.
    this.tweens.add({
      targets: [this.laneblue, this.fish],
      alpha: 1,
      duration: 700,
      delay: 300,
      ease: "Sine.easeOut",
    });

    // 3) Overlay washes in after the lane is established.
    this.tweens.add({
      targets: this.overlay,
      alpha: 1,
      duration: 350,
      delay: 950,
      ease: "Sine.easeOut",
    });

    // 4) Everything above (logo, txt, CTA) fades in staggered, last.
    [this.logo, this.txt1, this.playnow].forEach((obj, idx) => {
      const finalY = obj.y;
      obj.y = finalY + this.canvasHeight * 0.03;
      this.tweens.add({
        targets: obj,
        alpha: 1,
        y: finalY,
        duration: 450,
        delay: 1250 + idx * 150,
        ease: "Back.easeOut",
        onComplete: idx === 2
          ? () => this.input.once("pointerdown", () => this.goToPage2())
          : undefined,
      });
    });
  }

  goToPage2() {
    this.startBgMusic();
    const exitTargets = [
      this.laneblue, this.fish, this.plane, this.overlay,
      this.txt1, this.playnow,
      this.legalText, this.igoLogo, this.legalOverlay,
    ].filter(Boolean);
    //tween logo y 
    this.tweens.add({
      targets: this.logo,
      y: this.canvasHeight * 0.15,
      duration: 450,
      ease: "Back.easeOut",
    });


    this.tweens.add({
      targets: exitTargets,
      alpha: 0,
      duration: 350,
      ease: "Sine.easeIn",
      onComplete: () => {
        exitTargets.forEach((o) => o && o.destroy());
        this.laneblue = null;
        this.plane = null;
        this.overlay = null;
        /* this.logo = null; */
        this.txt1 = null;
        this.playnow = null;
        this.page2();
      },
    });
  }

  page2() {
    // Build the flight curve geometry up-front (pins' positions are known
    // immediately even though they pop in visually later).

    // ── Stage 1: map slides up from below, then a subtle zoom-in ──────────
    this.map = this.add.image(this.canvasWidth * .7, this.canvasHeight * 0.6, "map");
    this.map.setOrigin(0.5).setAlpha(0);
    const mapBaseScale = (this.canvasWidth * 1.7) / this.map.width;
    this.map.setScale(mapBaseScale);
    const pin1Pos = { x: this.map.x - this.map.width * 0.6, y: this.map.y - this.map.displayHeight * .03 };
    const pin2Pos = { x: this.map.x + this.map.width * 0.05, y: this.map.y - this.map.displayHeight * .25 };
    const flightStart = new Phaser.Math.Vector2(pin2Pos.x, pin2Pos.y);
    const flightEnd = new Phaser.Math.Vector2(pin1Pos.x, pin1Pos.y);
    const flightControl = new Phaser.Math.Vector2(
      (flightStart.x + flightEnd.x) / 2,
      flightStart.y - this.canvasHeight * 0.12
    );
    this.flightCurve = new Phaser.Curves.QuadraticBezier(
      flightStart, flightControl, flightEnd
    );
    this.tweens.add({
      targets: this.map,
      /* y: this.canvasHeight * 0.5, */
      alpha: 1,
      duration: 1400,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.map,
          /* x: this.canvasWidth * 0.72, */
          /* scale: mapBaseScale * 1.4, */
          duration: 700,
          ease: "Sine.easeInOut",
          onComplete: () => popPins(),
        });
      },
    });

    // ── Stage 2: pins pop in ───────────────────────────────────────────────
    const popPins = () => {
      this.pin1 = this.add.image(pin1Pos.x, pin1Pos.y, "pin");
      this.pin1.setOrigin(0.5);
      const pin1Scale = (this.canvasWidth * .08) / this.pin1.width;
      this.pin1.setScale(0);

      this.pin2 = this.add.image(pin2Pos.x, pin2Pos.y, "pin");
      this.pin2.setOrigin(0.5);
      const pin2Scale = (this.canvasWidth * .08) / this.pin2.width;
      this.pin2.setScale(0);

      this.tweens.add({
        targets: this.pin2,
        scale: pin2Scale,
        duration: 350,
        ease: "Back.easeOut",
      });
      this.tweens.add({
        targets: this.pin1,
        scale: pin1Scale,
        duration: 350,
        delay: 180,
        ease: "Back.easeOut",
        onComplete: () => drawLine(),
      });
    };

    // ── Stage 3: dotted line draws from pin2 → pin1 ────────────────────────
    const drawLine = () => {
      const dashSegments = 14;
      const spaced = this.flightCurve.getSpacedPoints(dashSegments * 2);
      this.flightPathDots = this.add.graphics();
      this.flightPathDots.setDepth(0);

      const stroke = Math.max(2, 4 * this.scaleFactor);
      const drawProgress = { dashes: 0 };
      this.tweens.add({
        targets: drawProgress,
        dashes: dashSegments,
        duration: 700,
        ease: "Sine.easeOut",
        onUpdate: () => {
          this.flightPathDots.clear();
          this.flightPathDots.lineStyle(stroke, 0x000000, 1);
          const drawn = Math.floor(drawProgress.dashes);
          for (let i = 0; i < drawn; i++) {
            const a = spaced[i * 2];
            const b = spaced[i * 2 + 1];
            this.flightPathDots.beginPath();
            this.flightPathDots.moveTo(a.x, a.y);
            this.flightPathDots.lineTo(b.x, b.y);
            this.flightPathDots.strokePath();
          }
        },
        onComplete: () => bringInPlane(),
      });
    };

    // ── Stage 4: plane appears at the start of the path ────────────────────
    const bringInPlane = () => {
      this.plane = this.add.image(flightStart.x, flightStart.y, "plane");
      this.plane.setOrigin(0.5);
      const planeScale = (this.canvasWidth * 0.15) / this.plane.width;
      this.plane.setScale(0);
      this.plane.setDepth(1);
      const initialTan = this.flightCurve.getTangent(0);
      this.plane.setRotation(Math.atan2(initialTan.y, initialTan.x) - 80);

      this.tweens.add({
        targets: this.plane,
        scale: planeScale,
        duration: 350,
        ease: "Back.easeOut",
        onComplete: () => flyPlane(),
      });
    };

    // ── Stage 5: plane flies along the path ────────────────────────────────
    const flyPlane = () => {
      const planeTracker = { t: 0 };
      this.planeFlightTween = this.tweens.add({
        targets: planeTracker,
        t: 1,
        duration: 2500,
        delay: 150,
        ease: "Sine.easeInOut",
        onUpdate: () => {
          const p = this.flightCurve.getPoint(planeTracker.t);
          const tan = this.flightCurve.getTangent(planeTracker.t);
          this.plane.setPosition(p.x, p.y);
          this.plane.setRotation(Math.atan2(tan.y, tan.x) - 80);
        },
        onComplete: () => exitToPage3(),
      });
    };

    // ── Stage 6: fade page2 out and transition to page3 ────────────────────
    const exitToPage3 = () => {
      const exitTargets = [
        this.map, this.pin1, this.pin2, this.flightPathDots, this.plane,
      ].filter(Boolean);
      //tween logo y -canvasHeight*.2
      this.tweens.add({
        targets: this.logo,
        y: -this.canvasHeight * 0.2,
        duration: 800,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.logo.setTexture("condorlogo2");
          this.logo.setScale((this.canvasWidth * .3) / this.logo.width);
          this.logo.setPosition(this.canvasWidth - this.logo.displayWidth * .55, -this.canvasHeight * 0.2);
          // Lock the logo to the screen so it doesn't scroll with the camera
          // when page3's camera follows the plane up the lane.
          this.logo.setScrollFactor(0).setDepth(2000);
          //tween y in canvasHeight * 0.2
          this.tweens.add({
            targets: this.logo,
            y: this.canvasHeight * 0.1,
            duration: 800,
            ease: "Sine.easeIn",
            onComplete: () => {
              //this.scene.start("Page3");
            },
          });
        },
      });


      this.tweens.add({
        targets: exitTargets,
        alpha: 0,
        duration: 450,
        delay: 300,
        ease: "Sine.easeIn",
        onComplete: () => {
          exitTargets.forEach((o) => o && o.destroy());
          this.map = null;
          this.pin1 = null;
          this.pin2 = null;
          this.flightPathDots = null;
          this.plane = null;
          this.flightCurve = null;
          this.page3();
        },
      });
    };
  }

  page3() {
    // ─── Lane visual ─────────────────────────────────────────────────────
    this.laneblue = this.add.image(this.canvasWidth * .5, this.canvasHeight * .83, "laneblue");
    this.laneblue.setOrigin(0.5, 1);
    this.laneblue.setScale((this.canvasWidth * 0.625) / this.laneblue.width);

    this.fish = this.add.image(this.canvasWidth * .5, this.canvasHeight * .83, "fish");
    this.fish.setOrigin(0.5, 1);
    this.fish.setScale((this.canvasWidth * 1) / this.fish.width);
    this.fish.setAlpha(1);
    this.fish.setDepth(this.laneblue.depth + 1);

    // Same SVG path geometry as laneblue1.svg — sampled into canvas-space
    // points so the gameplay loop can check distance to the path cheaply.
    const LANE_VB_W = 344;
    const LANE_VB_H = 1768;
    const lanePathD =
      "M180.445 1761" +
      "C155.945 1642 301.449 1649.5 281.446 1543.84" +
      "C266.805 1466.51 69.5017 1427.5 110.148 1282.71" +
      "C145.381 1203.74 182.479 1041.23 49.0039 1023" +
      "L51.9224 1021.5" +
      "C-21.078 1016.5 1.92176 871.501 93.271 855.001" +
      "C185.837 838.281 344.426 922.501 340.926 671.001" +
      "C318.922 530.501 -13.3746 547.701 107.425 312.501" +
      "C148.422 224.501 349.922 216.201 277.922 3.00098";

    const svgNs = "http://www.w3.org/2000/svg";
    const lanePathEl = document.createElementNS(svgNs, "path");
    lanePathEl.setAttribute("d", lanePathD);
    const laneTotalLen = lanePathEl.getTotalLength();

    const laneDisplayW = this.laneblue.displayWidth;
    const laneDisplayH = this.laneblue.displayHeight;
    const laneLeftX = this.laneblue.x - laneDisplayW / 2;
    const laneTopY = this.laneblue.y - laneDisplayH;
    const svgToCanvas = (sx, sy) => ({
      x: laneLeftX + (sx / LANE_VB_W) * laneDisplayW,
      y: laneTopY + (sy / LANE_VB_H) * laneDisplayH,
    });

    const LANE_SAMPLES = 600;
    this.lanePoints = new Array(LANE_SAMPLES + 1);
    for (let i = 0; i <= LANE_SAMPLES; i++) {
      const p = lanePathEl.getPointAtLength((i / LANE_SAMPLES) * laneTotalLen);
      this.lanePoints[i] = svgToCanvas(p.x, p.y);
    }
    this.laneNearestIdx = 0;

    // ─── Postcard imagery flanking the path ──────────────────────────────
    this.pathImages = [];
    const pathImagePositions = [
      { x: 0.8,  y:  0.525, scale: 0.3  },
      { x: 0.65, y:  0.20,  scale: 0.45 },
      { x: 0.05, y: -0.20,  scale: 0.4  },
      { x: 0.65, y: -0.80,  scale: 0.55 },
      { x: 0.35, y: -1.15,  scale: 0.4  },
    ];
    pathImagePositions.forEach((pos, i) => {
      const img = this.add.image(this.canvasWidth * pos.x, this.canvasHeight * pos.y, `img${i + 1}`);
      img.setOrigin(0.5);
      img.setScale((this.canvasWidth * (pos.scale ?? 0.16)) / img.width);
      img.setDepth(this.laneblue.depth + 0.5);
      img.baseScale = img.scale;
      img.pulsed = false;
      this.pathImages.push(img);
    });
    this.pathImagePulseBuffer = this.canvasWidth * 0.12;

    // ─── Coins along the path ────────────────────────────────────────────
    this.coins = [];
    this.coinsCollected = 0;
    this.coinCollectRadius = this.canvasWidth * 0.08;
    const coinFracs = [0.08, 0.16, 0.24, 0.32, 0.42, 0.50, 0.58, 0.68, 0.78, 0.88];
    coinFracs.forEach((frac) => {
      const idx = Math.floor(frac * (this.lanePoints.length - 1));
      const pt = this.lanePoints[idx];
      const coin = this.add.image(pt.x, pt.y, "coin");
      coin.setOrigin(0.5).setAngle(45);
      coin.setScale((this.canvasWidth * 0.15) / coin.width);
      coin.setDepth(this.laneblue.depth + 0.6);
      coin.collected = false;
      this.coins.push(coin);
    });

    // ─── Plane (free body — own position, own heading) ───────────────────
    // Sprite art points up. Add π/2 to heading before applying rotation so the
    // nose matches (cos h, sin h).
    this.planeForwardOffset = Math.PI / 2;
    const startA = this.lanePoints[0];
    this.plane = this.add.image(startA.x, startA.y, "plane");
    this.plane.setOrigin(0.5);
    this.plane.setScale((this.canvasWidth * 0.26) / this.plane.width);
    this.plane.setDepth(this.laneblue.depth + 1);
    // Aim the nose along the first path segment so the plane starts in sync
    // with the curve — otherwise the player would lose immediately when the
    // path bends away from straight-up.
    const startB = this.lanePoints[1];
    this.planeHeading = Math.atan2(startB.y - startA.y, startB.x - startA.x);
    this.plane.setRotation(this.planeHeading + this.planeForwardOffset);

    // ─── Flight tuning ───────────────────────────────────────────────────
    this.planeCruiseSpeed = this.canvasHeight * 0.18;
    this.planeFlyAwaySpeed = this.canvasHeight * 0.65;
    this.planeMaxSteer = Math.PI / 2;               // ±90° from up — 180° total cone
    this.planeTurnLerp = 6;                         // smoothing rate (1/s) — lower = laggier turn-in
    this.forgiveMargin = this.canvasWidth * 0.10;   // off-path threshold
    this.gracePeriod = 0.4;                         // s off-path before fly-away

    // Game state
    this.flying = false;
    this.flyingAway = false;
    this.flightDone = false;
    this.exitedToFinal = false;
    this.isPlaneflewaway = false;
    this.offPathTimer = 0;

    // ─── Joystick (horizontal-only, deflection drives target heading) ────
    const stickX = this.canvasWidth * 0.75;
    const stickY = this.canvasHeight * 0.85;
    const joyBaseRadius = this.canvasWidth * 0.13;
    const joyThumbRadius = this.canvasWidth * 0.06;
    this.joyCenterX = stickX;
    this.joyCenterY = stickY;
    this.joyBaseRadius = joyBaseRadius;
    this.joyThumbRadius = joyThumbRadius;
    this.joyDx = 0;
    this.joyDy = 0;
    this.joyActive = false;

    this.joyBase = this.add.graphics().setScrollFactor(0).setDepth(900);
    this.joyBase.lineStyle(4, 0x006CAC, 0.85);
    this.joyBase.fillStyle(0x006CAC, 0.25);
    this.joyBase.fillCircle(stickX, stickY, joyBaseRadius);
    this.joyBase.strokeCircle(stickX, stickY, joyBaseRadius);

    this.joyThumb = this.add.graphics().setScrollFactor(0).setDepth(901);
    const redrawThumb = (dx = 0) => {
      this.joyThumb.clear();
      this.joyThumb.fillStyle(0x006CAC, 1);
      this.joyThumb.lineStyle(3, 0x006CAC, 0.95);
      this.joyThumb.fillCircle(stickX + dx, stickY, joyThumbRadius);
      this.joyThumb.strokeCircle(stickX + dx, stickY, joyThumbRadius);
    };
    redrawThumb();

    this.joyZone = this.add
      .zone(stickX, stickY, joyBaseRadius * 2.4, joyBaseRadius * 2.4)
      .setScrollFactor(0)
      .setDepth(902)
      .setInteractive({ useHandCursor: true });

    const updateThumb = (pointer) => {
      let dx = pointer.x - stickX;
      if (dx > joyBaseRadius) dx = joyBaseRadius;
      if (dx < -joyBaseRadius) dx = -joyBaseRadius;
      this.joyDx = dx;
      this.joyDy = 0;
      redrawThumb(dx);
    };
    this.joyZone.on("pointerdown", (pointer) => {
      if (this.flyingAway || this.flightDone) return;
      this.joyActive = true;
      updateThumb(pointer);
    });
    this.input.on("pointermove", (pointer) => {
      if (this.joyActive && pointer.isDown) updateThumb(pointer);
    });
    this.input.on("pointerup", () => {
      this.joyActive = false;
      this.joyDx = 0;
      this.joyDy = 0;
      redrawThumb(0);
    });

    // First pointer anywhere unfreezes the game.
    this.input.on("pointerdown", () => {
      if (!this.flying) this.flying = true;
    });

    // ─── Hint text — swaps to warning state when off-path ────────────────
    this.txt3HintConfig = {
      texture: "txt3",
      x: this.canvasWidth * 0.3,
      y: this.canvasHeight * 0.9,
      scaleW: this.canvasWidth * 0.4,
    };
    this.txt3WarningConfig = {
      texture: "txt4",
      x: this.canvasWidth * 0.25,
      y: this.canvasHeight * 0.9,
      scaleW: this.canvasWidth * 0.3,
    };
    this.txt3WarningOn = false;
    this.txt3WobbleTween = null;
    this.txt3BlinkTween = null;

    this.txt3 = this.add.image(this.txt3HintConfig.x, this.txt3HintConfig.y, this.txt3HintConfig.texture);
    this.txt3.setOrigin(0.5);
    this.txt3.setScale(this.txt3HintConfig.scaleW / this.txt3.width);
    this.txt3.setScrollFactor(0).setDepth(1500);
    this.txt3WobbleTween = this.tweens.add({
      targets: this.txt3,
      x: this.canvasWidth * .25,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // ─── Camera: lock X, soft-follow Y so the plane rides the screen ─────
    if (this.bg) this.bg.setScrollFactor(0);
    const cam = this.cameras.main;
    const pathEndY = this.lanePoints[this.lanePoints.length - 1].y;
    const camTop = pathEndY - this.canvasHeight * 0.15;
    cam.setBounds(
      0,
      camTop,
      this.canvasWidth,
      (laneTopY + laneDisplayH) - camTop + this.canvasHeight * 0.2
    );
    cam.startFollow(this.plane, false, 0, 0.18); // no X-follow, smooth Y
    cam.fadeIn(500, 0, 0, 0);

    // Debug ring — visualises the forgiveness margin around the plane.
    this.planeRangeRing = this.add.graphics();
    this.planeRangeRing.setDepth(this.plane.depth);
  }

  startSpin() {
    this.spinning = true;
    this.spinbtn.disableInteractive();
    if (this.barBall) this.barBall.disableInteractive();
    if (this.spinbtnPulse) {
      this.spinbtnPulse.stop();
      this.spinbtnPulse = null;
      if (this.spinbtnBaseScale) this.spinbtn.setScale(this.spinbtnBaseScale);
    }

    const exitTargets = [
      this.smallbg, this.txt2, this.red, this.black,
      this.budgetTxt, this.budgetTxtval, this.betTxt, this.betTxtval,
      this.budgetamountTxt, this.betamountvalueTxt,
      this.bar, this.barBall, this.barFill, this.spinbtn,
    ].filter(Boolean);
    this.tweens.add({
      targets: exitTargets,
      alpha: 0,
      y: "-=20",
      duration: 350,
      ease: "Sine.easeIn",
      onComplete: () => exitTargets.forEach((o) => o && o.destroy()),
    });

    this.tweens.killTweensOf(this.roulette2);
    this.tweens.killTweensOf(this.roulette4);

    const centerX = this.canvasWidth * 0.5;
    const centerY = this.canvasHeight * 0.55;
    const targetScale =
      (this.canvasWidth * 0.95) / this.rouletteLayers[0].width;

    this.rouletteLayers.forEach((layer) => {
      this.tweens.add({
        targets: layer,
        x: centerX,
        y: centerY,
        scale: targetScale,
        duration: 1100,
        delay: 200,
        ease: "Quart.easeInOut",
      });
    });

    this.tweens.add({
      targets: [this.roulette2, this.roulette4],
      angle: "+=360",
      duration: 1200,
      delay: 1300,
      ease: "Sine.easeIn",
      onStart: () => {
        if (this.cache.audio.exists("wheelsound")) {
          this.wheelSound = this.sound.add("wheelsound", {
            volume: 0.3,
            loop: true,
          });
          this.wheelSound.play();
        }
      },
      onComplete: () => {
        this.tweens.add({
          targets: [this.roulette2, this.roulette4],
          angle: "+=2880",
          duration: 7000,
          ease: "Quint.easeOut",
        });
      },
    });

    /* this.spineffect = this.add.image(centerX, centerY, "spineffect");
    this.spineffect.setOrigin(0.5);
    this.spineffect.setScale(targetScale * .45);
    this.spineffect.setDepth(
      this.rouletteLayers[this.rouletteLayers.length - 1].depth + 2
    );
    this.spineffect.setAlpha(0);
    this.tweens.add({
      targets: this.spineffect,
      alpha: 0,
      duration: 400,
      delay: 400,
      ease: "Sine.easeOut",
    });
    this.spineffectRotate = this.tweens.add({
      targets: this.spineffect,
      angle: 360,
      duration: 3000,
      delay: 400,
      repeat: -1,
      ease: "Linear",
    }); */

    const wheelDisplayW = this.rouletteLayers[0].width * targetScale * .6;
    const outerRadius = wheelDisplayW * 0.6;
    const innerRadius = wheelDisplayW * 0.35;

    const orbitBall = this.add.image(
      centerX,
      centerY - outerRadius,
      "rouletteBall"
    );
    orbitBall.setOrigin(0.5);
    orbitBall.setScale((wheelDisplayW * 0.06) / orbitBall.width);
    orbitBall.setDepth(
      this.rouletteLayers[this.rouletteLayers.length - 1].depth + 1
    );
    orbitBall.setVisible(false);
    this.spinBall = orbitBall;

    const orbit = { t: 0 };
    const orbitUpdate = () => {
      const totalDeg = -360 * 9 * orbit.t;
      let radius = outerRadius - (outerRadius - innerRadius) * orbit.t;
      // Fret bumps: in the last 30% of the spin the ball clatters off frets,
      // amplitude peaks mid-phase and dies as it drops into the pocket.
      if (orbit.t > 0.7) {
        const phase = (orbit.t - 0.7) / 0.3;
        const amp = wheelDisplayW * 0.025 * Math.sin(phase * Math.PI);
        radius += Math.sin(orbit.t * Math.PI * 2 * 14) * amp;
      }
      const rad = Phaser.Math.DegToRad(totalDeg - 90);
      orbitBall.x = centerX + Math.cos(rad) * radius;
      orbitBall.y = centerY + Math.sin(rad) * radius;
    };
    const onSpinFinish = () => {
      if (this.spineffectRotate) {
        this.spineffectRotate.stop();
        this.spineffectRotate = null;
      }
      if (this.spineffect) {
        const fx = this.spineffect;
        this.tweens.add({
          targets: fx,
          alpha: 0,
          duration: 400,
          ease: "Sine.easeIn",
          onComplete: () => {
            fx.destroy();
            if (this.spineffect === fx) this.spineffect = null;
          },
        });
      }
      if (this.wheelSound) {
        const ws = this.wheelSound;
        this.tweens.add({
          targets: ws,
          volume: 0,
          duration: 600,
          ease: "Sine.easeIn",
          onComplete: () => {
            ws.stop();
            ws.destroy();
            if (this.wheelSound === ws) this.wheelSound = null;
          },
        });
      }
      this.showWin();
    };

    this.tweens.add({
      targets: orbit,
      t: 0.15,
      duration: 1200,
      delay: 1300,
      ease: "Sine.easeIn",
      onStart: () => orbitBall.setVisible(true),
      onUpdate: orbitUpdate,
      onComplete: () => {
        this.tweens.add({
          targets: orbit,
          t: 1,
          duration: 5000,
          ease: "Quint.easeOut",
          onUpdate: orbitUpdate,
          onComplete: () => {
            const finalRad = Phaser.Math.DegToRad(-360 * 9 * orbit.t - 90);
            const baseX = centerX + Math.cos(finalRad) * innerRadius;
            const baseY = centerY + Math.sin(finalRad) * innerRadius;
            const offset = { dx: baseX - centerX, dy: baseY - centerY };
            const wheelRefStart = this.roulette2 ? this.roulette2.angle : 0;
            const lock = { t: 0 };
            this.tweens.add({
              targets: lock,
              t: 1,
              duration: 1300,
              ease: "Sine.easeOut",
              onUpdate: () => {
                if (!this.roulette2) return;
                const dAngle = this.roulette2.angle - wheelRefStart;
                const rad = Phaser.Math.DegToRad(dAngle);
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                orbitBall.x = centerX + offset.dx * cos - offset.dy * sin;
                orbitBall.y = centerY + offset.dx * sin + offset.dy * cos;
              },
              onComplete: onSpinFinish,
            });
          },
        });
      },
    });
  }

  showWin() {
    const cx = this.canvasWidth / 2;
    const targetWheelY = this.canvasHeight * 0.7;

    if (this.rouletteLayers) {
      const ref = this.rouletteLayers[0];
      const wheelScale = ref.scale;
      const layerDepths = this.rouletteLayers.map((l) => l.depth);
      const minDepth = Math.min(...layerDepths);
      const maxDepth = Math.max(...layerDepths);

      this.roulette0 = this.add.image(ref.x, ref.y, "roulette0")
        .setOrigin(0.5).setScale(wheelScale).setDepth(minDepth - 1).setAlpha(0);
      this.roulette6 = this.add.image(ref.x, ref.y, "roulette6")
        .setOrigin(0.5).setScale(wheelScale).setDepth(maxDepth + 1).setAlpha(0);

      this.tweens.add({
        targets: [this.roulette0, this.roulette6],
        alpha: 1,
        duration: 400,
        ease: "Sine.easeOut",
      });

      [...this.rouletteLayers, this.roulette0, this.roulette6].forEach((layer) => {
        this.tweens.add({
          targets: layer,
          y: targetWheelY,
          duration: 600,
          ease: "Quart.easeInOut",
        });
      });
    }
    if (this.spinBall) {
      const ballOffsetY = this.spinBall.y - this.canvasHeight * 0.55;
      this.tweens.add({
        targets: this.spinBall,
        y: targetWheelY + ballOffsetY,
        duration: 600,
        ease: "Quart.easeInOut",
      });
    }

    const congrats = this.add.image(cx, this.canvasHeight * 0.18, "congratstxt")
      .setOrigin(0.5).setDepth(2001).setAlpha(0);
    congrats.setScale((this.canvasWidth * 0.75) / congrats.width);
    this.winCongrats = congrats;

    const youwin = this.add.image(cx, this.canvasHeight * 0.31, "youwin")
      .setOrigin(0.5).setDepth(2001).setAlpha(0);
    youwin.setScale((this.canvasWidth * 0.85) / youwin.width);
    const youwinFinalScale = youwin.scale;
    youwin.setScale(youwinFinalScale * 0.7);
    this.winYouwin = youwin;

    /* const cta = this.add.image(cx, this.canvasHeight * 0.95, "ctabtn")
      .setOrigin(0.5, 1).setDepth(2001).setAlpha(0);
    cta.setScale((this.canvasWidth * 0.7) / cta.width);
    const ctaFinalScale = cta.scale; */

    this.tweens.add({
      targets: congrats,
      alpha: 1,
      duration: 400,
      delay: 200,
      ease: "Sine.easeOut",
    });
    this.tweens.add({
      targets: youwin,
      alpha: 1,
      scale: youwinFinalScale,
      duration: 500,
      delay: 450,
      ease: "Back.easeOut",
    });

    this.time.delayedCall(2200, () => this.goToFinalPage());
    /* this.tweens.add({
      targets: cta,
      alpha: 1,
      duration: 400,
      delay: 800,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: cta,
          scale: ctaFinalScale * 1.06,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    cta.setInteractive({ useHandCursor: true });
    cta.on("pointerdown", () => {
      const url = window.landingPageUrl;
      if (url) window.open(url, "_blank");
    }); */

    //this.fireConfetti();
  }

  goToFinalPage() {
    const exitTargets = [
      this.winCongrats, this.winYouwin,
      ...(this.rouletteLayers || []),
      this.roulette0, this.roulette6, this.spinBall,
    ].filter(Boolean);

    this.tweens.add({
      targets: exitTargets,
      alpha: 0,
      duration: 400,
      ease: "Sine.easeIn",
      onComplete: () => {
        exitTargets.forEach((o) => o && o.destroy());
        this.rouletteLayers = null;
        this.roulette0 = null;
        this.roulette6 = null;
        this.spinBall = null;
        this.winCongrats = null;
        this.winYouwin = null;
        this.createFinalPage();
      },
    });
  }

  createFinalPage() {



    // Whole final page sits in screen space so any camera scroll from page3 is
    // irrelevant. Depth pushed up so it sits above any leftover gameplay layers.
    const FINAL_BASE_DEPTH = 5000;

    this.bg2 = this.add.image(this.canvasWidth * .5, this.canvasHeight * .5, "bg2");
    this.bg2.setOrigin(0.5);
    this.bg2.setScale((this.canvasWidth * 1) / this.bg2.width);
    this.bg2.setScrollFactor(0).setDepth(FINAL_BASE_DEPTH);

    this.logo = this.add.image(this.canvasWidth * .5, this.canvasHeight * .1, "condorlogo");
    this.logo.setOrigin(0.5);
    this.logo.setScale((this.canvasWidth * .6) / this.logo.width);
    this.logo.setScrollFactor(0).setDepth(FINAL_BASE_DEPTH + 1);

    this.escape = this.add.image(this.canvasWidth * .5, this.canvasHeight * .225, "escape");
    this.escape.setOrigin(0.5);
    this.escape.setScale((this.canvasWidth * .6) / this.escape.width);
    this.escape.setScrollFactor(0).setDepth(FINAL_BASE_DEPTH + 1);

    this.congrats = this.add.image(this.canvasWidth * .5, this.canvasHeight * .575, "congrats");
    this.congrats.setOrigin(0.5);
    this.congrats.setScale((this.canvasWidth * 1) / this.congrats.width);
    this.congrats.setScrollFactor(0).setDepth(FINAL_BASE_DEPTH + 1);

    this.discover = this.add.image(this.canvasWidth * .5, this.canvasHeight * .79, "discover");
    this.discover.setOrigin(0.5);
    this.discover.setScale((this.canvasWidth * .7) / this.discover.width);
    this.discover.setScrollFactor(0).setDepth(FINAL_BASE_DEPTH + 1);

    this.finalCta = this.add.image(this.canvasWidth * .5, this.canvasHeight * .89, "bookNow");
    this.finalCta.setOrigin(0.5);
    this.finalCta.setScale((this.canvasWidth * .55) / this.finalCta.width);
    this.finalCta.setScrollFactor(0).setDepth(FINAL_BASE_DEPTH + 1);

    this.playagain = this.add.image(this.canvasWidth * .5, this.canvasHeight * .575, "playagain");
    this.playagain.setOrigin(0.5);
    this.playagain.setScale((this.canvasWidth * .55) / this.playagain.width);
    this.playagain.setScrollFactor(0).setDepth(FINAL_BASE_DEPTH + 1);

    if (this.isPlaneflewaway) {
      this.congrats.x = this.canvasWidth * 5;
    } else {
      this.playagain.x = this.canvasWidth * 5;
    }

    this.finalCta.setInteractive({ useHandCursor: true });
    this.finalCta.on("pointerdown", () => {
      const url = window.landingPageUrl;
      if (url) window.open(url, "_blank");
    });

    // Play-again button restarts page3 from scratch.
    this.playagain.setInteractive({ useHandCursor: true });
    this.playagain.on("pointerdown", () => this.playAgain());

    // ── Entrance transitions ────────────────────────────────────────────────
    this.cameras.main.flash(350, 255, 255, 255);

    // bg2: gentle fade + slight scale settle.
    const bgFinalScale = this.bg2.scale;
    this.bg2.setAlpha(0).setScale(bgFinalScale * 1.06);
    this.tweens.add({
      targets: this.bg2,
      alpha: 1,
      scale: bgFinalScale,
      duration: 600,
      ease: "Sine.easeOut",
    });

    // Logo + escape: drop in from above the canvas, staggered.
    [this.logo, this.escape].forEach((obj, idx) => {
      const finalY = obj.y;
      obj.y = -obj.displayHeight;
      obj.setAlpha(0);
      this.tweens.add({
        targets: obj,
        y: finalY,
        alpha: 1,
        duration: 600,
        delay: 200 + idx * 120,
        ease: "Back.easeOut",
      });
    });

    // The featured middle image (congrats or playagain) — scale-pop in.
    const featured = this.isPlaneflewaway ? this.playagain : this.congrats;
    const featuredFinalScale = featured.scale;
    featured.setAlpha(0).setScale(0);
    this.tweens.add({
      targets: featured,
      alpha: 1,
      scale: featuredFinalScale,
      duration: 550,
      delay: 500,
      ease: "Back.easeOut",
    });

    // Discover text: fade up from a bit below its target.
    const discoverFinalY = this.discover.y;
    this.discover.setAlpha(0);
    this.discover.y = discoverFinalY + this.canvasHeight * 0.05;
    this.tweens.add({
      targets: this.discover,
      alpha: 1,
      y: discoverFinalY,
      duration: 500,
      delay: 850,
      ease: "Sine.easeOut",
    });

    // CTA: scale-pop in, then loop a subtle pulse to draw the eye.
    const ctaFinalScale = this.finalCta.scale;
    this.finalCta.setAlpha(0).setScale(0);
    this.tweens.add({
      targets: this.finalCta,
      alpha: 1,
      scale: ctaFinalScale,
      duration: 500,
      delay: 1050,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.finalCta,
          scale: ctaFinalScale * 1.06,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });
  }

  addLegalBlock(bannerRef) {
    const legalText =
      "19+. Ontario only. Play responsibly. Outcome & Product may not be exactly as shown. " +
      "If you have questions about your gambling or the gambling of someone close to you, " +
      "please go to ConnexOntario.ca. © Zamia LLP, 2026.";

    const yTop = bannerRef
      ? bannerRef.y - bannerRef.displayHeight - 8
      : this.canvasHeight - 8;

    const text = this.add.text(this.canvasWidth / 2, yTop, legalText, {
      fontFamily: "'Open Sans', sans-serif",
      fontSize: "13px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: this.canvasWidth * 0.9 },
    });
    text.setOrigin(0.5, 1);
    text.setDepth(20000);

    let igoLogo = null;
    if (this.textures.exists("igoLogo")) {
      igoLogo = this.add.image(
        this.canvasWidth / 2,
        text.y - text.displayHeight - 6,
        "igoLogo"
      );
      igoLogo.setOrigin(0.5, 1);
      igoLogo.setScale((this.canvasWidth * 0.18) / igoLogo.width);
      igoLogo.setDepth(20000);
    }

    const padding = 8;
    const topAnchor = igoLogo
      ? igoLogo.y - igoLogo.displayHeight
      : text.y - text.displayHeight;
    const overlayTop = topAnchor - padding;
    const overlayBottom = text.y + (text.displayHeight * .15) + padding;
    const overlay = this.add.rectangle(
      this.canvasWidth / 2,
      overlayTop,
      this.canvasWidth,
      overlayBottom - overlayTop,
      0x000000,
      0.45
    );
    overlay.setOrigin(0.5, 0);
    overlay.setDepth(19999);

    return { text, igoLogo, overlay };
  }

  addHoverBall(rouletteImg) {
    const ball = this.add.image(rouletteImg.x, rouletteImg.y, "rouletteBall");
    ball.setOrigin(0.5, 0.5);
    ball.setScale((rouletteImg.displayWidth * 0.08) / ball.width);
    ball.setDepth(rouletteImg.depth + 1);

    const offsetX = -rouletteImg.displayWidth * 0.225;
    const offsetY = -rouletteImg.displayHeight * 0;
    const baseX = rouletteImg.x + offsetX;
    const baseY = rouletteImg.y + offsetY;
    ball.x = baseX;
    ball.y = baseY;

    this.tweens.add({
      targets: ball,
      y: baseY - 8,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return ball;
  }

  fireConfetti() {
    if (!this.confettiFn) {
      const canvas = document.getElementById("confetti-canvas");
      this.confettiFn = canvas
        ? confetti.create(canvas, { resize: true, useWorker: true })
        : confetti;
    }
    const fire = this.confettiFn;
    const colors = ["#FFD700", "#2D50AE", "#E63946", "#ffffff", "#0E1E4A"];
    const burst = (originX) => {
      fire({
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        origin: { x: originX, y: 0.4 },
        colors,
        scalar: 0.9,
      });
    };
    burst(0.2);
    burst(0.8);
    setTimeout(() => burst(0.5), 250);
    setTimeout(() => {
      fire({
        particleCount: 120,
        spread: 100,
        startVelocity: 35,
        origin: { x: 0.5, y: 0.3 },
        colors,
        scalar: 0.9,
      });
    }, 600);
  }

  // Four-layer parallax. Back-to-front: sky → distant silhouette → city → foreground path.
  // Each layer is a tileSprite so infinite scrolling is just incrementing tilePositionX.
  createParallax() {
    const { canvasWidth, canvasHeight } = this;

    // `scale` is a multiplier on top of the canvas-fit scale — raise it to
    // make a layer appear larger (and tile fewer times across the canvas).
    const layers = [
      { key: "bg4", speed: 0.2, fill: "canvas", scale: 2 * this.scaleFactor, yOffset: 0 },   // sky + clouds
      { key: "bg3", speed: 0.5, fill: "bottom", scale: 1.5 * this.scaleFactor, yOffset: 20 }, // distant silhouette
      { key: "bg2", speed: 1.0, fill: "bottom", scale: 1.5 * this.scaleFactor, yOffset: 20 }, // mid city
      // yOffset shifts this layer vertically in display px (positive = down).
      { key: "bg1", speed: 2.0, fill: "bottom", scale: 1.5 * this.scaleFactor, yOffset: 20 }, // foreground
    ];

    this.bgLayers = layers.map(({ key, speed, fill, scale = 1, yOffset = 0 }, i) => {
      const tex = this.textures.get(key).getSourceImage();
      const tileScale = (canvasWidth / tex.width) * scale;
      const h = tex.height * tileScale;
      let sprite;

      if (fill === "canvas") {
        // Preserve aspect: anchor bg4 to the top, and fill the rest of the canvas
        // with the horizon color sampled from the bottom of the texture so the
        // sky appears to continue seamlessly below the cloud band.
        const px = this.textures.getPixel(
          Math.floor(tex.width / 2),
          tex.height - 1,
          key
        );
        const horizonColor = Phaser.Display.Color.GetColor(px.red, px.green, px.blue);
        this.add
          .rectangle(0, 0, canvasWidth, canvasHeight, horizonColor)
          .setOrigin(0, 0)
          .setDepth(i);

        sprite = this.add
          .tileSprite(canvasWidth / 2, yOffset, canvasWidth, h, key)
          .setOrigin(0.5, 0);
      } else {
        sprite = this.add
          .tileSprite(canvasWidth / 2, canvasHeight + yOffset, canvasWidth, h, key)
          .setOrigin(0.5, 1);
      }

      sprite.setTileScale(tileScale, tileScale);
      sprite.setDepth(i + 0.01);
      return { sprite, speed };
    });
  }

  // Walk animations for both characters — frames 1→4 looped. Frame 0 is used
  // as a single static "idle/jump" pose (drawn via setTexture, not anim).
  createAnimations() {
    const defs = [
      { key: "man_walk", prefix: "man_" },
      { key: "dino_walk", prefix: "dino_" },
    ];
    defs.forEach(({ key, prefix }) => {
      if (this.anims.exists(key)) return;
      const frames = [1, 2, 3, 4].map((i) => ({ key: `${prefix}${i}` }));
      this.anims.create({ key, frames, frameRate: 10, repeat: -1 });
    });
  }

  // Resolves the idle/static pose (frame 0). Falls back to frame 1 if the
  // expected frame-0 PNG hasn't been added yet.
  idleTextureKey() {
    const prefix = this.isDino ? "dino" : "man";
    const zero = `${prefix}_0`;
    return this.textures.exists(zero) ? zero : `${prefix}_1`;
  }

  // Resolves the airborne pose — frame 5 while rising (velocity.y < 0),
  // frame 6 while falling. Falls back through 0 → 1 if the expected frame
  // isn't loaded.
  airborneTextureKey() {
    const prefix = this.isDino ? "dino" : "man";
    const rising = this.player && this.player.body && this.player.body.velocity.y < 0;
    const preferred = `${prefix}_${rising ? 6 : 5}`;
    if (this.textures.exists(preferred)) return preferred;
    return this.idleTextureKey();
  }

  walkAnimKey() {
    return this.isDino ? "dino_walk" : "man_walk";
  }

  // Invisible static floor — gives the player something to land on at groundY.
  createGround() {
    const ground = this.add.rectangle(
      this.canvasWidth / 2,
      this.groundY,
      this.canvasWidth * 2,
      40
    );
    ground.setVisible(false);
    this.physics.add.existing(ground, true);
    this.ground = ground;
  }
  e
  createPlayer() {
    const scale = this.scaleFactor * .25;
    this.player = this.physics.add
      // Spawn feet-on-ground: since rebuildPlayerBody() makes origin = feet
      // anchor, player.y = feet world Y. groundY - 20 = ground top, so the
      // player lands directly grounded — same Y on every load, no initial fall.
      .sprite(this.canvasWidth * 0.22, this.groundY - 20, this.idleTextureKey())
      .setScale(scale)
      .setDepth(50);
    this.player.setCollideWorldBounds(false);
    // Start in idle pose — walk anim is kicked off later by startGame().
    this.player.setTexture(this.idleTextureKey());
    this.physics.add.collider(this.player, this.ground);

    this.rebuildPlayerBody();
  }

  // Recompute body size + offset for the current character. Sink raises the
  // body within the sprite so feet "dip" into the ground line. Called on
  // spawn and again after the dino transform so each character uses its own
  // sink value (see manSink/dinoSink).
  rebuildPlayerBody() {
    const w = this.player.width * 0.5;
    const h = this.player.height * 0.7;
    const sink = this.isDino ? this.dinoSink : this.manSink;

    // feetY = distance from the sprite's top to its visible feet (i.e. sprite
    // height minus the transparent/shadow padding below the feet).
    const feetY = this.player.height - sink;

    // Origin pivot is the feet, so player.y directly represents feet-in-world.
    this.player.setOrigin(0.5, feetY / this.player.height);

    // Body sized to the visible character, bottom-aligned to the same feet row.
    this.player.body.setSize(w, h);
    this.player.body.setOffset((this.player.width - w) / 2, feetY - h);
  }

  createTileGroup() {
    this.tiles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.physics.add.collider(this.player, this.tiles);
  }

  createCollectableGroup() {
    this.collectables = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.collectables, (_player, item) => {
      this.onCollect(item);
    });
  }

  createObstacleGroup() {
    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.obstacles, (_player, item) => {
      this.onHit(item);
    });
  }

  // End-of-game results banner. Uses the itemcollectedbanner art — two
  // stacked strips. Top strip shows total items collected; bottom strip
  // shows total obstacles dodged (obstacles that scrolled off uncollided).
  createItemBanner() {
    const totalItems = Object.values(this.itemCounts).reduce((a, b) => a + b, 0);
    const totalDodged = this.obstaclesDodged || 0;

    // Center the banner in the upper-middle of the canvas, scaled to fit width.
    const banner = this.add.image(
      this.canvasWidth / 2,
      this.canvasHeight * 0.35,
      "itemcollectedbanner"
    ).setOrigin(0.5, 0.5).setDepth(2000).setScrollFactor(0);
    const fit = (this.canvasWidth * 0.9) / banner.width;
    banner.setScale(fit * 1.1);

    // Approximate Y centers of the two strips, based on banner layout.
    const topY = banner.y - banner.displayHeight * 0.3;
    const botY = banner.y + banner.displayHeight * 0.3;
    const labelStyle = {
      fontFamily: "font, monospace",
      fontSize: "33px",
      color: "#2b1b10",
      fontStyle: 'bold',
    };

    const topText = this.add.text(this.canvasWidth / 2, topY, `Items verzameld: ${totalItems}`, labelStyle)
      .setOrigin(0.25, 0.5).setDepth(2001).setScrollFactor(0);
    const botText = this.add.text(this.canvasWidth * .48, botY, `Obstakels ontweken: ${totalDodged}`, labelStyle)
      .setOrigin(0.5).setDepth(2001).setScrollFactor(0);

    this.endBannerObjects = [banner, topText, botText];
  }

  hideEndBanner() {
    if (!this.endBannerObjects) return;
    this.endBannerObjects.forEach((o) => o && o.destroy());
    this.endBannerObjects = null;
  }

  hideGate() {
    if (this.gateSprite) { this.gateSprite.destroy(); this.gateSprite = null; }
    if (this.gateFrontSprite) { this.gateFrontSprite.destroy(); this.gateFrontSprite = null; }
  }

  // CTA block below the stats banner: title → mascot → button.
  // The button is interactive and opens the tracked landing page. The player
  // sprite is destroyed here so the CTA composition isn't cluttered by the
  // character still standing on the ground.
  createEndScreenCTA() {

    this.logo1.setScale(this.scaleFactor * .225);

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    // Clear every remaining collectable and obstacle so the CTA composition
    // is clean — only the backgrounds + any tiles/bottom placements remain.
    if (this.collectables) {
      this.collectables.children.iterate((obj) => obj && obj.destroy());
    }
    if (this.obstacles) {
      this.obstacles.children.iterate((obj) => obj && obj.destroy());
    }
    const cx = this.canvasWidth / 2;
    const fitByWidth = (img, fraction) => {
      const scale = (this.canvasWidth * fraction) / img.width;
      img.setScale(scale);
    };

    const titleY = this.canvasHeight * 0.3;
    const title = this.add.image(cx, titleY, "ctatitle")
      .setOrigin(0.5, 0.5).setDepth(2000).setScrollFactor(0);
    fitByWidth(title, .95);
    // Title drops in from above with a fade.
    title.setY(titleY - 80).setAlpha(0);
    this.tweens.add({
      targets: title,
      y: titleY,
      alpha: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    const mascot = this.add.image(this.canvasWidth * 0.5, this.canvasHeight * 0.8, "mascot")
      .setOrigin(0.5, 0.5).setDepth(2000).setScrollFactor(0);
    fitByWidth(mascot, 0.8);
    // Mascot bounces in (scale + fade) slightly delayed so it follows the title.
    const mascotScale = mascot.scale;
    mascot.setAlpha(0).setScale(mascotScale * 0.6);
    this.tweens.add({
      targets: mascot,
      alpha: 1,
      scale: mascotScale,
      duration: 500,
      delay: 150,
      ease: "Back.easeOut",
    });

    const btn = this.add.image(cx, this.canvasHeight * 0.9, "ctabtn")
      .setOrigin(0.5, 0.5).setDepth(2001).setScrollFactor(0);
    fitByWidth(btn, 0.75);

    // Pop-in transition: scales from 0 with overshoot, then the perpetual
    // pulse takes over once the entry settles.
    const baseScale = btn.scale;
    btn.setScale(0).setAlpha(0);
    this.tweens.add({
      targets: btn,
      scale: baseScale,
      alpha: 1,
      duration: 500,
      delay: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        // Attention pulse — button breathes so the player's eye is drawn to it.
        this.tweens.add({
          targets: btn,
          scale: baseScale * 1.08,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    // Overlay the DOM <button id="ctabtn"> on top of the Phaser sprite. The
    // DOM button is transparent (opacity 0) but catches the click — this is
    // the conventional playable-ad pattern so click tracking goes through
    // the host button rather than being swallowed by the canvas.
    this.activateDomCtaButton(btn);
  }

  // Arm the full-viewport DOM CTA button. CSS in index.html already sets it
  // to cover 100% × 100% with pointer-events:none and z-index:-1 as the
  // default. Here we just flip it into the active state (clickable, on top)
  // and attach the click handler — tapping anywhere fires the landing page.
  activateDomCtaButton(_phaserBtn) {
    if (typeof document === "undefined") return;
    const domBtn = document.getElementById("ctabtn");
    if (!domBtn) return;

    domBtn.style.pointerEvents = "auto";
    domBtn.style.zIndex = "9999";
    domBtn.style.cursor = "pointer";
    domBtn.style.opacity = "0";

    domBtn.onclick = () => {
      const url = window.landingPageUrl;
      if (url) window.open(url, "_blank");
    };
  }

  onCollect(item) {
    // Dino: one-time collectable. Player-character swaps to dino immediately
    // (walk anim + idle frame both flip via walkAnimKey/idleTextureKey) and
    // a 10s countdown starts before game over. At 8s (the last 2s of the
    // countdown), suppress tile/obstacle spawns and scroll the gate in.
    if (item.texture.key === MainMenu.DINO_KEY) {
      this.dinoCollected = true;
      this.dinoSprite = null;
      item.destroy();
      this.playSfx("powerup", 0.7);
      // Mario-style transform: flicker between man and dino for ~900ms, then
      // settle permanently as dino. startDinoTransform() sets isDino = true
      // at the end of the flicker so walkAnimKey/idleTextureKey pick up.
      this.startDinoTransform();
      // Spawn the gate in the last second of the outro (9s after collect).
      // endGame() is no longer time-based here — it fires when the player has
      // walked off the right edge after passing through the gate.
      this.time.delayedCall(9000, () => this.beginOutro());
      return;
    }
    this.score += 1;
    this.playSfx("collect", 0.5);

    // Track this collect — totals are rendered in the end-of-game banner.
    const key = item.texture.key;
    if (this.itemCounts && this.itemCounts[key] != null) {
      this.itemCounts[key] += 1;
    }

    // Collect pop: move up + scale up + fade out, then destroy. Disable the
    // body first so additional overlap frames don't re-trigger collect.
    if (item.body) item.body.enable = false;
    this.tweens.add({
      targets: item,
      y: item.y - 40,
      scaleX: item.scaleX * 1.5,
      scaleY: item.scaleY * 1.5,
      alpha: 0,
      duration: 250,
      ease: "Sine.easeOut",
      onComplete: () => item.destroy(),
    });
  }

  // Mario-style power-up effect: flip between the man and dino idle poses
  // (frame 0, with _1 fallback) for ~900ms, then commit to dino and resume
  // walking. The `transforming` flag pauses the walk/idle swap in update()
  // and blocks jump input. Physics keeps running — only visuals are frozen.
  startDinoTransform() {
    this.transforming = true;
    this.player.anims.stop();

    // Freeze player physics so they don't fall or drift during the flicker.
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

    const idleKey = (prefix) => {
      const zero = `${prefix}_0`;
      return this.textures.exists(zero) ? zero : `${prefix}_1`;
    };
    const manIdle = idleKey("man");
    const dinoIdle = idleKey("dino");

    const DURATION = 900;
    const TICK = 90;
    let elapsed = 0;
    let showDino = true;

    const ticker = this.time.addEvent({
      delay: TICK,
      loop: true,
      callback: () => {
        this.player.setTexture(showDino ? dinoIdle : manIdle);
        showDino = !showDino;
        elapsed += TICK;
        if (elapsed >= DURATION) {
          ticker.remove();
          this.transforming = false;
          this.isDino = true;
          // Restore gravity and resume walking as dino.
          this.player.body.setAllowGravity(true);
          this.player.play("dino_walk");
          // Rebuild body with dinoSink using the dino frame's dimensions.
          this.rebuildPlayerBody();
        }
      },
    });
  }

  // Pick one of the two allowed dino placements and spawn it. Also clears
  // the surrounding path — no tiles or ground obstacles spawn while the
  // dino is approaching, so the player has a clear shot at it.
  spawnDino() {
    if (this.dinoSprite || this.dinoCollected || this.gameOver) return;

    // Suppress tiles, obstacles, AND collectables through the dino's approach
    // + a small post-buffer, so nothing spawns close to the dino.
    const approachMs =
      ((this.canvasWidth - this.player.x) / this.worldScrollSpeed) * 1000;
    const clearWindow = this.time.now + approachMs + 800;
    this.tilesPausedUntil = Math.max(this.tilesPausedUntil, clearWindow);
    this.obstaclesPausedUntil = Math.max(this.obstaclesPausedUntil, clearWindow);
    this.collectablesPausedUntil = Math.max(this.collectablesPausedUntil, clearWindow);

    // Items already on screen keep scrolling through — we only suppress new
    // spawns during the window. No existing tiles/obstacles get destroyed.

    if (Math.random() < 0.5) this.spawnDinoOnTile();
    else this.spawnDinoOnGround();
  }

  // Dedicated tile + dino centered on top. Tile sits low — just above the
  // ground — so the jump is an easy one. Larger sprite for a wider overlap.
  spawnDinoOnTile() {
    // Low-floating tile: ~80–120 px above ground. Well within reach and
    // doesn't require an apex-perfect landing.
    const y = Phaser.Math.Between(this.groundY - 120, this.groundY - 80);

    const tileScale = this.scaleFactor * 1.5;
    const tile = this.tiles.create(0, y, "tile");
    tile.setOrigin(0.5, 0.9)
    tile.setScale(tileScale * 0.7);

    // Keep the dino tile horizontally separated from any existing tile so
    // it doesn't overlap or sit parallel alongside one.
    const MIN_GAP_FROM_TILE = 200;
    let baseX = this.canvasWidth + tile.displayWidth / 2;
    this.tiles.children.iterate((other) => {
      if (!other || other === tile) return;
      const otherRight = other.x + other.displayWidth / 2;
      const needed = otherRight + MIN_GAP_FROM_TILE + tile.displayWidth / 2;
      if (needed > baseX) baseX = needed;
    });
    tile.x = baseX;

    tile.setDepth(40);
    tile.body.allowGravity = false;
    tile.body.immovable = true;
    tile.body.checkCollision.down = false;
    tile.body.checkCollision.left = false;
    tile.body.checkCollision.right = false;

    const dino = this.collectables.create(tile.x, 0, MainMenu.DINO_KEY);
    dino.setScale(this.itemScale * 1.5);
    dino.y = tile.y - tile.displayHeight / 2 - dino.displayHeight * .6;
    dino.setDepth(47);
    dino.body.allowGravity = false;
    this.dinoSprite = dino;
  }

  // Dino sitting on the road — sprite bottom flush with ground top. Larger
  // footprint than a normal collectable so the player can't miss it.
  spawnDinoOnGround() {
    const dino = this.collectables.create(0, 0, MainMenu.DINO_KEY);
    dino.setScale(this.itemScale * 1.5);
    dino.x = this.canvasWidth + dino.displayWidth / 2;
    dino.y = this.groundY - 20 - dino.displayHeight / 2;
    dino.setDepth(47);
    dino.body.allowGravity = false;
    this.dinoSprite = dino;
  }

  // Fires 2s before the final game over. Clears incoming tile/obstacle spawns
  // and brings in the gate as a visual endpoint, scrolling with the world.
  beginOutro() {
    if (this.gameOver) return;
    const far = this.time.now + 10000;
    this.tilesPausedUntil = Math.max(this.tilesPausedUntil, far);
    this.obstaclesPausedUntil = Math.max(this.obstaclesPausedUntil, far);
    this.collectablesPausedUntil = Math.max(this.collectablesPausedUntil, far);

    // Existing items stay on screen; they're removed only when they scroll
    // off the left edge (scrollGroup) or get collected (onCollect). New
    // spawns are still paused via the *PausedUntil timestamps above.

    // Gate is split into two layers:
    //   gate1 = back half (depth 48, behind the player at depth 50)
    //   gate2 = front half (depth 52, in front of the player)
    // Walking the player through between them creates the "entering a gate"
    // illusion. Both sprites share scale + X so they stay aligned.
    const y = this.groundY + 200;
    const scale = this.scaleFactor;

    const gate1 = this.add.image(0, y, "gate1")
      .setOrigin(0.5, 1)
      .setDepth(48);
    gate1.setScale(scale);

    // Spawn the gate past any existing tile's right edge so it doesn't slide
    // in right next to the last tile on screen.
    const MIN_GAP_FROM_TILE = 200;
    let gateX = this.canvasWidth + gate1.displayWidth / 2;
    this.tiles.children.iterate((tile) => {
      if (!tile) return;
      const tileRight = tile.x + tile.displayWidth / 2;
      const needed = tileRight + MIN_GAP_FROM_TILE + gate1.displayWidth / 2;
      if (needed > gateX) gateX = needed;
    });
    gate1.x = gateX;

    const gate2 = this.add.image(0, y, "gate2")
      .setOrigin(0.5, 1)
      .setDepth(52);
    gate2.setScale(scale);
    gate2.x = gate1.x;

    this.gateSprite = gate1;         // primary ref — used for "centered" check
    this.gateFrontSprite = gate2;    // front layer, moves in lockstep
  }

  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;

    // End sting + duck the music so the SFX cuts through.
    this.playSfx("end", 0.7);
    if (this.bgMusic) this.bgMusic.setVolume(0.08);

    // Freeze the world manually (can't scene.pause() — we still need timers
    // to run so the 4s banner → CTA transition fires). update() early-returns
    // on gameOver, and the player's physics is neutralised here.
    if (this.player) {
      this.player.setVelocity(0, 0);
      if (this.player.body) this.player.body.setAllowGravity(false);
      if (this.player.anims) this.player.anims.stop();
    }

    // Stats banner first. Held for 4s, then banner + gate are destroyed and
    // the CTA elements fade in.
    this.createItemBanner();
    this.time.delayedCall(4000, () => {
      this.hideEndBanner();
      this.hideGate();
      this.createEndScreenCTA();
    });
  }

  // Spawn the blinking "SLOWED" label above the player. Cleared when the
  // slowdown chain completes (or replaced if the player is hit again).
  showSlowedText() {
    if (this.slowedText) this.slowedText.destroy();
    if (this.slowedTextTween) this.slowedTextTween.stop();
    this.slowedText = this.add.text(
      this.player.x,
      this.player.y - this.player.displayHeight * .6,
      "",
      {
        fontFamily: "font, monospace",
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
      }
    ).setOrigin(0.5, 1).setDepth(1500);

    // Drive blink via a scratch property instead of text.alpha directly so
    // update() can multiply it by an envelope (which fades to 0 as the
    // slowdown ends) and write the combined value to text.alpha.
    this.slowedBlinkAlpha = 1;
    this.slowedTextTween = this.tweens.add({
      targets: this,
      slowedBlinkAlpha: 0,
      duration: 220,
      yoyo: true,
      repeat: -1,
    });
  }

  hideSlowedText() {
    if (this.slowedTextTween) {
      this.slowedTextTween.stop();
      this.slowedTextTween = null;
    }
    if (this.slowedText) {
      this.slowedText.destroy();
      this.slowedText = null;
    }
  }

  onHit(item) {
    // Dino form is immune — obstacles pass through without feedback, shake,
    // tint, or blink. They aren't marked wasHit, so they still count as
    // "dodged" when they scroll off (dino tramples past them).
    if (this.isDino) return;

    // Mark this obstacle as hit so it's not counted as "dodged" when it
    // eventually scrolls off (see scrollGroup).
    item.wasHit = true;

    // Slow-mo on hit: smooth dip from current speed → 0.3, hold briefly,
    // then ramp back up to 1. Players feel both the deceleration and the
    // acceleration. Restarts cleanly on subsequent hits.
    if (this.slowdownTween) this.slowdownTween.stop();
    this.slowdownTween = this.tweens.chain({
      targets: this,
      tweens: [
        // Decelerate (the "slowing" feel)
        { worldSpeedMultiplier: 0.3, duration: 250, ease: "Sine.easeOut" },
        // Hold at slow-mo so the impact lingers
        { worldSpeedMultiplier: 0.3, duration: 600 },
        // Ramp back up (the "speeding up" feel) — easeIn so it picks up speed gradually
        { worldSpeedMultiplier: 1, duration: 2150, ease: "Sine.easeIn" },
      ],
      onComplete: () => this.hideSlowedText(),
    });
    this.showSlowedText();
    // Quick impact bump on the obstacle — snap a few pixels in X and ease
    // the offset back to zero. Done via a counter tween that applies the
    // per-frame delta to item.x, so the scroll loop's own x-decrement isn't
    // fought — net effect is a momentary right-shift layered on top of scroll.
    const bump = 8;
    item.x += bump;
    let last = bump;
    this.tweens.addCounter({
      from: bump,
      to: 0,
      duration: 150,
      ease: "Sine.easeOut",
      onUpdate: (tween) => {
        if (!item.active) return;
        const current = tween.getValue();
        item.x += current - last;
        last = current;
      },
    });

    // Obstacles persist and scroll past. Visual feedback: camera shake, a red
    // overlay that tracks the player (sprite.setTint is WebGL-only and we're
    // running on CANVAS), and alpha-blink. playerHitBlinking guards i-frames.
    if (this.playerHitBlinking) return;
    this.playerHitBlinking = true;

    this.cameras.main.shake(250, 0.01);
    // Full-screen red tint at 0.5 alpha that fades out over 600ms.
    const redTint = this.add
      .rectangle(0, 0, this.canvasWidth, this.canvasHeight, 0xff0000, 0.5)
      .setOrigin(0, 0)
      .setDepth(1000)
      .setScrollFactor(0);
    this.tweens.add({
      targets: redTint,
      alpha: 0,
      duration: 600,
      onComplete: () => redTint.destroy(),
    });

    this.tweens.add({
      targets: this.player,
      alpha: 0.5,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.player.setAlpha(1);
        this.playerHitBlinking = false;
      },
    });
  }

  scheduleNextTile() {
    // Stretch the delay inversely with world speed so spawns stay world-distance
    // spaced during slow-mo (less ground passes per ms when slow → space them out).
    const base = Phaser.Math.Between(this.tileSpawnMinDelay, this.tileSpawnMaxDelay)
      / Math.max(this.worldSpeedMultiplier, 0.3);
    this.time.delayedCall(base, () => {
      // Re-check at fire time: an arc may have been scheduled after this
      // tile was queued. If a pause is active now, defer past the arc and
      // re-enter this method so the check runs again.
      const pauseLeft = this.tilesPausedUntil - this.time.now;
      if (pauseLeft > 0) {
        this.time.delayedCall(pauseLeft + 50, () => {
          this.spawnTile();
          this.scheduleNextTile();
        });
      } else {
        this.spawnTile();
        this.scheduleNextTile();
      }
    });
  }

  // Spawn a floating tile off the right edge that drifts left at scrollSpeed.
  // Placement strategy:
  //   • Most tiles chain vertically from the previous tile's Y (±100 px drift)
  //     so heights evolve smoothly instead of zigzagging random.
  //   • ~15% are placed in a "tease" band just above jump peak — visible and
  //     glide past unreachable as flavor/challenge.
  //   • Reachable band derives from jump physics: peak = jumpV² / (2·gravity),
  //     minus 15% so the player doesn't need an apex-perfect landing.
  spawnTile() {
    const scale = this.scaleFactor * 1.5;
    const gravity = this.physics.world.gravity.y;
    const jumpPeak = (this.jumpVelocity * this.jumpVelocity) / (2 * gravity);
    const reach = Math.floor(jumpPeak * 0.85);

    const reachTop = this.groundY - reach * 1.5;   // highest landable (smallest Y)
    const reachBottom = this.groundY - reach;   // small clearance above ground

    let y;
    if (Math.random() < 0.15) {
      // Tease: just above jump peak, unreachable but visible.
      const teaseTop = this.groundY - Math.floor(jumpPeak * 1.25);
      const teaseBottom = reachTop - 20;
      y = Phaser.Math.Between(teaseTop, teaseBottom);
    } else if (this.prevTileY != null) {
      // Chain: drift ±100 px from previous, clamped to the reachable band.
      const delta = Phaser.Math.Between(-100, 100);
      y = Phaser.Math.Clamp(this.prevTileY + delta, reachTop, reachBottom);
    } else {
      y = Phaser.Math.Between(reachTop, reachBottom);
    }
    this.prevTileY = y;

    const tile = this.tiles.create(0, y, "tile");
    tile.setScale(scale * .7);
    // Place the tile just past the right edge of the canvas (left edge flush
    // with canvasWidth) so it's fully hidden at spawn and slides into view.
    // Setting x after setScale means we use the actual displayWidth.
    tile.x = this.canvasWidth + tile.displayWidth / 2;
    tile.setDepth(40);
    tile.body.allowGravity = false;
    tile.body.immovable = true;
    // One-way platform: only the top side collides. Jumping into the tile
    // from below or sliding into it from the sides passes through.
    tile.body.checkCollision.down = false;
    tile.body.checkCollision.left = false;
    tile.body.checkCollision.right = false;
    // No velocity — tile.x is stepped manually in update() to stay locked to bg1.

    // What rides on top of this tile:
    //   • 20% both — pickup on one side, hazard on the other
    //   • 25% pickup only (centered)
    //   • 15% hazard only (centered)
    //   • 40% nothing
    const roll = Math.random();
    if (roll < 0.2) {
      const offset = tile.displayWidth / 3;
      // Randomize which side gets which so it doesn't always feel symmetric.
      if (Math.random() < 0.5) {
        this.addPickupOnTile(tile, -offset);
        this.addHazardOnTile(tile, offset);
      } else {
        this.addHazardOnTile(tile, -offset);
        this.addPickupOnTile(tile, offset);
      }
    } else if (roll < 0.45) {
      this.addPickupOnTile(tile, 0);
    } else if (roll < 0.6) {
      this.addHazardOnTile(tile, 0);
    }
  }

  addPickupOnTile(tile, xOffset = 0) {
    const key = Phaser.Utils.Array.GetRandom(MainMenu.REGULAR_COLLECTABLE_KEYS);
    const item = this.collectables.create(tile.x + xOffset, 0, key);
    item.setScale(this.itemScale);
    item.y = tile.y - tile.displayHeight / 2 - item.displayHeight * .6;
    item.setDepth(46);
    item.body.allowGravity = false;
  }

  addHazardOnTile(tile, xOffset = 0) {
    const key = Phaser.Utils.Array.GetRandom(MainMenu.TILE_SAFE_OBSTACLE_KEYS);
    const item = this.obstacles.create(tile.x + xOffset, 0, key);
    item.setScale(this.itemScale);
    item.y = tile.y - tile.displayHeight / 2 - item.displayHeight * .6;
    item.setDepth(46);
    item.body.allowGravity = false;
    item.body.immovable = true;
  }

  scheduleNextCollectable() {
    const delay = Phaser.Math.Between(1800, 3200)
      / Math.max(this.worldSpeedMultiplier, 0.3);
    this.time.delayedCall(delay, () => {
      // Re-check pause at fire time — dino spawn may have set a clear window
      // after this tick was queued.
      const pauseLeft = this.collectablesPausedUntil - this.time.now;
      if (pauseLeft > 0) {
        this.time.delayedCall(pauseLeft + 50, () => {
          this.spawnCollectable();
          this.scheduleNextCollectable();
        });
      } else {
        this.spawnCollectable();
        this.scheduleNextCollectable();
      }
    });
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(2500, 4500)
      / Math.max(this.worldSpeedMultiplier, 0.3);
    this.time.delayedCall(delay, () => {
      // Re-check at fire time: dino may have set a pause after this was scheduled.
      const pauseLeft = this.obstaclesPausedUntil - this.time.now;
      if (pauseLeft > 0) {
        this.time.delayedCall(pauseLeft + 50, () => {
          this.spawnObstacle();
          this.scheduleNextObstacle();
        });
      } else {
        this.spawnObstacle();
        this.scheduleNextObstacle();
      }
    });
  }

  scheduleNextBottomPlacement() {
    const delay = Phaser.Math.Between(500, 1400)
      / Math.max(this.worldSpeedMultiplier, 0.3);
    this.time.delayedCall(delay, () => {
      // Stop spawning new bottom props once the gate has appeared, so none
      // of them can overlap the final gate scrolling in.
      if (this.gateSprite) return;
      this.spawnBottomPlacement();
      this.scheduleNextBottomPlacement();
    });
  }

  // Decorative prop that sits at the bottom of the canvas and scrolls with the
  // world. No physics — purely visual. Random key from BOTTOM_PLACEMENT_KEYS.
  spawnBottomPlacement() {
    const first = this.addBottomPlacementAt(null); // null = default off-right
    // ~40% of the time, pair a second placement right behind the first with
    // a small gap so the bottom edge reads as clusters instead of lonely props.
    if (Math.random() < 0.4) {
      const GAP = 40;
      const x = first.x + first.displayWidth / 2 + GAP;
      this.addBottomPlacementAt(x);
    }
  }

  // Shared helper — places a single bottom-placement sprite. If `x` is null,
  // spawns at the right edge (default runtime spawn point).
  addBottomPlacementAt(x) {
    const key = Phaser.Utils.Array.GetRandom(MainMenu.BOTTOM_PLACEMENT_KEYS);
    const sprite = this.add.image(0, this.canvasHeight, key)
      .setOrigin(0.5, 1)
      .setDepth(1000);
    sprite.setScale(this.itemScale * .35);

    // `requested` is the desired LEFT edge. null = off the right canvas edge.
    const requested = x == null ? this.canvasWidth : x;

    // Push past the rightmost existing placement + MIN_GAP so none overlap.
    const MIN_GAP = 15;
    let leftEdge = requested;
    this.bottomPlacements.children.iterate((other) => {
      if (!other) return;
      const otherRight = other.x + other.displayWidth / 2;
      const needed = otherRight + MIN_GAP;
      if (needed > leftEdge) leftEdge = needed;
    });

    sprite.x = leftEdge + sprite.displayWidth / 2;
    this.bottomPlacements.add(sprite);
    return sprite;
  }

  // Seed a few bottom placements across the visible canvas so the bottom
  // edge looks populated from scene start instead of empty.
  prespawnBottomPlacements(count) {
    for (let i = 0; i < count; i++) {
      const key = Phaser.Utils.Array.GetRandom(MainMenu.BOTTOM_PLACEMENT_KEYS);
      const sprite = this.add.image(0, this.canvasHeight, key)
        .setOrigin(0.5, 1)
        .setDepth(1000);
      sprite.setScale(this.itemScale * .35);
      // Evenly-ish spaced across the canvas with a bit of jitter.
      const slot = (this.canvasWidth / count) * (i + 0.5);
      sprite.x = slot + Phaser.Math.Between(-40, 40);
      this.bottomPlacements.add(sprite);
    }
  }

  // Top-level collectable spawn. Picks a pattern:
  //   • ~25% non-coin single (bag/banana/etc.)
  //   • ~20% line of 2 coins
  //   • ~20% line of 3 coins
  //   • ~15% circular 6-coin arc along the jump trajectory
  //   • ~20% single coin
  spawnCollectable() {
    const roll = Math.random();
    if (roll < 0.25) {
      const nonCoin = MainMenu.REGULAR_COLLECTABLE_KEYS.filter((k) => k !== "col_coin");
      this.spawnPickupSingle(Phaser.Utils.Array.GetRandom(nonCoin));
    } else if (roll < 0.45) {
      this.spawnCoinLine(2);
    } else if (roll < 0.65) {
      this.spawnCoinLine(3);
    } else if (roll < 0.80) {
      this.spawnCoinArc();
    } else {
      this.spawnPickupSingle("col_coin");
    }
  }

  // One pickup at a random reachable Y, fully off the right edge.
  spawnPickupSingle(key) {
    const gravity = this.physics.world.gravity.y;
    const jumpPeak = (this.jumpVelocity * this.jumpVelocity) / (2 * gravity);
    const reach = Math.floor(jumpPeak * 0.85);
    const y = Phaser.Math.Between(this.groundY - reach, this.groundY - 120);

    const item = this.collectables.create(0, y, key);
    item.setScale(this.itemScale);
    item.x = this.canvasWidth + item.displayWidth / 2;
    // Coins always render above everything else.
    item.setDepth(key === "col_coin" ? 1000 : 45);
    item.body.allowGravity = false;
  }

  // Horizontal run of `count` coins at a single Y — player collects by running
  // under them (low Y) or jumping through them (high Y).
  spawnCoinLine(count) {
    const gravity = this.physics.world.gravity.y;
    const jumpPeak = (this.jumpVelocity * this.jumpVelocity) / (2 * gravity);
    const reach = Math.floor(jumpPeak * 0.85);
    const y = Phaser.Math.Between(this.groundY - reach, this.groundY - 120);
    const spacing = 90;

    for (let i = 0; i < count; i++) {
      const coin = this.collectables.create(0, y, "col_coin");
      coin.setScale(this.itemScale);
      coin.x = this.canvasWidth + coin.displayWidth / 2 + i * spacing;
      coin.setDepth(1000);
      coin.body.allowGravity = false;
    }
  }

  // 6 coins placed along the player's jump parabola. If the player taps the
  // instant the first coin reaches them, they'll trace the arc and sweep all
  // 6. Tile spawning is suppressed for the arc's flight so the path is clear.
  spawnCoinArc() {
    const gravity = this.physics.world.gravity.y;
    const airtime = (-2 * this.jumpVelocity) / gravity; // seconds
    const groundTop = this.groundY - 60;
    const N = 6;

    // Push the arc's start past any existing tile so the jump path is clear.
    // Without this, a tile already scrolling in can sit right next to the arc.
    const MIN_GAP_FROM_TILE = 200;
    let baseX = this.canvasWidth;
    this.tiles.children.iterate((tile) => {
      if (!tile) return;
      const tileRight = tile.x + tile.displayWidth / 2;
      const needed = tileRight + MIN_GAP_FROM_TILE;
      if (needed > baseX) baseX = needed;
    });

    for (let i = 0; i < N; i++) {
      const t = (i * airtime) / (N - 1);
      const relX = this.worldScrollSpeed * t;
      const relY = this.jumpVelocity * t + (gravity * t * t) / 2; // negative = up

      const coin = this.collectables.create(0, groundTop + relY, "col_coin");
      coin.setScale(this.itemScale);
      coin.x = baseX + coin.displayWidth / 2 + relX;
      coin.setDepth(1000);
      coin.body.allowGravity = false;
    }

    // Block tile spawns until the arc has fully passed through the player.
    const approachMs = ((baseX - this.player.x) / this.worldScrollSpeed) * 1000;
    const arcMs = airtime * 1000;
    this.tilesPausedUntil = this.time.now + approachMs + arcMs + 400;
  }

  // Ground-level hazard — sprite bottom anchored to the top of the ground
  // body so potholes/peels sit flush with the running surface.
  spawnObstacle() {
    const key = Phaser.Utils.Array.GetRandom(MainMenu.OBSTACLE_KEYS);

    const item = this.obstacles.create(0, 0, key);
    // Per-key scale multiplier — blackpothole reads as a bigger ground hole.
    const scaleMul = key === "obs_blackpothole" ? 2.5 : 1;
    item.setScale(this.itemScale * scaleMul);
    item.x = this.canvasWidth + item.displayWidth / 2;
    item.y = this.groundY - 20 - item.displayHeight / 2; // bottom flush with ground top
    item.setDepth(45);
    item.body.allowGravity = false;
    item.body.immovable = true;
  }

  // Start the looped background music. Idempotent — calling repeatedly is
  // a no-op once the track is playing. Must be invoked from a user gesture
  // (browsers block audio autoplay otherwise).
  startBgMusic() {
    if (this.bgMusic && this.bgMusic.isPlaying) return;
    if (!this.bgMusic) {
      this.bgMusic = this.sound.add("bgMusic", { loop: true, volume: 0.18 });
    }
    if (!this.bgMusic.isPlaying) this.bgMusic.play();
  }

  // One-shot SFX. Wrapper guards against firing before audio context is
  // unlocked (early scene-create calls); first user gesture unlocks it.
  playSfx(key, volume = 0.6) {
    if (!this.sound || this.sound.locked) return;
    this.sound.play(key, { volume });
  }

  setupInput() {
    const DEBOUNCE_MS = 250;
    const onPress = () => {
      if (!this.player) return;
      // First user gesture is when audio is allowed to play. Start the
      // background music loop here regardless of which intro stage fires.
      this.startBgMusic();
      // Debounce so a duplicate pointerdown+keydown from the same tap, or
      // a rapid double-press, can only advance one stage at a time.
      const now = this.time.now;
      if (this.introStage < 2 && now - (this.lastIntroPressAt || 0) < DEBOUNCE_MS) return;

      // Intro flow — these presses never jump.
      if (this.introStage === 0) {
        this.introStage = 1;
        this.lastIntroPressAt = now;
        this.swapIntroOverlay("instru");
        return;
      }
      if (this.introStage === 1) {
        this.introStage = 2;
        this.lastIntroPressAt = now;
        this.hideIntroOverlay();
        this.startGame();
        return;
      }
      // Gameplay jump — only when grounded and not mid-transform.
      if (this.transforming) return;
      const onGround =
        this.player.body.blocked.down || this.player.body.touching.down;
      if (!onGround) return;
      this.player.setVelocityY(this.jumpVelocity);
    };
    this.input.on("pointerdown", onPress);
    this.input.keyboard.on("keydown-SPACE", onPress);
    this.input.keyboard.on("keydown-UP", onPress);
  }

  // Full-canvas overlay scaled to fit width. Depth 3000 so it sits above
  // everything — player, coins, tiles, future gate.
  showTitleOverlay() {
    this.introOverlay = this.add.image(
      this.canvasWidth * .5,
      this.canvasHeight * .05,
      "title"
    ).setOrigin(0.5, 0).setDepth(3000).setScrollFactor(0);
    const fit = Math.min(
      this.canvasWidth / this.introOverlay.width,
      this.canvasHeight / this.introOverlay.height
    );
    const finalScale = fit * .95;
    // Entry transition: fade + tiny scale-up with a soft overshoot.
    this.introOverlay.setAlpha(0).setScale(finalScale * 0.9);
    this.tweens.add({
      targets: this.introOverlay,
      alpha: 1,
      scale: finalScale,
      duration: 450,
      ease: "Back.easeOut",
    });
  }

  swapIntroOverlay(key) {
    if (this.introOverlay) this.introOverlay.destroy();
    this.introOverlay = this.add.image(
      this.canvasWidth / 2,
      this.canvasHeight * .55,
      key
    ).setOrigin(0.5).setDepth(3000).setScrollFactor(0);
    const fit = Math.min(
      this.canvasWidth / this.introOverlay.width,
      this.canvasHeight / this.introOverlay.height
    );
    this.introOverlay.setScale(fit * .9);

    this.logo1 = this.add.image(
      this.canvasWidth * .5,
      this.canvasHeight * .05,
      "logo"
    ).setOrigin(0.5, 0).setDepth(3000).setScrollFactor(0);

    /* const fitLogo = Math.min(
      this.canvasWidth / this.logo.width,
      this.canvasHeight / this.logo.height
    ); */
    this.logo1.setScale(this.scaleFactor * .3);
  }

  hideIntroOverlay() {
    if (this.introOverlay) {
      this.introOverlay.destroy();
      this.introOverlay = null;
    }
  }

  // Kick off parallax motion, walk animation, and all runtime spawners.
  startGame() {
    if (this.gameStarted) return;
    this.gameStarted = true;
    this.player.play(this.walkAnimKey());
    this.scheduleNextTile();
    this.scheduleNextCollectable();
    this.scheduleNextObstacle();
    this.scheduleNextBottomPlacement();
    // Dino first appears 15s after the game starts (not from scene load).
    this.time.delayedCall(15000, () => this.spawnDino());
  }

  playAgain() {
    // Tear down everything that page3 / createFinalPage put on the scene, reset
    // gameplay state, and restart page3 from a clean slate.
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.tweens.killAll();

      const destroyIfExists = (obj) => { if (obj) obj.destroy(); };
      // Final-page elements
      destroyIfExists(this.bg2);
      destroyIfExists(this.escape);
      destroyIfExists(this.congrats);
      destroyIfExists(this.discover);
      destroyIfExists(this.finalCta);
      destroyIfExists(this.playagain);
      this.bg2 = this.escape = this.congrats = null;
      this.discover = this.finalCta = this.playagain = null;

      // Lingering page3 elements
      destroyIfExists(this.laneblue);
      destroyIfExists(this.fish);
      destroyIfExists(this.plane);
      destroyIfExists(this.planeRangeRing);
      destroyIfExists(this.joyBase);
      destroyIfExists(this.joyThumb);
      destroyIfExists(this.joyZone);
      destroyIfExists(this.tapToStartLabel);
      destroyIfExists(this.logo);
      destroyIfExists(this.offCourseBanner);
      this.laneblue = this.fish = this.plane = this.planeRangeRing = null;
      this.joyBase = this.joyThumb = this.joyZone = null;
      this.tapToStartLabel = this.logo = null;
      this.offCourseBanner = null;

      // Sweep any lingering txt overlays from any page.
      destroyIfExists(this.txt1);
      destroyIfExists(this.txt2);
      destroyIfExists(this.txt3);
      destroyIfExists(this.txt4);
      this.txt1 = this.txt2 = this.txt3 = this.txt4 = null;

      (this.pathImages || []).forEach((o) => o && o.destroy());
      (this.coins || []).forEach((o) => o && o.destroy());
      this.pathImages = [];
      this.coins = [];

      // Reset all gameplay state
      this.exitedToFinal = false;
      this.flying = false;
      this.flightDone = false;
      this.driftMode = false;
      this.driftElapsed = 0;
      this.flyAwayForced = false;
      this.laneArcProgress = 0;
      this.planePerpOffset = 0;
      this.laneNearestIdx = 0;
      this.coinsCollected = 0;
      this.releaseTimer = 0;
      this.pathLocked = true;
      this.txt3WarningOn = false;
      this.txt3WobbleTween = null;
      this.txt3BlinkTween = null;
      this.isPlaneflewaway = false;
      this.joyActive = false;
      this.joyDx = 0;
      this.joyDy = 0;

      // Reset camera + scene-level pointer listeners (page3 re-installs its own).
      this.cameras.main.stopFollow();
      this.cameras.main.setScroll(0, 0);
      this.cameras.main.setBounds(0, 0, this.canvasWidth, this.canvasHeight);
      this.input.removeAllListeners("pointerdown");
      this.input.removeAllListeners("pointermove");
      this.input.removeAllListeners("pointerup");

      this.cameras.main.fadeIn(0);
      this.page3();
    });
  }

  exitPage3ToFinal() {
    if (this.exitedToFinal) return;
    this.exitedToFinal = true;
    this.flying = false;                       // stop steering / range checks
    // Path completed → won; otherwise the plane flew off and never made it.
    this.isPlaneflewaway = !this.flightDone;

    // Stop following so the camera doesn't drift while we fade out.
    this.cameras.main.stopFollow();

    // Black wipe out, then mount the final page (which has its own intro).
    this.cameras.main.fadeOut(550, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.cameras.main.fadeIn(0);
      this.cameras.main.setScroll(0, 0);
      this.createFinalPage();
    });
  }

  showOffCourseBanner() {
    if (this.offCourseBanner) return;
    const banner = this.add.text(
      this.canvasWidth / 2,
      this.canvasHeight * 0.4,
      "We Went Off Course!",
      {
        fontFamily: "'Open Sans', sans-serif",
        fontSize: `${Math.round(78 * this.scaleFactor)}px`,
        color: "#E02323",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 13 * this.scaleFactor,
        align: "center",
      }
    );
    banner.setOrigin(0.5);
    banner.setScrollFactor(0);
    banner.setDepth(2000);
    banner.setAlpha(0);
    banner.setScale(0.85);
    this.offCourseBanner = banner;

    // Pop-in: scale up + fade in.
    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
    // Continuous soft float so the banner feels alive while the plane exits.
    this.tweens.add({
      targets: banner,
      y: banner.y - this.canvasHeight * 0.02,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  updatePlaneFlight(delta) {
    const dt = delta / 1000;
    if (this.exitedToFinal || this.flightDone) return;

    // ── Steering: joystick deflection → target heading, eased toward ─────
    // Joystick range [-1,1] maps to ±45° from straight-up — plane can never
    // face sideways or backwards. Lerp toward the target so quick stick flicks
    // produce smooth nose rotation instead of an instant snap.
    if (!this.flyingAway) {
      const stick = this.joyActive ? (this.joyDx / this.joyBaseRadius) : 0;
      // Linear stick → heading mapping. Every mm of throw produces the same
      // amount of rotation, so the steering feels evenly spread across the
      // joystick's full range.
      const targetHeading = -Math.PI / 2 + stick * this.planeMaxSteer;
      const lerpAmt = 1 - Math.exp(-this.planeTurnLerp * dt);
      let d = targetHeading - this.planeHeading;
      while (d >  Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.planeHeading += d * lerpAmt;
    }

    // ── Forward motion in nose direction ─────────────────────────────────
    const speed = this.flyingAway ? this.planeFlyAwaySpeed : this.planeCruiseSpeed;
    this.plane.x += Math.cos(this.planeHeading) * speed * dt;
    this.plane.y += Math.sin(this.planeHeading) * speed * dt;
    this.plane.setRotation(this.planeHeading + this.planeForwardOffset);

    // ── Fly-away path: ignore steering; exit when off-camera ─────────────
    if (this.flyingAway) {
      const cam = this.cameras.main;
      const m = this.canvasWidth * 0.4;
      if (
        this.plane.x < cam.scrollX - m ||
        this.plane.x > cam.scrollX + cam.width + m ||
        this.plane.y < cam.scrollY - m ||
        this.plane.y > cam.scrollY + cam.height + m
      ) {
        this.exitPage3ToFinal();
      }
      return;
    }

    // ── Nearest path sample (windowed forward-biased search) ─────────────
    const pts = this.lanePoints;
    const WINDOW = 40;
    const fromI = Math.max(0, this.laneNearestIdx - 5);
    const toI = Math.min(pts.length - 1, this.laneNearestIdx + WINDOW);
    let bestSq = Infinity;
    let bestIdx = this.laneNearestIdx;
    for (let k = fromI; k <= toI; k++) {
      const ddx = pts[k].x - this.plane.x;
      const ddy = pts[k].y - this.plane.y;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 < bestSq) { bestSq = d2; bestIdx = k; }
    }
    this.laneNearestIdx = bestIdx;
    const distFromPath = Math.sqrt(bestSq);
    const onPath = distFromPath <= this.forgiveMargin;

    // Win: reached end of path.
    if (bestIdx >= pts.length - 2) {
      this.flightDone = true;
      this.exitPage3ToFinal();
      return;
    }

    // Off-path grace timer.
    if (!onPath) {
      this.offPathTimer += dt;
      if (this.offPathTimer >= this.gracePeriod) {
        this.flyingAway = true;
        this.isPlaneflewaway = true;
        this.joyActive = false;
        this.tweens.add({
          targets: [this.joyBase, this.joyThumb, this.joyZone],
          alpha: 0,
          duration: 250,
          onComplete: () => {
            this.joyBase?.setVisible(false);
            this.joyThumb?.setVisible(false);
          },
        });
        this.showOffCourseBanner();
      }
    } else {
      this.offPathTimer = 0;
    }

    // ── Lane / warning text state ────────────────────────────────────────
    if (this.laneblue) {
      const desiredKey = onPath ? "laneblue" : "lanered";
      if (this.laneblue.texture.key !== desiredKey) this.laneblue.setTexture(desiredKey);
    }
    if (this.txt3) {
      if (!onPath && !this.txt3WarningOn) {
        this.txt3WarningOn = true;
        if (this.txt3WobbleTween) { this.txt3WobbleTween.stop(); this.txt3WobbleTween = null; }
        this.tweens.killTweensOf(this.txt3);
        const w = this.txt3WarningConfig;
        this.txt3.setTexture(w.texture);
        this.txt3.setScale(w.scaleW / this.txt3.width);
        this.txt3.setPosition(w.x, w.y);
        this.txt3.setAlpha(1);
        this.txt3BlinkTween = this.tweens.add({
          targets: this.txt3,
          alpha: 0.35,
          duration: 350,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      } else if (onPath && this.txt3WarningOn) {
        this.txt3WarningOn = false;
        if (this.txt3BlinkTween) { this.txt3BlinkTween.stop(); this.txt3BlinkTween = null; }
        this.tweens.killTweensOf(this.txt3);
        const h = this.txt3HintConfig;
        this.txt3.setTexture(h.texture);
        this.txt3.setScale(h.scaleW / this.txt3.width);
        this.txt3.setPosition(h.x, h.y);
        this.txt3.setAlpha(1);
        this.txt3WobbleTween = this.tweens.add({
          targets: this.txt3,
          x: this.canvasWidth * .25,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    // ── Postcard pulse on proximity ──────────────────────────────────────
    const buf = this.pathImagePulseBuffer;
    for (let i = 0; i < this.pathImages.length; i++) {
      const img = this.pathImages[i];
      if (img.pulsed) continue;
      const halfW = img.displayWidth * 0.5 + buf;
      const halfH = img.displayHeight * 0.5 + buf;
      if (Math.abs(img.x - this.plane.x) < halfW && Math.abs(img.y - this.plane.y) < halfH) {
        img.pulsed = true;
        this.tweens.add({
          targets: img,
          scale: img.baseScale * 1.35,
          duration: 220,
          yoyo: true,
          ease: "Sine.easeOut",
        });
      }
    }

    // ── Coin collection ──────────────────────────────────────────────────
    const r2 = this.coinCollectRadius * this.coinCollectRadius;
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.collected) continue;
      const dx = c.x - this.plane.x;
      const dy = c.y - this.plane.y;
      if (dx * dx + dy * dy < r2) {
        c.collected = true;
        this.coinsCollected++;
        this.tweens.add({
          targets: c,
          scale: c.scale * 1.8,
          alpha: 0,
          y: c.y - this.canvasHeight * 0.05,
          duration: 350,
          ease: "Cubic.easeOut",
          onComplete: () => c.destroy(),
        });
      }
    }

    // ── Debug visualisation ──────────────────────────────────────────────
    this.planeRangeRing.clear();
    this.planeRangeRing.lineStyle(2, onPath ? 0xffffff : 0xff5555, 0.55);
    this.planeRangeRing.strokeCircle(this.plane.x, this.plane.y, this.forgiveMargin);
  }

  update(_time, delta) {
    if (this.flying) this.updatePlaneFlight(delta);
  }

  // Freeze world scrolling and push the player off the right edge. Physics
  // keeps running so the player animation loops and setVelocityX carries
  // them. Early-return in update's `outroPaused` branch handles the rest.
  pauseWorldForWalkOut() {
    if (this.outroPaused) return;
    this.outroPaused = true;
    this.player.setVelocityX(this.worldScrollSpeed);
    // Make sure the walk anim is actually playing during the walk-out so the
    // dino keeps striding out, even if it was stopped (e.g., player was
    // mid-air right before the gate centered).
    const walkKey = this.walkAnimKey(); // "dino_walk" since isDino is true here
    const anims = this.player.anims;
    if (!anims.isPlaying || anims.currentAnim?.key !== walkKey) {
      this.player.play(walkKey);
    }
  }

  scrollGroup(group, dx) {
    if (!group) return;
    group.children.iterate((obj) => {
      if (!obj) return;
      obj.x -= dx;
      if (obj.x + obj.displayWidth < 0) {
        // If the dino scrolled off uncollected, clear the ref and queue a
        // respawn so the player gets another chance.
        if (obj === this.dinoSprite) {
          this.dinoSprite = null;
          if (!this.dinoCollected && !this.gameOver) {
            this.time.delayedCall(2500, () => this.spawnDino());
          }
        }
        // Count obstacles that scrolled off without being hit.
        const key = obj.texture && obj.texture.key;
        if (key && key.startsWith && key.startsWith("obs_") && !obj.wasHit) {
          this.obstaclesDodged += 1;
        }
        obj.destroy();
      }
    });
  }
}
