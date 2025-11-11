import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
const RooHero = () => {
    const [imagesBaseUri] = useState(() => {
        const w = window;
        return w.IMAGES_BASE_URI || "";
    });
    return (_jsx("div", { className: "flex flex-col items-center justify-center pb-4 forced-color-adjust-none", children: _jsx("div", { style: {
                backgroundColor: "var(--vscode-foreground)",
                WebkitMaskImage: `url('${imagesBaseUri}/roo-logo.svg')`,
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskSize: "contain",
                maskImage: `url('${imagesBaseUri}/roo-logo.svg')`,
                maskRepeat: "no-repeat",
                maskSize: "contain",
            }, className: "mx-auto", children: _jsx("img", { src: imagesBaseUri + "/roo-logo.svg", alt: "Roo logo", className: "h-8 opacity-0" }) }) }));
};
export default RooHero;
//# sourceMappingURL=RooHero.js.map