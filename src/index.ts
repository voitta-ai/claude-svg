#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { SVGGenerator } from "./svg-generator.js";
import { SVGEditor } from "./svg-editor.js";
import { ResourceManager } from "./resource-manager.js";

class ClaudeSVGMCPServer {
  private server: Server;
  private svgGenerator: SVGGenerator;
  private svgEditor: SVGEditor;
  private resourceManager: ResourceManager;

  constructor() {
    this.server = new Server(
      {
        name: "claude-svg-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.svgGenerator = new SVGGenerator();
    this.svgEditor = new SVGEditor();
    this.resourceManager = new ResourceManager();

    this.setupHandlers();
    this.registerTools();
    this.registerResources();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "svg://templates/",
          name: "SVG Templates",
          description: "Available diagram templates",
          mimeType: "application/json",
        },
        {
          uri: "svg://examples/",
          name: "Example SVGs",
          description: "Browse example diagrams and visualizations",
          mimeType: "application/json",
        },
        {
          uri: "claude://context/",
          name: "Project Context",
          description: "CLAUDE.md project instructions and guidelines",
          mimeType: "text/markdown",
        },
        {
          uri: "html://visualization-template",
          name: "Visualization Template",
          description: "HTML template for creating and exporting visualizations",
          mimeType: "text/html",
        },
        {
          uri: "js://editor-modules",
          name: "Editor JavaScript Modules",
          description: "Interactive editing modules (undo, drag, bulk selection, etc.)",
          mimeType: "application/json",
        },
        {
          uri: "guide://workflow",
          name: "MCP Client Workflow Guide",
          description: "Complete guide for MCP clients on creating editable visualizations",
          mimeType: "text/markdown",
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = new URL(request.params.uri);
      return await this.resourceManager.readResource(uri);
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: "claude_context",
          description: "Project guidelines and instructions from CLAUDE.md",
        },
      ],
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name } = request.params;
      
      if (name === "claude_context") {
        // Read CLAUDE.md content
        const contextUri = new URL("claude://context/");
        const contextResult = await this.resourceManager.readResource(contextUri);
        
        return {
          messages: [
            {
              role: "system" as const,
              content: {
                type: "text" as const,
                text: contextResult.contents[0].text,
              },
            },
          ],
        };
      }
      
      throw new Error(`Unknown prompt: ${name}`);
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "generate_svg_diagram",
          description: "Generate SVG content only. IMPORTANT: MCP clients should use html://visualization-template resource to create final editable HTML files",
          inputSchema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["aws", "network", "flowchart", "architecture", "database"],
                description: "Type of diagram to generate",
              },
              description: {
                type: "string",
                description: "General description or title for the diagram",
              },
              components: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Component name" },
                    type: { type: "string", description: "Component type (e.g., 'Service', 'Database', 'CLI Tool')" },
                    description: { type: "string", description: "Optional component description" }
                  },
                  required: ["name", "type"]
                },
                description: "Array of components to include in the diagram"
              },
              connections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: { type: "string", description: "Source component name" },
                    to: { type: "string", description: "Target component name" },
                    label: { type: "string", description: "Optional connection label" }
                  },
                  required: ["from", "to"]
                },
                description: "Optional connections between components"
              },
              style: {
                type: "string",
                enum: ["minimal", "detailed", "dark", "light", "professional"],
                default: "professional",
                description: "Visual style for the diagram",
              },
              width: {
                type: "number",
                default: 1200,
                description: "SVG width in pixels",
              },
              height: {
                type: "number",
                default: 800,
                description: "SVG height in pixels",
              },
              animations: {
                type: "boolean",
                default: false,
                description: "Whether to include animated elements (flowing lines, etc.)",
              },
            },
            required: ["type"],
          },
        },
        {
          name: "generate_banner",
          description: "Create professional banners for LinkedIn or Twitter",
          inputSchema: {
            type: "object",
            properties: {
              platform: {
                type: "string",
                enum: ["linkedin", "twitter"],
                description: "Target platform (LinkedIn: 1584x396, Twitter: 1500x500)",
              },
              title: {
                type: "string",
                description: "Main title text",
              },
              subtitle: {
                type: "string",
                description: "Subtitle or tagline",
              },
              theme: {
                type: "string",
                enum: ["tech", "professional", "creative", "minimal"],
                default: "professional",
                description: "Visual theme",
              },
              colors: {
                type: "array",
                items: { type: "string" },
                description: "Custom color palette (hex codes)",
              },
            },
            required: ["platform", "title"],
          },
        },
        {
          name: "edit_svg_element",
          description: "Edit specific elements in an existing SVG",
          inputSchema: {
            type: "object",
            properties: {
              svg_content: {
                type: "string",
                description: "Current SVG content",
              },
              element_id: {
                type: "string",
                description: "ID of element to edit",
              },
              changes: {
                type: "object",
                properties: {
                  position: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" },
                    },
                  },
                  size: {
                    type: "object",
                    properties: {
                      width: { type: "number" },
                      height: { type: "number" },
                    },
                  },
                  style: {
                    type: "object",
                    additionalProperties: { type: "string" },
                  },
                  text: {
                    type: "string",
                  },
                },
                description: "Changes to apply to the element",
              },
            },
            required: ["svg_content", "element_id", "changes"],
          },
        },
        {
          name: "export_svg",
          description: "Export SVG to different formats with transformations",
          inputSchema: {
            type: "object",
            properties: {
              svg_content: {
                type: "string",
                description: "SVG content to export",
              },
              format: {
                type: "string",
                enum: ["png", "jpeg", "webp", "svg"],
                default: "png",
                description: "Export format",
              },
              scale: {
                type: "number",
                default: 1,
                minimum: 0.25,
                maximum: 4,
                description: "Scale factor (0.25-4x)",
              },
              quality: {
                type: "number",
                default: 0.9,
                minimum: 0.1,
                maximum: 1,
                description: "Quality for JPEG/WebP (0.1-1.0)",
              },
              crop: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" },
                },
                description: "Crop area (optional)",
              },
            },
            required: ["svg_content"],
          },
        },
        {
          name: "create_editable_visualization",
          description: "Create a complete HTML file with embedded SVG and editing controls (recommended for full workflow)",
          inputSchema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["aws", "network", "flowchart", "architecture", "database"],
                description: "Type of diagram to generate",
              },
              description: {
                type: "string",
                description: "General description or title for the diagram",
              },
              components: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Component name" },
                    type: { type: "string", description: "Component type (e.g., 'Service', 'Database', 'CLI Tool')" },
                    description: { type: "string", description: "Optional component description" }
                  },
                  required: ["name", "type"]
                },
                description: "Array of components to include in the diagram"
              },
              connections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: { type: "string", description: "Source component name" },
                    to: { type: "string", description: "Target component name" },
                    label: { type: "string", description: "Optional connection label" }
                  },
                  required: ["from", "to"]
                },
                description: "Optional connections between components"
              },
              style: {
                type: "string",
                enum: ["minimal", "detailed", "dark", "light", "professional"],
                default: "professional",
                description: "Visual style for the diagram",
              },
              width: {
                type: "number",
                default: 1200,
                description: "SVG width in pixels",
              },
              height: {
                type: "number",
                default: 800,
                description: "SVG height in pixels",
              },
              animations: {
                type: "boolean",
                default: false,
                description: "Whether to include animated elements (flowing lines, etc.)",
              },
              filename: {
                type: "string",
                description: "Custom filename for the HTML file (optional)",
              },
            },
            required: ["type"],
          },
        },
        {
          name: "get_project_context",
          description: "Get project guidelines and instructions from CLAUDE.md to use as system prompt",
          inputSchema: {
            type: "object",
            properties: {
              include_examples: {
                type: "boolean",
                default: false,
                description: "Include example files and templates in the response",
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "generate_svg_diagram":
            return await this.handleGeneratesvgDiagram(args);
          case "generate_banner":
            return await this.handleGenerateBanner(args);
          case "edit_svg_element":
            return await this.handleEditSVGElement(args);
          case "export_svg":
            return await this.handleExportSVG(args);
          case "create_editable_visualization":
            return await this.handleCreateEditableVisualization(args);
          case "get_project_context":
            return await this.handleGetProjectContext(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private registerTools() {
    // Tools are registered via the ListToolsRequestSchema handler
  }

  private registerResources() {
    // Resources are registered via the ListResourcesRequestSchema handler
  }

  private async handleGeneratesvgDiagram(args: any) {
    const schema = z.object({
      type: z.enum(["aws", "network", "flowchart", "architecture", "database"]),
      description: z.string().optional(),
      components: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional()
      })).optional(),
      connections: z.array(z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional()
      })).optional(),
      style: z.enum(["minimal", "detailed", "dark", "light", "professional"]).default("professional"),
      width: z.number().default(1200),
      height: z.number().default(800),
      animations: z.boolean().default(false),
    });

    const params = schema.parse(args);
    const result = await this.svgGenerator.generateDiagram(params);

    return {
      content: [
        {
          type: "text",
          text: `Generated ${params.type} diagram successfully!\n\nSVG Content:\n${result.svg}\n\nHTML File: ${result.htmlPath}`,
        },
      ],
    };
  }

  private async handleGenerateBanner(args: any) {
    const schema = z.object({
      platform: z.enum(["linkedin", "twitter"]),
      title: z.string(),
      subtitle: z.string().optional(),
      theme: z.enum(["tech", "professional", "creative", "minimal"]).default("professional"),
      colors: z.array(z.string()).optional(),
    });

    const params = schema.parse(args);
    const result = await this.svgGenerator.generateBanner(params);

    return {
      content: [
        {
          type: "text",
          text: `Generated ${params.platform} banner successfully!\n\nSVG Content:\n${result.svg}\n\nHTML File: ${result.htmlPath}`,
        },
      ],
    };
  }

  private async handleEditSVGElement(args: any) {
    const schema = z.object({
      svg_content: z.string(),
      element_id: z.string(),
      changes: z.object({
        position: z.object({
          x: z.number(),
          y: z.number(),
        }).optional(),
        size: z.object({
          width: z.number(),
          height: z.number(),
        }).optional(),
        style: z.record(z.string()).optional(),
        text: z.string().optional(),
      }),
    });

    const params = schema.parse(args);
    const result = await this.svgEditor.editElement(params);

    return {
      content: [
        {
          type: "text",
          text: `Element ${params.element_id} updated successfully!\n\nUpdated SVG:\n${result.svg}`,
        },
      ],
    };
  }

  private async handleExportSVG(args: any) {
    const schema = z.object({
      svg_content: z.string(),
      format: z.enum(["png", "jpeg", "webp", "svg"]).default("png"),
      scale: z.number().min(0.25).max(4).default(1),
      quality: z.number().min(0.1).max(1).default(0.9),
      crop: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }).optional(),
    });

    const params = schema.parse(args);
    const result = await this.svgEditor.exportSVG(params);

    return {
      content: [
        {
          type: "text",
          text: `SVG exported as ${params.format} successfully!\n\nExported file: ${result.filePath}`,
        },
      ],
    };
  }

  private async handleCreateEditableVisualization(args: any) {
    const schema = z.object({
      type: z.enum(["aws", "network", "flowchart", "architecture", "database"]),
      description: z.string().optional(),
      components: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional()
      })).optional(),
      connections: z.array(z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional()
      })).optional(),
      style: z.enum(["minimal", "detailed", "dark", "light", "professional"]).default("professional"),
      width: z.number().default(1200),
      height: z.number().default(800),
      animations: z.boolean().default(false),
      filename: z.string().optional(),
    });

    const params = schema.parse(args);
    const result = await this.svgGenerator.generateDiagram(params);
    
    // Get the template HTML to provide context
    const templateUri = new URL("html://visualization-template");
    const templateResult = await this.resourceManager.readResource(templateUri);
    const templateHtml = templateResult.contents[0].text;

    return {
      content: [
        {
          type: "text",
          text: `Created editable visualization successfully!

**HTML File Path:** ${result.htmlPath}

**Instructions:**
1. Open the file above in your browser
2. Use the export controls to save as PNG/JPEG/WebP  
3. Click "Edit SVG" to modify shapes and elements
4. The file includes interactive editing capabilities

**SVG Content:**
${result.svg}

**Template Features Available:**
- Export to multiple formats (PNG, JPEG, WebP)
- Resolution scaling (25% to 400%)
- Interactive cropping and rotation
- Built-in editor controls
- Print-ready exports

The HTML file contains the full editing template with all JavaScript modules for interactive editing.`,
        },
      ],
    };
  }

  private async handleGetProjectContext(args: any) {
    const schema = z.object({
      include_examples: z.boolean().default(false),
    });

    const params = schema.parse(args);
    
    // Get CLAUDE.md content
    const contextUri = new URL("claude://context/");
    const contextResult = await this.resourceManager.readResource(contextUri);
    
    let response = "# Project Context and Guidelines\n\n";
    response += contextResult.contents[0].text;
    
    if (params.include_examples) {
      // Get templates
      const templatesUri = new URL("svg://templates/");
      const templatesResult = await this.resourceManager.readResource(templatesUri);
      
      response += "\n\n# Available Templates\n\n";
      response += templatesResult.contents[0].text;
      
      // Get examples
      const examplesUri = new URL("svg://examples/");
      const examplesResult = await this.resourceManager.readResource(examplesUri);
      
      response += "\n\n# Example Files\n\n";
      response += examplesResult.contents[0].text;
    }

    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Error handling
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}

// Run the server when executed directly
const server = new ClaudeSVGMCPServer();
server.run().catch((error) => {
  console.error("Server failed:", error);
  process.exit(1);
});