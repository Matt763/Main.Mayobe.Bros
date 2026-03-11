import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../data');

export async function readJSON<T>(filePath: string): Promise<T> {
  try {
    const fullPath = join(DATA_DIR, filePath);
    const data = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

export async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  try {
    const fullPath = join(DATA_DIR, filePath);
    await fs.mkdir(dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

export async function readPostsFromFolder(): Promise<any[]> {
  try {
    const postsDir = join(DATA_DIR, 'posts');
    const files = await fs.readdir(postsDir);
    const posts = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const content = await fs.readFile(join(postsDir, file), 'utf-8');
          return JSON.parse(content);
        })
    );
    return posts;
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

export async function readPagesFromFolder(): Promise<any[]> {
  try {
    const pagesDir = join(DATA_DIR, 'pages');
    const files = await fs.readdir(pagesDir);
    const pages = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const content = await fs.readFile(join(pagesDir, file), 'utf-8');
          return JSON.parse(content);
        })
    );
    return pages;
  } catch (error) {
    console.error('Error reading pages:', error);
    return [];
  }
}

export async function writePost(post: any): Promise<void> {
  const postsDir = join(DATA_DIR, 'posts');
  await fs.mkdir(postsDir, { recursive: true });
  const fileName = `${post.slug || post.id}.json`;
  await fs.writeFile(join(postsDir, fileName), JSON.stringify(post, null, 2), 'utf-8');
}

export async function writePage(page: any): Promise<void> {
  const pagesDir = join(DATA_DIR, 'pages');
  await fs.mkdir(pagesDir, { recursive: true });
  const fileName = `${page.slug || page.id}.json`;
  await fs.writeFile(join(pagesDir, fileName), JSON.stringify(page, null, 2), 'utf-8');
}

export async function deletePost(slug: string): Promise<void> {
  const postsDir = join(DATA_DIR, 'posts');
  const fileName = `${slug}.json`;
  await fs.unlink(join(postsDir, fileName));
}

export async function deletePage(slug: string): Promise<void> {
  const pagesDir = join(DATA_DIR, 'pages');
  const fileName = `${slug}.json`;
  await fs.unlink(join(pagesDir, fileName));
}
