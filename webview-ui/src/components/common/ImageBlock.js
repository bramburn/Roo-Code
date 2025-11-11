import { jsx as _jsx } from "react/jsx-runtime";
import { ImageViewer } from "./ImageViewer";
export default function ImageBlock({ imageUri, imagePath, imageData, path }) {
    // Determine which props to use based on what's provided
    let finalImageUri;
    let finalImagePath;
    if (imageUri) {
        // New format: explicit imageUri and imagePath
        finalImageUri = imageUri;
        finalImagePath = imagePath;
    }
    else if (imageData) {
        // Legacy format: use imageData as direct URI (for Mermaid diagrams)
        finalImageUri = imageData;
        finalImagePath = path;
    }
    else {
        // No valid image data provided
        console.error("ImageBlock: No valid image data provided");
        return null;
    }
    return (_jsx("div", { className: "my-2", children: _jsx(ImageViewer, { imageUri: finalImageUri, imagePath: finalImagePath, alt: "AI Generated Image", showControls: true }) }));
}
//# sourceMappingURL=ImageBlock.js.map