import Phaser from 'phaser';
import {
  ANIMATION_CONFIG,
  ASSET_PATHS,
  COLORS,
  IMAGE_KEYS,
  SCALE,
  SOUND_KEYS,
  SOUND_VOLUMES,
  TEXT_STYLES,
  VIEW_CONFIGS,
  ViewConfig,
} from './constants';
import ResultTextManager from './resultText';
import { SliderManager } from './slider';

export interface DiceGameCallbacks {
  onGameReady?: () => void;
  onAnimationEnd?: (correlationId: string) => void;
}

export interface GameResult {
  result: number;
  isWin: boolean;
  diceValue: number;
  direction: string;
  correlationId?: string;
}

export type DiceGame = {
  setCallbacks: (callbacks: DiceGameCallbacks) => void;
  roll: (result: GameResult) => void;
  getCurrentResult: () => number;
  isReady: () => boolean;
  getGame: () => Phaser.Game | null;
  destroy: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setTargetDiceValue: (diceValue: number) => void;
  animateToTargetValue: (diceValue: number) => void;
  setDirection: (direction: string) => void;
  setOnSliderValueChange: (callback: (value: number) => void) => void;
  playStartSound: () => void;
  setMinDiceValue: (minValue: number) => void;
  setMaxDiceValue: (maxValue: number) => void;
};

class DiceScene extends Phaser.Scene {
  private sliderManager: SliderManager;

  private resultTextManager: ResultTextManager;

  private indicator: Phaser.GameObjects.Container | null = null;

  private currentTween: Phaser.Tweens.Tween | null = null;

  private isFirstRoll: boolean = true;

  private isMuted: boolean = false;

  private volume: number = 70;

  private isGameReady: boolean = false;

  private callbacks: DiceGameCallbacks = {};

  private targetDiceValue: number = 50;

  private direction: string = 'above';

  private minDiceValue: number = 0;

  private maxDiceValue: number = 100;

  private correlationIdMap: Map<string, GameResult> = new Map();

  private currentCorrelationId: string | null = null;

  private historyQueue: Array<{ result: GameResult; correlationId: string }> = [];

  private onSliderValueChange?: (value: number) => void;

  private currentIsLoss: boolean = false;

  private viewport: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();

  private gameScale: number = SCALE;

  private viewConfig: ViewConfig;

  constructor(viewMode: 'normal' | 'compact' | 'mobile' = 'normal', gameScale: number = SCALE) {
    super({ key: 'DiceScene' });
    this.gameScale = gameScale;
    this.viewConfig = VIEW_CONFIGS[viewMode];
    this.sliderManager = new SliderManager(this, gameScale, this.viewConfig);
    this.resultTextManager = new ResultTextManager(this, this.viewConfig);
  }

  preload() {
    this.loadAssets();
  }

  create() {
    this.input.enabled = this.viewConfig.inputEnabled;
    this.setupScene();
  }

  update(): void {}

  shutdown(): void {}

  public setCallbacks(callbacks: DiceGameCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };

    if (this.isGameReady && callbacks.onGameReady) {
      callbacks.onGameReady();
    }
  }

  public roll(result: GameResult): void {
    if (!this.isGameReady) {
      return;
    }

    const correlationId = result.correlationId || `dice-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (this.currentCorrelationId && this.currentTween) {
      const interruptedResult = this.correlationIdMap.get(this.currentCorrelationId);
      if (interruptedResult) {
        this.historyQueue.push({ result: interruptedResult, correlationId: this.currentCorrelationId });
      }
      this.reset();
    }

    this.correlationIdMap.set(correlationId, result);
    this.currentCorrelationId = correlationId;

    this.startDiceAnimation(result);
  }

  public getCurrentResult(): number {
    if (this.indicator) {
      const numberText = this.indicator.getData('numberText') as Phaser.GameObjects.Text;
      if (numberText) {
        return parseFloat(numberText.text) || 0;
      }
    }
    return 0;
  }

  public isReady(): boolean {
    return this.isGameReady;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(100, volume));
  }

  public setTargetDiceValue(diceValue: number): void {
    const previousTargetValue = this.targetDiceValue;

    if (this.isGameReady && !this.viewConfig.inputEnabled && this.indicator && previousTargetValue !== diceValue) {
      this.animateToTargetValue(diceValue);
      return;
    }

    this.targetDiceValue = diceValue;
    this.sliderManager.setSplitValue(diceValue);

    if (this.isGameReady && !this.viewConfig.inputEnabled && this.indicator) {
      const targetX = this.sliderManager.valueToX(diceValue);
      this.indicator.x = targetX;
    }
  }

  private createIndicatorTween(
    targetValue: number,
    duration: number,
    onUpdate?: () => void,
    onComplete?: () => void,
    additionalProps?: Partial<Phaser.Types.Tweens.TweenBuilderConfig>,
  ): void {
    if (!this.indicator) return;

    const clampedValue = Math.max(this.minDiceValue, Math.min(this.maxDiceValue, targetValue));
    const targetX = this.sliderManager.valueToX(clampedValue);

    if (this.currentTween) {
      this.currentTween.remove();
      this.currentTween = null;
    }

    const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: this.indicator,
      x: targetX,
      duration,
      ease: ANIMATION_CONFIG.EASE,
      ...additionalProps,
    };

    if (onUpdate) {
      tweenConfig.onUpdate = onUpdate;
    }

    if (onComplete) {
      tweenConfig.onComplete = onComplete;
    }

    this.currentTween = this.tweens.add(tweenConfig);
  }

  public animateToTargetValue(diceValue: number): void {
    if (!this.isGameReady || !this.indicator || this.viewConfig.inputEnabled) {
      return;
    }

    this.targetDiceValue = diceValue;
    this.sliderManager.setSplitValue(diceValue);

    this.createIndicatorTween(
      diceValue,
      ANIMATION_CONFIG.SUBSEQUENT_ROLL_DURATION,
      () => {
        if (this.indicator) {
          const currentValue = this.sliderManager.xToValue(this.indicator.x);
          this.updateIndicatorText(currentValue, false);
        }
      },
      () => {
        this.updateIndicatorText(diceValue, false);
        this.currentTween = null;
      },
    );
  }

  public setDirection(direction: string): void {
    this.direction = direction;
    this.sliderManager.setDirection(direction);
    this.sliderManager.setSplitValue(this.targetDiceValue);
  }

  public setMinDiceValue(minValue: number): void {
    this.minDiceValue = minValue;
    this.sliderManager.setMinDiceValue(minValue);
    if (this.isGameReady) {
      this.sliderManager.setSplitValue(this.targetDiceValue);
    }
  }

  public setMaxDiceValue(maxValue: number): void {
    this.maxDiceValue = maxValue;
    this.sliderManager.setMaxDiceValue(maxValue);
    if (this.isGameReady) {
      this.sliderManager.setSplitValue(this.targetDiceValue);
    }
  }

  public playStartSound(): void {
    this.playSound(SOUND_KEYS.START, { volume: SOUND_VOLUMES.START });
  }

  public setOnSliderValueChange(callback: (value: number) => void): void {
    this.onSliderValueChange = callback;
  }

  private updateViewport(): void {
    this.getVisibleArea(this.scale, this.viewport);
  }

  private getVisibleArea(
    scaleManager: Phaser.Scale.ScaleManager,
    out: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(),
  ): Phaser.Geom.Rectangle {
    const result = new Phaser.Geom.Rectangle();

    const { baseSize, canvasBounds, displayScale, parentSize } = scaleManager;

    result.x = canvasBounds.x >= 0 ? 0 : -(canvasBounds.x * displayScale.x);
    result.y = canvasBounds.y >= 0 ? 0 : -(canvasBounds.y * displayScale.y);

    const width = baseSize.width - (canvasBounds.width - parentSize.width) * displayScale.x;
    result.width = Math.min(baseSize.width, width);
    const height = baseSize.height - (canvasBounds.height - parentSize.height) * displayScale.y;
    result.height = Math.min(baseSize.height, height);

    if (out) {
      out.setTo(result.x, result.y, result.width, result.height);
    }

    return result;
  }

  private loadAssets(): void {
    this.load.image(IMAGE_KEYS.HANDLE, `${ASSET_PATHS.IMAGES}/Handle.png`);
    this.load.image(IMAGE_KEYS.DIAMOND, `${ASSET_PATHS.IMAGES}/Diamond.png`);
    this.load.image(IMAGE_KEYS.DIAMOND_RED, `${ASSET_PATHS.IMAGES}/Diamond-Red.png`);
    this.load.audio(SOUND_KEYS.START, `${ASSET_PATHS.SOUNDS}/Start.wav`).on('loaderror', () => {
      console.warn('Start sound not found');
    });
    this.load.audio(SOUND_KEYS.CLICK, `${ASSET_PATHS.SOUNDS}/Click.wav`).on('loaderror', () => {
      console.warn('Click sound not found');
    });
    this.load.audio(SOUND_KEYS.SLIDE, `${ASSET_PATHS.SOUNDS}/Slide.mp3`).on('loaderror', () => {
      console.warn('Slide sound not found');
    });
    this.load.audio(SOUND_KEYS.WIN, `${ASSET_PATHS.SOUNDS}/Win.mp3`).on('loaderror', () => {
      console.warn('Win sound not found');
    });
  }

  private setupScene(): void {
    this.updateViewport();

    this.sliderManager.setCallbacks({
      onValueChange: (value: number) => {
        if (this.onSliderValueChange) {
          this.onSliderValueChange(value);
        }
      },
      playSound: (key: string, config?: Phaser.Types.Sound.SoundConfig) => {
        this.playSound(key, config);
      },
      stopSound: (key: string) => {
        this.sound.stopByKey(key);
      },
    });

    this.sliderManager.setMinDiceValue(this.minDiceValue);
    this.sliderManager.setMaxDiceValue(this.maxDiceValue);
    this.sliderManager.setDirection(this.direction);
    this.sliderManager.updateLayout(
      this.scale.width,
      this.scale.height,
      this.viewport.width,
      (1920 - this.viewport.width) / 2,
    );
    this.sliderManager.create();

    this.resultTextManager.create();

    const diamondTexture = this.textures.get(IMAGE_KEYS.DIAMOND);
    const diamondHeight = diamondTexture
      ? diamondTexture.getSourceImage().height * this.gameScale
      : 100 * this.gameScale;
    const slider = this.sliderManager.getSlider();
    const indicatorY = slider.y - diamondHeight / 2;
    const initialValue = this.viewConfig.indicatorInitialValue(this.sliderManager.getSplitValue());
    const initialX = this.sliderManager.valueToX(initialValue);

    this.indicator = this.createIndicator(initialX, indicatorY);
    this.indicator.y = this.sliderManager.calculateIndicatorY(diamondHeight);
    this.indicator.setDepth(10);

    this.indicator.setAlpha(this.viewConfig.indicatorInitialAlpha);
    this.indicator.setScale(this.viewConfig.indicatorInitialScale(this.gameScale));
    this.updateIndicatorText(initialValue);

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.updateViewport();
      this.sliderManager.onResize(
        gameSize.width,
        gameSize.height,
        this.viewport.width,
        (1920 - this.viewport.width) / 2,
      );

      if (this.indicator) {
        const scaledDiamondHeight = diamondTexture
          ? diamondTexture.getSourceImage().height * this.gameScale
          : 100 * this.gameScale;
        this.indicator.y = this.sliderManager.calculateIndicatorY(scaledDiamondHeight);
        const numberText = this.indicator.getData('numberText') as Phaser.GameObjects.Text;
        if (numberText) {
          const currentValue = parseFloat(numberText.text);
          this.indicator.x = this.sliderManager.valueToX(currentValue);
        }
      }

      this.resultTextManager.onResize(gameSize);
    });

    this.sliderManager.setSplitValue(this.targetDiceValue);

    this.isGameReady = true;
    this.callbacks.onGameReady?.();
  }

  private onAnimationUpdate(): void {
    if (this.indicator) {
      const currentValue = this.sliderManager.xToValue(this.indicator.x);
      this.updateIndicatorText(currentValue, this.currentIsLoss);
      this.resultTextManager.update(currentValue, this.currentIsLoss);
    }
  }

  private onAnimationComplete(serverResult: number, correlationId: string): void {
    this.updateIndicatorText(serverResult, this.currentIsLoss);
    this.resultTextManager.update(serverResult, this.currentIsLoss);

    if (!this.currentIsLoss) {
      this.playSound(SOUND_KEYS.WIN, { volume: SOUND_VOLUMES.WIN });
    }

    this.currentTween = null;

    this.handleRollComplete(correlationId);
  }

  private startRollWithResult(serverResult: number, correlationId: string): void {
    if (typeof serverResult !== 'number' || serverResult < 0 || serverResult > 100) {
      console.error('Invalid server result:', serverResult);
      return;
    }

    if (!this.indicator) {
      console.error('Indicator not initialized');
      return;
    }

    const diamondGreen = this.indicator.getData('diamondGreen') as Phaser.GameObjects.Image;
    const diamondRed = this.indicator.getData('diamondRed') as Phaser.GameObjects.Image;
    const splitValue = this.sliderManager.getSplitValue();
    let isLoss = false;
    if (this.direction === 'above') {
      isLoss = serverResult <= splitValue;
    } else {
      isLoss = serverResult >= splitValue;
    }

    this.currentIsLoss = isLoss;

    if (diamondGreen && diamondRed) {
      if (!this.viewConfig.inputEnabled) {
        diamondGreen.setVisible(true);
        diamondRed.setVisible(false);
      } else if (isLoss) {
        diamondGreen.setVisible(false);
        diamondRed.setVisible(true);
      } else {
        diamondGreen.setVisible(true);
        diamondRed.setVisible(false);
      }
    }

    this.updateIndicatorText(serverResult, isLoss);
    this.playSound(SOUND_KEYS.SLIDE, { volume: SOUND_VOLUMES.SLIDE });

    const { isFirstRoll } = this;
    if (isFirstRoll) {
      this.isFirstRoll = false;
      this.indicator.setAlpha(this.viewConfig.indicatorInitialAlpha);
      this.indicator.setScale(this.viewConfig.indicatorInitialScale(this.gameScale));
    }

    this.createIndicatorTween(
      serverResult,
      isFirstRoll ? ANIMATION_CONFIG.FIRST_ROLL_DURATION : ANIMATION_CONFIG.SUBSEQUENT_ROLL_DURATION,
      () => this.onAnimationUpdate(),
      () => this.onAnimationComplete(serverResult, correlationId),
      isFirstRoll
        ? {
            alpha: 1,
            scale: this.gameScale,
          }
        : undefined,
    );
  }

  private handleRollComplete(correlationId: string): void {
    const result = this.correlationIdMap.get(correlationId);
    if (result) {
      this.completeGame(result);
      this.correlationIdMap.delete(correlationId);
    }

    if (this.currentCorrelationId === correlationId) {
      this.currentCorrelationId = null;
    }

    this.processHistoryQueue();
  }

  private processHistoryQueue(): void {
    while (this.historyQueue.length > 0) {
      const nextHistory = this.historyQueue.shift();
      if (nextHistory) {
        const result = this.correlationIdMap.get(nextHistory.correlationId);
        if (result) {
          this.completeGame(result);
          this.correlationIdMap.delete(nextHistory.correlationId);
        }
      }
    }
  }

  private reset(): void {
    if (this.currentTween) {
      this.currentTween.remove();
      this.currentTween = null;
    }
  }

  private createIndicator(initialX: number, initialY: number): Phaser.GameObjects.Container {
    const diamondGreen = this.add.image(0, 0, IMAGE_KEYS.DIAMOND);
    const diamondRed = this.add.image(0, 0, IMAGE_KEYS.DIAMOND_RED);
    diamondGreen.setScale(this.gameScale * this.viewConfig.indicatorImageScale);
    diamondRed.setScale(this.gameScale * this.viewConfig.indicatorImageScale);
    diamondRed.setVisible(false);

    const numberText = this.add
      .text(0, 0, '0.00', {
        ...TEXT_STYLES.INDICATOR_TEXT,
        fontSize: `${this.viewConfig.indicatorTextFontSize * this.gameScale}px`,
      })
      .setOrigin(0.5);

    const container = this.add.container(initialX, initialY, [diamondGreen, diamondRed, numberText]);

    container.setData('numberText', numberText);
    container.setData('diamondGreen', diamondGreen);
    container.setData('diamondRed', diamondRed);

    return container;
  }

  private updateIndicatorText(value: number, isLoss?: boolean): void {
    if (!this.indicator) return;

    const formattedValue = value.toFixed(2);
    const numberText = this.indicator.getData('numberText') as Phaser.GameObjects.Text;
    if (numberText) {
      numberText.setText(formattedValue);

      let shouldBeLoss: boolean;
      if (!this.viewConfig.inputEnabled) {
        shouldBeLoss = false;
      } else {
        shouldBeLoss = isLoss !== undefined ? isLoss : this.currentIsLoss;
      }
      const textColor = shouldBeLoss ? COLORS.RESULT_TEXT_LOSS : COLORS.RESULT_TEXT;
      numberText.setColor(textColor);
    }
  }

  private canPlaySound(): boolean {
    if (
      this.isMuted ||
      !this.viewConfig.soundEnabled ||
      !this.sound ||
      !(this.sound as Phaser.Sound.WebAudioSoundManager).context ||
      (this.sound as Phaser.Sound.WebAudioSoundManager).context.state === 'closed'
    ) {
      return false;
    }
    return true;
  }

  private playSound(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
    if (!this.canPlaySound()) return;

    try {
      if (!this.cache.audio.exists(key)) {
        console.warn(`Audio key not found in cache: ${key}`);
        return;
      }

      // Apply master volume (0-100 -> 0-1)
      const masterVolume = this.volume / 100;
      const finalConfig = {
        ...config,
        volume: (config.volume ?? 1) * masterVolume,
      };

      const sound = this.sound.add(key, finalConfig);
      sound.play();
    } catch (error) {
      console.warn(`Failed to play sound ${key}:`, error);
    }
  }

  private startDiceAnimation(result: GameResult): void {
    const correlationId = result.correlationId || `dice-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const serverResult = result.result;

    this.startRollWithResult(serverResult, correlationId);
  }

  private async completeGame(result: GameResult): Promise<void> {
    this.reset();
    this.callbacks.onAnimationEnd?.(result.correlationId || '');
  }
}

export type DiceViewMode = 'normal' | 'compact' | 'mobile';

export const createDiceGame = (
  config: Phaser.Types.Core.GameConfig,
  viewMode: DiceViewMode = 'normal',
  scale: number = SCALE,
): DiceGame => {
  let game: Phaser.Game | null = null;
  let scene: DiceScene | null = new DiceScene(viewMode, scale);
  const callbacks: DiceGameCallbacks = {};
  let pendingTargetDiceValue: number | null = null;
  let pendingDirection: string | null = null;
  let pendingMuted: boolean | null = null;
  let pendingVolume: number | null = null;
  let pendingSliderValueChange: ((value: number) => void) | null = null;
  let pendingMinDiceValue: number | null = null;
  let pendingMaxDiceValue: number | null = null;

  const gameConfig: Phaser.Types.Core.GameConfig = {
    backgroundColor: COLORS.BACKGROUND,
    type: Phaser.WEBGL,
    scene: scene,
    scale: {
      mode: Phaser.Scale.ENVELOP,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: window.devicePixelRatio,
      width: 1920,
      height: 1080,
    },
    render: {
      pixelArt: false,
      roundPixels: true,
      antialias: true,
      antialiasGL: true,
    },
    ...config,
  };

  function setCallbacks(newCallbacks: DiceGameCallbacks): void {
    Object.assign(callbacks, newCallbacks);
    scene?.setCallbacks(callbacks);
  }

  function roll(result: GameResult): void {
    scene?.roll(result);
  }

  function getCurrentResult(): number {
    return scene?.getCurrentResult() || 0;
  }

  function isReady(): boolean {
    return scene?.isReady() || false;
  }

  function getGame(): Phaser.Game | null {
    return game;
  }

  function destroy(): void {
    game?.destroy(true);
    game = null;
    scene = null;
  }

  function setMuted(muted: boolean): void {
    if (scene) {
      scene.setMuted(muted);
    } else {
      pendingMuted = muted;
    }
  }

  function setVolume(volume: number): void {
    if (scene) {
      scene.setVolume(volume);
    } else {
      pendingVolume = volume;
    }
  }

  function setTargetDiceValue(diceValue: number): void {
    if (scene) {
      scene.setTargetDiceValue(diceValue);
    } else {
      pendingTargetDiceValue = diceValue;
    }
  }

  function setDirection(direction: string): void {
    if (scene) {
      scene.setDirection(direction);
    } else {
      pendingDirection = direction;
    }
  }

  function playStartSound(): void {
    if (scene) {
      scene.playStartSound();
    }
  }

  function setOnSliderValueChange(callback: (value: number) => void): void {
    if (scene) {
      scene.setOnSliderValueChange(callback);
    } else {
      pendingSliderValueChange = callback;
    }
  }

  function setMinDiceValue(minValue: number): void {
    if (scene) {
      scene.setMinDiceValue(minValue);
    } else {
      pendingMinDiceValue = minValue;
    }
  }

  function setMaxDiceValue(maxValue: number): void {
    if (scene) {
      scene.setMaxDiceValue(maxValue);
    } else {
      pendingMaxDiceValue = maxValue;
    }
  }

  function animateToTargetValue(diceValue: number): void {
    scene?.animateToTargetValue(diceValue);
  }

  game = new Phaser.Game(gameConfig);
  game.events.once('ready', () => {
    scene = game?.scene.getScene('DiceScene') as DiceScene;
    if (scene) {
      scene.setCallbacks(callbacks);

      if (pendingMinDiceValue !== null) {
        scene.setMinDiceValue(pendingMinDiceValue);
        pendingMinDiceValue = null;
      }

      if (pendingMaxDiceValue !== null) {
        scene.setMaxDiceValue(pendingMaxDiceValue);
        pendingMaxDiceValue = null;
      }

      if (pendingTargetDiceValue !== null) {
        scene.setTargetDiceValue(pendingTargetDiceValue);
        pendingTargetDiceValue = null;
      }

      if (pendingDirection !== null) {
        scene.setDirection(pendingDirection);
        pendingDirection = null;
      }

      if (pendingMuted !== null) {
        scene.setMuted(pendingMuted);
        pendingMuted = null;
      }

      if (pendingVolume !== null) {
        scene.setVolume(pendingVolume);
        pendingVolume = null;
      }

      if (pendingSliderValueChange !== null) {
        scene.setOnSliderValueChange(pendingSliderValueChange);
        pendingSliderValueChange = null;
      }
    } else {
      console.error('Scene not found after game ready');
    }
  });

  return {
    setCallbacks,
    roll,
    getCurrentResult,
    isReady,
    getGame,
    destroy,
    setMuted,
    setVolume,
    playStartSound,
    setOnSliderValueChange,
    setTargetDiceValue,
    animateToTargetValue,
    setDirection,
    setMinDiceValue,
    setMaxDiceValue,
  };
};
