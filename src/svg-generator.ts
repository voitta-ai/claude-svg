import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ResourceManager } from "./resource-manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DiagramParams {
  type: "aws" | "network" | "flowchart" | "architecture" | "database";
  description: string;
  style: "minimal" | "detailed" | "dark" | "light" | "professional";
  width: number;
  height: number;
}

export interface BannerParams {
  platform: "linkedin" | "twitter";
  title: string;
  subtitle?: string;
  theme: "tech" | "professional" | "creative" | "minimal";
  colors?: string[];
}

export interface GenerationResult {
  svg: string;
  htmlPath: string;
}

export class SVGGenerator {
  private templatePath: string;
  private resourceManager: ResourceManager;
  private projectGuidelines: string | null = null;

  constructor() {
    this.templatePath = join(__dirname, "..", "visualization-template.html");
    this.resourceManager = new ResourceManager();
  }

  async loadProjectGuidelines(): Promise<void> {
    try {
      const contextUri = new URL("claude://context/");
      const contextResult = await this.resourceManager.readResource(contextUri);
      this.projectGuidelines = contextResult.contents[0].text;
    } catch (error) {
      console.warn("Could not load CLAUDE.md guidelines:", error);
      this.projectGuidelines = null;
    }
  }

  async generateDiagram(params: DiagramParams): Promise<GenerationResult> {
    if (!this.projectGuidelines) {
      await this.loadProjectGuidelines();
    }
    
    const svg = await this.createDiagramSVG(params);
    const htmlPath = await this.createHTMLFile(svg, `${params.type}-diagram`);
    
    return { svg, htmlPath };
  }

  async generateBanner(params: BannerParams): Promise<GenerationResult> {
    if (!this.projectGuidelines) {
      await this.loadProjectGuidelines();
    }
    
    const svg = await this.createBannerSVG(params);
    const htmlPath = await this.createHTMLFile(svg, `${params.platform}-banner`);
    
    return { svg, htmlPath };
  }

  private async createDiagramSVG(params: DiagramParams): Promise<string> {
    const { type, description, style, width, height } = params;
    
    // Generate SVG based on type and description
    switch (type) {
      case "aws":
        return this.generateAWSDiagram(description, style, width, height);
      case "network":
        return this.generateNetworkDiagram(description, style, width, height);
      case "flowchart":
        return this.generateFlowchart(description, style, width, height);
      case "architecture":
        return this.generateArchitectureDiagram(description, style, width, height);
      case "database":
        return this.generateDatabaseDiagram(description, style, width, height);
      default:
        throw new Error(`Unsupported diagram type: ${type}`);
    }
  }

  private async createBannerSVG(params: BannerParams): Promise<string> {
    const dimensions = params.platform === "linkedin" 
      ? { width: 1584, height: 396 }
      : { width: 1500, height: 500 };

    return this.createBannerSVGContent(params, dimensions);
  }

  private generateAWSDiagram(description: string, style: string, width: number, height: number): string {
    const bgColor = style === "dark" ? "#0a0e27" : "#f8fafc";
    const textColor = style === "dark" ? "#ffffff" : "#1e293b";
    
    // Following CLAUDE.md guidelines: minimum 30px spacing, no overlapping elements, proper container sizing
    return `<svg id="visualization" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="awsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff9500"/>
          <stop offset="100%" style="stop-color:#ff6b35"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="${textColor}"/>
        </marker>
      </defs>
      
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      
      <!-- VPC Container with proper padding -->
      <rect x="80" y="80" width="${width - 160}" height="${height - 160}" 
            fill="none" stroke="#232f3e" stroke-width="2" stroke-dasharray="5,5" rx="10"/>
      <text x="100" y="110" fill="${textColor}" font-size="16" font-weight="bold">VPC</text>
      
      <!-- API Gateway - positioned with 30px spacing -->
      <rect x="150" y="180" width="140" height="100" fill="url(#awsGradient)" rx="8" filter="url(#shadow)"/>
      <text x="220" y="220" fill="white" font-size="14" text-anchor="middle">API</text>
      <text x="220" y="240" fill="white" font-size="14" text-anchor="middle">Gateway</text>
      
      <!-- Lambda Function - 30px spacing from API Gateway -->
      <rect x="320" y="180" width="140" height="100" fill="#ff9900" rx="8" filter="url(#shadow)"/>
      <text x="390" y="220" fill="white" font-size="14" text-anchor="middle">Lambda</text>
      <text x="390" y="240" fill="white" font-size="14" text-anchor="middle">Function</text>
      
      <!-- RDS Database - 30px spacing from Lambda -->
      <rect x="490" y="180" width="140" height="100" fill="#3498db" rx="8" filter="url(#shadow)"/>
      <text x="560" y="220" fill="white" font-size="14" text-anchor="middle">RDS</text>
      <text x="560" y="240" fill="white" font-size="14" text-anchor="middle">Database</text>
      
      <!-- Straight line connections following CLAUDE.md guidelines -->
      <line x1="290" y1="230" x2="320" y2="230" stroke="${textColor}" stroke-width="2" marker-end="url(#arrowhead)">
        <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="1s" repeatCount="indefinite"/>
      </line>
      <line x1="460" y1="230" x2="490" y2="230" stroke="${textColor}" stroke-width="2" marker-end="url(#arrowhead)">
        <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="1s" repeatCount="indefinite"/>
      </line>
      
      <!-- Title with proper spacing -->
      <text x="${width / 2}" y="40" fill="${textColor}" font-size="24" font-weight="bold" text-anchor="middle">
        AWS Architecture: ${description.slice(0, 30)}${description.length > 30 ? '...' : ''}
      </text>
    </svg>`;
  }

  private generateNetworkDiagram(description: string, style: string, width: number, height: number): string {
    const bgColor = style === "dark" ? "#0a0e27" : "#f8fafc";
    const textColor = style === "dark" ? "#ffffff" : "#1e293b";
    
    return `<svg id="visualization" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      
      <!-- Network nodes -->
      <circle cx="300" cy="200" r="40" fill="#4ade80" filter="url(#shadow)"/>
      <text x="300" y="205" fill="white" font-size="12" text-anchor="middle">Router</text>
      
      <circle cx="600" cy="200" r="40" fill="#60a5fa" filter="url(#shadow)"/>
      <text x="600" y="205" fill="white" font-size="12" text-anchor="middle">Switch</text>
      
      <circle cx="900" cy="200" r="40" fill="#f87171" filter="url(#shadow)"/>
      <text x="900" y="205" fill="white" font-size="12" text-anchor="middle">Server</text>
      
      <!-- Connections -->
      <line x1="340" y1="200" x2="560" y2="200" stroke="${textColor}" stroke-width="3"/>
      <line x1="640" y1="200" x2="860" y2="200" stroke="${textColor}" stroke-width="3"/>
      
      <text x="${width / 2}" y="50" fill="${textColor}" font-size="24" font-weight="bold" text-anchor="middle">
        Network Topology: ${description.slice(0, 30)}${description.length > 30 ? '...' : ''}
      </text>
    </svg>`;
  }

  private generateFlowchart(description: string, style: string, width: number, height: number): string {
    const bgColor = style === "dark" ? "#0a0e27" : "#f8fafc";
    const textColor = style === "dark" ? "#ffffff" : "#1e293b";
    
    return `<svg id="visualization" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      
      <!-- Start -->
      <ellipse cx="200" cy="150" rx="60" ry="30" fill="#10b981" filter="url(#shadow)"/>
      <text x="200" y="155" fill="white" font-size="12" text-anchor="middle">Start</text>
      
      <!-- Process -->
      <rect x="350" y="120" width="120" height="60" fill="#3b82f6" rx="8" filter="url(#shadow)"/>
      <text x="410" y="155" fill="white" font-size="12" text-anchor="middle">Process</text>
      
      <!-- Decision -->
      <polygon points="600,120 660,150 600,180 540,150" fill="#f59e0b" filter="url(#shadow)"/>
      <text x="600" y="155" fill="white" font-size="10" text-anchor="middle">Decision?</text>
      
      <!-- End -->
      <ellipse cx="800" cy="150" rx="60" ry="30" fill="#ef4444" filter="url(#shadow)"/>
      <text x="800" y="155" fill="white" font-size="12" text-anchor="middle">End</text>
      
      <!-- Arrows -->
      <line x1="260" y1="150" x2="350" y2="150" stroke="${textColor}" stroke-width="2" marker-end="url(#arrowhead)"/>
      <line x1="470" y1="150" x2="540" y2="150" stroke="${textColor}" stroke-width="2" marker-end="url(#arrowhead)"/>
      <line x1="660" y1="150" x2="740" y2="150" stroke="${textColor}" stroke-width="2" marker-end="url(#arrowhead)"/>
      
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="${textColor}"/>
        </marker>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <text x="${width / 2}" y="50" fill="${textColor}" font-size="24" font-weight="bold" text-anchor="middle">
        Flowchart: ${description.slice(0, 30)}${description.length > 30 ? '...' : ''}
      </text>
    </svg>`;
  }

  private generateArchitectureDiagram(description: string, style: string, width: number, height: number): string {
    return this.generateAWSDiagram(description, style, width, height); // Reuse AWS template for architecture
  }

  private generateDatabaseDiagram(description: string, style: string, width: number, height: number): string {
    const bgColor = style === "dark" ? "#0a0e27" : "#f8fafc";
    const textColor = style === "dark" ? "#ffffff" : "#1e293b";
    
    return `<svg id="visualization" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      
      <!-- Application Layer -->
      <rect x="200" y="100" width="800" height="100" fill="#3b82f6" rx="8" filter="url(#shadow)"/>
      <text x="600" y="155" fill="white" font-size="16" text-anchor="middle">Application Layer</text>
      
      <!-- Database Layer -->
      <rect x="200" y="250" width="200" height="100" fill="#10b981" rx="8" filter="url(#shadow)"/>
      <text x="300" y="305" fill="white" font-size="14" text-anchor="middle">Primary DB</text>
      
      <rect x="450" y="250" width="200" height="100" fill="#f59e0b" rx="8" filter="url(#shadow)"/>
      <text x="550" y="305" fill="white" font-size="14" text-anchor="middle">Cache</text>
      
      <rect x="700" y="250" width="200" height="100" fill="#ef4444" rx="8" filter="url(#shadow)"/>
      <text x="800" y="305" fill="white" font-size="14" text-anchor="middle">Replica DB</text>
      
      <!-- Connections -->
      <line x1="600" y1="200" x2="300" y2="250" stroke="${textColor}" stroke-width="2"/>
      <line x1="600" y1="200" x2="550" y2="250" stroke="${textColor}" stroke-width="2"/>
      <line x1="600" y1="200" x2="800" y2="250" stroke="${textColor}" stroke-width="2"/>
      
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <text x="${width / 2}" y="50" fill="${textColor}" font-size="24" font-weight="bold" text-anchor="middle">
        Database Architecture: ${description.slice(0, 25)}${description.length > 25 ? '...' : ''}
      </text>
    </svg>`;
  }

  private createBannerSVGContent(params: BannerParams, dimensions: { width: number; height: number }): string {
    const { title, subtitle, theme, colors } = params;
    const { width, height } = dimensions;
    
    const defaultColors = {
      tech: ["#0ea5e9", "#8b5cf6", "#06b6d4"],
      professional: ["#1e40af", "#059669", "#dc2626"],
      creative: ["#f59e0b", "#ec4899", "#8b5cf6"],
      minimal: ["#374151", "#6b7280", "#9ca3af"]
    };
    
    const themeColors = colors || defaultColors[theme];
    
    return `<svg id="visualization" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bannerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${themeColors[0]}"/>
          <stop offset="50%" style="stop-color:${themeColors[1]}"/>
          <stop offset="100%" style="stop-color:${themeColors[2]}"/>
        </linearGradient>
      </defs>
      
      <rect width="${width}" height="${height}" fill="url(#bannerGradient)"/>
      
      <!-- Content positioned right of profile picture area -->
      <text x="450" y="${height / 2 - 20}" fill="white" font-size="42" font-weight="bold">
        ${title}
      </text>
      
      ${subtitle ? `<text x="450" y="${height / 2 + 25}" fill="rgba(255,255,255,0.9)" font-size="24">
        ${subtitle}
      </text>` : ''}
      
      <!-- Tech decoration -->
      <circle cx="${width - 100}" cy="80" r="30" fill="rgba(255,255,255,0.1)"/>
      <circle cx="${width - 150}" cy="${height - 80}" r="20" fill="rgba(255,255,255,0.15)"/>
    </svg>`;
  }

  private async createHTMLFile(svg: string, filename: string): Promise<string> {
    try {
      const template = await readFile(this.templatePath, "utf-8");
      const html = template.replace(
        "<!-- CLAUDE WILL REPLACE THIS COMMENT WITH SVG -->",
        svg
      );
      
      const outputPath = join(__dirname, "..", `${filename}-${Date.now()}.html`);
      await writeFile(outputPath, html);
      
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to create HTML file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}