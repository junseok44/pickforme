#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// app.config.js 파일에서 설정 읽기
const getAppConfig = env => {
    // 환경변수 설정
    process.env.APP_ENV = env;

    // app.config.js 파일 내용을 읽어서 임시 CommonJS 파일로 변환
    const configPath = path.join(__dirname, '..', 'app.config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');

    // ES6 export를 CommonJS module.exports로 변환
    const commonjsContent = configContent.replace('export default', 'module.exports =');

    // 임시 파일 생성
    const tempPath = path.join(__dirname, 'temp-config.js');
    fs.writeFileSync(tempPath, commonjsContent);

    try {
        // 모듈 캐시 삭제
        delete require.cache[require.resolve(tempPath)];

        // config 함수 실행
        const configFunction = require(tempPath);
        const result = configFunction({ config: {} });

        // 임시 파일 삭제
        fs.unlinkSync(tempPath);

        return result;
    } catch (error) {
        // 임시 파일 삭제 (에러 발생 시에도)
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        throw error;
    }
};

const createOTATag = env => {
    try {
        console.log(`🚀 ${env} 환경의 OTA 태그를 생성합니다...`);

        // app.config.js에서 설정 읽기
        const config = getAppConfig(env);
        const version = config.version;
        const runtimeVersion = config.runtimeVersion;

        console.log(`📋 설정 정보:`);
        console.log(`   - 환경: ${env}`);
        console.log(`   - 버전: ${version}`);
        console.log(`   - 런타임 버전: ${runtimeVersion}`);

        // 타임스탬프 생성
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/T/, '-').substring(0, 13); // YYYYMMDD-HHMM 형식

        // 두 개의 태그 생성
        const detailedTag = `ota-${env}-v${version}-r${runtimeVersion}-${timestamp}`; // 상세 태그 (타임스탬프 포함)
        const latestTag = `ota-${env}-v${version}-r${runtimeVersion}`; // 최신 태그 (타임스탬프 없음)

        console.log(`🏷️  생성할 태그들:`);
        console.log(`   1. 상세 태그: ${detailedTag}`);
        console.log(`   2. 최신 태그: ${latestTag}`);

        // 기존 최신 태그가 있으면 삭제 (로컬에서)
        try {
            execSync(`git tag -d ${latestTag}`, { stdio: 'pipe' });
            console.log(`   ♻️  기존 최신 태그 삭제: ${latestTag}`);
        } catch (error) {
            // 태그가 없으면 무시
        }

        // 기존 최신 태그가 있으면 원격에서도 삭제
        try {
            execSync(`git push origin :refs/tags/${latestTag}`, { stdio: 'pipe' });
            console.log(`   ♻️  원격 최신 태그 삭제: ${latestTag}`);
        } catch (error) {
            // 태그가 없으면 무시
        }

        // 1. 상세 태그 생성 및 푸시 (타임스탬프 포함)
        execSync(`git tag ${detailedTag}`, { stdio: 'inherit' });
        execSync(`git push origin ${detailedTag}`, { stdio: 'inherit' });

        // 2. 최신 태그 생성 및 푸시 (타임스탬프 없음)
        execSync(`git tag ${latestTag}`, { stdio: 'inherit' });
        execSync(`git push origin ${latestTag}`, { stdio: 'inherit' });

        console.log(`✅ OTA 태그들이 성공적으로 생성되었습니다:`);
        console.log(`   - 상세 태그: ${detailedTag}`);
        console.log(`   - 최신 태그: ${latestTag}`);
    } catch (error) {
        console.error('❌ 태그 생성 중 오류가 발생했습니다:', error.message);
        process.exit(1);
    }
};

// 명령행 인수 처리
const args = process.argv.slice(2);

if (args.length !== 1) {
    console.error('❌ 사용법: node auto-tag-ota.js <env>');
    console.error('예: node auto-tag-ota.js staging');
    console.error('예: node auto-tag-ota.js production');
    process.exit(1);
}

const env = args[0];

if (!['staging', 'production'].includes(env)) {
    console.error('❌ 환경은 staging 또는 production만 가능합니다');
    process.exit(1);
}

createOTATag(env);
