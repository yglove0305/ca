class CanvasAPI {
    constructor(canvasId, serverEndpoint) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error("Canvas element not found");
        }
        this.context = this.canvas.getContext("2d");
        this.shapes = [];
        this.layers = [];
        this.currentLayer = null;
        this.serverEndpoint = serverEndpoint; // Server endpoint for saving data

        // AutoDraw setup
        this.autoDrawActive = false;
        this.sketches = [];
        this.mlModel = null; // Placeholder for ML model
        this.loadMLModel();
    }

    setDimensions(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    createLayer(name) {
        const layer = document.createElement("canvas");
        layer.width = this.canvas.width;
        layer.height = this.canvas.height;
        layer.style.position = "absolute";
        layer.style.top = "0";
        layer.style.left = "0";
        layer.id = name;
        document.body.appendChild(layer);
        this.layers.push(layer);
        this.currentLayer = layer.getContext("2d");
    }

    switchLayer(name) {
        const layer = this.layers.find(l => l.id === name);
        if (!layer) throw new Error(`Layer with name ${name} not found`);
        this.currentLayer = layer.getContext("2d");
    }

    addShape(type, options) {
        const shape = { type, options };
        this.shapes.push(shape);
        this.renderShape(shape);
    }

    renderShape(shape) {
        const { type, options } = shape;
        const ctx = this.currentLayer || this.context;

        switch (type) {
            case "rectangle":
                ctx.fillStyle = options.color || "black";
                ctx.fillRect(options.x, options.y, options.width, options.height);
                break;
            case "circle":
                ctx.fillStyle = options.color || "black";
                ctx.beginPath();
                ctx.arc(options.x, options.y, options.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case "line":
                ctx.strokeStyle = options.color || "black";
                ctx.lineWidth = options.lineWidth || 1;
                ctx.beginPath();
                ctx.moveTo(options.startX, options.startY);
                ctx.lineTo(options.endX, options.endY);
                ctx.stroke();
                break;
            default:
                throw new Error("Unknown shape type");
        }
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.shapes = [];
    }

    saveAsImage() {
        return this.canvas.toDataURL("image/png");
    }

    addText(text, x, y, options = {}) {
        const ctx = this.currentLayer || this.context;
        ctx.font = options.font || "16px Arial";
        ctx.fillStyle = options.color || "black";
        ctx.textAlign = options.align || "left";
        ctx.fillText(text, x, y);
    }

    setBackgroundColor(color) {
        const ctx = this.currentLayer || this.context;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawImage(imageSrc, x, y, width, height) {
        const ctx = this.currentLayer || this.context;
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            ctx.drawImage(image, x, y, width, height);
        };
    }

    applyFilter(filterName) {
        const ctx = this.currentLayer || this.context;
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        switch (filterName) {
            case "grayscale":
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg; // red
                    data[i + 1] = avg; // green
                    data[i + 2] = avg; // blue
                }
                break;
            case "invert":
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i]; // red
                    data[i + 1] = 255 - data[i + 1]; // green
                    data[i + 2] = 255 - data[i + 2]; // blue
                }
                break;
            default:
                throw new Error("Unknown filter");
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Image Quality Enhancement
    enhanceQuality() {
        const ctx = this.currentLayer || this.context;
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Apply sharpening filter
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0,
        ];
        const side = Math.sqrt(kernel.length);
        const halfSide = Math.floor(side / 2);

        const src = imageData.data;
        const srcWidth = imageData.width;
        const srcHeight = imageData.height;

        const output = new Uint8ClampedArray(src.length);

        for (let y = 0; y < srcHeight; y++) {
            for (let x = 0; x < srcWidth; x++) {
                const dstOffset = (y * srcWidth + x) * 4;
                let r = 0, g = 0, b = 0;

                for (let ky = 0; ky < side; ky++) {
                    for (let kx = 0; kx < side; kx++) {
                        const srcX = Math.min(srcWidth - 1, Math.max(0, x + kx - halfSide));
                        const srcY = Math.min(srcHeight - 1, Math.max(0, y + ky - halfSide));
                        const srcOffset = (srcY * srcWidth + srcX) * 4;
                        const wt = kernel[ky * side + kx];

                        r += src[srcOffset] * wt;
                        g += src[srcOffset + 1] * wt;
                        b += src[srcOffset + 2] * wt;
                    }
                }

                output[dstOffset] = Math.min(Math.max(r, 0), 255);
                output[dstOffset + 1] = Math.min(Math.max(g, 0), 255);
                output[dstOffset + 2] = Math.min(Math.max(b, 0), 255);
                output[dstOffset + 3] = src[dstOffset + 3]; // Alpha channel
            }
        }

        imageData.data.set(output);
        ctx.putImageData(imageData, 0, 0);
    }

    // Save to Server
    async saveToServer() {
        const imageData = this.saveAsImage();
        try {
            const response = await fetch(this.serverEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageData })
            });
            if (response.ok) {
                console.log("Image saved successfully to server.");
            } else {
                console.error("Failed to save image to server:", response.statusText);
            }
        } catch (error) {
            console.error("Error saving image to server:", error);
        }
    }
}

// Example usage
const canvasAPI = new CanvasAPI("myCanvas", "https://example.com/save");
canvasAPI.setDimensions(800, 600);
canvasAPI.setBackgroundColor("white");

// Draw something on the canvas
canvasAPI.addShape("rectangle", { x: 50, y: 50, width: 200, height: 100, color: "blue" });
canvasAPI.enhanceQuality(); // Enhance the quality of the drawn content
canvasAPI.saveToServer(); // Save the enhanced image to the server
