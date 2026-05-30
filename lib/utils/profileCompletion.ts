export function calculateProfileCompletion(profile: any, role: string) {
  let score = 0;

  if (profile?.name) score += 15;
  if (profile?.bio) score += 20;
  if (profile?.profilePicture || profile?.image) score += 15;
  if (profile?.skills?.length) score += 15;
  if (profile?.availability) score += 10;
  if (profile?.linkedin || profile?.website) score += 10;

  if (role === "FOUNDER") {
    if (profile?.startupDetails) score += 15;
  }

  return Math.min(score, 100);
}