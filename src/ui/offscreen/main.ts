const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.inset = '0';
overlay.style.background = 'rgba(8, 11, 19, 0.32)';
overlay.style.cursor = 'crosshair';
overlay.style.zIndex = '2147483647';
overlay.style.border = '2px dashed rgba(92, 108, 255, 0.7)';
overlay.style.pointerEvents = 'auto';
overlay.style.display = 'none';

const selection = document.createElement('div');
selection.style.position = 'absolute';
selection.style.border = '2px solid rgba(92, 108, 255, 0.9)';
selection.style.background = 'rgba(92, 108, 255, 0.2)';
selection.style.display = 'none';

overlay.appendChild(selection);
document.body.appendChild(overlay);

let startX = 0;
let startY = 0;
let isDragging = false;

const closeOverlay = () => {
  overlay.style.display = 'none';
  selection.style.display = 'none';
};

const openOverlay = () => {
  overlay.style.display = 'block';
};

overlay.addEventListener('mousedown', (event) => {
  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  selection.style.display = 'block';
  selection.style.left = `${startX}px`;
  selection.style.top = `${startY}px`;
  selection.style.width = '0px';
  selection.style.height = '0px';
});

overlay.addEventListener('mousemove', (event) => {
  if (!isDragging) return;
  const currentX = event.clientX;
  const currentY = event.clientY;
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const left = Math.min(currentX, startX);
  const top = Math.min(currentY, startY);
  selection.style.left = `${left}px`;
  selection.style.top = `${top}px`;
  selection.style.width = `${width}px`;
  selection.style.height = `${height}px`;
});

const stopDrag = (event: MouseEvent) => {
  if (!isDragging) return;
  isDragging = false;
  const endX = event.clientX;
  const endY = event.clientY;
  const region = {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY)
  };
  chrome.runtime.sendMessage({ type: 'region:selected', region });
  closeOverlay();
};

overlay.addEventListener('mouseup', stopDrag);
overlay.addEventListener('mouseleave', () => {
  if (isDragging) {
    isDragging = false;
    selection.style.display = 'none';
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'region:overlay-open') {
    openOverlay();
  }
  if (message?.type === 'region:overlay-close') {
    closeOverlay();
  }
});
