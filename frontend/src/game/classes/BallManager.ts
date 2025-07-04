import { HEIGHT, WIDTH, ballRadius, obstacleRadius } from "../constants";
import { Obstacle, Sink, createObstacles, createSinks } from "../objects";
import { pad, unpad } from "../padding";
import { Ball } from "./Ball";

interface Ripple {
    x: number;
    y: number;
    startTime: number;
    duration: number;
    maxRadius: number;
}

export class BallManager {
    private balls: Ball[];
    private canvasRef: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private obstacles: Obstacle[]
    private sinks: Sink[]
    private requestId?: number;
    private onFinish?: (index: number,startX?: number, multiplier?: number, color?: string) => void;
    private ripples: Ripple[];
    private shakingSinks: Map<number, number>; // Map to store sink index and shake end time

    constructor(canvasRef: HTMLCanvasElement, onFinish?: (index: number,startX?: number, multiplier?: number, color?: string) => void) {
        this.balls = [];
        this.canvasRef = canvasRef;
        this.ctx = this.canvasRef.getContext("2d")!;
        this.obstacles = createObstacles();
        this.sinks = createSinks();
        this.ripples = [];
        this.shakingSinks = new Map(); // Initialize before update()
        this.onFinish = onFinish; // Explicitly assign to 'this' to satisfy linter
        this.update();
    }

    addBall(startX?: number) {
        const newBall = new Ball(startX || pad(WIDTH / 2 + 13), pad(50), ballRadius, this.ctx, this.obstacles, this.sinks, (index) => {
            this.balls = this.balls.filter(ball => ball !== newBall);
            const sink = this.sinks[index];
            const multiplier = sink?.multiplier;
            const color = this.getColor(index).background;
            this.onFinish?.(index, startX, multiplier, color);
            this.shakingSinks.set(index, Date.now() + 200); // Shake for 200ms
        }, (x, y) => this.addRipple(x, y));
        this.balls.push(newBall);
    }

    addRipple(x: number, y: number) {
        this.ripples.push({
            x,
            y,
            startTime: Date.now(),
            duration: 800, // milliseconds - slower expansion
            maxRadius: 15, // smaller radius
        });
    }

    drawRipples() {
        const currentTime = Date.now();
        this.ripples = this.ripples.filter(ripple => {
            const elapsed = currentTime - ripple.startTime;
            const progress = elapsed / ripple.duration;

            if (progress < 1) {
                // Ease-out function for smoother animation
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const currentRadius = ripple.maxRadius * easedProgress;
                
                // Smoother opacity fade with ease-in
                const opacity = Math.pow(1 - progress, 2) * 0.6; // Max opacity 0.6 instead of 1

                this.ctx.beginPath();
                this.ctx.arc(ripple.x, ripple.y, currentRadius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(173, 216, 230, ${opacity})`; // Light blue ripple
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                this.ctx.closePath();
                return true;
            }
            return false;
        });
    }

    drawObstacles() {
        this.obstacles.forEach((obstacle) => {
            const x = unpad(obstacle.x);
            const y = unpad(obstacle.y);
            
            // Metallic/glowing peg with gradient
            const pegGradient = this.ctx.createRadialGradient(x, y, 0, x, y, obstacle.radius);
            pegGradient.addColorStop(0, '#e5e7eb');
            pegGradient.addColorStop(0.7, '#9ca3af');
            pegGradient.addColorStop(1, '#6b7280');
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, obstacle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = pegGradient;
            this.ctx.fill();
            
            // Glowing edge
            this.ctx.strokeStyle = 'rgba(229, 231, 235, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.closePath();
        });
    }
  
    getColor(index: number) {
        const sink = this.sinks[index];
        const multiplier = sink?.multiplier || 0;

        // Define the color stops for the gradient
        const colorStops = [
            { value: 0.5, color: { r: 255, g: 255, b: 153 } }, // Light Yellow (for 0.5x)
            { value: 1.0, color: { r: 255, g: 255, b: 0 } },   // Yellow
            { value: 1.1, color: { r: 255, g: 204, b: 0 } },   // Orange-Yellow
            { value: 1.2, color: { r: 255, g: 153, b: 0 } },   // Orange
            { value: 1.4, color: { r: 255, g: 102, b: 0 } },   // Dark Orange
            { value: 2.0, color: { r: 255, g: 51, b: 0 } },    // Red-Orange
            { value: 9.0, color: { r: 255, g: 0, b: 0 } },     // Red
            { value: 16.0, color: { r: 204, g: 0, b: 0 } }    // Darker Red (for 16x)
        ];

        // Find the two color stops to interpolate between
        let startColor = colorStops[0];
        let endColor = colorStops[colorStops.length - 1];

        for (let i = 0; i < colorStops.length - 1; i++) {
            if (multiplier >= colorStops[i].value && multiplier <= colorStops[i + 1].value) {
                startColor = colorStops[i];
                endColor = colorStops[i + 1];
                break;
            }
        }

        // Calculate interpolation factor
        const range = endColor.value - startColor.value;
        const progress = range === 0 ? 0 : (multiplier - startColor.value) / range;

        // Interpolate RGB values
        const r = Math.round(startColor.color.r + (endColor.color.r - startColor.color.r) * progress);
        const g = Math.round(startColor.color.g + (endColor.color.g - startColor.color.g) * progress);
        const b = Math.round(startColor.color.b + (endColor.color.b - startColor.color.b) * progress);

        const textColor = (multiplier === 16) ? 'white' : 'black';

        return { background: `rgb(${r}, ${g}, ${b})`, color: textColor };
    }
    drawSinks() {
        const SPACING = obstacleRadius * 2;
        const cornerRadius = 5; // For rounded corners

        for (let i = 0; i < this.sinks.length; i++) {
            const sink = this.sinks[i];
            let offsetX = 0;
            let offsetY = 0;
            const shakeEndTime = this.shakingSinks.get(i);
            if (shakeEndTime && Date.now() < shakeEndTime) {
                const shakeIntensity = (shakeEndTime - Date.now()) / 200; // Normalize to 0-1
                offsetX = (Math.random() - 0.5) * 5 * shakeIntensity; // Random offset
                offsetY = (Math.random() - 0.5) * 5 * shakeIntensity;
            } else if (shakeEndTime) {
                this.shakingSinks.delete(i); // Remove if shake is over
            }

            const colorInfo = this.getColor(i);
            const x = sink.x - SPACING / 2 + offsetX;
            const y = sink.y - sink.height / 2 + offsetY;
            const width = sink.width - SPACING / 4;
            const height = sink.height;
            
            // Add glow effect if shaking (recently hit)
            if (shakeEndTime && Date.now() < shakeEndTime) {
                this.ctx.save();
                this.ctx.shadowColor = colorInfo.background;
                this.ctx.shadowBlur = 20;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
            }
            
            this.ctx.fillStyle = colorInfo.background;

            // Draw shadow
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Black shadow, 50% opacity
            this.ctx.shadowBlur = 8; // Blur radius
            this.ctx.shadowOffsetX = 4; // Horizontal offset
            this.ctx.shadowOffsetY = 4; // Vertical offset

            // Draw the shape that will cast the shadow (same as the main box)
            this.ctx.beginPath();
            this.ctx.moveTo(x + cornerRadius, y);
            this.ctx.lineTo(x + width - cornerRadius, y);
            this.ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);
            this.ctx.lineTo(x + width, y + height - cornerRadius);
            this.ctx.arcTo(x + width, y + height, x + width - cornerRadius, y + height, cornerRadius);
            this.ctx.lineTo(x + cornerRadius, y + height);
            this.ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);
            this.ctx.lineTo(x, y + cornerRadius);
            this.ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
            this.ctx.closePath();
            this.ctx.fillStyle = this.getColor(i).background; // Use the background color for the shadow-casting shape
            this.ctx.fill();
            this.ctx.restore(); // Restore context to remove shadow for subsequent drawings

            // Draw main rounded rectangle
            this.ctx.beginPath();
            this.ctx.moveTo(x + cornerRadius, y);
            this.ctx.lineTo(x + width - cornerRadius, y);
            this.ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);
            this.ctx.lineTo(x + width, y + height - cornerRadius);
            this.ctx.arcTo(x + width, y + height, x + width - cornerRadius, y + height, cornerRadius);
            this.ctx.lineTo(x + cornerRadius, y + height);
            this.ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);
            this.ctx.lineTo(x, y + cornerRadius);
            this.ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
            this.ctx.closePath();
            this.ctx.fill();

            // Add a subtle border
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Dark, semi-transparent border
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Draw text with bounce animation
            this.ctx.fillStyle = colorInfo.color;
            
            // Scale text if recently hit for bounce effect
            let textScale = 1;
            if (shakeEndTime && Date.now() < shakeEndTime) {
                const elapsed = Date.now() - (shakeEndTime - 200);
                textScale = 1 + Math.sin(elapsed * 0.02) * 0.3; // Bounce effect
                this.ctx.save();
                this.ctx.translate(x + width / 2, y + height / 2);
                this.ctx.scale(textScale, textScale);
                this.ctx.translate(-(x + width / 2), -(y + height / 2));
            }
            
            this.ctx.font = 'bold 14px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((sink?.multiplier)?.toString() + "x", x + width / 2, y + height / 2);
            
            if (shakeEndTime && Date.now() < shakeEndTime) {
                this.ctx.restore(); // Restore scale transformation
                this.ctx.restore(); // Restore glow effect
            }
        }
    }

    draw() {
        // Dark gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, HEIGHT);
        gradient.addColorStop(0, '#1f2937');
        gradient.addColorStop(1, '#111827');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        this.drawObstacles();
        this.drawSinks();
        this.drawRipples();
        this.balls.forEach(ball => {
            ball.draw();
            ball.update();
        });
    }
    
    update() {
        this.draw();
        this.requestId = requestAnimationFrame(this.update.bind(this));
    }

    stop() {
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
        }
    }
}