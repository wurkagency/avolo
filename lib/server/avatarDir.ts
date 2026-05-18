import path from "path";

export function getAvatarDir(): string {
  return process.env.AVATAR_DIR ?? path.join(process.cwd(), "uploads", "avatars");
}
