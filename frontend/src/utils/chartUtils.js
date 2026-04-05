// Shared chart utilities
// Contains helper to export charts (Chart.js canvas, Plotly, SVG) as JPEG with white background
import Plotly from 'plotly.js-dist-min';

export async function downloadChart(chartId, fileName = 'chart.jpg') {
  const ensureJpg = (name) => {
    if (!name) return 'chart.jpg';
    return name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.jpeg') ? name : `${name}.jpg`;
  };
  fileName = ensureJpg(fileName);
  const mime = 'image/jpeg';
  try {
    const container = document.getElementById(chartId);
    if (!container) {
      alert('Chart element not found');
      console.warn('downloadChart: no element with id', chartId);
      return;
    }

    const triggerDownload = (url, name) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };

    const exportAsJpegFromImage = (imgOrCanvas, name) => {
      const w = imgOrCanvas.width || imgOrCanvas.naturalWidth || 1200;
      const h = imgOrCanvas.height || imgOrCanvas.naturalHeight || 800;
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      const ctx = tmp.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(imgOrCanvas, 0, 0, w, h);
      const dataUrl = tmp.toDataURL('image/jpeg', 0.92);
      triggerDownload(dataUrl, name);
    };

    let canvas = null;
    if (container.tagName === 'CANVAS') canvas = container;
    else canvas = container.querySelector('canvas');
    if (canvas && typeof canvas.toDataURL === 'function') {
      try {
        exportAsJpegFromImage(canvas, fileName);
        return;
      } catch (e) {
        console.warn('downloadChart: canvas export failed', e);
      }
    }

    const plotlyDiv = container.querySelector('.js-plotly-plot') || container.querySelector('.plotly') || container.querySelector('[data-plotly]') || container;
    if (plotlyDiv && Plotly && typeof Plotly.toImage === 'function') {
      try {
        const result = await Plotly.toImage(plotlyDiv, { format: 'jpeg', width: 1200, height: 800 });
        if (typeof result === 'string' && result.startsWith('data:')) {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              try {
                exportAsJpegFromImage(img, fileName);
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = (err) => reject(err || new Error('Plotly image load error'));
            img.src = result;
          });
          return;
        }
        if (result instanceof Blob) {
          const url = URL.createObjectURL(result);
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              try {
                exportAsJpegFromImage(img, fileName);
                URL.revokeObjectURL(url);
                resolve();
              } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
              }
            };
            img.onerror = (err) => {
              URL.revokeObjectURL(url);
              reject(err || new Error('Plotly blob load error'));
            };
            img.src = url;
          });
          return;
        }
      } catch (e) {
        console.warn('downloadChart: Plotly.toImage failed', e);
      }
    }

    if (typeof container.toDataURL === 'function') {
      try {
        exportAsJpegFromImage(container, fileName);
        return;
      } catch (e) {
        console.warn('downloadChart: container toDataURL failed', e);
      }
    }

    const svg = container.querySelector('svg');
    if (svg) {
      try {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svg);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvasEl = document.createElement('canvas');
              const rect = svg.getBoundingClientRect();
              canvasEl.width = rect.width || 1200;
              canvasEl.height = rect.height || 800;
              const ctx = canvasEl.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
              ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
              const dataUrl = canvasEl.toDataURL(mime, 0.92);
              triggerDownload(dataUrl, fileName);
              URL.revokeObjectURL(url);
              resolve();
            } catch (err) {
              URL.revokeObjectURL(url);
              reject(err);
            }
          };
          img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err || new Error('SVG image load error'));
          };
          img.src = url;
        });
        return;
      } catch (e) {
        console.warn('downloadChart: svg->jpeg failed', e);
      }
    }

    alert('Chart not available to download as JPEG');
    console.warn('downloadChart: no canvas/plotly/svg found in', container);
  } catch (err) {
    console.error('downloadChart err', err);
    alert('Failed to download chart');
  }
}
