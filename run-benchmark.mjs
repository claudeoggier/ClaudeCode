import chalk from './source/index.js';
import { performance } from 'node:perf_hooks';

const ITERATIONS = 100_000;

function bench(name, fn) {
	// Warmup
	for (let i = 0; i < 1000; i++) fn();

	const start = performance.now();
	for (let i = 0; i < ITERATIONS; i++) fn();
	const duration = performance.now() - start;

	const opsPerSec = Math.round(ITERATIONS / (duration / 1000));
	console.log(`${name.padEnd(45)} ${opsPerSec.toLocaleString()} ops/sec`);
}

const chalkRed = chalk.red;
const chalkBgRed = chalk.bgRed;
const chalkBlueBgRed = chalk.blue.bgRed;
const chalkBlueBgRedBold = chalk.blue.bgRed.bold;
const blueStyledString = 'the fox jumps' + chalk.blue('over the lazy dog') + '!';

console.log('\n--- Chalk Benchmark ---\n');

bench('1 style',                              () => chalk.red('the fox jumps over the lazy dog'));
bench('2 styles',                             () => chalk.blue.bgRed('the fox jumps over the lazy dog'));
bench('3 styles',                             () => chalk.blue.bgRed.bold('the fox jumps over the lazy dog'));
bench('cached: 1 style',                      () => chalkRed('the fox jumps over the lazy dog'));
bench('cached: 2 styles',                     () => chalkBlueBgRed('the fox jumps over the lazy dog'));
bench('cached: 3 styles',                     () => chalkBlueBgRedBold('the fox jumps over the lazy dog'));
bench('cached: 1 style with newline',         () => chalkRed('the fox jumps\nover the lazy dog'));
bench('cached: 1 style nested intersecting',  () => chalkRed(blueStyledString));
bench('cached: 1 style nested non-intersect', () => chalkBgRed(blueStyledString));
bench('cached: 1 style template literal',     () => chalkRed`the fox jumps over the lazy dog`);
bench('cached: nested styles template literal',() => chalkRed`the fox {bold jumps} over the {underline lazy} dog`);

console.log('');
