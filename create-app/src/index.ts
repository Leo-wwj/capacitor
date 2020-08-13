process.title = '@capacitor/create-app';

if (process.argv.includes('--verbose')) {
  process.env.DEBUG = '*';
}

import tar from 'tar';
import { resolve } from 'path';
import kleur from 'kleur';
import Debug from 'debug';
import * as help from './help';

import { emoji, isTTY } from './cli';
import { createConfigFile } from './config';
import { exists, mkdir } from './fs';
import { getOptions } from './options';
import { gatherDetails } from './prompt';

const debug = Debug('@capacitor/create-app');

const run = async () => {
  if (process.argv.find(arg => ['-h', '-?', '--help'].includes(arg))) {
    help.run();
    process.exit();
  }

  const options = getOptions();
  debug('options from command-line: %O', options);

  if (Object.values(options).includes(undefined)) {
    if (isTTY) {
      debug(`Missing/invalid options. Prompting for user input...`);
    } else {
      process.stderr.write(
        `ERR: Refusing to prompt for missing/invalid options in non-TTY environment.\n` +
          `See ${kleur.bold('--help')}. Run with ${kleur.bold(
            '--verbose',
          )} for more context.\n`,
      );
      process.exit(1);
    }
  }

  const details = await gatherDetails(options);

  const template = resolve(__dirname, '..', 'assets', 'app-template.tar.gz');
  const appdir = resolve(process.cwd(), details.dir);

  if (await exists(appdir)) {
    process.stderr.write(
      `ERR: Not overwriting existing directory: ${kleur.bold(details.dir)}`,
    );
    process.exit(1);
  }

  await mkdir(appdir, { recursive: true });
  await tar.extract({ file: template, cwd: appdir });
  await createConfigFile(details);

  const tada = emoji('🎉', '*');

  process.stdout.write(`
${kleur.bold(`${tada} Your Capacitor app is ready to go! ${tada}`)}

Next steps:
  - cd ${details.dir}
  - npm install
  - npx cap sync
`);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
