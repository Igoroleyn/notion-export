import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

export const notion = new Client({ auth: process.env.NOTION_API_KEY });
export const databaseId = process.env.DATABASE_ID;

export async function getAllPages() {
  const pages = [];
  let cursor = undefined;

  while (true) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });

    pages.push(...response.results);
    if (!response.has_more) break;
    cursor = response.next_cursor;
  }

  return pages;
}

export async function getBlockChildren(pageId) {
  const blocks = [];
  let cursor;

  while (true) {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });

    blocks.push(...res.results);
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return blocks;
}
