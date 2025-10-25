#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const showUsage = () => {
    console.log(`
사용법: node scripts/build.js [options]

Options:
  --env <env>         환경 (dev, staging, production) [기본값: staging]
  --platform <plat>   플랫폼 (android, ios) [기본값: android] 
  --mode <mode>       빌드 모드 (local, cloud) [기본값: cloud]
  --no-prebuild      prebuild 단계를 건너뛰고 빌드만 실행
  --no-tag           빌드 완료 후 자동 태그 생성을 건너뛰기
  --dry-run          실제 실행하지 않고 명령어만 출력

Examples:
  node scripts/build.js --env staging --platform android --mode local
  node scripts/build.js --env production --platform ios --mode cloud
  node scripts/build.js --env staging --platform android --no-prebuild --dry-run
`);
};

const parseArgs = () => {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        showUsage();
        process.exit(0);
    }

    const options = {
        env: 'staging',
        platform: 'android',
        mode: 'cloud',
        noPrebuild: false,
        noTag: false,
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case '--env':
                if (!nextArg || !['dev', 'development', 'staging', 'production'].includes(nextArg)) {
                    console.error('❌ --env는 dev, staging, production 중 하나여야 합니다');
                    process.exit(1);
                }
                options.env = nextArg === 'dev' ? 'development' : nextArg;
                i++;
                break;
            case '--platform':
                if (!nextArg || !['android', 'ios'].includes(nextArg)) {
                    console.error('❌ --platform은 android 또는 ios여야 합니다');
                    process.exit(1);
                }
                options.platform = nextArg;
                i++;
                break;
            case '--mode':
                if (!nextArg || !['local', 'cloud'].includes(nextArg)) {
                    console.error('❌ --mode는 local 또는 cloud여야 합니다');
                    process.exit(1);
                }
                options.mode = nextArg;
                i++;
                break;
            case '--no-prebuild':
                options.noPrebuild = true;
                break;
            case '--no-tag':
                options.noTag = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    console.error(`❌ 알 수 없는 옵션: ${arg}`);
                    showUsage();
                    process.exit(1);
                }
        }
    }

    return options;
};

const generateCommands = options => {
    const { env, platform, mode, noPrebuild } = options;
    const commands = [];

    // prebuild 실행 (--no-prebuild 옵션이 없을 때만)
    if (!noPrebuild) {
        const prebuildCmd = `APP_ENV=${env} expo prebuild --platform ${platform}`;
        commands.push(prebuildCmd);
    }

    // build 명령어 생성
    let buildCmd = `eas build --profile ${env} --platform ${platform}`;

    if (mode === 'local') {
        const timestamp = '$(date +%Y%m%d-%H%M)';
        const outputPath = `./build/${platform}/pickforme-${env}-${timestamp}.${
            platform === 'android' ? 'aab' : 'ipa'
        }`;
        buildCmd += ` --local --output ${outputPath}`;
    }

    commands.push(buildCmd);

    return commands;
};

const main = () => {
    const options = parseArgs();
    const commands = generateCommands(options);

    console.log(`🚀 build 실행 준비:`);
    console.log(`📋 설정:`);
    console.log(`   - 환경: ${options.env}`);
    console.log(`   - 플랫폼: ${options.platform}`);
    console.log(`   - 모드: ${options.mode}`);
    console.log(`   - Prebuild 건너뛰기: ${options.noPrebuild ? 'YES' : 'NO'}`);
    console.log(`   - 자동 태그 생성: ${options.noTag ? 'NO' : 'YES'}`);
    console.log(`   - Dry Run: ${options.dryRun ? 'YES' : 'NO'}`);
    console.log('');

    console.log(`🔧 실행할 명령어들:`);
    commands.forEach((cmd, index) => {
        console.log(`   ${index + 1}. ${cmd}`);
    });
    console.log('');

    if (options.dryRun) {
        console.log('💡 Dry run 모드: 실제 실행하지 않습니다');
        return;
    }

    // 실제 명령어 실행
    try {
        for (const cmd of commands) {
            console.log(`⚡ 실행 중: ${cmd}`);
            execSync(cmd, { stdio: 'inherit' });
        }
        console.log('✅ 모든 빌드 명령어가 성공적으로 실행되었습니다');

        // 빌드 완료 후 자동 태그 생성 (--no-tag 옵션이 없고, dry-run이 아닐 때만)
        if (!options.noTag && !options.dryRun) {
            console.log('\n🏷️  빌드 완료! 자동 태그를 생성합니다...');
            try {
                const tagScriptPath = path.join(__dirname, 'auto-tag-build.js');
                execSync(`node ${tagScriptPath} ${options.env} ${options.platform}`, {
                    stdio: 'inherit',
                    cwd: path.join(__dirname, '..')
                });
            } catch (tagError) {
                console.error('⚠️  태그 생성 중 오류가 발생했지만 빌드는 성공했습니다:', tagError.message);
                console.log('💡 수동으로 태그를 생성하려면: node scripts/auto-tag-build.js <env> <platform>');
            }
        }
    } catch (error) {
        console.error('❌ 명령어 실행 중 오류가 발생했습니다:', error.message);
        process.exit(1);
    }
};

main();
