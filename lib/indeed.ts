/** Indeed's resume download URL carries the same candidate id used in their profile view URL. */
export function getIndeedCandidateUrl(resumeUrl?: string): string | null {
  if (!resumeUrl) {
    return null;
  }
  try {
    const id = new URL(resumeUrl).searchParams.get('id');
    return id ? `https://employers.indeed.com/candidates/view?id=${id}` : null;
  } catch {
    return null;
  }
}
