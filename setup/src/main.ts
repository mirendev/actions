import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import * as crypto from "crypto";
import * as fs from "fs";

interface Artifact {
  name: string;
  sha256: string;
  size: number;
  platform?: string;
  arch?: string;
}

interface VersionInfo {
  version: string;
  artifacts: Artifact[];
}

async function run(): Promise<void> {
  const version = core.getInput("version") || "latest";

  const platform = "linux";
  const arch = "amd64";
  const artifactName = `miren-${platform}-${arch}.zip`;

  const versionUrl = `https://api.miren.cloud/assets/release/miren/${version}/version.json`;
  core.info(`Fetching version info from ${versionUrl}`);

  const versionPath = await tc.downloadTool(versionUrl);
  const versionInfo: VersionInfo = JSON.parse(
    fs.readFileSync(versionPath, "utf-8")
  );

  const artifact = versionInfo.artifacts.find((a) => a.name === artifactName);
  if (!artifact) {
    throw new Error(
      `No artifact found for ${artifactName} in version ${versionInfo.version}`
    );
  }

  const downloadUrl = `https://api.miren.cloud/assets/release/miren/${version}/${artifactName}`;
  core.info(
    `Downloading Miren CLI ${versionInfo.version} from ${downloadUrl}`
  );

  const zipPath = await tc.downloadTool(downloadUrl);

  core.info("Verifying SHA-256 checksum");
  const fileBuffer = fs.readFileSync(zipPath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  if (hash !== artifact.sha256) {
    throw new Error(
      `SHA-256 mismatch: expected ${artifact.sha256}, got ${hash}`
    );
  }
  core.info("Checksum verified");

  const extractedDir = await tc.extractZip(zipPath);

  await exec.exec("sudo", [
    "install",
    "-v",
    "-m",
    "755",
    `${extractedDir}/miren`,
    "/usr/local/bin/miren",
  ]);

  let versionOutput = "";
  await exec.exec("miren", ["version"], {
    listeners: {
      stdout: (data: Buffer) => {
        versionOutput += data.toString();
      },
    },
  });

  core.setOutput("version", versionInfo.version);
  core.info(`Miren CLI ${versionInfo.version} installed successfully`);
}

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
