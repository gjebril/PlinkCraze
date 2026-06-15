import Phaser from 'phaser';
import { COLORS, LAYOUT_CONFIG, TEXT_STYLES, ViewConfig } from './constants';

export default class ResultTextManager {
  private scene: Phaser.Scene;

  private resultTextContainer: Phaser.GameObjects.Container | null = null;

  private resultDigits: Phaser.GameObjects.Text[] = [];

  private readonly numResultDigits: number = 6;

  private digitWidth: number = 0;

  private digitHeight: number = 0;

  private decimalWidth: number = 0;

  private viewConfig: ViewConfig;

  constructor(scene: Phaser.Scene, viewConfig: ViewConfig) {
    this.scene = scene;
    this.viewConfig = viewConfig;
  }

  private getResultTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      ...TEXT_STYLES.RESULT_TEXT,
      fontSize: this.viewConfig.resultTextFontSize,
    };
  }

  public create(): void {
    if (!this.viewConfig.showResultText) {
      return;
    }

    this.resultDigits.forEach((digit) => digit.destroy());
    this.resultDigits = [];
    if (this.resultTextContainer) {
      this.resultTextContainer.destroy();
    }

    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height * LAYOUT_CONFIG.RESULT_TEXT_Y_PERCENT;
    this.resultTextContainer = this.scene.add.container(centerX, centerY);

    const resultTextStyle = this.getResultTextStyle();
    const measureText = this.scene.add.text(0, 0, '0', resultTextStyle).setVisible(false);
    this.digitWidth = measureText.width - measureText.width * 0.04;
    this.digitHeight = measureText.height;

    measureText.setText('.');
    this.decimalWidth = measureText.width;
    measureText.destroy();

    for (let i = 0; i < this.numResultDigits; i += 1) {
      const charText = this.scene.add.text(0, 0, '', resultTextStyle).setOrigin(0.5);

      charText.setFixedSize(this.digitWidth, this.digitHeight);
      charText.setAlign('center');

      this.resultDigits.push(charText);
      this.resultTextContainer.add(charText);
    }

    this.update(1.0, false);
  }

  public update(value: number, isLoss: boolean): void {
    if (this.resultDigits.length !== this.numResultDigits) return;

    const numStr = value.toFixed(2).padStart(this.numResultDigits, '0');
    const chars = numStr.split('');
    const colorHex = isLoss ? COLORS.RESULT_TEXT_LOSS : COLORS.RESULT_TEXT;

    let firstVisibleIndex = 2;
    for (let i = 0; i <= 2; i += 1) {
      if (chars[i] !== '0') {
        firstVisibleIndex = i;
        break;
      }
    }

    const visibleItems: { char: string; width: number }[] = [];

    for (let i = firstVisibleIndex; i < this.numResultDigits; i += 1) {
      const char = chars[i];
      const width = char === '.' ? this.decimalWidth : this.digitWidth;
      visibleItems.push({ char, width });
    }

    const numVisibleDigits = visibleItems.length;
    let totalWidth = visibleItems.reduce((sum, item) => sum + item.width, 0);

    if (numVisibleDigits > 0) {
      totalWidth += (numVisibleDigits - 1) * TEXT_STYLES.RESULT_TEXT.letterSpacing;
    }

    let currentX = -totalWidth / 2;

    let visibleItemIndex = 0;
    for (let i = 0; i < this.numResultDigits; i += 1) {
      const digitText = this.resultDigits[i];

      if (i < firstVisibleIndex) {
        digitText.setVisible(false);
      } else {
        const item = visibleItems[visibleItemIndex];
        if (item) {
          const { char, width } = item;

          if (digitText.text !== char) {
            digitText.setText(char);
          }
          digitText.setColor(colorHex);
          digitText.setStroke(colorHex, TEXT_STYLES.RESULT_TEXT.strokeThickness);

          digitText.setFixedSize(width, this.digitHeight);
          digitText.x = currentX + width / 2;
          digitText.setVisible(true);

          currentX += width + TEXT_STYLES.RESULT_TEXT.letterSpacing;

          visibleItemIndex += 1;
        } else {
          digitText.setVisible(false);
        }
      }
    }
  }

  public onResize(gameSize: Phaser.Structs.Size): void {
    if (this.resultTextContainer) {
      this.resultTextContainer.x = gameSize.width / 2;
      this.resultTextContainer.y = gameSize.height * LAYOUT_CONFIG.RESULT_TEXT_Y_PERCENT;
    }
  }

  public destroy(): void {
    this.resultDigits.forEach((digit) => digit.destroy());
    this.resultDigits = [];
    if (this.resultTextContainer) {
      this.resultTextContainer.destroy();
      this.resultTextContainer = null;
    }
  }
}
