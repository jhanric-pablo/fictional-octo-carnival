const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  
  // Check if we are in GitHub Codespaces
  const hostname = window.location.hostname;
  if (hostname.includes('app.github.dev') || hostname.includes('github.dev')) {
    const match = hostname.match(/^(.*)-(\d+)(\.app\.github\.dev|\.github\.dev)$/);
    if (match) {
      return `https://${match[1]}-5000${match[3]}`;
    }
  }
  
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();
