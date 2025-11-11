"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

type BranchEntry = { child: number; count: number; text: string };
type NodeFunnel = { reach: number; transitions: number; drop_off: number };

export default function ExplorerClient({
	branches,
	nodeFunnel
}: {
	branches: Record<string, BranchEntry[]>;
	nodeFunnel: Record<string, NodeFunnel>;
}) {
	// Root is 1 in the dataset
	const ROOT_ID = 1;
	const [path, setPath] = useState<Array<{ id: number; text: string }>>([]);
	const currentId = path.length === 0 ? ROOT_ID : path[path.length - 1].id;

	const options = useMemo(() => branches[String(currentId)] || [], [branches, currentId]);
	const sortedOptions = useMemo(
		() => [...options].sort((a, b) => (b.count - a.count) || a.text.localeCompare(b.text)),
		[options]
	);
	const total = useMemo(() => options.reduce((sum, e) => sum + (e.count ?? 0), 0), [options]);

	function onOpen(child: BranchEntry) {
		setPath((prev) => [...prev, { id: child.child, text: child.text }]);
	}
	function onBack() {
		setPath((prev) => prev.slice(0, -1));
	}
	function jumpToDepth(idx: number) {
		// idx is 0-based over path; jumping to -1 means root
		setPath((prev) => prev.slice(0, idx + 1));
	}

	return (
		<div className="space-y-4">
			{/* Breadcrumb */}
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<span className="font-semibold">Path:</span>
				<button
					type="button"
					onClick={() => setPath([])}
					className="rounded bg-muted px-2 py-1 hover:bg-accent"
				>
					Root
				</button>
				{path.map((p, idx) => (
					<div key={p.id} className="flex items-center gap-2">
						<span>→</span>
						<button
							type="button"
							onClick={() => jumpToDepth(idx)}
							className="rounded bg-muted px-2 py-1 hover:bg-accent"
							title={p.text}
						>
							{p.text}
						</button>
					</div>
				))}
			</div>

			{/* Back button */}
			{path.length > 0 && (
				<div>
					<button
						type="button"
						onClick={onBack}
						className="rounded border px-3 py-1 text-sm hover:bg-accent"
					>
						Back
					</button>
				</div>
			)}

			{/* Grid of options */}
			{sortedOptions.length === 0 ? (
				<div className="text-sm text-muted-foreground">No usage data available at this level.</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{sortedOptions.map((opt) => {
						const pct = total > 0 ? ((opt.count / total) * 100).toFixed(1) : "0.0";
						const nf = nodeFunnel[String(opt.child)];
						const terminatedHere = nf?.drop_off ?? 0;
						return (
							<Card
								key={opt.child}
								className="cursor-pointer transition-shadow hover:shadow"
								onClick={() => onOpen(opt)}
							>
								<CardHeader>
									<CardTitle className="text-base">{opt.text}</CardTitle>
								</CardHeader>
								<CardContent className="text-sm">
									<div>Count: {opt.count}</div>
									<div>Share: {pct}%</div>
									<div>Terminated here: {terminatedHere}</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}


