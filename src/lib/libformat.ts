import { processCategory, processVerbCategory } from './libwordcategories';
export default function formatCategoryString(sense: Definition) {
	const category = processCategory(sense.category);
	const verbCategory =
		sense.category === 'verb' ? processVerbCategory(sense.verb_category) : '';
	const parts: string[] = [];
	if (category) parts.push(category);
	if (verbCategory) parts.push(verbCategory);
	return parts.length ? `(${parts.join(' ')})` : '';
}
