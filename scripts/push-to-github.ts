import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'voyage-booking';
const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', '.cache', 'attached_assets', 'tmp', '.config', '.upm']);
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp', '.tiff', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.mp3', '.pdf', '.zip', '.gz', '.tar']);

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    const topLevel = relativePath.split(path.sep)[0];

    if (EXCLUDED_DIRS.has(topLevel)) continue;

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function isBinary(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

async function main() {
  console.log('Getting GitHub client...');
  const octokit = await getUncachableGitHubClient();

  console.log('Getting authenticated user...');
  const { data: user } = await octokit.rest.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);

  const owner = user.login;

  let repoExists = false;
  try {
    await octokit.rest.repos.get({ owner, repo: REPO_NAME });
    repoExists = true;
    console.log(`Repository ${REPO_NAME} already exists.`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Creating repository ${REPO_NAME}...`);
      await octokit.rest.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        auto_init: true,
        private: false,
      });
      console.log(`Repository ${REPO_NAME} created.`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw e;
    }
  }

  const projectDir = path.resolve(process.cwd());
  console.log(`Scanning project files in ${projectDir}...`);
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push.`);

  console.log('Creating blobs...');
  const BATCH_SIZE = 10;
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (filePath) => {
        const fullPath = path.join(projectDir, filePath);
        const binary = isBinary(filePath);
        let content: string;
        let encoding: 'utf-8' | 'base64';

        if (binary) {
          content = fs.readFileSync(fullPath).toString('base64');
          encoding = 'base64';
        } else {
          content = fs.readFileSync(fullPath, 'utf-8');
          encoding = 'utf-8';
        }

        const { data: blob } = await octokit.rest.git.createBlob({
          owner,
          repo: REPO_NAME,
          content,
          encoding,
        });

        return {
          path: filePath,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );
    treeItems.push(...results);
    console.log(`  Processed ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files`);
  }

  console.log('Creating tree...');
  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo: REPO_NAME,
    tree: treeItems,
  });

  let parentSha: string | undefined;
  try {
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo: REPO_NAME,
      ref: 'heads/main',
    });
    parentSha = ref.object.sha;
  } catch (e: any) {
    console.log('No existing main branch found, creating initial commit...');
  }

  console.log('Creating commit...');
  const commitParams: any = {
    owner,
    repo: REPO_NAME,
    message: 'Initial commit: push entire codebase',
    tree: tree.sha,
  };
  if (parentSha) {
    commitParams.parents = [parentSha];
  }
  const { data: commit } = await octokit.rest.git.createCommit(commitParams);

  if (parentSha) {
    console.log('Updating main branch...');
    await octokit.rest.git.updateRef({
      owner,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } else {
    console.log('Creating main branch...');
    try {
      await octokit.rest.git.createRef({
        owner,
        repo: REPO_NAME,
        ref: 'refs/heads/main',
        sha: commit.sha,
      });
    } catch {
      await octokit.rest.git.updateRef({
        owner,
        repo: REPO_NAME,
        ref: 'heads/main',
        sha: commit.sha,
        force: true,
      });
    }
  }

  console.log(`\nSuccessfully pushed to https://github.com/${owner}/${REPO_NAME}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
