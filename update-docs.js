const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const DOCS_DIR = path.join(process.cwd(), 'docs');
const ROOT_DIR = process.cwd();

// Get APK files to extract app names
function getAppNames() {
  const apkDir = path.join(ROOT_DIR, 'apk');
  if (!fs.existsSync(apkDir)) return [];

  const files = fs.readdirSync(apkDir);
  return files
    .filter(f => f.endsWith('.apk'))
    .map(f => f.replace('.apk', ''));
}

// Get all markdown files in a directory
function getMarkdownFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && item.endsWith('.md')) {
      files.push({
        name: item,
        path: fullPath,
        title: item.replace('.md', '').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
      });
    }
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

// Configure marked to preserve mermaid code blocks
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);

renderer.code = function(code, language) {
  if (language === 'mermaid') {
    return `<pre class="mermaid">${code}</pre>`;
  }
  return originalCodeRenderer(code, language);
};

// Generate HTML for a single markdown file
function renderMarkdownToHTML(content, title) {
  const htmlContent = marked(content, { renderer });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        header {
            background: #2c3e50;
            color: white;
            padding: 1.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        header h1 {
            font-size: 1.5rem;
            font-weight: 600;
        }
        .back-link {
            display: inline-block;
            margin-top: 0.5rem;
            color: #3498db;
            text-decoration: none;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        .content {
            padding: 2rem;
        }
        .content h1 {
            font-size: 2rem;
            color: #2c3e50;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #3498db;
        }
        .content h2 {
            font-size: 1.5rem;
            color: #2c3e50;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        .content h3 {
            font-size: 1.25rem;
            color: #34495e;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }
        .content p {
            margin-bottom: 1rem;
            color: #333;
        }
        .content ul, .content ol {
            margin-left: 2rem;
            margin-bottom: 1rem;
        }
        .content li {
            margin-bottom: 0.5rem;
        }
        .content code {
            background: #f4f4f4;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }
        .content pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            margin-bottom: 1rem;
        }
        .content pre code {
            background: transparent;
            padding: 0;
        }
        .content a {
            color: #3498db;
            text-decoration: none;
        }
        .content a:hover {
            text-decoration: underline;
        }
        .content img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 1rem 0;
        }
        .content blockquote {
            border-left: 4px solid #3498db;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #7f8c8d;
            font-style: italic;
        }
        .content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
        }
        .content th, .content td {
            border: 1px solid #ddd;
            padding: 0.75rem;
            text-align: left;
        }
        .content th {
            background: #f4f4f4;
            font-weight: 600;
        }
        .content .mermaid {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            text-align: center;
        }
    </style>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true });
    </script>
</head>
<body>
    <div class="container">
        <header>
            <h1>${title}</h1>
        </header>
        <div class="content">
            ${htmlContent}
        </div>
    </div>
</body>
</html>`;
}

// Generate index.html for an app documentation folder
function generateAppIndexHTML(appName, mdFiles) {
  let listHTML = '';
  for (const file of mdFiles) {
    const htmlFileName = file.name.replace('.md', '.html');
    listHTML += `                <li class="doc-item">
                    <a href="./${htmlFileName}" class="doc-link">
                        <span class="doc-icon">📄</span>
                        <span class="doc-title">${file.title}</span>
                    </a>
                </li>
`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        header {
            background: #2c3e50;
            color: white;
            padding: 1.5rem 2rem;
        }
        header h1 {
            font-size: 1.5rem;
            font-weight: 600;
        }
        .back-link {
            display: inline-block;
            margin-top: 0.5rem;
            color: #3498db;
            text-decoration: none;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        .content {
            padding: 2rem;
        }
        .doc-list {
            list-style: none;
        }
        .doc-item {
            margin-bottom: 0.75rem;
        }
        .doc-link {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s;
        }
        .doc-link:hover {
            background: #e9ecef;
            transform: translateX(4px);
        }
        .doc-icon {
            font-size: 1.5rem;
            margin-right: 1rem;
        }
        .doc-title {
            font-weight: 500;
            color: #2c3e50;
        }
        .apk-download {
            margin-top: 2rem;
            padding: 1rem;
            background: #e8f4fd;
            border-radius: 6px;
            text-align: center;
        }
        .apk-download a {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
        }
        .apk-download a:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${appName} Documentation</h1>
            <a href="../index.html" class="back-link">← Back to Repository</a>
        </header>
        <div class="content">
            <h2 style="color: #2c3e50; margin-bottom: 1rem;">Documentation Pages</h2>
            <ul class="doc-list">
${listHTML}
            </ul>
            <div class="apk-download">
                <p style="margin-bottom: 0.5rem; color: #7f8c8d;">Download Application</p>
                <a href="../apk/${appName}.apk">📦 Download ${appName}.apk</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Process all app documentation folders
function processDocs() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.log('ℹ️ No docs folder found.');
    return [];
  }

  const apps = [];

  // Get all subdirectories in docs/
  const items = fs.readdirSync(DOCS_DIR);
  for (const item of items) {
    const appDir = path.join(DOCS_DIR, item);
    const stat = fs.statSync(appDir);

    if (stat.isDirectory()) {
      const mdFiles = getMarkdownFiles(appDir);

      if (mdFiles.length > 0) {
        // Create individual HTML files for each markdown
        for (const mdFile of mdFiles) {
          const content = fs.readFileSync(mdFile.path, 'utf-8');
          const htmlFileName = mdFile.name.replace('.md', '.html');
          const htmlPath = path.join(appDir, htmlFileName);

          const html = renderMarkdownToHTML(content, `${item} - ${mdFile.title}`);
          fs.writeFileSync(htmlPath, html);
          console.log(`  ✓ Generated ${htmlFileName}`);
        }

        // Create index.html for the app
        const indexPath = path.join(appDir, 'index.html');
        const indexHTML = generateAppIndexHTML(item, mdFiles);
        fs.writeFileSync(indexPath, indexHTML);
        console.log(`  ✓ Generated index.html for ${item}`);

        apps.push({
          name: item,
          path: `./docs/${item}/index.html`,
          docCount: mdFiles.length
        });
      }
    }
  }

  return apps;
}

// Main function
function main() {
  console.log('📚 Processing documentation...');

  const apps = processDocs();

  if (apps.length > 0) {
    console.log(`\n✅ Processed ${apps.length} app(s):`);
    for (const app of apps) {
      console.log(`   - ${app.name} (${app.docCount} docs)`);
    }
  } else {
    console.log('ℹ️ No documentation found.');
  }

  // Return apps list for root index.html
  return apps;
}

// Export for use in update-index.js
module.exports = { main, getAppNames, getMarkdownFiles };

// Run if called directly
if (require.main === module) {
  main();
}
