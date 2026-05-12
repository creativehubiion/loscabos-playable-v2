import { Scene } from "phaser";
import { getScaleUtils } from "../utils/scaleUtils";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const {
      canvasWidth,
      canvasHeight,
      scaleFactor,
    } = getScaleUtils(this, true);

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.scaleFactor = scaleFactor;

    this.createLoadingUI();
  }

  createLoadingUI() {
    const { canvasWidth, canvasHeight, scaleFactor } = this;

    const barWidth = canvasWidth * 0.55;
    const barHeight = 12 * scaleFactor;
    const borderRadius = barHeight / 2;
    const barX = canvasWidth / 2 - barWidth / 2;
    const barY = canvasHeight * 0.5;

    this.barWidth = barWidth;
    this.barHeight = barHeight;
    this.borderRadius = borderRadius;
    this.barX = barX;
    this.barY = barY;

    this.loadingBarContainer = this.add.graphics();
    this.loadingBarContainer.fillStyle(0xffffff, 0.35);
    this.loadingBarContainer.fillRoundedRect(barX, barY, barWidth, barHeight, borderRadius);

    this.loadingBarFill = this.add.graphics();
  }

  updateProgressBar(value) {
    if (!this.loadingBarFill) return;

    const fillWidth = this.barWidth * value;

    this.loadingBarFill.clear();
    this.loadingBarFill.fillStyle(0x00A859, 1);
    this.loadingBarFill.fillRoundedRect(
      this.barX,
      this.barY,
      Math.max(fillWidth, this.barHeight),
      this.barHeight,
      this.borderRadius
    );
  }

  preload() {
    this.load.on("progress", (value) => {
      this.updateProgressBar(value);
    });

    this.load.setPath(window.trackingPath + "images/");

    // Load the logo first so it can render while the rest streams in.
    this.load.image("condorlogo", "condorlogo.png");

    this.load.on("filecomplete-image-condorlogo", () => {
      const logo = this.add.image(
        this.canvasWidth / 2,
        this.canvasHeight * 0.4,
        "condorlogo"
      );
      logo.setOrigin(0.5).setDepth(1);

      const maxLogoWidth = this.canvasWidth * 0.45;
      const logoScale = maxLogoWidth / logo.width;
      logo.setScale(logoScale);

      this.tweens.add({
        targets: logo,
        scale: logoScale * 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.loaderLogo = logo;
    });

    // Backgrounds
    this.load.image("bg1", "bg1.png");
    this.load.image("bg2", "bg2.png");

    // Logos
    this.load.image("condorlogo2", "condorlogo2.png");

    // UI / CTAs
    this.load.image("bookNow", "bookNow.png");
    this.load.image("playNow", "playNow.png");
    this.load.image("playagain", "playagain.png");
    this.load.image("discover", "discover.png");
    this.load.image("escape", "escape.png");
    this.load.image("congrats", "congrats.png");

    // Map + path
    this.load.image("map", "map.png");
    this.load.image("mapline", "mapline.png");
    this.load.image("pin", "pin.png");

    // Player + collectibles
    this.load.image("plane", "plane.png");
    this.load.image("coin", "coin.png");

    // Lane markers
    this.load.svg("laneblue", "laneblue1.svg");
    this.load.svg("lanegray", "lanegray1.svg");
    this.load.svg("lanered", "lanered1.svg");

    this.load.image("txt1", "txt1.png");
    this.load.image("txt4", "txt4.png");
    this.load.image("overlay", "overlay.png");

    this.load.image("fish", "fish.png");
    // Imagery
    for (let i = 1; i <= 5; i++) {
      this.load.image(`img${i}`, `img${i}.png`);
    }

    // Obstacles
    for (let i = 1; i <= 7; i++) {
      this.load.image(`obj${i}`, `obj${i}.png`);
    }

    // Text overlays
    for (let i = 1; i <= 3; i++) {
      this.load.image(`txt${i}`, `txt${i}.png`);
    }

    // Audio
    this.load.audio("bgMusic", "bgMusic.mp3");
  }

  create() {
    const targets = [this.loadingBarContainer, this.loadingBarFill];
    if (this.loaderLogo) targets.push(this.loaderLogo);

    this.tweens.add({
      targets,
      alpha: 0,
      duration: 0,
      ease: "Power2",
      onComplete: () => {
        this.scene.start("MainMenu");
      },
    });
  }
}
