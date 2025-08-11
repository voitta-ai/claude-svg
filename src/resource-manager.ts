import { readFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ResourceManager {
  private projectRoot: string;

  constructor() {
    this.projectRoot = join(__dirname, "..");
  }

  async readResource(uri: URL): Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }> {
    // Get the full href to handle different protocols
    const fullUri = uri.href;
    const path = uri.pathname;

    // Handle different URI schemes
    if (fullUri.startsWith("svg://templates")) {
      return await this.getTemplates();
    } else if (fullUri.startsWith("svg://examples")) {
      return await this.getExamples();
    } else if (fullUri.startsWith("claude://context")) {
      return await this.getProjectContext();
    } else if (fullUri.startsWith("html://visualization-template")) {
      return await this.getVisualizationTemplate();
    } else if (fullUri.startsWith("js://editor-modules")) {
      return await this.getEditorModules();
    } else if (fullUri.startsWith("guide://workflow")) {
      return await this.getWorkflowGuide();
    } else if (path.startsWith("/templates/")) {
      return await this.getTemplates();
    } else if (path.startsWith("/examples/")) {
      return await this.getExamples();
    } else if (path.startsWith("/context/")) {
      return await this.getProjectContext();
    } else if (path.startsWith("/visualization-template")) {
      return await this.getVisualizationTemplate();
    } else {
      throw new Error(`Unknown resource path: ${path} (full URI: ${fullUri})`);
    }
  }

  private async getTemplates(): Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }> {
    const templates = [
      {
        name: "AWS Architecture",
        type: "aws",
        description: "Cloud architecture with VPC, subnets, and services",
        components: ["VPC", "API Gateway", "Lambda", "RDS", "S3"]
      },
      {
        name: "Network Topology",
        type: "network", 
        description: "Network infrastructure with routers, switches, and servers",
        components: ["Router", "Switch", "Server", "Firewall"]
      },
      {
        name: "Process Flowchart",
        type: "flowchart",
        description: "Decision-based process flow with start/end points",
        components: ["Start/End", "Process", "Decision", "Connector"]
      },
      {
        name: "System Architecture",
        type: "architecture",
        description: "High-level system design and component relationships",
        components: ["Frontend", "Backend", "Database", "Cache"]
      },
      {
        name: "Database Schema",
        type: "database",
        description: "Database structure with tables and relationships",
        components: ["Tables", "Relationships", "Indexes", "Views"]
      }
    ];

    return {
      contents: [{
        uri: "svg://templates/",
        text: JSON.stringify(templates, null, 2),
        mimeType: "application/json"
      }]
    };
  }

  private async getExamples(): Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }> {
    try {
      const examplesDir = join(this.projectRoot, "examples");
      const files = await readdir(examplesDir);
      const svgFiles = files.filter(file => file.endsWith('.svg'));
      
      const examples = [];
      
      for (const file of svgFiles) {
        try {
          const content = await readFile(join(examplesDir, file), 'utf-8');
          examples.push({
            name: file.replace('.svg', '').replace(/-/g, ' '),
            filename: file,
            preview: content.substring(0, 500) + '...',
            size: content.length
          });
        } catch (error) {
          // Skip files that can't be read
          console.error(`Could not read ${file}:`, error);
        }
      }

      return {
        contents: [{
          uri: "svg://examples/",
          text: JSON.stringify(examples, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: "svg://examples/",
          text: JSON.stringify({ error: "Could not load examples" }, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  }

  async getExampleContent(filename: string): Promise<string> {
    const filePath = join(this.projectRoot, "examples", filename);
    return await readFile(filePath, 'utf-8');
  }

  async getTemplateHTML(): Promise<string> {
    const templatePath = join(this.projectRoot, "visualization-template.html");
    return await readFile(templatePath, 'utf-8');
  }

  async getProjectFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.projectRoot);
      return files.filter(file => 
        file.endsWith('.html') || 
        file.endsWith('.svg') || 
        file.endsWith('.json')
      );
    } catch (error) {
      return [];
    }
  }

  private async getProjectContext(): Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }> {
    try {
      const claudeMdPath = join(this.projectRoot, "CLAUDE.md");
      const content = await readFile(claudeMdPath, 'utf-8');
      
      return {
        contents: [{
          uri: "claude://context/",
          text: content,
          mimeType: "text/markdown"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: "claude://context/",
          text: "# Project Context\n\nCLAUDE.md file not found or could not be read.\n\nError: " + (error instanceof Error ? error.message : String(error)),
          mimeType: "text/markdown"
        }]
      };
    }
  }

  private async getVisualizationTemplate(): Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }> {
    try {
      const templatePath = join(this.projectRoot, "visualization-template.html");
      const content = await readFile(templatePath, 'utf-8');
      
      return {
        contents: [{
          uri: "html://visualization-template",
          text: content,
          mimeType: "text/html"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: "html://visualization-template",
          text: `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
<h1>Template Not Found</h1>
<p>visualization-template.html file not found or could not be read.</p>
<p>Error: ${error instanceof Error ? error.message : String(error)}</p>
</body>
</html>`,
          mimeType: "text/html"
        }]
      };
    }
  }

  private async getEditorModules(): Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }> {
    try {
      const jsDir = join(this.projectRoot, "js");
      const files = await readdir(jsDir);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      
      const modules: { [key: string]: any } = {};
      
      for (const file of jsFiles) {
        try {
          const content = await readFile(join(jsDir, file), 'utf-8');
          modules[file.replace('.js', '')] = {
            filename: file,
            description: this.getModuleDescription(file),
            content: content,
            size: content.length
          };
        } catch (error) {
          console.error(`Could not read ${file}:`, error);
        }
      }

      return {
        contents: [{
          uri: "js://editor-modules",
          text: JSON.stringify({
            description: "Interactive SVG editing modules for the visualization template",
            modules,
            usage: "These modules provide drag-and-drop, undo/redo, bulk selection, and editing capabilities when loaded in the HTML template"
          }, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: "js://editor-modules",
          text: JSON.stringify({ 
            error: "Could not load JavaScript modules",
            details: error instanceof Error ? error.message : String(error)
          }, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  }

  private getModuleDescription(filename: string): string {
    const descriptions: { [key: string]: string } = {
      'undo-system.js': 'Complete undo/redo system with Ctrl+Z/Ctrl+Y keyboard shortcuts',
      'drag-handler.js': 'Drag and drop functionality for all SVG elements',
      'svg-utils.js': 'Utility functions for SVG manipulation and path handling',
      'bulk-selection.js': 'Multi-select and group operations',
      'group-selection.js': 'Group selection and manipulation tools',
      'smart-move.js': 'Smart movement with snapping and alignment guides'
    };
    
    return descriptions[filename] || 'SVG editing functionality module';
  }

  private async getWorkflowGuide(): Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }> {
    const guide = `# MCP Client Workflow Guide

## Creating Editable Visualizations

### Quick Start for MCP Clients

1. **Get the Template**: Use \`html://visualization-template\` resource
2. **Generate SVG**: Use \`generate_svg_diagram\` tool for SVG content
3. **Combine**: Replace \`<!-- CLAUDE WILL REPLACE THIS COMMENT WITH SVG -->\` in template with generated SVG
4. **Save**: Write the combined HTML file where needed

### Example Workflow

\`\`\`javascript
// 1. Get template
const templateResponse = await readResource("html://visualization-template");
const template = templateResponse.contents[0].text;

// 2. Generate SVG
const svgResponse = await callTool("generate_svg_diagram", {
  type: "architecture",
  description: "Visitor List Service Architecture",
  components: [
    { name: "VisitorListServiceCli", type: "CLI Tool" },
    { name: "PersonListDaemon", type: "SQS Consumer" },
    { name: "Memcached Cluster", type: "Cache" },
    { name: "S3 Buckets", type: "Storage" }
  ],
  connections: [
    { from: "VisitorListServiceCli", to: "S3 Buckets", label: "uploads" },
    { from: "PersonListDaemon", to: "Memcached Cluster", label: "caches" }
  ]
});
const svgContent = extractSVGFromResponse(svgResponse);

// 3. Combine
const finalHTML = template.replace(
  "<!-- CLAUDE WILL REPLACE THIS COMMENT WITH SVG -->",
  svgContent
);

// 4. Save to desired location
writeFile("/path/to/your/architecture.html", finalHTML);
\`\`\`

### Key Benefits

- **Full Editing**: Template includes all JavaScript modules inline
- **Self-Contained**: No external dependencies
- **Interactive**: Drag/drop, undo/redo, selection
- **Export Ready**: PNG, JPEG, WebP export with scaling and cropping

### Template Features

- **SVG Editing**: Click \"Edit in SVG Editor\" button
- **Export Controls**: Multiple formats and resolutions
- **Interactive Features**: Crop, rotate, scale
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+S (download)

### Troubleshooting

- **Missing Editing**: Ensure you used the \`html://visualization-template\` resource
- **Wrong Content**: Check SVG generation matches your description
- **File Location**: Save the complete HTML file where you need it

### Advanced Usage

The template is self-contained with these inline modules:
- SVGUtils class (bounds calculation, path manipulation)
- UndoSystem class (50-step history with keyboard shortcuts)
- DragHandler class (mouse interaction and element movement)
- Export system (multiple formats with transformations)

### Notes for Developers

- The template is ~45KB with all modules inline
- Works in any modern browser
- No external JavaScript dependencies
- Fully responsive design
`;

    return {
      contents: [{
        uri: "guide://workflow",
        text: guide,
        mimeType: "text/markdown"
      }]
    };
  }
}