type TruncateProps = {
	text?: string | null;
	max?: number;
	className?: string;
};

export default function Truncate({ text, max = 40, className }: TruncateProps) {
	const value = (text ?? "").toString();
	const shouldTruncate = value.length > max;
	const display = shouldTruncate ? `${value.slice(0, max)}…` : value;
	return (
		<span title={value} className={className}>
			{display}
		</span>
	);
}


