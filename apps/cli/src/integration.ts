import { cp, mkdir, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const exists = async (path: string) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const installPaths = async () => {
  if (process.env.DELULU_SKILLS_DIR) {
    return [join(process.env.DELULU_SKILLS_DIR, "manage-social-publishing")];
  }
  const home = homedir();
  const candidates = [
    {
      host: join(home, ".agents"),
      destination: join(home, ".agents", "skills", "manage-social-publishing"),
    },
    {
      host: join(home, ".claude"),
      destination: join(home, ".claude", "skills", "manage-social-publishing"),
    },
  ];
  const detected = (
    await Promise.all(
      candidates.map(async (candidate) => ({
        ...candidate,
        detected: await exists(candidate.host),
      }))
    )
  )
    .filter((candidate) => candidate.detected)
    .map((candidate) => candidate.destination);
  return detected.length > 0 ? detected : [candidates[0].destination];
};

const skillSource = async () => {
  const bundled = fileURLToPath(new URL("./skill", import.meta.url));
  if (await exists(bundled)) {
    return bundled;
  }
  return fileURLToPath(
    new URL("../../../skills/manage-social-publishing", import.meta.url)
  );
};

export const integrationStatus = async () => {
  const paths = await installPaths();
  const installedPaths = (
    await Promise.all(
      paths.map(async (path) => ({ path, installed: await exists(path) }))
    )
  )
    .filter((entry) => entry.installed)
    .map((entry) => entry.path);
  return {
    installed: installedPaths.length === paths.length,
    path: paths[0] as string,
    paths,
    installedPaths,
    credentialsIncluded: false,
  };
};

export const installIntegration = async () => {
  const source = await skillSource();
  for (const destination of await installPaths()) {
    await mkdir(dirname(destination), { recursive: true });
    await rm(destination, { recursive: true, force: true });
    await cp(source, destination, { recursive: true });
  }
  return integrationStatus();
};

export const removeIntegration = async () => {
  const paths = await installPaths();
  const installed = await Promise.all(paths.map(exists));
  await Promise.all(
    paths.map((destination) =>
      rm(destination, { recursive: true, force: true })
    )
  );
  return {
    removed: installed.some(Boolean),
    path: paths[0] as string,
    paths,
  };
};
