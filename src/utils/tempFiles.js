const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// LOCAL_TEMP_DIR: where THIS process writes temp files on the local filesystem.
// Can be overridden via LOCAL_TEMP_DIR env var; defaults to <project-root>/temp.
const LOCAL_TEMP_DIR = process.env.LOCAL_TEMP_DIR
  ? path.resolve(process.env.LOCAL_TEMP_DIR)
  : path.resolve(__dirname, '../../temp');

// HOST_BASE_DIR: the path the Docker daemon uses when mounting temp dirs into
// sibling containers.  In Docker-in-Docker deployments this may differ from
// LOCAL_TEMP_DIR because the volume is mounted from the *host* filesystem.
//
// If HOST_BASE_DIR is a relative path (e.g. the default "./temp" set in
// docker-compose.yml) we resolve it to an absolute path so that volume-mount
// strings passed to `docker run -v` are unambiguous on any host OS.
//
// Defaults to LOCAL_TEMP_DIR when not set.
const rawHostBaseDir = process.env.HOST_BASE_DIR || LOCAL_TEMP_DIR;
const HOST_BASE_DIR = path.resolve(rawHostBaseDir);

async function initTempDir() {
  try {
    await fs.mkdir(LOCAL_TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create local temp dir', err);
  }
}
initTempDir();

/**
 * Creates a temporary directory for an execution request.
 * @returns {Promise<{uuid: string, localDir: string, hostDir: string}>}
 */
async function createTempDir() {
  const uuid = uuidv4();
  const localDir = path.resolve(path.join(LOCAL_TEMP_DIR, uuid));

  // Defense-in-depth: verify the resolved path is inside LOCAL_TEMP_DIR.
  // uuidv4() output is safe, but this guard protects against any future
  // change that might allow user-influenced path segments.
  if (!localDir.startsWith(LOCAL_TEMP_DIR + path.sep) && localDir !== LOCAL_TEMP_DIR) {
    throw new Error(`Path traversal detected: resolved temp path is outside base dir`);
  }

  // Construct the host-side path using the resolved HOST_BASE_DIR.
  // We normalise to forward slashes so the path is valid inside a Linux
  // container even when the judge is running on Windows.
  const hostDir = `${HOST_BASE_DIR}/${uuid}`.replace(/\\/g, '/');

  await fs.mkdir(localDir, { recursive: true });

  return { uuid, localDir, hostDir };
}

/**
 * Writes source code to a file inside the local temp directory.
 * @param {string} localDir 
 * @param {string} filename 
 * @param {string} sourceCode 
 */
async function writeSourceCode(localDir, filename, sourceCode) {
  const filePath = path.join(localDir, filename);
  await fs.writeFile(filePath, sourceCode, 'utf8');
}

/**
 * Removes the temporary directory.
 * @param {string} localDir 
 */
async function cleanupTempDir(localDir) {
  try {
    await fs.rm(localDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to cleanup temp dir ${localDir}`, err);
  }
}

module.exports = {
  createTempDir,
  writeSourceCode,
  cleanupTempDir
};
