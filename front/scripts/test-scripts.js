#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// 기존 명령어들 정의
const LEGACY_COMMANDS = {
    'prebuild:dev': 'APP_ENV=development expo prebuild',
    'prebuild:staging': 'APP_ENV=staging expo prebuild',
    'prebuild:production': 'APP_ENV=production expo prebuild',
    'build:local:staging:android':
        'APP_ENV=staging expo prebuild --platform android && eas build --profile staging --platform android --local --output ./build/android/pickforme-staging-$(date +%Y%m%d-%H%M).aab',
    'build:local:staging:ios':
        'APP_ENV=staging expo prebuild --platform ios && eas build --profile staging --platform ios --local --output ./build/ios/pickforme-staging-$(date +%Y%m%d-%H%M).ipa',
    'build:local:production:android':
        'APP_ENV=production expo prebuild --platform android && eas build --profile production --platform android --local --output ./build/android/pickforme-production-$(date +%Y%m%d-%H%M).aab',
    'build:local:production:ios':
        'APP_ENV=production expo prebuild --platform ios && eas build --profile production --platform ios --local --output ./build/ios/pickforme-production-$(date +%Y%m%d-%H%M).ipa',
    'build:staging:cloud:android':
        'APP_ENV=staging expo prebuild --platform android && eas build --profile staging --platform android',
    'build:staging:cloud:ios':
        'APP_ENV=staging expo prebuild --platform ios && eas build --profile staging --platform ios',
    'build:production:cloud:android':
        'APP_ENV=production expo prebuild --platform android && eas build --profile production --platform android',
    'build:production:cloud:ios':
        'APP_ENV=production expo prebuild --platform ios && eas build --profile production --platform ios'
};

// 새로운 스크립트 명령어 매핑
const NEW_SCRIPT_MAPPINGS = [
    {
        legacy: 'prebuild:dev',
        newCommand: 'node scripts/prebuild.js --env development --platform all',
        expectedCommands: [
            'APP_ENV=development expo prebuild --platform android',
            'APP_ENV=development expo prebuild --platform ios'
        ]
    },
    {
        legacy: 'prebuild:staging',
        newCommand: 'node scripts/prebuild.js --env staging --platform all',
        expectedCommands: [
            'APP_ENV=staging expo prebuild --platform android',
            'APP_ENV=staging expo prebuild --platform ios'
        ]
    },
    {
        legacy: 'prebuild:production',
        newCommand: 'node scripts/prebuild.js --env production --platform all',
        expectedCommands: [
            'APP_ENV=production expo prebuild --platform android',
            'APP_ENV=production expo prebuild --platform ios'
        ]
    },
    {
        legacy: 'build:local:staging:android',
        newCommand: 'node scripts/build.js --env staging --platform android --mode local',
        expectedCommands: [
            'APP_ENV=staging expo prebuild --platform android',
            'eas build --profile staging --platform android --local --output ./build/android/pickforme-staging-$(date +%Y%m%d-%H%M).aab'
        ]
    },
    {
        legacy: 'build:local:staging:ios',
        newCommand: 'node scripts/build.js --env staging --platform ios --mode local',
        expectedCommands: [
            'APP_ENV=staging expo prebuild --platform ios',
            'eas build --profile staging --platform ios --local --output ./build/ios/pickforme-staging-$(date +%Y%m%d-%H%M).ipa'
        ]
    },
    {
        legacy: 'build:local:production:android',
        newCommand: 'node scripts/build.js --env production --platform android --mode local',
        expectedCommands: [
            'APP_ENV=production expo prebuild --platform android',
            'eas build --profile production --platform android --local --output ./build/android/pickforme-production-$(date +%Y%m%d-%H%M).aab'
        ]
    },
    {
        legacy: 'build:local:production:ios',
        newCommand: 'node scripts/build.js --env production --platform ios --mode local',
        expectedCommands: [
            'APP_ENV=production expo prebuild --platform ios',
            'eas build --profile production --platform ios --local --output ./build/ios/pickforme-production-$(date +%Y%m%d-%H%M).ipa'
        ]
    },
    {
        legacy: 'build:staging:cloud:android',
        newCommand: 'node scripts/build.js --env staging --platform android --mode cloud',
        expectedCommands: [
            'APP_ENV=staging expo prebuild --platform android',
            'eas build --profile staging --platform android'
        ]
    },
    {
        legacy: 'build:staging:cloud:ios',
        newCommand: 'node scripts/build.js --env staging --platform ios --mode cloud',
        expectedCommands: ['APP_ENV=staging expo prebuild --platform ios', 'eas build --profile staging --platform ios']
    },
    {
        legacy: 'build:production:cloud:android',
        newCommand: 'node scripts/build.js --env production --platform android --mode cloud',
        expectedCommands: [
            'APP_ENV=production expo prebuild --platform android',
            'eas build --profile production --platform android'
        ]
    },
    {
        legacy: 'build:production:cloud:ios',
        newCommand: 'node scripts/build.js --env production --platform ios --mode cloud',
        expectedCommands: [
            'APP_ENV=production expo prebuild --platform ios',
            'eas build --profile production --platform ios'
        ]
    }
];

// 명령어를 실행하고 출력을 캡처하는 함수
const captureScriptOutput = command => {
    try {
        const output = execSync(`${command} --dry-run`, {
            encoding: 'utf8',
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });

        // "실행할 명령어들:" 이후의 명령어들만 추출
        const lines = output.split('\n');
        const commandStartIndex = lines.findIndex(line => line.includes('🔧 실행할 명령어들:'));
        const dryRunIndex = lines.findIndex(line => line.includes('💡 Dry run 모드'));

        if (commandStartIndex === -1 || dryRunIndex === -1) {
            return [];
        }

        const commandLines = lines
            .slice(commandStartIndex + 1, dryRunIndex)
            .filter(line => line.trim())
            .map(line => line.replace(/^\s*\d+\.\s*/, '').trim())
            .filter(line => line.length > 0);

        return commandLines;
    } catch (error) {
        console.error(`❌ 명령어 실행 실패: ${command}`);
        console.error(error.message);
        return [];
    }
};

// 명령어 비교 함수
const compareCommands = (legacy, actual, expected) => {
    if (actual.length !== expected.length) {
        return {
            success: false,
            reason: `명령어 개수 불일치. 예상: ${expected.length}, 실제: ${actual.length}`
        };
    }

    for (let i = 0; i < expected.length; i++) {
        if (actual[i] !== expected[i]) {
            return {
                success: false,
                reason: `명령어 ${i + 1} 불일치.\n  예상: ${expected[i]}\n  실제: ${actual[i]}`
            };
        }
    }

    return { success: true };
};

// 메인 테스트 함수
const runTests = () => {
    console.log('🧪 스크립트 호환성 테스트 시작\n');
    console.log('=' * 80);

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = [];

    for (const mapping of NEW_SCRIPT_MAPPINGS) {
        totalTests++;

        console.log(`\n📋 테스트 ${totalTests}: ${mapping.legacy}`);
        console.log(`   기존 명령어: ${LEGACY_COMMANDS[mapping.legacy]}`);
        console.log(`   새로운 명령어: ${mapping.newCommand}`);

        // 새로운 스크립트 실행하여 출력 캡처
        const actualCommands = captureScriptOutput(mapping.newCommand);

        console.log(`\n   🔍 비교 결과:`);
        console.log(`   예상 명령어들:`);
        mapping.expectedCommands.forEach((cmd, i) => {
            console.log(`     ${i + 1}. ${cmd}`);
        });

        console.log(`   실제 명령어들:`);
        actualCommands.forEach((cmd, i) => {
            console.log(`     ${i + 1}. ${cmd}`);
        });

        // 명령어 비교
        const comparison = compareCommands(mapping.legacy, actualCommands, mapping.expectedCommands);

        if (comparison.success) {
            console.log(`   ✅ PASS`);
            passedTests++;
        } else {
            console.log(`   ❌ FAIL: ${comparison.reason}`);
            failedTests.push({
                test: mapping.legacy,
                reason: comparison.reason,
                expected: mapping.expectedCommands,
                actual: actualCommands
            });
        }

        console.log('-'.repeat(80));
    }

    // 최종 결과 출력
    console.log(`\n📊 테스트 결과 요약:`);
    console.log(`   전체 테스트: ${totalTests}`);
    console.log(`   성공: ${passedTests} ✅`);
    console.log(`   실패: ${totalTests - passedTests} ❌`);
    console.log(`   성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests.length > 0) {
        console.log(`\n❌ 실패한 테스트들:`);
        failedTests.forEach((failed, i) => {
            console.log(`\n   ${i + 1}. ${failed.test}`);
            console.log(`      이유: ${failed.reason}`);
        });

        return false;
    } else {
        console.log(`\n🎉 모든 기본 테스트가 성공했습니다!`);
        return true;
    }
};

// 추가 테스트: no-prebuild 옵션 검증
const runNoPrebuildTests = () => {
    console.log('\n🔧 --no-prebuild 옵션 테스트\n');

    const noPrebuildTests = [
        {
            name: 'staging android cloud (no-prebuild)',
            command: 'node scripts/build.js --env staging --platform android --mode cloud --no-prebuild',
            expected: ['eas build --profile staging --platform android']
        },
        {
            name: 'production ios local (no-prebuild)',
            command: 'node scripts/build.js --env production --platform ios --mode local --no-prebuild',
            expected: [
                'eas build --profile production --platform ios --local --output ./build/ios/pickforme-production-$(date +%Y%m%d-%H%M).ipa'
            ]
        }
    ];

    noPrebuildTests.forEach((test, i) => {
        console.log(`📋 ${test.name}`);
        const actualCommands = captureScriptOutput(test.command);
        const comparison = compareCommands(test.name, actualCommands, test.expected);

        if (comparison.success) {
            console.log(`   ✅ PASS`);
        } else {
            console.log(`   ❌ FAIL: ${comparison.reason}`);
        }
        console.log('');
    });
};

// 스크립트 실행
if (require.main === module) {
    try {
        const basicTestsPass = runTests();
        runNoPrebuildTests();

        if (basicTestsPass) {
            console.log(`\n🎉 모든 테스트가 성공적으로 완료되었습니다!`);
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (error) {
        console.error('테스트 실행 중 오류:', error.message);
        process.exit(1);
    }
}
