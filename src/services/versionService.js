import packageJson from '../../package.json';

// Fallback version info if version.json is not available
const fallbackVersion = {
  version: packageJson.version,
  buildNumber: 'dev',
  commitHash: 'unknown',
  commitHashShort: 'unknown',
  commitDate: new Date().toISOString(),
  commitMessage: 'Development build',
  buildDate: new Date().toISOString()
};

class VersionService {
  constructor() {
    this.versionInfo = fallbackVersion;
    this.loadVersionInfo();
  }

  async loadVersionInfo() {
    try {
      // Try to load version.json (generated by git hook)
      const response = await fetch('/version.json');
      if (response.ok) {
        this.versionInfo = await response.json();
      }
    } catch (error) {
      console.warn('Could not load version.json, using fallback version info');
    }
  }

  getVersion() {
    return this.versionInfo.version;
  }

  getFullVersionInfo() {
    return this.versionInfo;
  }

  getBuildNumber() {
    return this.versionInfo.buildNumber;
  }

  getCommitHash() {
    return this.versionInfo.commitHash;
  }

  getCommitHashShort() {
    return this.versionInfo.commitHashShort;
  }

  getCommitDate() {
    return this.versionInfo.commitDate;
  }

  getCommitMessage() {
    return this.versionInfo.commitMessage;
  }

  getBuildDate() {
    return this.versionInfo.buildDate;
  }

  getVersionString() {
    return `v${this.getVersion()} (Build ${this.getBuildNumber()})`;
  }

  getDetailedVersionString() {
    return `v${this.getVersion()} (Build ${this.getBuildNumber()}, Commit ${this.getCommitHashShort()})`;
  }
}

// Create singleton instance
const versionService = new VersionService();

export default versionService;