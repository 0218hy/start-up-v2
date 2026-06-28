const fs = require("fs");
const path = require("path");

const indexPath = path.join(process.cwd(), "dist", "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html was not found. Run expo export before this script.");
}

const html = fs.readFileSync(indexPath, "utf8");
const updatedHtml = html.replace(
  /<script(?![^>]*\btype=)([^>]*src="\/_expo\/static\/js\/web\/entry-[^"]+"[^>]*)><\/script>/,
  '<script type="module"$1></script>'
);

if (updatedHtml === html) {
  console.warn("No Expo web entry script tag was updated.");
} else {
  fs.writeFileSync(indexPath, updatedHtml);
}
