const asyncHandler = require('../utils/asyncHandler');
const parentResultService = require('../services/parentResultService');

const getStudentResults = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    const results = await parentResultService.getStudentResults(userId, id, req.query);

    res.status(200).json({
        status: 'success',
        data: results,
    });
});

module.exports = {
    getStudentResults,
};
