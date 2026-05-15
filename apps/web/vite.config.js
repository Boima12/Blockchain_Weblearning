import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/db/connect.js';
import PublishedCourse from './src/db/models/PublishedCourse.js';
import UserAccount from './src/db/models/UserAccount.js';

// Emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readJsonBody = async (req) => {
  let rawBody = '';

  for await (const chunk of req) {
    rawBody += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  }

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
};

const toPublicCourse = (courseDoc) => {
  if (!courseDoc || typeof courseDoc !== 'object') {
    return null;
  }

  const { _id, __v, createdAt, updatedAt, ...course } = courseDoc;
  return {
    ...course,
    updatedAt: course.updatedAt ?? updatedAt ?? new Date().toISOString(),
    createdAt: course.createdAt ?? createdAt ?? new Date().toISOString(),
  };
};

const normalizeWalletAddress = (value) => String(value ?? '').trim();

const normalizeProfile = ({ displayName, walletAddress }) => ({
  displayName: String(displayName ?? '').trim() || 'Blockchain Student',
  walletAddress:
    normalizeWalletAddress(walletAddress) ||
    '0xA4f0fA32F7bA19EfA72fD8B601845513d19b4aD0',
  bio: 'University student building a Web3 learning platform.',
  avatarUrl: '',
});

const normalizeUserStatePayload = (payload = {}) => ({
  profile:
    payload.profile && typeof payload.profile === 'object'
      ? {
          displayName:
            String(payload.profile.displayName ?? '').trim() ||
            'Blockchain Student',
          walletAddress:
            normalizeWalletAddress(payload.profile.walletAddress) ||
            '0xA4f0fA32F7bA19EfA72fD8B601845513d19b4aD0',
          bio:
            String(payload.profile.bio ?? '').trim() ||
            'University student building a Web3 learning platform.',
          avatarUrl: String(payload.profile.avatarUrl ?? '').trim(),
        }
      : normalizeProfile({}),
  createdCourses: Array.isArray(payload.createdCourses)
    ? payload.createdCourses
    : [],
  purchasedCourses: Array.isArray(payload.purchasedCourses)
    ? payload.purchasedCourses
    : [],
  learningProgress:
    payload.learningProgress && typeof payload.learningProgress === 'object'
      ? payload.learningProgress
      : {},
  certificates: Array.isArray(payload.certificates)
    ? payload.certificates
    : [],
});

const toPublicUserAccount = (accountDoc) => {
  if (!accountDoc || typeof accountDoc !== 'object') {
    return null;
  }

  const { _id, __v, createdAt, updatedAt, ...account } = accountDoc;

  return {
    accountId: String(_id),
    ...account,
    createdAt: account.createdAt ?? createdAt ?? new Date().toISOString(),
    updatedAt: account.updatedAt ?? updatedAt ?? new Date().toISOString(),
  };
};

const normalizeGateway = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return 'https://gateway.pinata.cloud';
  }

  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

const buildCourseMetadataPayload = ({ course = {}, profile = {} } = {}) => {
  const image =
    course.thumbnailUrl ||
    course.image_750x422 ||
    course.image_480x270 ||
    course.image_304x171 ||
    'https://gateway.pinata.cloud/ipfs/bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku';

  const ownerWalletAddress =
    String(profile.walletAddress ?? course.ownerWalletAddress ?? '').trim();

  return {
    name: String(course.title ?? 'Untitled Course').trim(),
    description: String(course.description ?? '').trim(),
    image,
    ownerWalletAddress,
    price: Number(course.price ?? 0),
    token: String(course.token ?? 'MATIC').trim(),
    external_url: String(course.url ?? '').trim(),
  };
};

const pinataIpfsApi = (pinataJwt, gatewayBase) => ({
  name: 'pinata-ipfs-api',
  configureServer(server) {
    server.middlewares.use('/api/ipfs/course-metadata', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');

      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      if (!pinataJwt) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'PINATA_JWT is not configured.' }));
        return;
      }

      const body = await readJsonBody(req);
      const course = body?.course;
      const profile = body?.profile;

      if (!course) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Course payload is required.' }));
        return;
      }

      const metadata = buildCourseMetadataPayload({ course, profile });

      try {
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${pinataJwt}`,
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
              name: `course-${String(course.id ?? (metadata.name || 'metadata'))}`,
            },
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: payload?.error || 'Pinata upload failed.' }));
          return;
        }

        const cid = payload?.IpfsHash;
        if (!cid) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Pinata response missing CID.' }));
          return;
        }

        const gateway = normalizeGateway(gatewayBase);
        res.statusCode = 200;
        res.end(JSON.stringify({ cid, ipfsUrl: `${gateway}/ipfs/${cid}` }));
      } catch (error) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            error:
              error instanceof Error
                ? `Pinata upload failed: ${error.message}`
                : 'Pinata upload failed.',
          }),
        );
      }
    });
  },
});

const publishedCoursesMongoApi = (mongoUri) => ({
  name: 'published-courses-mongo-api',
  configureServer(server) {
    server.middlewares.use('/api/published-courses', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'GET') {
        const requestUrl = new URL(req.url ?? '/', 'http://localhost');
        const requestedId = requestUrl.searchParams.get('id');

        try {
          await connectDB(mongoUri);

          if (requestedId) {
            const found = await PublishedCourse.findOne({
              id: String(requestedId),
            }).lean();

            if (!found) {
              res.statusCode = 404;
              res.end(
                JSON.stringify({
                  error: 'Course not found.',
                }),
              );
              return;
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                course: toPublicCourse(found),
              }),
            );
            return;
          }

          const documents = await PublishedCourse.find({})
            .sort({ updatedAt: -1, _id: -1 })
            .lean();

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              items: documents.map(toPublicCourse).filter(Boolean),
            }),
          );
        } catch {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: "can't fetch data from MongoDB",
            }),
          );
        }

        return;
      }

      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end(JSON.stringify({
          error: 'Method not allowed',
        }));
        return;
      }

      const body = await readJsonBody(req);
      const incomingCourse = body?.course;

      if (!incomingCourse || !incomingCourse.id) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          error: 'Payload must include course with a valid id.',
        }));
        return;
      }

      try {
        await connectDB(mongoUri);

        const normalizedCourse = {
          ...incomingCourse,
          id: String(incomingCourse.id),
          status: 'Published',
          updatedAt: incomingCourse.updatedAt ?? new Date().toISOString(),
          publishedAt: incomingCourse.publishedAt ?? new Date().toISOString(),
        };

        const saved = await PublishedCourse.findOneAndUpdate(
          { id: normalizedCourse.id },
          normalizedCourse,
          {
            upsert: true,
            returnDocument: 'after',
            setDefaultsOnInsert: true,
            lean: true,
          },
        );

        // Update user's createdCourses in UserAccount if ownerWalletAddress is provided
        const ownerWalletAddress = String(normalizedCourse.ownerWalletAddress ?? '').trim();
        if (ownerWalletAddress) {
          const userAccount = await UserAccount.findOne({ walletAddress: ownerWalletAddress });
          if (userAccount) {
            const courseIdStr = String(normalizedCourse.id);
            // Only add if not already in createdCourses
            if (!userAccount.createdCourses.some(c => String(c.id) === courseIdStr)) {
              userAccount.createdCourses.push({
                id: courseIdStr,
                title: normalizedCourse.title,
                publishedAt: normalizedCourse.publishedAt,
              });
              await userAccount.save();
            }
          }
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            course: toPublicCourse(saved) ?? normalizedCourse,
          }),
        );
      } catch (error) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            error:
              error instanceof Error
                ? `Failed to save course in MongoDB: ${error.message}`
                : 'Failed to save course in MongoDB.',
          }),
        );
      }
    });
  },
});

const userAccountMongoApi = (mongoUri) => ({
  name: 'user-account-mongo-api',
  configureServer(server) {
    server.middlewares.use('/api/auth', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');

      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end(
          JSON.stringify({
            error: 'Method not allowed',
          }),
        );
        return;
      }

      const requestUrl = new URL(req.url ?? '/', 'http://localhost');
      const route = requestUrl.pathname;

      try {
        await connectDB(mongoUri);
      } catch {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            error: "can't fetch data from MongoDB",
          }),
        );
        return;
      }

      const body = await readJsonBody(req);

      const upsertWalletAccount = async () => {
        const displayName = String(body?.displayName ?? '').trim();
        const walletAddress = normalizeWalletAddress(body?.walletAddress);

        if (!walletAddress) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error: 'Wallet address is required.',
            }),
          );
          return null;
        }

        const existing = await UserAccount.findOne({ walletAddress });

        if (existing) {
          if (displayName) {
            existing.profile = {
              ...existing.profile,
              displayName,
              walletAddress,
            };
          }

          existing.lastLoginAt = new Date();
          await existing.save();
          return toPublicUserAccount(existing.toObject());
        }

        const profile = normalizeProfile({
          displayName,
          walletAddress,
        });

        const created = await UserAccount.create({
          walletAddress,
          profile,
          createdCourses: [],
          purchasedCourses: [],
          learningProgress: {},
          certificates: [],
          lastLoginAt: new Date(),
        });

        return toPublicUserAccount(created.toObject());
      };

      if (route === '/register' || route === '/login') {
        const account = await upsertWalletAccount();
        if (!account) {
          return;
        }

        res.statusCode = route === '/register' ? 201 : 200;
        res.end(
          JSON.stringify({
            ok: true,
            account,
          }),
        );
        return;
      }

      if (route === '/logout') {
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
          }),
        );
        return;
      }

      res.statusCode = 404;
      res.end(
        JSON.stringify({
          error: 'Auth route not found.',
        }),
      );
    });

    server.middlewares.use('/api/user-account', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');

      const requestUrl = new URL(req.url ?? '/', 'http://localhost');
      const pathSegments = requestUrl.pathname.split('/').filter(Boolean);
      const accountId = pathSegments[0];
      const resource = pathSegments[1] ?? '';

      if (!accountId) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            error: 'Account id is required.',
          }),
        );
        return;
      }

      try {
        await connectDB(mongoUri);
      } catch {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            error: "can't fetch data from MongoDB",
          }),
        );
        return;
      }

      if (req.method === 'GET' && !resource) {
        const found = await UserAccount.findById(accountId).lean();

        if (!found) {
          res.statusCode = 404;
          res.end(
            JSON.stringify({
              error: 'User account not found.',
            }),
          );
          return;
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            account: toPublicUserAccount(found),
          }),
        );
        return;
      }

      if (req.method === 'PUT' && resource === 'state') {
        const body = await readJsonBody(req);
        const normalizedState = normalizeUserStatePayload(body);

        const updated = await UserAccount.findByIdAndUpdate(
          accountId,
          {
            profile: normalizedState.profile,
            createdCourses: normalizedState.createdCourses,
            purchasedCourses: normalizedState.purchasedCourses,
            learningProgress: normalizedState.learningProgress,
            certificates: normalizedState.certificates,
          },
          {
            returnDocument: 'after',
            lean: true,
          },
        );

        if (!updated) {
          res.statusCode = 404;
          res.end(
            JSON.stringify({
              error: 'User account not found.',
            }),
          );
          return;
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            account: toPublicUserAccount(updated),
          }),
        );
        return;
      }

      res.statusCode = 405;
      res.end(
        JSON.stringify({
          error: 'Method not allowed.',
        }),
      );
    });
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const mongoUri = env.MONGO_URI;
  const pinataJwt = env.PINATA_JWT;
  const pinataGateway = env.PINATA_GATEWAY;

  return {
    plugins: [
      react(),
      publishedCoursesMongoApi(mongoUri),
      userAccountMongoApi(mongoUri),
      pinataIpfsApi(pinataJwt, pinataGateway),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './'), // Alias '~' points to the 'root' folder
      },
    },
  };
});