const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.resolve(
    __dirname,
    "..",
    "DOCS/project_structure/netsa_mobile_structure.md"
);

function generateTree(dir, prefix = "") {
    const files = fs
        .readdirSync(dir)
        .filter(f => !["node_modules", ".git", "dist", ".expo"].includes(f));

    let tree = "";

    files.forEach((file, index) => {
        const filePath = path.join(dir, file);
        const isLast = index === files.length - 1;
        const connector = isLast ? "└── " : "├── ";

        tree += `${prefix}${connector}${file}\n`;

        if (fs.statSync(filePath).isDirectory()) {
            tree += generateTree(
                filePath,
                prefix + (isLast ? "    " : "│   ")
            );
        }
    });

    return tree;
}

const structure = generateTree(ROOT_DIR);

const content = `# NETSA Mobile Structure (Auto Generated)

> ⚠️ This file is auto-generated. Do not edit manually.

\`\`\`
${structure}
\`\`\`
`;

fs.writeFileSync(OUTPUT_FILE, content);

console.log("✅ Project structure updated.");