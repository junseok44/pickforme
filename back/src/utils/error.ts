/**
 * 에러 객체를 일관된 형식으로 포맷팅하는 유틸리티 함수
 * @param error - 포맷팅할 에러 객체
 * @returns 포맷팅된 에러 메타데이터
 */
export const formatError = (error: unknown) => {
  return {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : 'UnknownError',
    stack: error instanceof Error ? error.stack : 'UnknownError',
    error: JSON.stringify(error),
  };
};
