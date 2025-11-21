import { processCategory, processVerbCategory } from './libwordcategories';
export function formatCategoryString(sense: any) {
	const category = processCategory(sense.category);
	const verbCategory =
		sense.category === 'verb' ? processVerbCategory(sense.verbCategory) : '';
	const parts: string[] = [];
	if (category) parts.push(category);
	if (verbCategory) parts.push(verbCategory);
	return parts.length ? `(${parts.join(' ')})` : '';
}
