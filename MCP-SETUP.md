# Claude SVG Editor MCP Server

Transform the Claude SVG Editor into a powerful MCP server that can be used with Claude Desktop, Cursor, and any MCP-compatible tool.

## Features

### Tools Available
- **`generate_svg_diagram`** - Create AWS architecture, network topology, flowcharts, and system diagrams
- **`generate_banner`** - Generate LinkedIn (1584×396) and Twitter (1500×500) banners
- **`edit_svg_element`** - Modify existing SVG elements (position, size, style, text)
- **`export_svg`** - Export SVGs to PNG, JPEG, WebP with scaling and cropping

### Resources Available
- **`svg://templates/`** - Browse available diagram templates and components
- **`svg://examples/`** - Access example SVGs from the project

## Quick Setup

### 1. Install Dependencies
```bash
npm install
npm run build
```

### 2. Configure Claude Desktop

Add this to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json`)


```json
{
  "mcpServers": {
    "claude-svg-editor": {
      "command": "node",
      "args": [
        "/absolute/path/to/claude-svg/build/index.js"
      ]
    }
  }
}
```

### 3. Restart Claude Desktop

The MCP server will now be available in Claude Desktop with a 🔧 tool icon.

## Usage Examples

### Generate an AWS Architecture Diagram
```json
{
  "tool": "generate_svg_diagram",
  "parameters": {
    "type": "aws",
    "description": "API Gateway connecting to Lambda functions and RDS database in a VPC",
    "style": "professional",
    "width": 1200,
    "height": 800
  }
}
```

### Create a LinkedIn Banner
```json
{
  "tool": "generate_banner", 
  "parameters": {
    "platform": "linkedin",
    "title": "DevOps Engineer",
    "subtitle": "Scaling teams, automating everything",
    "theme": "tech",
    "colors": ["#0ea5e9", "#8b5cf6", "#06b6d4"]
  }
}
```

### Edit an SVG Element
```json
{
  "tool": "edit_svg_element",
  "parameters": {
    "svg_content": "<svg>...</svg>",
    "element_id": "api-gateway",
    "changes": {
      "position": { "x": 300, "y": 200 },
      "size": { "width": 150, "height": 100 },
      "style": { "fill": "#ff6b35" }
    }
  }
}
```

### Export SVG to PNG
```json
{
  "tool": "export_svg",
  "parameters": {
    "svg_content": "<svg>...</svg>",
    "format": "png",
    "scale": 2,
    "quality": 0.9
  }
}
```

## Integration with Other Tools

### Cursor IDE
Install the MCP extension and add the server configuration to your workspace.

### VS Code with Continue
Add the MCP server to your Continue configuration.

### Other MCP Clients
Any tool supporting the Model Context Protocol can connect to this server using stdio transport.

## Development

### Project Structure
```
src/
├── index.ts           # Main MCP server entry point
├── svg-generator.ts   # SVG generation logic
├── svg-editor.ts      # SVG editing and export functionality
└── resource-manager.ts # Resource and template management
```

### Adding New Diagram Types
1. Add the new type to the enum in `svg-generator.ts`
2. Implement the generation logic
3. Update the tool schema in `index.ts`

### Testing
```bash
# Build the server
npm run build

# Test with stdio (for debugging)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

## Architecture

The MCP server exposes the Claude SVG Editor's capabilities through standardized MCP tools and resources:

- **Tools** perform active operations (generate, edit, export)
- **Resources** provide access to templates and examples
- **STDIO Transport** enables communication with MCP clients

All generated files include the interactive HTML template with export controls, maintaining the full functionality of the original editor.

## Troubleshooting

### Server Not Appearing in Claude Desktop
1. Check the absolute path in the configuration
2. Ensure the build completed successfully
3. Restart Claude Desktop completely
4. Check the console for error messages

### Export Functionality
- SVG exports work directly
- PNG/JPEG/WebP exports create interactive HTML files
- Open the HTML file in a browser to complete the export

### Performance
- The server loads quickly using stdio transport
- SVG generation is optimized for common diagram types
- Large diagrams may take a few seconds to generate

## Contributing

This MCP server bridges the Claude SVG Editor with the broader MCP ecosystem. Contributions welcome for:

- New diagram types and templates
- Enhanced editing capabilities  
- Performance optimizations
- Additional export formats

## License

MIT License - Free to use and modify