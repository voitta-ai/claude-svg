import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface EditElementParams {
  svg_content: string;
  element_id: string;
  changes: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    style?: Record<string, string>;
    text?: string;
  };
}

export interface ExportParams {
  svg_content: string;
  format: "png" | "jpeg" | "webp" | "svg";
  scale: number;
  quality: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface EditResult {
  svg: string;
}

export interface ExportResult {
  filePath: string;
}

export class SVGEditor {
  async editElement(params: EditElementParams): Promise<EditResult> {
    const { svg_content, element_id, changes } = params;
    
    // Simple string-based editing for demonstration
    // In production, you'd use a proper XML parser like jsdom
    let updatedSVG = svg_content;
    
    // Find the element by ID
    const elementRegex = new RegExp(`(<[^>]+id="${element_id}"[^>]*>)`, 'g');
    const match = elementRegex.exec(svg_content);
    
    if (!match) {
      throw new Error(`Element with ID '${element_id}' not found`);
    }
    
    let elementTag = match[1];
    
    // Apply position changes
    if (changes.position) {
      elementTag = this.updateAttribute(elementTag, 'x', changes.position.x.toString());
      elementTag = this.updateAttribute(elementTag, 'y', changes.position.y.toString());
      elementTag = this.updateAttribute(elementTag, 'cx', changes.position.x.toString());
      elementTag = this.updateAttribute(elementTag, 'cy', changes.position.y.toString());
    }
    
    // Apply size changes
    if (changes.size) {
      elementTag = this.updateAttribute(elementTag, 'width', changes.size.width.toString());
      elementTag = this.updateAttribute(elementTag, 'height', changes.size.height.toString());
      elementTag = this.updateAttribute(elementTag, 'r', (changes.size.width / 2).toString());
    }
    
    // Apply style changes
    if (changes.style) {
      Object.entries(changes.style).forEach(([property, value]) => {
        elementTag = this.updateAttribute(elementTag, property, value);
      });
    }
    
    // Replace the original element with the updated one
    updatedSVG = svg_content.replace(match[1], elementTag);
    
    // Handle text content changes
    if (changes.text && elementTag.includes('<text')) {
      const textRegex = new RegExp(`(<text[^>]+id="${element_id}"[^>]*>)[^<]*(</text>)`, 'g');
      updatedSVG = updatedSVG.replace(textRegex, `$1${changes.text}$2`);
    }
    
    return { svg: updatedSVG };
  }

  private updateAttribute(elementTag: string, attribute: string, value: string): string {
    const attrRegex = new RegExp(`${attribute}="[^"]*"`, 'g');
    if (attrRegex.test(elementTag)) {
      return elementTag.replace(attrRegex, `${attribute}="${value}"`);
    } else {
      // Add the attribute if it doesn't exist
      return elementTag.replace('>', ` ${attribute}="${value}">`);
    }
  }

  async exportSVG(params: ExportParams): Promise<ExportResult> {
    const { svg_content, format, scale, quality, crop } = params;
    
    if (format === "svg") {
      const timestamp = Date.now();
      const filePath = join(__dirname, "..", `exported-svg-${timestamp}.svg`);
      await writeFile(filePath, svg_content);
      return { filePath };
    }
    
    // For raster formats, create an HTML file with export functionality
    const timestamp = Date.now();
    const html = this.createExportHTML(svg_content, format, scale, quality, crop);
    const htmlPath = join(__dirname, "..", `export-${format}-${timestamp}.html`);
    await writeFile(htmlPath, html);
    
    return { 
      filePath: htmlPath
    };
  }

  private createExportHTML(svg: string, format: string, scale: number, quality: number, crop?: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>SVG Export - ${format.toUpperCase()}</title>
  <style>
    body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
    #canvas { border: 1px solid #ccc; background: white; }
    #controls { margin-bottom: 20px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    button { padding: 10px 20px; margin: 5px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #005a87; }
    .info { background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div id="controls">
    <h2>SVG Export Tool</h2>
    <button onclick="exportImage()">Export as ${format.toUpperCase()}</button>
    <div class="info">
      <strong>Export Settings:</strong><br>
      Format: ${format.toUpperCase()}<br>
      Scale: ${scale}x<br>
      Quality: ${(quality * 100).toFixed(0)}%<br>
      ${crop ? `Crop: ${crop.x}, ${crop.y}, ${crop.width}×${crop.height}` : 'No cropping'}
    </div>
    <div class="info">
      <strong>Instructions:</strong><br>
      1. Click the export button above<br>
      2. The image will download automatically<br>
      3. Check your Downloads folder for the exported file
    </div>
  </div>
  
  <div id="svg-container">
    ${svg}
  </div>
  
  <canvas id="canvas" style="display: none;"></canvas>
  
  <script>
    function exportImage() {
      const svgElement = document.querySelector('svg');
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!svgElement) {
        alert('No SVG found to export');
        return;
      }
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = function() {
        const scale = ${scale};
        const originalWidth = svgElement.viewBox?.baseVal?.width || svgElement.clientWidth || 800;
        const originalHeight = svgElement.viewBox?.baseVal?.height || svgElement.clientHeight || 600;
        
        canvas.width = originalWidth * scale;
        canvas.height = originalHeight * scale;
        
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        ${crop ? `
        const cropX = ${crop.x};
        const cropY = ${crop.y}; 
        const cropWidth = ${crop.width};
        const cropHeight = ${crop.height};
        
        const cropData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        ctx.putImageData(cropData, 0, 0);
        ` : ''}
        
        canvas.toBlob(function(blob) {
          if (blob) {
            const link = document.createElement('a');
            link.download = 'exported-image.${format}';
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert('Image exported successfully!');
          } else {
            alert('Export failed. Please try again.');
          }
        }, 'image/${format}', ${quality});
        
        URL.revokeObjectURL(svgUrl);
      };
      
      img.onerror = function() {
        alert('Failed to load SVG for export');
        URL.revokeObjectURL(svgUrl);
      };
      
      img.src = svgUrl;
    }
  </script>
</body>
</html>`;
  }

  // Additional utility methods
  async bulkSelect(svg_content: string, selector: string): Promise<EditResult> {
    // Simple implementation - would need proper CSS selector parsing
    return { svg: svg_content };
  }

  async groupElements(svg_content: string, element_ids: string[]): Promise<EditResult> {
    // Create a group and wrap the specified elements
    const groupId = `group-${Date.now()}`;
    let updatedSVG = svg_content;
    
    // This would need proper XML parsing in production
    // For now, return unchanged
    return { svg: updatedSVG };
  }
}