import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
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

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

const normalizeWalletAddress = (value) => String(value ?? '').trim();

const normalizeProfile = ({ displayName, email, walletAddress }) => ({
  displayName: String(displayName ?? '').trim() || 'Blockchain Student',
  email: normalizeEmail(email) || 'student@university.edu',
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
          email:
            normalizeEmail(payload.profile.email) ||
            'student@university.edu',
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

const hashPassword = (password, passwordSalt) =>
  crypto
    .createHash('sha256')
    .update(`${passwordSalt}:${String(password ?? '')}`)
    .digest('hex');

const createPasswordRecord = (password) => {
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  return {
    passwordSalt,
    passwordHash: hashPassword(password, passwordSalt),
  };
};

const toPublicUserAccount = (accountDoc) => {
  if (!accountDoc || typeof accountDoc !== 'object') {
    return null;
  }

  const { _id, __v, createdAt, updatedAt, ...account } = accountDoc;

  if ('passwordHash' in account) {
    delete account.passwordHash;
  }

  if ('passwordSalt' in account) {
    delete account.passwordSalt;
  }

  return {
    accountId: String(_id),
    ...account,
    createdAt: account.createdAt ?? createdAt ?? new Date().toISOString(),
    updatedAt: account.updatedAt ?? updatedAt ?? new Date().toISOString(),
  };
};

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

      if (route === '/register') {
        const displayName = String(body?.displayName ?? '').trim();
        const email = normalizeEmail(body?.email);
        const walletAddress = normalizeWalletAddress(body?.walletAddress);
        const password = String(body?.password ?? '');

        if (!displayName || !email || !walletAddress || password.length < 6) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error:
                'Display name, email, wallet address, and a password with at least 6 characters are required.',
            }),
          );
          return;
        }

        const existing = await UserAccount.findOne({
          $or: [
            { email },
            { walletAddress },
          ],
        }).lean();

        if (existing) {
          res.statusCode = 409;
          res.end(
            JSON.stringify({
              error: 'An account with that email or wallet address already exists.',
            }),
          );
          return;
        }

        const passwordRecord = createPasswordRecord(password);
        const profile = normalizeProfile({
          displayName,
          email,
          walletAddress,
        });

        const created = await UserAccount.create({
          email,
          walletAddress,
          ...passwordRecord,
          profile,
          createdCourses: [],
          purchasedCourses: [],
          learningProgress: {},
          certificates: [],
          lastLoginAt: new Date(),
        });

        res.statusCode = 201;
        res.end(
          JSON.stringify({
            ok: true,
            account: toPublicUserAccount(created.toObject()),
          }),
        );
        return;
      }

      if (route === '/login') {
        const identifier = String(body?.identifier ?? '').trim();
        const password = String(body?.password ?? '');

        if (!identifier || !password) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error: 'Identifier and password are required.',
            }),
          );
          return;
        }

        const normalizedIdentifier = normalizeEmail(identifier);

        const account = await UserAccount.findOne({
          $or: [
            { email: normalizedIdentifier },
            { walletAddress: identifier },
          ],
        });

        if (!account) {
          res.statusCode = 401;
          res.end(
            JSON.stringify({
              error: 'Invalid login credentials.',
            }),
          );
          return;
        }

        const incomingPasswordHash = hashPassword(password, account.passwordSalt);
        if (incomingPasswordHash !== account.passwordHash) {
          res.statusCode = 401;
          res.end(
            JSON.stringify({
              error: 'Invalid login credentials.',
            }),
          );
          return;
        }

        account.lastLoginAt = new Date();
        await account.save();

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            account: toPublicUserAccount(account.toObject()),
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

  return {
    plugins: [
      react(),
      publishedCoursesMongoApi(mongoUri),
      userAccountMongoApi(mongoUri),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './'), // Alias '~' points to the 'root' folder
      },
    },
  };
});