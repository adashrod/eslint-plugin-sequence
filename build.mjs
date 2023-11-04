import fs from "fs";

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
            const fullFileName = `${dirName}/${fileName}`;
            const stats = fs.statSync(fullFileName);
            if (stats.isDirectory()) {
                copyDir(fullFileName);
            } else {
                copyFile(fullFileName);
            }
        });
    });
}

fs.rmSync(`${distDir}/tests`, { recursive: true, force: true });

copyDir(`${srcPrefix}docs`);
copyFile("package.json");
copyFile("README.md");
copyFile("LICENSE");
