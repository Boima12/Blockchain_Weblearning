import mongoose from 'mongoose';

const publishedCourseSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
    },
    {
        strict: false,
        timestamps: true,
    },
);

const PublishedCourse =
    mongoose.models.PublishedCourse ||
    mongoose.model('PublishedCourse', publishedCourseSchema);

export default PublishedCourse;
