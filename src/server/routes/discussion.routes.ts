import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getDiscussions, createDiscussion, getDiscussionReplies, createDiscussionReply } from '../controllers/discussion.controller.js';

const router = express.Router();

router.use(protect);

router.get('/class/:classId', getDiscussions);
router.post('/class/:classId', createDiscussion);
router.get('/:discussionId/replies', getDiscussionReplies);
router.post('/:discussionId/replies', createDiscussionReply);

export default router;
