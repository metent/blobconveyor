import { $, env } from "bun";

const baseRoute = env.BASE_ROUTE ?? "";
const routePattern = RegExp(`^${baseRoute}/(.+)`);
const containerRegistry = env.CONTAINER_REGISTRY ?? "registry.hub.docker";
const imageName = env.IMAGE_NAME;
const platformArgs = env.PLATFORM ? ["--platform", env.PLATFORM] : "";
const usernameArgs = env.USERNAME ? ["-u", env.USERNAME] : "";
const passwordArgs = env.PASSWORD ? ["-p", env.PASSWORD] : "";
const blobName = env.BLOB_NAME ?? "build";
const blobSuffix = env.BLOB_EXTENSION ?? "";
const blobCacheDir = env.CACHE_DIRECTORY ?? ".";
const blobPattern = RegExp(`${blobCacheDir}/(.+)${blobSuffix}$`);
const imageUrl = `${containerRegistry}/${imageName}`;

await $`crane auth login ${containerRegistry} ${usernameArgs} ${passwordArgs}`;

Bun.serve({
	idleTimeout: 30,
	static: {
		"/favicon.ico": new Response(""),
	},
	async fetch(req) {
		let pathname = URL.parse(req.url).pathname;
		if (pathname === baseRoute) return Response(getTags());

		let tag = pathname.match(routePattern)?.[1];
		if (!tag) return new Response("404!");

		return new Response(Bun.file(`${blobCacheDir}/${tag}${blobSuffix}`));
	},
	async error(err) {
		if (err.name !== "ENOENT") return new Response("500!");
		let tag = err.path.match(blobPattern)[1];
		let file = Bun.file(err.path);
		await $`crane export ${imageUrl}:${tag} - ${platformArgs} | tar -Oxf - ${blobName} > ${file}`;
		return new Response(file);
	}
});

async function* getTags() {
	yield '<!doctype html><html lang="en"><meta charset=utf-8>';
	for await (let tag of $`crane ls ${imageUrl} ${platformArgs}`.lines()) {
		if (tag) yield `<a href="${baseRoute}${blobSuffix}/${tag}">${tag}</a><br>\n`;
	}
}
