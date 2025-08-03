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
    const path = uri.pathname;

    if (path.startsWith("/templates/")) {
      return await this.getTemplates();
    } else if (path.startsWith("/examples/")) {
      return await this.getExamples();
    } else if (path.startsWith("/context/")) {
      return await this.getProjectContext();
    } else {
      throw new Error(`Unknown resource path: ${path}`);
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
}