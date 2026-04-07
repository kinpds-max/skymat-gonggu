// ============================================================
// HASNOL 견적서 → 구글 드라이브 자동 저장 Apps Script
// ============================================================
// 사용법:
// 1. script.google.com 에서 새 프로젝트 만들기
// 2. 이 코드 붙여넣기
// 3. FOLDER_ID를 실제 드라이브 폴더 ID로 변경
// 4. 배포 > 새 배포 > 웹 앱 > 액세스: 모든 사용자(익명) > 배포
// 5. 생성된 웹 앱 URL을 app.js 의 APPS_SCRIPT_URL 에 붙여넣기
// ============================================================

// ✅ 저장할 구글 드라이브 폴더 ID
// 폴더를 열었을 때 URL: https://drive.google.com/drive/folders/[여기가 폴더ID]
const FOLDER_ID = '13xpREW7xB9c96--1ZMPHx6nb6jNI1Ifb'; // 하스놀 상세견적 폴더

function doPost(e) {
  try {
    // CORS 허용 헤더
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    const params = JSON.parse(e.postData.contents);
    const base64Data = params.pdf;      // base64 인코딩된 PDF 데이터
    const fileName = params.fileName;   // 파일명 (예: HASNOL_견적서_홍길동_2026-04-08.pdf)
    const customerName = params.customerName || '고객';

    if (!base64Data || !fileName) {
      return makeResponse(400, { success: false, message: 'PDF 데이터 또는 파일명이 없습니다.' }, headers);
    }

    // Base64 → Blob 변환
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, 'application/pdf', fileName);

    // 드라이브 폴더에 저장
    const folder = DriveApp.getFolderById(FOLDER_ID);

    // 같은 이름 파일이 있으면 덮어쓰지 않고 날짜+시간 붙이기
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd_HHmmss');
    const finalFileName = fileName.replace('.pdf', `_${timestamp}.pdf`);

    const file = folder.createFile(blob.setName(finalFileName));

    // 저장된 파일 링크
    const fileUrl = file.getUrl();
    const fileId = file.getId();

    return makeResponse(200, {
      success: true,
      message: `✅ "${finalFileName}" 파일이 드라이브에 저장되었습니다.`,
      fileUrl: fileUrl,
      fileId: fileId,
      fileName: finalFileName
    }, headers);

  } catch (err) {
    return makeResponse(500, {
      success: false,
      message: '저장 중 오류: ' + err.message
    }, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
  }
}

// OPTIONS 요청 처리 (CORS preflight)
function doGet(e) {
  return makeResponse(200, { success: true, message: 'HASNOL Drive API 정상 작동 중' }, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  });
}

function makeResponse(code, data, headers) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
                   .setMimeType(ContentService.MimeType.JSON);
  return output;
}
