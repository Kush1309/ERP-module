const {
    createHomework,
    getHomeworks,
    getHomeworkById,
    updateHomework,
    deleteHomework
} = require('../services/homeworkService');
const AppError = require('../utils/AppError');

const createHomeworkController = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Extract and whitelist only allowed fields
        const {
            title,
            description,
            class: className,
            section,
            subject,
            dueDate,
            status,
            teacherId
        } = req.body;

        const safeData = {
            title,
            description,
            class: className,
            section,
            subject,
            dueDate,
            status
        };

        if (teacherId !== undefined) {
            safeData.teacherId = teacherId;
        }

        const homework = await createHomework(userId, safeData);
        res.status(201).json(homework);
    } catch (err) {
        next(err);
    }
};

const getHomeworksController = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Forward only safe query parameters
        const {
            page,
            limit,
            search,
            status,
            class: className,
            section,
            subject,
            sort
        } = req.query;

        const safeQuery = {};
        if (page !== undefined) safeQuery.page = page;
        if (limit !== undefined) safeQuery.limit = limit;
        if (search !== undefined) safeQuery.search = search;
        if (status !== undefined) safeQuery.status = status;
        if (className !== undefined) safeQuery.class = className;
        if (section !== undefined) safeQuery.section = section;
        if (subject !== undefined) safeQuery.subject = subject;
        if (sort !== undefined) safeQuery.sort = sort;

        const result = await getHomeworks(userId, safeQuery);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getHomeworkByIdController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const homework = await getHomeworkById(userId, id);
        res.status(200).json(homework);
    } catch (err) {
        next(err);
    }
};

const updateHomeworkController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const {
            title,
            description,
            class: className,
            section,
            subject,
            dueDate,
            status
        } = req.body;

        const safeData = {};
        if (title !== undefined) safeData.title = title;
        if (description !== undefined) safeData.description = description;
        if (className !== undefined) safeData.class = className;
        if (section !== undefined) safeData.section = section;
        if (subject !== undefined) safeData.subject = subject;
        if (dueDate !== undefined) safeData.dueDate = dueDate;
        if (status !== undefined) safeData.status = status;

        const updated = await updateHomework(userId, id, safeData);
        res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

const deleteHomeworkController = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const result = await deleteHomework(userId, id);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createHomework: createHomeworkController,
    getHomeworks: getHomeworksController,
    getHomeworkById: getHomeworkByIdController,
    updateHomework: updateHomeworkController,
    deleteHomework: deleteHomeworkController
};
