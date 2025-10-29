import  {Router} from 'express';
import { createQa, getAllQa, getAnswerByQuestion, getQaByScheme, getQuestionsByScheme } from '../controllers/botQa';

const router = Router();

router.post('/createQa', createQa);
router.get('/getAllQa', getAllQa);
router.post('/getByScheme', getQaByScheme);
router.post('/questions',getQuestionsByScheme);
router.post('/answer', getAnswerByQuestion)

export default router;