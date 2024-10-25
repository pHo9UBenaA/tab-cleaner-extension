const { build } = require('esbuild');
const path = require('node:path');
const glob = require('glob');
const copyStaticFiles = require('esbuild-copy-static-files');

const PATHS = {
	src: 'src',
	dist: 'dist'
};

const srcDir = path.join(__dirname, PATHS.src);
const distDir = path.join(__dirname, PATHS.dist);

const baseOptions = {
	bundle: true,
	minify: true,
	treeShaking: true,
	platform: 'browser',
	tsconfig: './tsconfig.json',
	outdir: distDir
};

const copyAssets = copyStaticFiles({
	src: `./${PATHS.src}/assets`,
	dest: `./${PATHS.dist}`,
	dereference: true,
	errorOnExist: false
});

const buildConfigs = [
	{
		...baseOptions,
		entryPoints: glob.sync(`${srcDir}/*.ts`),
		outbase: `./${PATHS.src}`,
		plugins: [copyAssets]
	},
	{
		...baseOptions,
		entryPoints: glob.sync(`${srcDir}/options.tsx`)
	}
];

const handleBuildError = (err) => {
	process.stderr.write(err.stderr);
	process.exit(1);
};

Promise.all(buildConfigs.map(config => build(config)))
	.catch(handleBuildError);
