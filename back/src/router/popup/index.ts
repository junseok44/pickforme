import Router from '@koa/router';
import { PopupService } from '../../services/popup.service';
import requireAuth from 'middleware/jwt';

const router = new Router({
  prefix: '/popup',
});

router.get('/', async (ctx) => {
  try {
    const popups = await PopupService.getAllPopups();
    ctx.body = popups;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: '서버 오류가 발생했습니다.' };
  }
});

router.get('/active', requireAuth, async (ctx) => {
  try {
    const popups = await PopupService.getActivePopupsForUser(ctx.state.user._id);
    ctx.body = popups;
  } catch (error: any) {
    if (error.message === '사용자를 찾을 수 없습니다.') {
      ctx.status = 404;
      ctx.body = { error: error.message };
    } else {
      ctx.status = 500;
      ctx.body = { error: '서버 오류가 발생했습니다.' };
    }
  }
});

// 팝업 생성
router.post('/', async (ctx) => {
  try {
    const popupData = ctx.request.body as {
      popup_id: string;
      title: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    };

    const popup = await PopupService.createPopup(popupData);
    ctx.status = 201;
    ctx.body = popup;
  } catch (error: any) {
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      ctx.status = 400;
      ctx.body = { error: '이미 존재하는 popup_id입니다.' };
      return;
    }

    if (error.message) {
      ctx.status = 400;
      ctx.body = { error: error.message };
      return;
    }

    ctx.status = 500;
    ctx.body = { error: '서버 오류가 발생했습니다.' };
  }
});

// 팝업 삭제
router.delete('/:popup_id', async (ctx) => {
  try {
    const { popup_id: popupId } = ctx.params;
    await PopupService.deletePopup(popupId);

    ctx.status = 200;
    ctx.body = {
      message: '팝업이 성공적으로 삭제되었습니다.',
    };
  } catch (error: any) {
    if (error.message === '해당하는 팝업을 찾을 수 없습니다.') {
      ctx.status = 404;
      ctx.body = { error: error.message };
      return;
    }

    ctx.status = 500;
    ctx.body = { error: '서버 오류가 발생했습니다.' };
  }
});

export default router;
