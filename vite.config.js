import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/db/connect.js';
import PublishedCourse from './src/db/models/PublishedCourse.js';

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
            new: true,
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const mongoUri = env.MONGO_URI;

  return {
    plugins: [react(), publishedCoursesMongoApi(mongoUri)],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './'), // Alias '~' points to the 'root' folder
      },
    },
  };
});