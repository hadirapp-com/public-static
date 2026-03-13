const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  ignoreDirs: ['.git', 'node_modules'],
  fileTypes: {
    'APK Files': ['.apk'],
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'],
    'Documents': ['.pdf', '.doc', '.docx', '.txt', '.md'],
    'Videos': ['.mp4', '.webm', '.mov', '.avi'],
    'Audio': ['.mp3', '.wav', '.ogg'],
    'Archives': ['.zip', '.rar', '.tar', '.gz'],
    'Other': []
  },
  icons: {
    'APK Files': '📦',
    'Images': '🖼️',
    'Documents': '📄',
    'Videos': '🎬',
    'Audio': '🎵',
    'Archives': '📁',
    'Other': '📄'
  }
};

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!CONFIG.ignoreDirs.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function categorizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  for (const [category, extensions] of Object.entries(CONFIG.fileTypes)) {
    if (category === 'Other') continue;
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'Other';
}

function getRelativePath(filePath) {
  return './' + path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function generateIndexHTML() {
  const files = getAllFiles(process.cwd());
  const categorized = {};

  // Initialize categories
  for (const category of Object.keys(CONFIG.fileTypes)) {
    categorized[category] = [];
  }

  // Categorize files
  for (const file of files) {
    const category = categorizeFile(file);
    const relativePath = getRelativePath(file);
    const fileName = path.basename(file);
    const ext = path.extname(file).toLowerCase();

    categorized[category].push({
      name: fileName,
      path: relativePath,
      ext: ext
    });
  }

  // Generate HTML sections
  let sectionsHTML = '';

  for (const [category, fileList] of Object.entries(categorized)) {
    if (fileList.length === 0) continue;

    const icon = CONFIG.icons[category];

    sectionsHTML += `            <section class="section">
                <h2>${category}</h2>
                <ul class="file-list">
`;
    for (const file of fileList) {
      sectionsHTML += `                    <li class="file-item">
                        <span class="file-icon">${icon}</span>
                        <div class="file-info">
                            <div class="file-name"><a href="${file.path}" class="file-link">${file.name}</a></div>
                            <div class="file-type">${file.ext.substring(1).toUpperCase()} File</div>
                        </div>
                    </li>
`;
    }

    sectionsHTML += `                </ul>
            </section>
`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repository Index</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f5;
            padding: 2rem;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
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
        .content {
            padding: 2rem;
        }
        .section {
            margin-bottom: 2rem;
        }
        .section h2 {
            font-size: 1.2rem;
            color: #2c3e50;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #3498db;
        }
        .file-list {
            list-style: none;
        }
        .file-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 0.5rem;
            transition: background 0.2s;
        }
        .file-item:hover {
            background: #e9ecef;
        }
        .file-icon {
            margin-right: 1rem;
            font-size: 1.5rem;
        }
        .file-info {
            flex: 1;
        }
        .file-name {
            font-weight: 500;
            color: #2c3e50;
        }
        .file-link {
            color: #3498db;
            text-decoration: none;
        }
        .file-link:hover {
            text-decoration: underline;
        }
        .file-type {
            font-size: 0.85rem;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Repository Index</h1>
        </header>
        <div class="content">
${sectionsHTML}
        </div>
    </div>
</body>
</html>`;

  return html;
}

function gitCommit(message) {
  try {
    console.log('📝 Adding files to git...');
    execSync('git add index.html', { stdio: 'inherit' });

    console.log('💾 Creating commit...');
    execSync(`git commit -m "${message}"`, {
      stdio: 'inherit',
      env: { ...process.env, GIT_AUTHOR_NAME: 'Claude Sonnet 4.5', GIT_COMMITTER_NAME: 'Claude Sonnet 4.5' }
    });

    console.log('✅ Commit created successfully!');
  } catch (error) {
    if (error.message.includes('nothing to commit')) {
      console.log('ℹ️ No changes to commit.');
    } else {
      console.error('❌ Git error:', error.message);
    }
  }
}

function main() {
  console.log('🔍 Scanning files...');

  const html = generateIndexHTML();
  fs.writeFileSync('index.html', html);

  console.log('✅ index.html updated!');

  // Commit changes
  gitCommit('update index.html - auto-generated');

  console.log('\n🎉 Done!');
}

main();
