import * as fs from "fs";

const distDir = "dist";
const srcPrefix = "src/";

function truncateSrc(path) {
    return path.startsWith(srcPrefix) ? path.slice(srcPrefix.length) : path;
}

function copyFile(fileName) {
    fs.copyFileSync(fileName, `${distDir}/${truncateSrc(fileName)}`);
}

function copyDir(dirName) {
    const dest = truncateSrc(dirName);
    fs.mkdirSync(`${distDir}/${dest}`, { recursive: true });
    fs.readdir(dirName, {}, (err, files) => {
        if (err) {
            console.error(err);
        }
        files.forEach((fileName) => {
            copyFile(`${dirName}/${fileName}`);
        });
    });
}

fs.rmdirSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir);

copyFile("package.json");
copyFile("README.md");
copyFile("LICENSE");
copyFile("src/index.js");
copyDir("src/lib/rules");
