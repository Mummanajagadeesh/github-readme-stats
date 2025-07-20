// @ts-check
import { retryer } from "../common/retryer.js";
import { MissingParamError, request } from "../common/utils.js";

/**
 * @typedef {import('axios').AxiosRequestHeaders} AxiosRequestHeaders Axios request headers.
 * @typedef {import('axios').AxiosResponse} AxiosResponse Axios response.
 */

/**
 * Repo data fetcher.
 *
 * @param {AxiosRequestHeaders} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<AxiosResponse>} The response.
 */
const fetcher = (variables, token) => {
  return request(
    {
      query: `
      fragment RepoInfo on Repository {
        name
        nameWithOwner
        isPrivate
        isArchived
        isTemplate
        stargazers {
          totalCount
        }
        description
        primaryLanguage {
          color
          id
          name
        }
        forkCount
      }
      query getRepo($login: String!, $repo: String!) {
        user(login: $login) {
          repository(name: $repo) {
            ...RepoInfo
          }
        }
        organization(login: $login) {
          repository(name: $repo) {
            ...RepoInfo
          }
        }
      }
    `,
      variables,
    },
    {
      Authorization: `token ${token}`,
    }
  );
};

const urlExample = "/api/pin?username=USERNAME&amp;repo=REPO_NAME";

/**
 * Timeout helper to fail early if GitHub API stalls.
 * @param {number} ms Timeout in milliseconds.
 * @returns {Promise<never>}
 */
const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("GitHub API timeout")), ms)
  );

/**
 * @typedef {import("./types").RepositoryData} RepositoryData Repository data.
 */

/**
 * Fetch repository data.
 *
 * @param {string} username GitHub username.
 * @param {string} reponame GitHub repository name.
 * @param {string} [token] Optional GitHub token (used for private repo access).
 * @returns {Promise<RepositoryData>} Repository data.
 */
const fetchRepo = async (username, reponame, token) => {
  if (!username && !reponame) {
    throw new MissingParamError(["username", "repo"], urlExample);
  }
  if (!username) {
    throw new MissingParamError(["username"], urlExample);
  }
  if (!reponame) {
    throw new MissingParamError(["repo"], urlExample);
  }

  const finalToken =
    token || process.env.PRIVATE_GH_TOKEN || process.env.GH_TOKEN;

  if (!finalToken) {
    throw new Error("GitHub token is required to fetch private repo metadata.");
  }

  let res;
  try {
    res = await Promise.race([
      retryer(fetcher, { login: username, repo: reponame }, finalToken),
      timeout(8000), // 8 second timeout
    ]);
  } catch (err) {
    console.error("[fetchRepo ERROR]", err);
    throw new Error("Failed to fetch repo (timeout or GitHub API error).");
  }

  const data = res?.data?.data;

  if (!data || (!data.user && !data.organization)) {
    throw new Error("Repository not found or inaccessible.");
  }

  const isUser = data.organization === null && data.user;
  const isOrg = data.user === null && data.organization;

  if (isUser) {
    if (!data.user.repository) {
      throw new Error("User Repository Not found");
    }
    return {
      ...data.user.repository,
      starCount: data.user.repository.stargazers.totalCount,
    };
  }

  if (isOrg) {
    if (!data.organization.repository) {
      throw new Error("Organization Repository Not found");
    }
    return {
      ...data.organization.repository,
      starCount: data.organization.repository.stargazers.totalCount,
    };
  }

  throw new Error("Unexpected behavior");
};

export { fetchRepo };
export default fetchRepo;
