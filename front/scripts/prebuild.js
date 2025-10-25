#!/usr/bin/env node

const { execSync } = require('child_process');

const showUsage = () => {
    console.log(`
사용법: node scripts/prebuild.js [options]

Options:
  --env <env>         환경 (dev, staging, production) [기본값: staging]
  --platform <plat>   플랫폼 (android, ios, all) [기본값: all]
  --dry-run          실제 실행하지 않고 명령어만 출력

Examples:
  node scripts/prebuild.js --env staging --platform android
  node scripts/prebuild.js --env production --platform ios
  node scripts/prebuild.js --env dev --platform all --dry-run
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
        platform: 'all',
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
                if (!nextArg || !['android', 'ios', 'all'].includes(nextArg)) {
                    console.error('❌ --platform은 android, ios, all 중 하나여야 합니다');
                    process.exit(1);
                }
                options.platform = nextArg;
                i++;
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
    const { env, platform } = options;
    const commands = [];

    if (platform === 'all') {
        commands.push(`APP_ENV=${env} expo prebuild --platform android`);
        commands.push(`APP_ENV=${env} expo prebuild --platform ios`);
    } else {
        commands.push(`APP_ENV=${env} expo prebuild --platform ${platform}`);
    }

    return commands;
};

const main = () => {
    const options = parseArgs();
    const commands = generateCommands(options);

    console.log(`🚀 prebuild 실행 준비:`);
    console.log(`📋 설정:`);
    console.log(`   - 환경: ${options.env}`);
    console.log(`   - 플랫폼: ${options.platform}`);
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
        console.log('✅ 모든 prebuild 명령어가 성공적으로 실행되었습니다');
    } catch (error) {
        console.error('❌ prebuild 실행 중 오류가 발생했습니다:', error.message);
        process.exit(1);
    }
};

main();
