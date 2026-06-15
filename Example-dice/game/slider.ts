import Phaser from 'phaser';
import {
  COLORS,
  IMAGE_KEYS,
  SLIDER_CONFIG,
  SLIDER_LABELS,
  SOUND_KEYS,
  SOUND_VOLUMES,
  TEXT_STYLES,
  ViewConfig,
} from './constants';

export interface Slider {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export interface SliderCallbacks {
  onValueChange?: (value: number) => void;
  playSound?: (key: string, config?: Phaser.Types.Sound.SoundConfig) => void;
  stopSound?: (key: string) => void;
}

export class SliderManager {
  private scene: Phaser.Scene;

  private slider: Slider;

  private splitValue: number;

  private sliderGraphics: Phaser.GameObjects.Graphics | null = null;

  private thumb: Phaser.GameObjects.Image | null = null;

  private sliderLabels: Phaser.GameObjects.Text[] = [];

  private sliderTicks: Phaser.GameObjects.Graphics[] = [];

  private gradRT: Phaser.GameObjects.RenderTexture | null = null;

  private gradMaskGfx: Phaser.GameObjects.Graphics | null = null;

  private gradMask: Phaser.Display.Masks.GeometryMask | null = null;

  private lastClickTime: number = 0;

  private direction: string = 'above';

  private minDiceValue: number = 0;

  private maxDiceValue: number = 100;

  private callbacks: SliderCallbacks = {};

  private gameScale: number;

  private viewConfig: ViewConfig;

  constructor(scene: Phaser.Scene, gameScale: number, viewConfig: ViewConfig) {
    this.scene = scene;
    this.gameScale = gameScale;
    this.viewConfig = viewConfig;
    this.slider = {
      x: 0,
      y: 0,
      width: 0,
      height: viewConfig.sliderHeight * this.gameScale,
      radius: viewConfig.sliderRadius * this.gameScale,
    };
    this.splitValue = 50;
  }

  public setCallbacks(callbacks: SliderCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public setDirection(direction: string): void {
    this.direction = direction;
    this.draw();
  }

  public setMinDiceValue(minValue: number): void {
    this.minDiceValue = minValue;
    this.setSplitValue(this.splitValue);
  }

  public setMaxDiceValue(maxValue: number): void {
    this.maxDiceValue = maxValue;
    this.setSplitValue(this.splitValue);
  }

  public getSplitValue(): number {
    return this.splitValue;
  }

  public getSlider(): Slider {
    return this.slider;
  }

  public getThumb(): Phaser.GameObjects.Image | null {
    return this.thumb;
  }

  public create(): void {
    this.sliderGraphics = this.scene.add.graphics();
    this.draw();
    this.drawLabels();

    const initialSplitX = this.valueToX(this.splitValue);
    this.thumb = this.scene.add.image(initialSplitX, this.calculateThumbY(), IMAGE_KEYS.HANDLE);
    this.thumb.setScale(this.gameScale * this.viewConfig.thumbScale);
    this.thumb.setInteractive({ draggable: true, useHandCursor: true });
    this.thumb.setDepth(11);

    this.thumb.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
      if (!this.thumb) return;

      const minX = this.valueToX(this.minDiceValue);
      const maxX = this.valueToX(this.maxDiceValue);
      const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
      const newValue = this.xToValue(clampedX);

      this.updateSplitValueWithSound(newValue);

      if (this.callbacks.onValueChange) {
        this.callbacks.onValueChange(this.splitValue);
      }
    });

    this.thumb.on('dragend', () => {
      if (this.callbacks.stopSound) {
        this.callbacks.stopSound(SOUND_KEYS.CLICK);
      }
    });

    const sliderHitArea = this.scene.add
      .zone(this.slider.x, this.slider.y, this.slider.width, this.slider.height)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    sliderHitArea.on('pointerdown', this.handleClick, this);
  }

  public updateLayout(width?: number, height?: number, viewportWidth?: number, viewportX?: number): void {
    const gameHeight = height || this.scene.scale.height;
    const visibleWidth = viewportWidth !== undefined ? viewportWidth : width || this.scene.scale.width;
    const visibleX = viewportX !== undefined ? viewportX : 0;
    const margin = visibleWidth * this.viewConfig.sliderMarginPercent;
    const sliderWidth = visibleWidth - margin * 2;
    const sliderX = visibleX + margin;
    const sliderY = this.viewConfig.sliderY(gameHeight);

    this.slider.x = sliderX;
    this.slider.y = sliderY;
    this.slider.width = sliderWidth;
  }

  public onResize(width: number, height: number, viewportWidth?: number, viewportX?: number): void {
    this.updateLayout(width, height, viewportWidth, viewportX);
    this.draw();
    this.drawLabels();

    if (this.thumb) {
      this.thumb.x = this.valueToX(this.splitValue);
      this.thumb.y = this.calculateThumbY();
    }
  }

  public setSplitValue(value: number): void {
    this.updateSplitValueWithSound(value, false);
  }

  public valueToX(value: number): number {
    const { x, width } = this.slider;
    return x + (value / 100) * width;
  }

  public xToValue(xCoord: number): number {
    const { x, width } = this.slider;
    return ((xCoord - x) / width) * 100;
  }

  public calculateThumbY(): number {
    return this.slider.y + this.slider.height / 2 + this.viewConfig.thumbOffsetY * this.gameScale;
  }

  public calculateIndicatorY(diamondHeight: number): number {
    const sliderBorderWidth = this.viewConfig.sliderBorderWidth * this.gameScale;
    const indicatorGap = this.viewConfig.indicatorGap * this.gameScale;
    return (
      this.slider.y -
      (diamondHeight * this.gameScale * this.viewConfig.indicatorImageScale) / 2 -
      sliderBorderWidth -
      indicatorGap * 1.6
    );
  }

  private handleClick = (pointer: Phaser.Input.Pointer): void => {
    const minX = this.valueToX(this.minDiceValue);
    const maxX = this.valueToX(this.maxDiceValue);

    const clampedX = Phaser.Math.Clamp(pointer.x, minX, maxX);
    const newValue = this.xToValue(clampedX);

    this.updateSplitValueWithSound(newValue);

    if (this.callbacks.onValueChange) {
      this.callbacks.onValueChange(this.splitValue);
    }
  };

  private updateSplitValueWithSound(newValue: number, playSound: boolean = true): void {
    const roundedValue = Math.round(newValue);
    const clampedValue = Phaser.Math.Clamp(roundedValue, this.minDiceValue, this.maxDiceValue);

    if (clampedValue !== this.splitValue) {
      this.splitValue = clampedValue;

      if (playSound && this.callbacks.playSound) {
        const { now } = this.scene.time;
        const cooldown = SLIDER_CONFIG.CLICK_COOLDOWN;

        if (now > this.lastClickTime + cooldown) {
          this.callbacks.playSound(SOUND_KEYS.CLICK, { volume: SOUND_VOLUMES.CLICK });
          this.lastClickTime = now;
        }
      }

      if (this.thumb) {
        this.thumb.x = this.valueToX(this.splitValue);
      }

      this.draw();
    }
  }

  private draw(): void {
    if (!this.sliderGraphics) return;

    const s = this.slider;
    const gfx = this.sliderGraphics;
    gfx.clear();

    gfx.fillStyle(COLORS.BORDER, 1);
    const sliderGap = this.viewConfig.sliderGap * this.gameScale;
    const sliderBorderWidth = this.viewConfig.sliderBorderWidth * this.gameScale;
    const outerRadius = this.viewConfig.sliderOuterRadius * this.gameScale;
    gfx.fillRoundedRect(
      s.x - sliderGap - sliderBorderWidth,
      s.y - sliderGap - sliderBorderWidth,
      s.width + (sliderGap + sliderBorderWidth) * 2,
      s.height + (sliderGap + sliderBorderWidth) * 2,
      outerRadius,
    );

    gfx.fillStyle(COLORS.GAP, 1);
    gfx.fillRoundedRect(
      s.x - sliderGap,
      s.y - sliderGap,
      s.width + sliderGap * 2,
      s.height + sliderGap * 2,
      outerRadius - sliderBorderWidth,
    );

    gfx.fillStyle(COLORS.SLIDER_BG, 1);
    gfx.fillRoundedRect(s.x, s.y, s.width, s.height, s.radius);

    const splitX = this.valueToX(this.splitValue);

    const needsResize = this.gradRT && (this.gradRT.width !== s.width || this.gradRT.height !== s.height);
    if (needsResize && this.gradRT) {
      if (this.gradMask) {
        this.gradRT.clearMask();
        this.gradMask = null;
      }
      this.gradRT.destroy();
      this.gradRT = null;

      if (this.gradMaskGfx) {
        this.gradMaskGfx.destroy();
        this.gradMaskGfx = null;
      }
    }

    if (!this.gradRT) {
      this.gradRT = this.scene.add.renderTexture(0, 0, s.width, s.height);
      this.gradRT.setOrigin(0, 0);
      this.gradRT.setDepth(3);
    }

    this.gradRT.setPosition(s.x, s.y);

    this.gradRT.clear();

    const g = this.scene.add.graphics();
    const localSplit = Phaser.Math.Clamp(splitX - s.x, 0, s.width);
    const leftW = Math.max(0, Math.min(localSplit, s.width));
    const rightW = s.width - leftW;

    const { RED_TOP, RED_BOTTOM, GREEN_TOP, GREEN_BOTTOM } = COLORS;

    const isAbove = this.direction === 'above';
    const leftColor = isAbove ? { top: RED_TOP, bottom: RED_BOTTOM } : { top: GREEN_TOP, bottom: GREEN_BOTTOM };
    const rightColor = isAbove ? { top: GREEN_TOP, bottom: GREEN_BOTTOM } : { top: RED_TOP, bottom: RED_BOTTOM };

    if (leftW > 0) {
      g.fillGradientStyle(leftColor.top, leftColor.top, leftColor.bottom, leftColor.bottom, 1);
      g.fillRect(0, 0, leftW, s.height);
    }

    if (rightW > 0) {
      g.fillGradientStyle(rightColor.top, rightColor.top, rightColor.bottom, rightColor.bottom, 1);
      g.fillRect(leftW, 0, rightW, s.height);
    }

    this.gradRT.draw(g, 0, 0);
    g.destroy();

    if (!this.gradMaskGfx) {
      this.gradMaskGfx = this.scene.add.graphics();
      this.gradMaskGfx.fillStyle(0xffffff, 1);
      this.gradMaskGfx.fillRoundedRect(0, 0, s.width, s.height, s.radius);
      this.gradMask = this.gradMaskGfx.createGeometryMask();
      this.gradRT.setMask(this.gradMask);
    } else {
      this.gradMaskGfx.clear();
      this.gradMaskGfx.fillStyle(0xffffff, 1);
      this.gradMaskGfx.fillRoundedRect(0, 0, s.width, s.height, s.radius);

      if (needsResize || !this.gradMask) {
        if (this.gradMask) {
          this.gradRT.clearMask();
        }
        this.gradMask = this.gradMaskGfx.createGeometryMask();
        this.gradRT.setMask(this.gradMask);
      }
    }
    this.gradMaskGfx.setPosition(s.x, s.y);

    gfx.fillStyle(COLORS.THUMB_BG, 1);
    const thumbLineWidth = 20 * this.gameScale;
    const thumbLineOffset = 10 * this.gameScale;
    const thumbLineHeightOffset = 5 * this.gameScale;
    gfx.fillRect(
      splitX - thumbLineOffset,
      s.y - thumbLineHeightOffset,
      thumbLineWidth,
      s.height + thumbLineHeightOffset * 2,
    );
  }

  private drawLabels(): void {
    this.sliderLabels.forEach((label) => label.destroy());
    this.sliderTicks.forEach((tick) => tick.destroy());

    this.sliderLabels = [];
    this.sliderTicks = [];

    const s = this.slider;
    const sliderGap = this.viewConfig.sliderGap * this.gameScale;
    const sliderBorderWidth = this.viewConfig.sliderBorderWidth * this.gameScale;
    const tickHeight = SLIDER_CONFIG.TICK_HEIGHT * this.gameScale;
    const labelYOffset = this.viewConfig.labelYOffset * this.gameScale;
    const tickTopY = s.y + s.height + sliderGap + sliderBorderWidth / 2 - tickHeight / 2;
    const labelY = Math.round(s.y + s.height + sliderGap + sliderBorderWidth + labelYOffset);

    SLIDER_LABELS.forEach((val) => {
      const x = Math.round(this.valueToX(val));

      const label = this.scene.add
        .text(x, labelY, val.toString(), {
          ...TEXT_STYLES.LABEL_TEXT,
          fontSize: `${this.viewConfig.labelTextFontSize * this.gameScale}px`,
          shadow: {
            ...TEXT_STYLES.LABEL_TEXT.shadow,
            offsetX: TEXT_STYLES.LABEL_TEXT.shadow.offsetX * this.gameScale,
            offsetY: TEXT_STYLES.LABEL_TEXT.shadow.offsetY * this.gameScale,
            blur: TEXT_STYLES.LABEL_TEXT.shadow.blur * this.gameScale,
          },
        })
        .setOrigin(0.5);
      label.setAlpha(0.7);
      this.sliderLabels.push(label);

      const tickWidth = SLIDER_CONFIG.TICK_WIDTH * this.gameScale;
      const tickGfx = this.scene.add.graphics();
      tickGfx.fillStyle(COLORS.TICK, 1);
      tickGfx.fillRect(x - tickWidth / 2, tickTopY, tickWidth, tickHeight);
      tickGfx.setDepth(1);
      this.sliderTicks.push(tickGfx);
    });
  }

  public destroy(): void {
    this.sliderLabels.forEach((label) => label.destroy());
    this.sliderTicks.forEach((tick) => tick.destroy());
    if (this.sliderGraphics) {
      this.sliderGraphics.destroy();
    }
    if (this.gradRT) {
      this.gradRT.destroy();
    }
    if (this.gradMaskGfx) {
      this.gradMaskGfx.destroy();
    }
    if (this.thumb) {
      this.thumb.destroy();
    }
  }
}
