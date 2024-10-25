const srcDirName = 'src';
const distDirName = 'dist';

const path = require('node:path');
const glob = require('glob');

const srcDir = path.join(__dirname, srcDirName);
const distDir = path.join(__dirname, distDirName);

const optionsStatic = {
	bundle: true,
	minify: true,
	treeShaking: true,
	platform: 'browser',
	tsconfig: './tsconfig.json',
};

const copyStaticFiles = require('esbuild-copy-static-files');
const copyAssets = copyStaticFiles({
	src: `./${srcDirName}/assets`,
	dest: `./${distDirName}`,
	dereference: true,
	errorOnExist: false,
});

const outdir = `${distDir}`;

const tsEntryPoints = glob.sync(`${srcDir}/*.ts`);
const tsxEntryPoints = glob.sync(`${srcDir}/options.tsx`);

const tsOption = {
	...optionsStatic,
	outdir,
	entryPoints: tsEntryPoints,
	outbase: `./${srcDirName}`,
	plugins: [copyAssets],
};

const tsxOption = {
	...optionsStatic,
	outdir,
	entryPoints: tsxEntryPoints,
};

const { build } = require('esbuild');
build(tsOption).catch((err) => {
	process.stderr.write(err.stderr);
	process.exit(1);
});

build(tsxOption).catch((err) => {
	process.stderr.write(err.stderr);
	process.exit(1);
});
