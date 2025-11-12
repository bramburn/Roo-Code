import * as fs from "fs";
import * as path from "path";

interface SplitOptions {
  filePath: string;
  parts: number;
}

function parseArgs(): SplitOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: npx ts-node scripts/split-file-by-tags.ts <filePath> [parts]");
    console.error("Example: npx ts-node scripts/split-file-by-tags.ts C:\\dev\\Roo-Code\\repomix-output-ts.md 4");
    process.exit(1);
  }

  const filePath = args[0];
  const parts = args[1] ? parseInt(args[1], 10) : 4;

  if (isNaN(parts) || parts < 1) {
    console.error("Error: parts must be a positive integer");
    process.exit(1);
  }

  return { filePath, parts };
}

function findFileClosingTags(content: string): number[] {
  const tagPositions: number[] = [];
  const tag = "</file>";
  let index = 0;

  while ((index = content.indexOf(tag, index)) !== -1) {
    tagPositions.push(index + tag.length);
    index += tag.length;
  }

  return tagPositions;
}

function splitFile(options: SplitOptions): void {
  const { filePath, parts } = options;

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const totalLines = content.split("\n").length;
  const tagPositions = findFileClosingTags(content);

  if (tagPositions.length === 0) {
    console.error("Error: No </file> tags found in the file");
    process.exit(1);
  }

  console.log(`File: ${filePath}`);
  console.log(`Total lines: ${totalLines}`);
  console.log(`Total </file> tags found: ${tagPositions.length}`);
  console.log(`Splitting into ${parts} parts`);

  const chunkSize = Math.ceil(content.length / parts);
  const splitPoints: number[] = [];

  for (let i = 1; i < parts; i++) {
    const targetPosition = chunkSize * i;
    let closestTag = 0;
    let minDistance = Infinity;

    for (const tagPos of tagPositions) {
      const distance = Math.abs(tagPos - targetPosition);
      if (distance < minDistance) {
        minDistance = distance;
        closestTag = tagPos;
      }
    }

    if (!splitPoints.includes(closestTag)) {
      splitPoints.push(closestTag);
    }
  }

  splitPoints.sort((a, b) => a - b);

  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);

  let previousIndex = 0;

  for (let i = 0; i < splitPoints.length; i++) {
    const splitPoint = splitPoints[i];
    const chunk = content.substring(previousIndex, splitPoint);
    const outputFileName = `${baseName}-split-${i + 1}${ext}`;
    const outputPath = path.join(dirName, outputFileName);

    fs.writeFileSync(outputPath, chunk, "utf-8");
    console.log(`Created: ${outputPath} (${chunk.length} bytes)`);

    previousIndex = splitPoint;
  }

  // Write the final chunk
  const finalChunk = content.substring(previousIndex);
  const finalFileName = `${baseName}-split-${splitPoints.length + 1}${ext}`;
  const finalPath = path.join(dirName, finalFileName);
  fs.writeFileSync(finalPath, finalChunk, "utf-8");
  console.log(`Created: ${finalPath} (${finalChunk.length} bytes)`);

  console.log(`\nSplit complete! Created ${splitPoints.length + 1} files.`);
}

const options = parseArgs();
splitFile(options);

