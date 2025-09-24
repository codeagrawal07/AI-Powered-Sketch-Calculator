// Get necessary elements from the DOM
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPanel = document.querySelector('.color-panel');
const clearBtn = document.getElementById('clearBtn');
const generateBtn = document.getElementById('generateBtn');
const analyzeBtn = document.getElementById('analyzeBtn'); 
const brushSizeSelector = document.getElementById('brushSize');
const userPrompt = document.getElementById('userPrompt');
const outputText = document.getElementById('outputText');
// === CANVAS SETUP ===
canvas.width = 800;
canvas.height = 600;

ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// === STATE MANAGEMENT ===
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentMode = 'pen'; // 'pen' or 'eraser'
let penColor = 'black'; // Store the last selected pen color
let penSize = 5; // Initial pen/eraser size

// Set initial drawing properties
ctx.strokeStyle = penColor;
ctx.lineWidth = penSize;

// === DRAWING FUNCTION ===
function draw(e) {
    if (!isDrawing) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    [lastX, lastY] = [e.offsetX, e.offsetY];
}
// === EVENT LISTENERS ===

// Drawing event listeners on the canvas
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// 1. Color/Eraser Selection
colorPanel.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-swatch')) {
        const currentActive = document.querySelector('.color-swatch.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        
        e.target.classList.add('active');
        currentMode = e.target.dataset.mode;

        if (currentMode === 'pen') {
            penColor = e.target.dataset.color;
            ctx.strokeStyle = penColor;
            ctx.lineWidth = penSize;
        } else if (currentMode === 'eraser') {
            ctx.strokeStyle = 'white'; // Eraser uses canvas background color
            ctx.lineWidth = penSize;
        }
    }
});

// 2. Brush Size Selector
brushSizeSelector.addEventListener('change', (e) => {
    penSize = parseInt(e.target.value);
    ctx.lineWidth = penSize;
});

// 3. Clear Button
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 4. Generate Button (Download Image)
generateBtn.addEventListener('click', () => {
    // === FIX FOR TRANSPARENT BACKGROUND ===
    // 1. Create a temporary canvas in memory
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // 2. Fill the temporary canvas with a white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 3. Draw the original canvas content on top of the white background
    tempCtx.drawImage(canvas, 0, 0);

    // 4. Use the temporary canvas to generate the download link
    const link = document.createElement('a');
    link.download = 'my-masterpiece.png';
    link.href = tempCanvas.toDataURL('image/png'); // Generate image from the temp canvas
    link.click();
});


// Initialize with a default active color
document.querySelector('.color-swatch[data-color="black"]').classList.add('active');

/**
 * NEW FUNCTION: Writes text received from the LLM onto the canvas.
 * @param {string} text - The text to write.
 * @param {boolean} isLoading - If true, shows a loading state.
 */
function writeToOutputPanel(text, isLoading = false) {
    if (isLoading) {
        outputText.innerHTML = `<p class="placeholder-text">${text}</p>`;
    } else {
        // We set innerHTML directly to render any HTML from the AI (like lists or bold text)
        outputText.innerHTML = text;
    }
}



// **UPDATED**: Analyze Button Event Listener
analyzeBtn.addEventListener('click', async () => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    // 2. Fill the temporary canvas with a white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    // 3. Draw the original canvas content on top of the white background
    tempCtx.drawImage(canvas, 0, 0);
    // Get the canvas image data as a Base64 string
    imageDataURL = tempCanvas.toDataURL('image/png'); // Generate image from the temp canvas
    // **NEW**: Get the text from the textarea
    const promptText = userPrompt.value;

    // Get the canvas image data as a Base64 string
    // Display a "Processing..." message on the canvas
    writeToOutputPanel('Analyzing your drawing...');


    try {
        // Send the image data to your Python server using the fetch API
              const response = await fetch('http://127.0.0.1:5000/process-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // **CHANGE**: Add the prompt text to the request body
            body: JSON.stringify({ 
                image: imageDataURL,
                prompt: promptText // Send the text along with the image
            }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        // Get the JSON response from the server
        const result = await response.json();
        
        // Write the LLM's description onto the canvas
         writeToOutputPanel(result.description);

    } catch (error) {
        console.error('Error:', error);
        writeToOutputPanel('Failed to analyze. Check console for details.');
    }
});