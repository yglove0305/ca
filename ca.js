class CanvasAPI {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error("Canvas element not found");
        }
        this.context = this.canvas.getContext("2d");
        this.shapes = [];
        this.layers = [];
        this.currentLayer = null;

        // AutoDraw setup
        this.autoDrawActive = false;
        this.autoDrawModel = null; // Placeholder for ML model
        this.sketches = [];
        this.loadAutoDrawModel();
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

    // AutoDraw Feature
    loadAutoDrawModel() {
        // Placeholder: Load a pre-trained machine learning model for sketch recognition
        console.log("AutoDraw model loaded.");
        this.autoDrawModel = {}; // Mock object for demonstration
    }

    startSketching() {
        this.autoDrawActive = true;
        this.sketches = [];
        this.canvas.addEventListener("mousedown", this.handleSketch.bind(this));
    }

    stopSketching() {
        this.autoDrawActive = false;
        this.canvas.removeEventListener("mousedown", this.handleSketch.bind(this));
        this.convertSketchToShape();
    }

    handleSketch(event) {
        const x = event.offsetX;
        const y = event.offsetY;
        this.sketches.push({ x, y });
        const ctx = this.context;
        ctx.fillStyle = "gray";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    convertSketchToShape() {
        if (!this.autoDrawModel) {
            console.error("AutoDraw model not loaded.");
            return;
        }
        // Placeholder: Use ML model to recognize sketch and convert to shape
        const recognizedShape = "rectangle"; // Mock recognition result
        const options = { x: 50, y: 50, width: 100, height: 50, color: "blue" };
        this.addShape(recognizedShape, options);
    }
}

// Example usage
const canvasAPI = new CanvasAPI("myCanvas");
canvasAPI.setDimensions(800, 600);
canvasAPI.setBackgroundColor("white");

// Start AutoDraw functionality
canvasAPI.startSketching();
// Stop AutoDraw after sketching
setTimeout(() => canvasAPI.stopSketching(), 5000);
