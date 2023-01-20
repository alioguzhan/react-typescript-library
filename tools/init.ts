import { cyan, green, red, underline, yellow } from 'colors';
import enquirer from 'enquirer';
import { readFileSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import replace from 'replace-in-file';
import shell from 'shelljs';

// eslint-disable-next-line dot-notation
if (process.env['RTL_SKIP_POSTINSTALL']) {
  console.log('⚠ Skipping post-install process...');
  process.exit(0);
}

// Note: These should all be relative to the project root directory
const rmDirs = ['.git', 'tools', 'CHANGELOG.md'];
const rmFiles = ['.all-contributorsrc', '.gitattributes'];
const modifyFiles = [
  'LICENSE',
  'package.json',
  'README.md',
  'CODE_OF_CONDUCT.md',
  'shell.nix',
  '.github/workflows/release-please.yml',
];

// ----------------- //

function isInstalled(program: string) {
  return shell.which(program);
}

function checkEnv() {
  if (!isInstalled('node')) {
    console.log('node.js is not installed');
    process.exit(1);
  }

  if (!isInstalled('npm')) {
    console.log('npm is not installed');
    process.exit(1);
  }
  if (!isInstalled('git')) {
    console.log('git is not installed');
    process.exit(1);
  }

  if (!isInstalled('yarn')) {
    console.log('yarn is not installed');
    process.exit(1);
  }

  console.log('🧰 Env Info:');
  console.log('------------');
  shell.exec('git --version');
  shell.exec('echo node Version: $(node -v)');
  shell.exec('echo npm version: $(npm --version)');
  shell.exec('echo yarn version: $(yarn --version)');
  console.log('------------\n');
}

function getSuggestedLibraryName() {
  return basename(resolve(__dirname, '..'))
    .replace(/[^\w\d]|_/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
// ----------------- //

const questions = [
  {
    type: 'input',
    name: 'libraryName',
    message: 'What is the name of your library?',
    initial: getSuggestedLibraryName(),
  },
  {
    type: 'confirm',
    name: 'installExampleApp',
    message:
      'Would you like to generate an example react app to test your library/component?',
    initial: true,
  },
];

// ----------------- Program starts here -------------- //
(async () => {
  console.log('🎉 Welcome to react-typescript-library generator!\n');
  checkEnv();
  const response = await enquirer.prompt<any>(questions).catch(() => {
    console.log('Cancelled. Bye!');
    process.exit(0);
  });
  const { libraryName, installExampleApp } = response;
  if (!libraryName) {
    console.log('Cancelled. Bye!');
    process.exit(0);
  }

  console.log(
    cyan(
      '\nThanks for the info. The last few changes are being made... hang tight!\n\n'
    )
  );

  // Get the Git username and email before the .git directory is removed
  const username = shell.exec('git config user.name').toString().trim();
  const usermail = shell.exec('git config user.email').toString().trim();

  if (installExampleApp) {
    yellow('Installing the test application into example/ directory...');
    shell.exec('yarn create react-app --template=typescript example');
    shell.exec('echo "SKIP_PREFLIGHT_CHECK=true" >> example/.env');
  }
  shell.exec('mv tools/README.md README.md');
  console.log(underline.white('Removed'));

  // The directories and files are combined here, to simplify the function,
  // as the 'rm' command checks the item type before attempting to remove it
  const rmItems = rmDirs.concat(rmFiles);

  shell.rm(
    '-rf',
    rmItems.map((f) => resolve(__dirname, '..', f))
  );

  console.log(red(rmItems.join('\n')));
  console.log('\n');

  const files = ['.gitignore'].map((f) => resolve(__dirname, '..', f));
  replace.sync({
    files,
    from: ['dist/', 'docs/'],
    to: '',
  });

  console.log(underline.white('Modified'));

  const mFiles = modifyFiles.map((f) => resolve(__dirname, '..', f));
  try {
    replace.sync({
      files: mFiles,
      from: [
        /--libraryname--/g,
        /--username--/g,
        /--usermail--/g,
        /--currentYear--/g,
      ],
      to: [libraryName, username, usermail, new Date().getFullYear()],
    });
    console.log(yellow(modifyFiles.join('\n')));
  } catch (error) {
    console.error('An error occurred modifying the file: ', error);
  }
  console.log('\n');

  if (installExampleApp) {
    console.log(yellow('Linking packages to the example app...'));
    shell.exec(
      'cd example && yarn add link:.. link:../node_modules/react link:../node_modules/react-dom && cd ..'
    );
  }

  console.log(underline.white('Finalizing'));

  // Recreate Git folder
  const gitInitOutput = shell
    .exec('git init "' + resolve(__dirname, '..') + '"', {})
    .toString();
  console.log(green(gitInitOutput.replace(/(\n|\r)+/g, '')));

  // Remove post-install command
  const jsonPackage = resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(readFileSync(jsonPackage) as any);

  // Note: Add items to remove from the package file here
  delete pkg.scripts.postinstall;

  // remove the dependencies that are required for the bootstrapping.
  [
    '@types/shelljs',
    'colors',
    'enquirer',
    'prompt',
    'replace-in-file',
    'shelljs',
    'ts-node',
  ].forEach((dep) => {
    delete pkg.devDependencies[dep];
  });

  pkg.version = '0.1.0';

  writeFileSync(jsonPackage, JSON.stringify(pkg, null, 2));
  console.log(green('Postinstall script has been removed'));

  console.log(yellow('Removing yarn.lock and performing a clean install...'));
  shell.rm('yarn.lock && rm -rf node_modules && yarn install && yarn build');
  console.log('\n');
  shell.exec("git add . && git commit -am 'chore: init' --no-verify");
  console.log('\n');
  console.log(cyan("OK, you're all set. Happy coding!! ;)\n"));
})();
