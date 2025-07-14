# Claude SVG Creator

Create stunning SVG visualizations instantly with Claude Code. Just describe what you want, and Claude generates professional graphics.

**⚡ Requires [Claude Code](https://claude.ai/code) - This workflow is designed specifically for Claude's AI coding assistant.**

## Examples

### LinkedIn Banner
![LinkedIn Banner Example](./examples/example-linkedin-banner.svg)

### Twitter/X Header
![Twitter Banner Example](./examples/example-twitter-banner.svg)

### Neural Network Visualization
![Neural Cosmos Visualization](./examples/example-neural-cosmos.svg)

## Creating Your Own

Simply ask Claude to create an SVG visualization:

```
"Create an SVG showing my AWS architecture with load balancers and databases"
```

```
"Make a LinkedIn banner for a machine learning engineer"
```

```
"Design a flowchart showing user authentication flow"
```

Claude will generate an SVG file and save it with a descriptive name.

## Getting Started with Claude Code

1. **Install Claude Code** from [claude.ai/code](https://claude.ai/code)
2. **Clone this repository** to your working directory
3. **Ask Claude** to create any visualization you need
4. **Find your SVG** in the project directory

## How It Works

The workflow includes:
- `visualization-template.html` - A reusable template with export controls
- `CLAUDE.md` - Instructions that help Claude create better visualizations
- `.gitignore` - Keeps your workspace clean

When you ask for a visualization, Claude:
1. Creates the SVG content
2. Uses the template for consistent export options
3. Saves everything with clear naming

## Tips for Best Results

- **Be specific** - "Create a network diagram showing 3 servers connected to a database"
- **Mention the purpose** - "for a LinkedIn post" or "for a presentation"
- **Request modifications** - "Make the colors more vibrant" or "Add animation"
- **Specify dimensions** - "1200x600 for a blog header"

## Troubleshooting

**Claude not creating visualizations?**
- Make sure you're using Claude Code (not regular Claude)
- Mention "SVG" or "visualization" in your request

**Can't find the file?**
- Check your current working directory
- Files are named descriptively (e.g., `aws-architecture.svg`)

**Need to export as PNG/JPEG?**
- Open the generated HTML file in a browser
- Use the export controls to download in any format

## Contributing

This workflow is designed for Claude Code users. Contributions welcome:
- Better templates
- More examples
- Documentation improvements

Submit issues and PRs on GitHub.

## License

MIT License - Free to use and modify

---

**Made for Claude Code** - The AI-powered way to create professional visualizations