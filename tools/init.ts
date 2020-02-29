/**
 * This script runs automatically after your first npm-install.
 *
 * LICENSE and COPYRIGHT NOTE:
 *
 * This file is taken from https://github.com/alexjoverm/typescript-library-starter and
 * is almost identical to https://github.com/alexjoverm/typescript-library-starter/blob/master/tools/init.ts
 *
 * I just made some modifications added some new functions.
 * **/

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */

const { basename, resolve } = require('path');
const replace = require('replace-in-file');
const { readFileSync, writeFileSync } = require('fs');
const { cyan, green, red, underline, yellow } = require('colors');
const { fork } = require('child_process');
const _prompt = require('prompt');
const { mv, rm, which, exec } = require('shelljs');

// Note: These should all be relative to the project root directory
const rmDirs = ['.git', 'tools'];
const rmFiles = ['.all-contributorsrc', '.gitattributes'];
const modifyFiles = ['LICENSE', 'package.json', 'README.md'];
const renameFiles: Array<string> = [];

/**
 * Removes items from the project that aren't needed after the initial setup
 */
function removeItems() {
  console.log(underline.white('Removed'));

  // The directories and files are combined here, to simplify the function,
  // as the 'rm' command checks the item type before attempting to remove it
  const rmItems = rmDirs.concat(rmFiles);
  rm(
    '-rf',
    rmItems.map(f => resolve(__dirname, '..', f))
  );
  console.log(red(rmItems.join('\n')));

  console.log('\n');
}

/**
 * Updates the contents of the template files with the library name or user details
 *
 * @param libraryName
 * @param username
 * @param usermail
 */
function modifyContents(
  libraryName: string,
  username: string,
  usermail: string
) {
  console.log(underline.white('Modified'));

  const files = modifyFiles.map(f => resolve(__dirname, '..', f));
  try {
    replace.sync({
      files,
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
}

function modifyGitignoreFile(): void {
  const files = ['.gitignore'].map(f => resolve(__dirname, '..', f));
  replace.sync({
    files,
    from: ['dist/', 'docs/'],
    to: '',
  });
}

/**
 * Renames any template files to the new library name
 *
 * @param libraryName
 */
function renameItems(libraryName: string) {
  console.log(underline.white('Renamed'));

  renameFiles.forEach(function(files) {
    // Files[0] is the current filename
    // Files[1] is the new name
    const newFilename = files[1].replace(/--libraryname--/g, libraryName);
    mv(
      resolve(__dirname, '..', files[0]),
      resolve(__dirname, '..', newFilename)
    );
    console.log(cyan(files[0] + ' => ' + newFilename));
  });

  console.log('\n');
}

/**
 * Calls any external programs to finish setting up the library
 */
function finalize() {
  console.log(underline.white('Finalizing'));

  // Recreate Git folder
  const gitInitOutput = exec('git init "' + resolve(__dirname, '..') + '"', {
    silent: true,
  }).stdout;
  console.log(green(gitInitOutput.replace(/(\n|\r)+/g, '')));

  // Remove post-install command
  const jsonPackage = resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(readFileSync(jsonPackage) as any);

  // Note: Add items to remove from the package file here
  delete pkg.scripts.postinstall;

  // remove the dependencies that are required for the bootstrapping.
  ['colors', 'prompt', 'replace-in-file', 'shelljs', 'ts-node'].forEach(dep => {
    delete pkg.devDependencies[dep];
  });

  writeFileSync(jsonPackage, JSON.stringify(pkg, null, 2));
  console.log(green('Postinstall script has been removed'));

  console.log(yellow('Removing yarn.lock and performing a clean install...'));
  rm('yarn.lock');
  exec('yarn install');
  exec('yarn build');
  exec("git add . && git commit -am 'chore: init' --no-verify");
  console.log('\n');
}
/**
 * Calls all of the functions needed to setup the library
 *
 * @param libraryName
 */
function setupLibrary(libraryName: string, generateExample = false) {
  console.log(
    cyan(
      '\nThanks for the info. The last few changes are being made... hang tight!\n\n'
    )
  );

  // Get the Git username and email before the .git directory is removed
  const username = exec('git config user.name').stdout.trim();
  const usermail = exec('git config user.email').stdout.trim();

  if (generateExample) {
    yellow('Installing the test application into example/ directory...');
    exec('npx create-react-app example');
    exec('echo "SKIP_PREFLIGHT_CHECK=true" >> example/.env');
  }
  mv('tools/README.md', 'README.md');
  removeItems();

  modifyGitignoreFile();
  modifyContents(libraryName, username, usermail);

  if (generateExample) {
    console.log(yellow('Linking packages to the example app...'));
    exec(
      'cd example && yarn add link:.. link:../node_modules/react link:../node_modules/react-dom && cd ..'
    );
  }

  finalize();

  console.log(cyan("OK, you're all set. Happy coding!! ;)\n"));
}
/**
 * The library name is suggested by looking at the directory name of the
 * tools parent directory and converting it to kebab-case
 *
 * The regex for this looks for any non-word or non-digit character, or
 * an underscore (as it's a word character), and replaces it with a dash.
 * Any leading or trailing dashes are then removed, before the string is
 * lowercased and returned
 */
function libraryNameSuggested() {
  return basename(resolve(__dirname, '..'))
    .replace(/[^\w\d]|_/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

const _promptSchemaLibraryName = {
  properties: {
    library: {
      description: cyan(
        'What do you want the library to be called? (use kebab-case)'
      ),
      pattern: /^[a-z]+(-[a-z]+)*$/,
      type: 'string',
      required: true,
      message:
        '"kebab-case" uses lowercase letters, and hyphens for any punctuation',
    },
  },
};

const _promptSchemaLibrarySuggest = {
  properties: {
    useSuggestedName: {
      description: cyan(
        'Would you like it to be called "' + libraryNameSuggested() + '"? [y/n]'
      ),
      pattern: /^(y(es)?|n(o)?)$/i,
      type: 'string',
      required: true,
      message: 'You need to type "[y]es" or "[n]o" to continue...',
    },
  },
};

const _promptInstallExampleApp = {
  properties: {
    installExampleApp: {
      description: yellow(
        'Would you like to generate an example react app to test your library/component? [y/n]'
      ),
      pattern: /^(y(es)?|n(o)?)$/i,
      type: 'string',
      required: true,
      message: 'You need to type "[y]es" or "[n]o" to continue...',
    },
  },
};

/**
 * Asks the user for the name of the library if it has been cloned into the
 * default directory, or if they want a different name to the one suggested
 */
function libraryNameCreate() {
  _prompt.get(_promptSchemaLibraryName, (err: any, res: any) => {
    if (err) {
      console.log(red('Sorry, there was an error building the workspace :('));
      removeItems();
      process.exit(1);
      return;
    }
    _prompt.get(_promptInstallExampleApp, (err: any, res: any) => {
      let installExampleApp = false;
      if (err) return;
      if (res.installExampleApp.toLowerCase().charAt(0) === 'y') {
        installExampleApp = true;
      }
      setupLibrary(res.library, installExampleApp);
    });
  });
}

/**
 * Sees if the users wants to accept the suggested library name if the project
 * has been cloned into a custom directory (i.e. it's not 'typescript-library-starter')
 */
function libraryNameSuggestedAccept() {
  _prompt.get(_promptSchemaLibrarySuggest, (err: any, res: any) => {
    if (err) {
      console.log(red("Sorry, you'll need to type the library name"));
      libraryNameCreate();
    }

    if (res.useSuggestedName.toLowerCase().charAt(0) === 'y') {
      _prompt.get(_promptInstallExampleApp, (err: any, res: any) => {
        let installExampleApp = false;
        if (err) return;
        if (res.installExampleApp.toLowerCase().charAt(0) === 'y') {
          installExampleApp = true;
        }
        setupLibrary(libraryNameSuggested(), installExampleApp);
      });
    } else {
      libraryNameCreate();
    }
  });
}

/**
 * Checks if the suggested library name is the default, which is 'typescript-library-starter'
 */
function libraryNameSuggestedIsDefault() {
  if (libraryNameSuggested() === 'typescript-library-starter') {
    return true;
  }

  return false;
}

_prompt.start();

_prompt.message = '';

// Clear console
process.stdout.write('\x1B[2J\x1B[0f');

if (!which('git')) {
  console.log(red('Sorry, this script requires git'));
  removeItems();
  process.exit(1);
}

// Say hi!
console.log(
  cyan(
    "Hi! You're almost ready to create the next React Library with Typescript."
  )
);

// Generate the library name and start the tasks
if (process.env.CI == null) {
  if (!libraryNameSuggestedIsDefault()) {
    libraryNameSuggestedAccept();
  } else {
    libraryNameCreate();
  }
} else {
  // This is being run in a CI environment, so don't ask any questions
  setupLibrary(libraryNameSuggested());
}
