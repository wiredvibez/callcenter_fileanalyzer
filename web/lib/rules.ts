import { readFile } from "node:fs/promises";
import path from "node:path";

type TreeNode = {
	rule_id: number;
	text: string;
	url?: string | null;
	children?: TreeNode[];
};

let ruleTextMapPromise: Promise<Map<number, string>> | null = null;

async function buildRuleTextMap(): Promise<Map<number, string>> {
	// Read the precomputed tree from the project root: ../button_tree.all.json
	// Resolve relative to Next.js project root (web/)
	const filePath = path.resolve(process.cwd(), "..", "button_tree.all.json");
	const json = await readFile(filePath, "utf-8");
	const data = JSON.parse(json) as TreeNode[];
	const map = new Map<number, string>();

	const stack: TreeNode[] = Array.isArray(data) ? [...data] : [];
	while (stack.length > 0) {
		const node = stack.pop()!;
		if (node && typeof node.rule_id === "number") {
			// Prefer first seen text; do not overwrite if already present
			if (!map.has(node.rule_id)) {
				map.set(node.rule_id, node.text ?? "");
			}
		}
		if (node?.children && node.children.length > 0) {
			for (const child of node.children) {
				stack.push(child);
			}
		}
	}

	return map;
}

export async function getRuleTextMap(): Promise<Map<number, string>> {
	if (!ruleTextMapPromise) {
		ruleTextMapPromise = buildRuleTextMap();
	}
	return ruleTextMapPromise;
}

export async function getRuleText(ruleId: number): Promise<string | undefined> {
	const map = await getRuleTextMap();
	return map.get(ruleId);
}


