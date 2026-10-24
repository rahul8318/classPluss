const CourseModule = require('../models/CourseModule');
const Resource = require('../models/Resource');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

exports.createModule = async (req, res, next) => {
  try {
    const { title, description, orderIndex } = req.body;
    const courseId = req.params.courseId || req.params.id;

    if (!title) {
      return next(ApiError.badRequest('Module title is required'));
    }

    const count = await CourseModule.countDocuments({ courseId });

    const newModule = await CourseModule.create({
      courseId,
      title,
      description: description || '',
      orderIndex: orderIndex !== undefined ? orderIndex : count,
    });

    return ApiResponse.created(res, { module: newModule }, 'Module created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getModules = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const modules = await CourseModule.find({ courseId }).sort({ orderIndex: 1 }).lean();

    // Attach published resources per module
    const populated = await Promise.all(
      modules.map(async mod => {
        const query = { moduleId: mod._id };
        if (!req.isTeacher) {
          query.isPublished = true;
        }
        const resources = await Resource.find(query).select('-textContent').sort({ createdAt: 1 }).lean();
        return {
          ...mod,
          resources,
        };
      })
    );

    return ApiResponse.success(res, { modules: populated });
  } catch (error) {
    next(error);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { title, description, orderIndex, isPublished } = req.body;

    const moduleItem = await CourseModule.findById(moduleId);
    if (!moduleItem) {
      return next(ApiError.notFound('Module not found'));
    }

    if (title) moduleItem.title = title;
    if (description !== undefined) moduleItem.description = description;
    if (orderIndex !== undefined) moduleItem.orderIndex = orderIndex;
    if (isPublished !== undefined) moduleItem.isPublished = isPublished;

    await moduleItem.save();
    return ApiResponse.success(res, { module: moduleItem }, 'Module updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const moduleItem = await CourseModule.findById(moduleId);
    if (!moduleItem) {
      return next(ApiError.notFound('Module not found'));
    }

    await CourseModule.deleteOne({ _id: moduleId });
    // Update resources that were in this module
    await Resource.updateMany({ moduleId }, { $unset: { moduleId: 1 } });

    return ApiResponse.success(res, null, 'Module deleted successfully');
  } catch (error) {
    next(error);
  }
};
