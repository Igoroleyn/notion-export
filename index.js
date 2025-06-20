import fs from "fs-extra";
import axios from "axios";
import path from "path";
import { getAllPages, getBlockChildren } from "./notion-client.js";

const downloadsDir = "./downloads";

async function downloadImage(url, filename) {
  const filepath = path.join(downloadsDir, filename);
  const response = await axios.get(url, { responseType: "stream" });
  await new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on("finish", resolve)
      .on("error", reject);
  });
  return filepath;
}

async function run() {
  await fs.ensureDir(downloadsDir);

  const pages = await getAllPages();
  const output = [];

  for (const page of pages) {
    const pageId = page.id;
    const titleProp = page.properties["Token"] || page.properties["Name"];
    const title =
      titleProp?.title?.[0]?.plain_text || titleProp?.rich_text?.[0]?.plain_text || "Untitled";

    const blocks = await getBlockChildren(pageId);
    const images = [];

    for (const block of blocks) {
      if (
        block.type === "image" &&
        block.image.type === "file" &&
        block.image.file.url
      ) {
        const url = block.image.file.url;
        const filename = `${title.replace(/\s+/g, "_")}_${Date.now()}.png`;
        const localPath = await downloadImage(url, filename);
        images.push(localPath);
      }

      if (
        block.type === "image" &&
        block.image.type === "external"
      ) {
        images.push(block.image.external.url); // просто ссылка
      }
    }

    output.push({
      title,
      id: pageId,
      properties: page.properties,
      images,
    });

    console.log(`✅ Обработан: ${title} (${images.length} картинок)`);
  }

  await fs.writeJson("output.json", output, { spaces: 2 });
  console.log(`🎉 Завершено! Сохранено в output.json`);
}

run().catch((err) => console.error("Ошибка:", err));
