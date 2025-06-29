import axios from 'axios';

export default async function handler(req, res) {
  const GITHUB_TOKEN = process.env.PAT_1;
  const USERNAME = 'Mummanajagadeesh';

  const query = `
    {
      user(login: "${USERNAME}") {
        repositories(ownerAffiliations: OWNER) {
          totalCount
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      'https://api.github.com/graphql',
      { query },
      {
        headers: {
          Authorization: `bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const totalCount = response.data.data.user.repositories.totalCount;

    // SVG badge content with dynamic totalCount
    const svgBadge = `
<svg xmlns="http://www.w3.org/2000/svg" width="95" height="20" role="img" aria-label="Total repos: ${totalCount}">
  <defs>
    <linearGradient id="smooth" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity="0.1"/>
      <stop offset="1" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <!-- Left gray with rounded left corners only -->
  <rect x="0" y="0" width="65" height="20" fill="#555" rx="3" ry="3" />
  <rect x="35" y="0" width="30" height="20" fill="#555" rx="0" ry="0" />

  <!-- Right green with rounded right corners only -->
  <rect x="65" y="0" width="30" height="20" fill="#4c1" rx="3" ry="3" />
  <rect x="65" y="0" width="5" height="20" fill="#4c1" rx="0" ry="0" />

  <!-- Gradient overlay -->
  <rect rx="3" width="95" height="20" fill="url(#smooth)"/>

  <!-- Text -->
  <g fill="#fff" font-family="Verdana, Geneva, DejaVu Sans, sans-serif" font-size="11" font-weight="600" dominant-baseline="middle">
    <text x="32.5" y="14" text-anchor="middle">repos</text>
    <text x="92" y="14" text-anchor="end">${totalCount}</text>
  </g>
</svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svgBadge);
  } catch (error) {
    console.error('Error fetching repo count:', error.message);
    res.status(500).send('Error fetching repo count');
  }
}
