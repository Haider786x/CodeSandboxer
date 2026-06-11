const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure base temp directory exists relative to project root
const LOCAL_TEMP_DIR = path.resolve(__dirname, '../../temp');
// Used for docker -v mounting
const HOST_BASE_DIR = process.env.HOST_BASE_DIR || LOCAL_TEMP_DIR;

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
  const localDir = path.join(LOCAL_TEMP_DIR, uuid);
  // Construct the host path assuming HOST_BASE_DIR uses forward slashes or is properly formatted
  // path.join with HOST_BASE_DIR might mess up if mixing windows/linux. Let's just use string concat for safety, or posix.join
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
