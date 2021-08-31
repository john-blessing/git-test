/*
 * @Author: your name
 * @Date: 2021-08-31 21:49:00
 * @LastEditTime: 2021-08-31 21:54:18
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /git-test/release.js
 */

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const util = require('util');
const chalk = require('chalk');
const semverInc = require('semver/functions/inc');

const pkg = require('./package.json');

const exec = util.promisify(child_process.exec);

const run = async (command) => {
  console.log(
    `${chalk.green(command)}
    `
  );

  await exec(command, { maxBuffer: 5000 * 1024 });
};

const currentVersion = pkg.version;

const getNextVersions = () => ({
  major: semverInc(currentVersion, 'major'),
  minor: semverInc(currentVersion, 'minor'),
  patch: semverInc(currentVersion, 'patch'),
  premajor: semverInc(currentVersion, 'premajor'),
  preminor: semverInc(currentVersion, 'preminor'),
  prepatch: semverInc(currentVersion, 'prepatch'),
  prerelease: semverInc(currentVersion, 'prerelease')
});

const timeLog = (logInfo, type) => {
  let info = '';
  if (type === 'start') {
    info = `=> 开始任务：${logInfo}`;
  } else {
    info = `✨ 结束任务：${logInfo}`;
  }
  const nowDate = new Date();
  console.log(
    `[${nowDate.toLocaleString()}.${nowDate.getMilliseconds().toString().padStart(3, '0')}] ${info}
    `
  );
};

/**
 * 获取下一次版本号
 */
async function prompt() {
  const nextVersions = getNextVersions();
  const { nextVersion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextVersion',
      message: `请选择将要发布的版本 (当前版本 ${currentVersion})`,
      choices: Object.keys(nextVersions).map((level) => ({
        name: `${level} => ${nextVersions[level]}`,
        value: nextVersions[level]
      }))
    }
  ]);
  return nextVersion;
}

/**
 * 更新版本号
 * @param nextVersion 新版本号
 */
async function updateVersion(nextVersion) {
  pkg.version = nextVersion;
  timeLog('修改package.json版本号', 'start');
  await fs.writeFileSync(path.resolve(__dirname, './package.json'), JSON.stringify(pkg, null, 2));
  timeLog('修改package.json版本号', 'end');
}

/**
 * 将代码提交至git
 */
async function push() {
  timeLog('推送代码至git仓库', 'start');
  await run('git add -A');
  const { word } = await commit();
  await run(`git commit -m ${word}`);
  await run('git push origin');
  timeLog('推送代码至git仓库', 'end');
}

/**
 * 组件库打包
 */
async function build() {
  timeLog('组件库打包', 'start');
  await run('npm run build');
  timeLog('组件库打包', 'end');
}

/**
 * 发布至npm
 */
async function publish() {
  try {
    await run('npm publish');
  } catch (error) {
    process.exit(1);
  }
}

/**
 * 打tag提交至git
 */
// async function tag(nextVersion) {
//   timeLog('打tag并推送至git', 'start');
//   await run(`git tag v${nextVersion}`);
//   await run(`git push origin tag v${nextVersion}`);
//   timeLog('打tag并推送至git', 'end');
// }

/**
 * 输入commit信息
 */
 async function commit() {
  const data = await inquirer.prompt([
    {
      type: 'input',
      name: 'word',
      message: `请输入commit信息：`
    }
  ]);
  return data;
}

async function main() {
  try {
    const nextVersion = await prompt();
    const startTime = Date.now();
    // =================== 组件库打包 ===================
    // await build();
    // =================== 更新版本号 ===================
    await updateVersion(nextVersion);
    // =================== 发布至npm ===================
    // await publish();
    // =================== 更新changelog ===================
    // await generateChangelog();
    // =================== 代码推送git仓库 ===================
    await push(nextVersion);
    // =================== 打tag并推送至git ===================
    console.log(`✨ 发布流程结束 共耗时${((Date.now() - startTime) / 1000).toFixed(3)}s`);
  } catch (error) {
    console.log('💣 发布失败，失败原因：', error);
  }
}

main();




