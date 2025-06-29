import axios from 'axios';

export default async function handler(req, res) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
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

    // SVG badge content
    const svgBadge = `
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
        <rect width="120" height="20" fill="#555"/>
        <rect x="60" width="60" height="20" fill="#4c1"/>
        <text x="30" y="14" fill="#fff" font-family="Verdana" font-size="11">Repos</text>
        <text x="90" y="14" fill="#fff" font-family="Verdana" font-size="11">${totalCount}</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svgBadge);
  } catch (error) {
    console.error('Error fetching repo count:', error.message);
    res.status(500).send('Error fetching repo count');
  }
}
